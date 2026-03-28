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
import { Label } from '@/components/ui/label';
import { Order } from '@/lib/types';
import { updateOrder, addTransaction, getOrders } from '@/lib/storage';
import { toast } from 'sonner';

interface PaymentModalProps {
  order: Order;
  selectedItemIds: string[];
  onClose: () => void;
  onPaymentComplete: () => void;
}

export default function PaymentModal({
  order,
  selectedItemIds,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [loading, setLoading] = useState(false);

  // Calculate the amount to pay
  const paymentAmount = order.items
    .filter(item => selectedItemIds.includes(item.id))
    .reduce((sum, item) => {
      const unpaidQuantity = item.quantity - item.paidQuantity;
      return sum + unpaidQuantity * item.unitPrice;
    }, 0);

  const handlePay = async () => {
    if (paymentAmount <= 0) {
      toast.error('No amount to pay');
      return;
    }

    setLoading(true);
    try {
      // Update order items with paid quantities
      const updatedItems = order.items.map(item => {
        if (selectedItemIds.includes(item.id)) {
          return {
            ...item,
            paidQuantity: item.quantity,
          };
        }
        return item;
      });

      // Calculate new totals
      const newTotalPaid = updatedItems.reduce((sum, item) => {
        return sum + item.paidQuantity * item.unitPrice;
      }, 0);

      const newStatus = newTotalPaid >= order.totalAmount ? 'completed' : 'active';
      const completedAt = newStatus === 'completed' ? Date.now() : undefined;

      // Update order
      updateOrder(order.id, {
        items: updatedItems,
        totalPaid: newTotalPaid,
        status: newStatus,
        completedAt,
      });

      // Add transaction
      addTransaction({
        id: `txn-${Date.now()}`,
        orderId: order.id,
        amount: paymentAmount,
        paymentMethod,
        timestamp: Date.now(),
        itemIds: selectedItemIds,
      });

      toast.success(`Payment of $${paymentAmount.toFixed(2)} recorded`);
      onPaymentComplete();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Table {order.tableNumber} - {selectedItemIds.length} item{selectedItemIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-700">
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              ${paymentAmount.toFixed(2)}
            </p>
          </div>

          {/* Selected Items */}
          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg space-y-2">
            <p className="font-semibold text-sm">Items to Pay:</p>
            {order.items
              .filter(item => selectedItemIds.includes(item.id))
              .map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.itemName}</span>
                  <span className="font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'other'] as const).map((method) => (
                <Button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  className={paymentMethod === method ? 'bg-amber-600 hover:bg-amber-500' : ''}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePay}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500"
            >
              {loading ? 'Processing...' : `Pay $${paymentAmount.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
