'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ShoppingCart, Search, X, Utensils } from 'lucide-react';
import { Order, MenuItem, Category } from '@/lib/types';
import { updateOrder, getTransactions, getMenuItems, getCategories } from '@/lib/storage';
import { toast } from 'sonner';
import PaymentModal from './payment-modal';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onOrderUpdated: () => void;
}

interface AddItem extends MenuItem {
  tempId: string;
}

export default function OrderDetailModal({ order, onClose, onOrderUpdated }: OrderDetailModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemsToAdd, setItemsToAdd] = useState<AddItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMenuItems(getMenuItems());
    setCategories(getCategories());
  }, []);

  const remainingAmount = order.totalAmount - order.totalPaid;
  const isPaid = remainingAmount <= 0;
  const isCanceled = order.status === 'canceled';

  const availableItems = useMemo(() => {
    let items = selectedCategory
      ? menuItems.filter(item => item.categoryId === selectedCategory.id)
      : menuItems;
    
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return items;
  }, [selectedCategory, menuItems, searchQuery]);

  const totalAddAmount = itemsToAdd.reduce((sum, item) => sum + item.price, 0);
  const totalAddItems = itemsToAdd.length;

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
    
    const newTotal = updatedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    
    updateOrder(order.id, { 
      items: updatedItems, 
      totalAmount: newTotal 
    });
    
    toast.success('Item removed');
    onOrderUpdated();
  };

  const handleAddToAddList = (item: MenuItem) => {
    setItemsToAdd(prev => [
      ...prev,
      {
        ...item,
        tempId: `temp-${Date.now()}-${Math.random()}`
      }
    ]);
    toast.success(`Added ${item.name} to add list`);
  };

  const handleRemoveFromAddList = (tempId: string) => {
    setItemsToAdd(prev => prev.filter(item => item.tempId !== tempId));
    toast.info('Item removed from add list');
  };

  const handleClearAddList = () => {
    setItemsToAdd([]);
    toast.info('Add list cleared');
  };

  const handleConfirmAddItems = () => {
    if (itemsToAdd.length === 0) {
      toast.error('No items to add');
      return;
    }

    const newItems = itemsToAdd.map((item, index) => ({
      id: `oi-${Date.now()}-${index}-${Math.random()}`,
      menuItemId: item.id,
      quantity: 1,
      unitPrice: item.price,
      itemName: item.name,
      categoryName: item.categoryId,
      paidQuantity: 0,
      addedAt: Date.now(),
    }));

    const updatedItems = [...order.items, ...newItems];
    const newTotal = updatedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    updateOrder(order.id, {
      items: updatedItems,
      totalAmount: newTotal
    });

    toast.success(`Added ${itemsToAdd.length} item(s) to order`);
    setItemsToAdd([]);
    setShowAddItems(false);
    onOrderUpdated();
  };

  const handleCancelOrder = () => {
    if (isCanceled) {
      toast.error('Order is already canceled');
      return;
    }

    if (confirm('Are you sure you want to cancel this order? This will set the order status to canceled and remove all associated transactions.')) {
      const allTransactions = getTransactions();
      const updatedTransactions = allTransactions.filter(t => t.orderId !== order.id);
      localStorage.setItem('caisse_transactions', JSON.stringify(updatedTransactions));
      
      updateOrder(order.id, {
        status: 'canceled',
        totalPaid: 0,
        items: order.items.map(item => ({
          ...item,
          paidQuantity: 0
        }))
      });
      
      toast.success(`Order #${order.id} has been canceled.`);
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

  const canPay = !isPaid && !isCanceled;
  const canAddItems = !isCanceled && !isPaid;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <ShoppingCart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Order Details - Table {order.tableNumber}
                    {isCanceled && (
                      <span className="ml-3 text-sm text-red-600 dark:text-red-400 font-normal">
                        (Canceled)
                      </span>
                    )}
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <Utensils className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-700 dark:text-amber-300">Table {order.tableNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <ShoppingCart className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">{order.items.length} items · ${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Order Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
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

            {/* Add Items Section */}
            {showAddItems && (
              <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Add Items to Order</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddItems(false);
                      setItemsToAdd([]);
                      setSelectedCategory(null);
                      setSearchQuery('');
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Search and Categories */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                          !selectedCategory
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        All
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                            selectedCategory?.id === category.id
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Items Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                    {availableItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddToAddList(item)}
                        className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-amber-400 hover:shadow-md transition-all text-left"
                      >
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-2">
                          ${item.price.toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Items to Add List */}
                  {itemsToAdd.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Items to add ({totalAddItems})
                        </p>
                        <button
                          onClick={handleClearAddList}
                          className="text-xs text-red-600 dark:text-red-400"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {itemsToAdd.map((item) => (
                          <div key={item.tempId} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-900 dark:text-white">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-amber-600">${item.price.toFixed(2)}</span>
                              <button
                                onClick={() => handleRemoveFromAddList(item.tempId)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                        <span className="font-semibold text-slate-900 dark:text-white">Total to add:</span>
                        <span className="font-bold text-amber-600">${totalAddAmount.toFixed(2)}</span>
                      </div>
                      <Button
                        onClick={handleConfirmAddItems}
                        className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white"
                      >
                        Add {totalAddItems} Item(s) to Order
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-amber-50">Items</h3>
                {canAddItems && !showAddItems && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddItems(true)}
                    className="bg-amber-600 hover:bg-amber-500"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Items
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {order.items.map((item) => {
                  const isPaidItem = item.paidQuantity >= item.quantity;

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

            {/* Progress Bar */}
            {!isCanceled && !isPaid && (
              <div className="mt-6">
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
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-between">
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
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Close
              </Button>
              {canPay && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePaySelected}
                    disabled={selectedItemIds.length === 0}
                    className="px-6"
                  >
                    Pay Selected
                  </Button>
                  <Button
                    onClick={handlePayAll}
                    className="bg-amber-600 hover:bg-amber-500 px-8 text-white font-semibold"
                  >
                    Pay All
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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