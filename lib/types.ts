// Category Type
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Menu Item Type
export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  createdAt: number;
}

// Table Type
export interface Table {
  id: string;
  number: number;
  gridX: number;
  gridY: number;
  status: 'empty' | 'occupied' | 'reserved';
  createdAt: number;
}

// Order Item Type
export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  itemName: string;
  categoryName: string;
  paidQuantity: number; // How many units are paid
  notes?: string;
  addedAt: number;
}

// Order Type
export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'active' | 'completed';
  totalAmount: number;
  totalPaid: number;
  createdAt: number;
  completedAt?: number;
}

// Transaction Type (for payment tracking)
export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'other';
  timestamp: number;
  itemIds: string[]; // Which order items were paid for
}

// Dashboard Stats Type
export interface DashboardStats {
  totalRevenue: number;
  ordersCompleted: number;
  tablesOccupied: number;
  averageOrderValue: number;
  topItems: Array<{
    itemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyRevenue: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
}
