import { 
  Category, 
  MenuItem, 
  Table, 
  Order, 
  OrderItem,
  Transaction 
} from './types';

const STORAGE_KEYS = {
  CATEGORIES: 'caisse_categories',
  ITEMS: 'caisse_items',
  TABLES: 'caisse_tables',
  ORDERS: 'caisse_orders',
  TRANSACTIONS: 'caisse_transactions',
};

// Utility function to check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Generic get function
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
}

// Generic set function
export function saveToStorage<T>(key: string, value: T): void {
  if (!isBrowser) return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage: ${key}`, error);
  }
}

// ============= CATEGORIES =============
export function getCategories(): Category[] {
  return getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
}

export function saveCategories(categories: Category[]): void {
  saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
}

export function addCategory(category: Category): void {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
}

export function updateCategory(id: string, updates: Partial<Category>): void {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates };
    saveCategories(categories);
  }
}

export function deleteCategory(id: string): void {
  const categories = getCategories();
  saveCategories(categories.filter(c => c.id !== id));
}

// ============= MENU ITEMS =============
export function getMenuItems(): MenuItem[] {
  return getFromStorage<MenuItem[]>(STORAGE_KEYS.ITEMS, []);
}

export function saveMenuItems(items: MenuItem[]): void {
  saveToStorage(STORAGE_KEYS.ITEMS, items);
}

export function addMenuItem(item: MenuItem): void {
  const items = getMenuItems();
  items.push(item);
  saveMenuItems(items);
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>): void {
  const items = getMenuItems();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveMenuItems(items);
  }
}

export function deleteMenuItem(id: string): void {
  const items = getMenuItems();
  saveMenuItems(items.filter(i => i.id !== id));
}

export function getItemsByCategory(categoryId: string): MenuItem[] {
  return getMenuItems().filter(item => item.categoryId === categoryId);
}

// ============= TABLES =============
export function getTables(): Table[] {
  return getFromStorage<Table[]>(STORAGE_KEYS.TABLES, []);
}

export function saveTables(tables: Table[]): void {
  saveToStorage(STORAGE_KEYS.TABLES, tables);
}

export function addTable(table: Table): void {
  const tables = getTables();
  tables.push(table);
  saveTables(tables);
}

export function updateTable(id: string, updates: Partial<Table>): void {
  const tables = getTables();
  const index = tables.findIndex(t => t.id === id);
  if (index !== -1) {
    tables[index] = { ...tables[index], ...updates };
    saveTables(tables);
  }
}

export function deleteTable(id: string): void {
  const tables = getTables();
  saveTables(tables.filter(t => t.id !== id));
}

export function getTableByPosition(gridX: number, gridY: number): Table | undefined {
  return getTables().find(t => t.gridX === gridX && t.gridY === gridY);
}

// ============= ORDERS =============
export function getOrders(): Order[] {
  return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function saveOrders(orders: Order[]): void {
  saveToStorage(STORAGE_KEYS.ORDERS, orders);
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
}

export function updateOrder(id: string, updates: Partial<Order>): void {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    saveOrders(orders);
  }
}

export function deleteOrder(id: string): void {
  const orders = getOrders();
  saveOrders(orders.filter(o => o.id !== id));
}

export function getOrdersByTable(tableId: string): Order[] {
  return getOrders().filter(o => o.tableId === tableId && o.status === 'active');
}

export function getActiveOrders(): Order[] {
  return getOrders().filter(o => o.status === 'active');
}

export function getCompletedOrders(): Order[] {
  return getOrders().filter(o => o.status === 'completed');
}

// ============= TRANSACTIONS =============
export function getTransactions(): Transaction[] {
  return getFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function saveTransactions(transactions: Transaction[]): void {
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function addTransaction(transaction: Transaction): void {
  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
}

export function getTransactionsByOrder(orderId: string): Transaction[] {
  return getTransactions().filter(t => t.orderId === orderId);
}

// ============= ANALYTICS =============
export function getTodayRevenue(): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  return getTransactions()
    .filter(t => t.timestamp >= startOfDay)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTodayOrders(): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  return getCompletedOrders()
    .filter(o => o.completedAt && o.completedAt >= startOfDay)
    .length;
}

export function getTopItemsToday(): Array<{ itemId: string; name: string; quantity: number; revenue: number }> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const orders = getCompletedOrders().filter(o => o.completedAt && o.completedAt >= startOfDay);
  const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemStats[item.menuItemId]) {
        itemStats[item.menuItemId] = {
          name: item.itemName,
          quantity: 0,
          revenue: 0,
        };
      }
      itemStats[item.menuItemId].quantity += item.quantity;
      itemStats[item.menuItemId].revenue += item.quantity * item.unitPrice;
    });
  });
  
  return Object.entries(itemStats)
    .map(([itemId, stats]) => ({
      itemId,
      ...stats,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export function getHourlyRevenue(): Array<{ hour: number; revenue: number; orders: number }> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const hourly: Record<number, { revenue: number; orders: number }> = {};
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourly[i] = { revenue: 0, orders: 0 };
  }
  
  // Add transaction data
  getTransactions()
    .filter(t => t.timestamp >= startOfDay)
    .forEach(t => {
      const hour = new Date(t.timestamp).getHours();
      hourly[hour].revenue += t.amount;
    });
  
  // Count completed orders by hour
  getCompletedOrders()
    .filter(o => o.completedAt && o.completedAt >= startOfDay)
    .forEach(o => {
      const hour = new Date(o.completedAt!).getHours();
      hourly[hour].orders += 1;
    });
  
  return Object.entries(hourly).map(([hour, data]) => ({
    hour: parseInt(hour),
    ...data,
  }));
}

// ============= INITIALIZATION =============
export function initializeDefaultData(): void {
  // Initialize with some default categories and items if empty
  if (getCategories().length === 0) {
    const defaultCategories: Category[] = [
      {
        id: '1',
        name: 'Coffee',
        color: '#8B4513',
        createdAt: Date.now(),
      },
      {
        id: '2',
        name: 'Tea',
        color: '#2d5016',
        createdAt: Date.now(),
      },
      {
        id: '3',
        name: 'Pastries',
        color: '#CD853F',
        createdAt: Date.now(),
      },
    ];
    saveCategories(defaultCategories);
    
    const defaultItems: MenuItem[] = [
      {
        id: 'item-1',
        categoryId: '1',
        name: 'Espresso',
        price: 2.5,
        description: 'Single shot espresso',
        createdAt: Date.now(),
      },
      {
        id: 'item-2',
        categoryId: '1',
        name: 'Latte',
        price: 4.0,
        description: 'Espresso with steamed milk',
        createdAt: Date.now(),
      },
      {
        id: 'item-3',
        categoryId: '2',
        name: 'Green Tea',
        price: 2.5,
        createdAt: Date.now(),
      },
      {
        id: 'item-4',
        categoryId: '3',
        name: 'Croissant',
        price: 3.0,
        createdAt: Date.now(),
      },
    ];
    saveMenuItems(defaultItems);
  }
}
