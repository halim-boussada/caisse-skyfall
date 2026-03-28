'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addTable, getTables, getTableByPosition, deleteTable, updateTable, getOrdersByTable, getMenuItems, addOrder, updateOrder, getOrders } from '@/lib/storage';
import { toast } from 'sonner';

interface TableModalProps {
  position: { x: number; y: number };
  onClose: () => void;
  onTableCreated: () => void;
}

export default function TableModal({ position, onClose, onTableCreated }: TableModalProps) {
  const existingTable = getTableByPosition(position.x, position.y);
  const [tableNumber, setTableNumber] = useState(existingTable?.number.toString() || '');
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [activeTab, setActiveTab] = useState(existingTable ? 'order' : 'create');

  useEffect(() => {
    setMenuItems(getMenuItems());
  }, []);

  const handleSave = async () => {
    if (!tableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }

    setLoading(true);
    try {
      if (existingTable) {
        updateTable(existingTable.id, {
          number: parseInt(tableNumber),
          name: `Table ${tableNumber}`,
        });
        toast.success('Table updated');
      } else {
        const newTable = {
          id: `table-${Date.now()}`,
          number: parseInt(tableNumber),
          gridX: position.x,
          gridY: position.y,
          name: `Table ${tableNumber}`,
          status: 'empty' as const,
          createdAt: Date.now(),
        };
        addTable(newTable);
        toast.success('Table created');
      }
      onTableCreated();
      onClose();
    } catch (error) {
      toast.error('Failed to save table');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingTable) return;
    
    if (confirm('Are you sure you want to delete this table?')) {
      setLoading(true);
      try {
        deleteTable(existingTable.id);
        toast.success('Table deleted');
        onTableCreated();
        onClose();
      } catch (error) {
        toast.error('Failed to delete table');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddItems = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items');
      return;
    }

    setLoading(true);
    try {
      const orders = getOrders();
      let order = orders.find(o => o.tableId === existingTable?.id && o.status === 'active');

      const newItems = Array.from(selectedItems.entries()).map(([itemId, quantity]) => {
        const menuItem = menuItems.find(m => m.id === itemId);
        return {
          id: `oi-${Date.now()}-${Math.random()}`,
          menuItemId: itemId,
          quantity,
          unitPrice: menuItem.price,
          itemName: menuItem.name,
          categoryName: menuItem.categoryId,
          paidQuantity: 0,
          addedAt: Date.now(),
        };
      });

      if (order) {
        const updatedItems = [...order.items, ...newItems];
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        updateOrder(order.id, {
          items: updatedItems,
          totalAmount,
        });
      } else {
        if (!existingTable) {
          toast.error('Table not created yet');
          return;
        }
        const newOrder = {
          id: `order-${Date.now()}`,
          tableId: existingTable.id,
          tableNumber: existingTable.number,
          items: newItems,
          status: 'active' as const,
          totalAmount: newItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
          totalPaid: 0,
          createdAt: Date.now(),
        };
        addOrder(newOrder);
      }

      // Update table status
      if (existingTable) {
        updateTable(existingTable.id, { status: 'occupied' });
      }

      toast.success('Items added to order');
      setSelectedItems(new Map());
      onTableCreated();
      onClose();
    } catch (error) {
      console.error('Error adding items:', error);
      toast.error('Failed to add items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemQuantity = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    if (quantity > 0) {
      newSelected.set(itemId, quantity);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-h-[80vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingTable ? `Table ${existingTable.number}` : 'Create Table'}
          </DialogTitle>
          <DialogDescription>
            Position: ({position.x}, {position.y})
          </DialogDescription>
        </DialogHeader>

        {existingTable ? (
        <div>
           <div>
                <label className="block text-sm font-medium text-amber-50 mb-2">
                  Table Number
                </label>
                <Input
                  type="number"
                  min="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., 1"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-700 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-500"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
        </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-50 mb-2">
                Table Number
              </label>
              <Input
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g., 1"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500"
              >
                {loading ? 'Saving...' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
