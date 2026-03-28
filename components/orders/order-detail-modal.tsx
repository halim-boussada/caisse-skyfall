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
import { updateOrder, deleteOrder } from '@/lib/storage';
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
    const updatedItems = order.items.filter(item => item.id !== itemId);
    if (updatedItems.length === 0) {
      if (confirm('Remove all items? This will cancel the order.')) {
        deleteOrder(order.id);
        toast.success('Order cancelled');
        onOrderUpdated();
      }
      return;
    }
    const newTotal = updatedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    updateOrder(order.id, { items: updatedItems, totalAmount: newTotal });
    toast.success('Item removed');
    onOrderUpdated();
  };

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      deleteOrder(order.id);
      toast.success('Order cancelled');
      onOrderUpdated();
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-screen max-w-none rounded-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - Table {order.tableNumber}</DialogTitle>
            <DialogDescription>
              {isPaid ? 'Order completed' : 'Manage payments and items for this order'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pr-4">
            {/* Order Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg border border-blue-200 dark:border-slate-600">
                <p className="text-xs text-blue-600 dark:text-slate-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-amber-50">${order.totalAmount.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 dark:bg-slate-700/30 p-4 rounded-lg border border-green-200 dark:border-slate-600">
                <p className="text-xs text-green-600 dark:text-slate-400 mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${order.totalPaid.toFixed(2)}</p>
              </div>
              <div className="bg-amber-50 dark:bg-slate-700/30 p-4 rounded-lg border border-amber-200 dark:border-slate-600">
                <p className="text-xs text-amber-600 dark:text-slate-400 mb-1">Remaining</p>
                <p className={`text-2xl font-bold ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-yellow-400'}`}>
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
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => handleItemToggle(item.id)}
                        className="mt-1 w-4 h-4 rounded cursor-pointer"
                        disabled={isPaidItem}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-amber-50">{item.itemName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`font-semibold ${isPaidItem ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-yellow-400'}`}>
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Paid: {item.paidQuantity}/{item.quantity}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar */}
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

            {/* Actions */}
            <div className="flex gap-2 justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
                className="bg-red-600 hover:bg-red-500 dark:bg-red-900 dark:hover:bg-red-800"
              >
                Cancel Order
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                {!isPaid && (
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

      {showPaymentModal && (
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
