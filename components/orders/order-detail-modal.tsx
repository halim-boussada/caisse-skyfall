'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order } from '@/lib/types';
import { updateOrder, deleteOrder, getTransactions, updateTransaction, addTransaction, getOrders } from '@/lib/storage';
import { toast } from 'sonner';
import PaymentModal from './payment-modal';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export default function OrderDetailModal({ order, onClose, onOrderUpdated }: OrderDetailModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const remainingAmount = order.totalAmount - order.totalPaid;
  const isPaid = remainingAmount <= 0;
  const isCanceled = order.status === 'canceled';

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handlePayAll = () => {
    setSelectedItemIds(order.items.map(item => item.id));
    setShowPaymentModal(true);
  };

  const handlePaySelected = () => {
    if (selectedItemIds.length === 0) {
      toast.error('Please select items to pay for');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleRemoveItem = (itemId: string) => {
    if (isCanceled) {
      toast.error('Cannot modify a canceled order');
      return;
    }

    const updatedItems = order.items.filter(item => item.id !== itemId);
    if (updatedItems.length === 0) {
      if (confirm('Remove all items? This will cancel the order.')) {
        handleCancelOrder();
      }
      return;
    }
    
    // Calculate new total
    const newTotal = updatedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    
    // Update order with removed item
    updateOrder(order.id, { 
      items: updatedItems, 
      totalAmount: newTotal 
    });
    
    toast.success('Item removed');
    onOrderUpdated();
  };

  const handleCancelOrder = () => {
    if (isCanceled) {
      toast.error('Order is already canceled');
      return;
    }

    if (confirm('Are you sure you want to cancel this order? This will set the order status to canceled and remove all associated transactions.')) {
      // Get all transactions for this order
      const allTransactions = getTransactions();
      const orderTransactions = allTransactions.filter(t => t.orderId === order.id);
      
      // Remove all transactions associated with this order
      // We need to create a new transactions array without these transactions
      const updatedTransactions = allTransactions.filter(t => t.orderId !== order.id);
      
      // Save updated transactions back to localStorage
      localStorage.setItem('caisse_transactions', JSON.stringify(updatedTransactions));
      
      // Update order status to canceled and reset paid amounts
      const canceledOrder = {
        ...order,
        status: 'canceled' as const,
        totalPaid: 0,
        // Mark all items as unpaid
        items: order.items.map(item => ({
          ...item,
          paidQuantity: 0
        }))
      };
      
      updateOrder(order.id, {
        status: 'canceled',
        totalPaid: 0,
        items: canceledOrder.items
      });
      
      toast.success(`Order #${order.id} has been canceled. All payments have been refunded/removed.`);
      onOrderUpdated();
    }
  };

  const handleReactivateOrder = () => {
    if (confirm('Do you want to reactivate this canceled order? This will allow you to add items and process payments again.')) {
      updateOrder(order.id, { 
        status: 'active',
        totalPaid: 0,
        items: order.items.map(item => ({
          ...item,
          paidQuantity: 0
        }))
      });
      
      toast.success('Order reactivated successfully');
      onOrderUpdated();
    }
  };

  // Don't allow payment if order is canceled
  const canPay = !isPaid && !isCanceled;

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-screen max-w-none rounded-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details - Table {order.tableNumber}
              {isCanceled && (
                <span className="ml-3 text-sm text-red-600 dark:text-red-400 font-normal">
                  (Canceled)
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {isCanceled 
                ? 'This order has been canceled. No payments can be processed.'
                : isPaid 
                  ? 'Order completed' 
                  : 'Manage payments and items for this order'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pr-4">
            {/* Order Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${
                isCanceled 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  : 'bg-blue-50 dark:bg-slate-700/50 border-blue-200 dark:border-slate-600'
              }`}>
                <p className={`text-xs mb-1 ${
                  isCanceled 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-slate-400'
                }`}>
                  Total Amount
                </p>
                <p className={`text-2xl font-bold ${
                  isCanceled 
                    ? 'text-red-900 dark:text-red-300 line-through'
                    : 'text-blue-900 dark:text-amber-50'
                }`}>
                  ${order.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                isCanceled 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  : 'bg-green-50 dark:bg-slate-700/30 border-green-200 dark:border-slate-600'
              }`}>
                <p className={`text-xs mb-1 ${
                  isCanceled 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-slate-400'
                }`}>
                  Paid
                </p>
                <p className={`text-2xl font-bold ${
                  isCanceled 
                    ? 'text-red-900 dark:text-red-300 line-through'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  ${order.totalPaid.toFixed(2)}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                isCanceled 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  : 'bg-amber-50 dark:bg-slate-700/30 border-amber-200 dark:border-slate-600'
              }`}>
                <p className={`text-xs mb-1 ${
                  isCanceled 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-slate-400'
                }`}>
                  Remaining
                </p>
                <p className={`text-2xl font-bold ${
                  isCanceled 
                    ? 'text-red-900 dark:text-red-300 line-through'
                    : isPaid 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-amber-600 dark:text-yellow-400'
                }`}>
                  ${remainingAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-amber-50 mb-3">Items</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {order.items.map((item) => {
                  const isPaidItem = item.paidQuantity >= item.quantity;
                  const unpaidQuantity = item.quantity - item.paidQuantity;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isCanceled
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700 opacity-75'
                          : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {!isCanceled && (
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => handleItemToggle(item.id)}
                          className="mt-1 w-4 h-4 rounded cursor-pointer"
                          disabled={isPaidItem}
                        />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCanceled 
                            ? 'text-red-700 dark:text-red-400 line-through'
                            : 'text-slate-900 dark:text-amber-50'
                        }`}>
                          {item.itemName}
                        </p>
                        <p className={`text-xs ${
                          isCanceled 
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`font-semibold ${
                            isCanceled 
                              ? 'text-red-600 dark:text-red-400 line-through'
                              : isPaidItem 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-amber-600 dark:text-yellow-400'
                          }`}>
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                          {!isCanceled && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Paid: {item.paidQuantity}/{item.quantity}
                            </p>
                          )}
                        </div>
                        {!isCanceled && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar - Only show if not canceled */}
            {!isCanceled && (
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Payment Progress</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-amber-50">
                    {((order.totalPaid / order.totalAmount) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((order.totalPaid / order.totalAmount) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                {!isCanceled ? (
                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    className="bg-red-600 hover:bg-red-500 dark:bg-red-900 dark:hover:bg-red-800"
                  >
                    Cancel Order
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleReactivateOrder}
                    className="bg-green-600 hover:bg-green-500 text-white dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    Reactivate Order
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                {canPay && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePaySelected}
                      disabled={selectedItemIds.length === 0}
                    >
                      Pay Selected
                    </Button>
                    <Button
                      onClick={handlePayAll}
                      className="bg-amber-600 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
                    >
                      Pay All
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showPaymentModal && !isCanceled && (
        <PaymentModal
          order={order}
          selectedItemIds={selectedItemIds}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedItemIds([]);
          }}
          onPaymentComplete={() => {
            setShowPaymentModal(false);
            setSelectedItemIds([]);
            onOrderUpdated();
          }}
        />
      )}
    </>
  );
}