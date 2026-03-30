'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2, ShoppingCart, Utensils, Search } from 'lucide-react';
import { getTables, getMenuItems, getCategories, addOrder, getOrders, updateTable } from '@/lib/storage';
import { Table, MenuItem, Category } from '@/lib/types';
import { toast } from 'sonner';

interface CreateOrderModalProps {
  onClose: () => void;
  onOrderCreated: () => void;
}

interface CartItem extends MenuItem {
  cartItemId: string;
  // No quantity field - each item is separate
}

export default function CreateOrderModal({ onClose, onOrderCreated }: CreateOrderModalProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'table' | 'items' | 'review'>('table');

  useEffect(() => {
    setTables(getTables());
    setCategories(getCategories());
    setMenuItems(getMenuItems());
  }, []);

  const getTableStatus = (table: Table) => {
    const orders = getOrders();
    const hasActiveOrder = orders.some(o => o.tableId === table.id && o.status === 'active');
    if (hasActiveOrder) return { text: 'Active Order', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' };
    if (table.status === 'occupied') return { text: 'Occupied', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' };
    return { text: 'Available', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' };
  };

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

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  const totalItems = cart.length;

  const handleAddToCart = (item: MenuItem) => {
    // Always add as a separate item, no quantity grouping
    setCart(prevCart => [
      ...prevCart,
      { 
        ...item, 
        cartItemId: `cart-${Date.now()}-${Math.random()}` 
      }
    ]);
    toast.success(`Added ${item.name} to order`);
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    toast.info('Item removed from order');
  };

  const handleClearCart = () => {
    setCart([]);
    toast.info('Cart cleared');
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setStep('items');
  };

  const handleCreateOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      toast.error('Please select a table and add items to the order');
      return;
    }

    setLoading(true);
    try {
      // Each cart item becomes a separate order item with quantity = 1
      const orderItems = cart.map((item, index) => ({
        id: `oi-${Date.now()}-${index}-${Math.random()}`,
        menuItemId: item.id,
        quantity: 1,
        unitPrice: item.price,
        itemName: item.name,
        categoryName: item.categoryId,
        paidQuantity: 0,
        addedAt: Date.now(),
      }));

      const newOrder = {
        id: `order-${Date.now()}`,
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        items: orderItems,
        status: 'active' as const,
        totalAmount: totalAmount,
        totalPaid: 0,
        createdAt: Date.now(),
      };

      addOrder(newOrder);

// send to printer
await fetch('/api/print', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newOrder),
});
      
      // Update table status to occupied if it's not already
      const currentTable = tables.find(t => t.id === selectedTable.id);
      if (currentTable?.status !== 'occupied') {
        updateTable(selectedTable.id, { status: 'occupied' });
      }
      
      toast.success(`Order created successfully for Table ${selectedTable.number}`);
      onOrderCreated();
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'items') {
      setStep('table');
      setSelectedTable(null);
      setCart([]);
    } else if (step === 'review') {
      setStep('items');
    }
  };

  return (
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Order</h1>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {selectedTable && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <Utensils className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-700 dark:text-amber-300">Table {selectedTable.number}</span>
                  </div>
                )}
                {totalItems > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <ShoppingCart className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">{totalItems} items · ${totalAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {['table', 'items', 'review'].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                  step === s 
                    ? 'bg-amber-600 text-white shadow-lg' 
                    : (step === 'items' && s === 'table') || (step === 'review' && (s === 'table' || s === 'items'))
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                {idx < 2 && (
                  <div className={`w-12 h-0.5 mx-1 ${
                    step === 'review' ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'table' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select a Table</h2>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Available
                  </span>
                  <span className="inline-flex items-center gap-1 ml-3">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Active Order
                  </span>
                  <span className="inline-flex items-center gap-1 ml-3">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> Occupied
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables.map((table) => {
                  const status = getTableStatus(table);
                  return (
                    <button
                      key={table.id}
                      onClick={() => handleSelectTable(table)}
                      className={`relative p-4 rounded-xl border-2 transition-all hover:border-amber-400 hover:shadow-lg hover:scale-105 cursor-pointer ${
                        selectedTable?.id === table.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/30'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Utensils className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                        <span className="text-xl font-bold text-slate-900 dark:text-white">#{table.number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'items' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Menu Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Menu Items</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Categories Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                      !selectedCategory
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                        selectedCategory?.id === category.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                      style={selectedCategory?.id === category.id ? {} : { borderLeft: `3px solid ${category.color}` }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className="group p-3 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-amber-400 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 flex-1">
                          {item.name}
                        </h3>
                        <Plus className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        ${item.price.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>

                {availableItems.length === 0 && (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No items found
                  </div>
                )}
              </div>

              {/* Cart - No quantity controls, each item is separate */}
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Order Cart</h2>
                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">Your cart is empty</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add items from the menu</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                      {cart.map((item) => (
                        <div key={item.cartItemId} className="bg-white dark:bg-slate-700 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm text-slate-900 dark:text-white">{item.name}</h3>
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.cartItemId)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                        <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-4">
                        <span className="text-slate-600 dark:text-slate-400">Items</span>
                        <span className="text-sm">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                      </div>
                      <Button
                        onClick={() => setStep('review')}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        Review Order
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Table</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Table {selectedTable?.number}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Items</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span>
                  </div>
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between text-sm pl-4">
                      <span>{item.name}</span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t-2 border-slate-200 dark:border-slate-700">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={step === 'table'}
            className="px-6"
          >
            Back
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
            {step === 'review' ? (
              <Button
                onClick={handleCreateOrder}
                disabled={loading || !selectedTable || cart.length === 0}
                className="bg-amber-600 hover:bg-amber-500 px-8 text-white font-semibold"
              >
                {loading ? 'Creating...' : 'Create Order'}
              </Button>
            ) : step === 'items' && cart.length > 0 && (
              <Button
                onClick={() => setStep('review')}
                className="bg-amber-600 hover:bg-amber-500 px-8 text-white font-semibold"
              >
                Review Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}