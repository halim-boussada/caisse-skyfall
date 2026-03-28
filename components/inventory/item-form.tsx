'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addMenuItem, getMenuItems, updateMenuItem, deleteMenuItem } from '@/lib/storage';
import { toast } from 'sonner';

interface ItemFormProps {
  itemId: string | null;
  categoryId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ItemForm({ itemId, categoryId, onClose, onSave }: ItemFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (itemId) {
      const items = getMenuItems();
      const item = items.find(i => i.id === itemId);
      if (item) {
        setName(item.name);
        setPrice(item.price.toString());
        setDescription(item.description || '');
      }
    }
  }, [itemId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    if (!price || isNaN(parseFloat(price))) {
      toast.error('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const priceNum = parseFloat(price);
      if (itemId) {
        updateMenuItem(itemId, { name, price: priceNum, description });
        toast.success('Item updated');
      } else {
        const newItem = {
          id: `item-${Date.now()}`,
          categoryId,
          name,
          price: priceNum,
          description: description || undefined,
          createdAt: Date.now(),
        };
        addMenuItem(newItem);
        toast.success('Item created');
      }
      onSave();
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemId) return;

    if (confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      try {
        deleteMenuItem(itemId);
        toast.success('Item deleted');
        onSave();
      } catch (error) {
        toast.error('Failed to delete item');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle>{itemId ? 'Edit Item' : 'Create Item'}</DialogTitle>
          <DialogDescription>
            {itemId ? 'Update item details' : 'Add a new item to this category'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-amber-50 mb-2 block">Item Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Espresso"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label className="text-amber-50 mb-2 block">Price</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 2.50"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label className="text-amber-50 mb-2 block">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Single shot espresso"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              Cancel
            </Button>
            {itemId && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
