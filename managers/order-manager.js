/**
 * OrderManager - Centralized order state management
 * Handles CRUD operations, localStorage persistence, and event emission
 */
class OrderManager {
    constructor() {
        if (OrderManager.instance) {
            return OrderManager.instance;
        }

        this.storageKey = 'vect_confirmed_orders';
        this.orders = [];
        this.orderIdCounter = 0;
        this.eventListeners = new Map();

        // Load existing orders from localStorage
        this.loadOrders();

        OrderManager.instance = this;
    }

    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!OrderManager.instance) {
            OrderManager.instance = new OrderManager();
        }
        return OrderManager.instance;
    }

    /**
     * Load orders from localStorage
     */
    loadOrders() {
        try {
            const savedOrders = localStorage.getItem(this.storageKey);
            if (savedOrders) {
                this.orders = JSON.parse(savedOrders);
                
                // Find the highest order ID to continue counter
                if (this.orders.length > 0) {
                    this.orderIdCounter = Math.max(...this.orders.map(order => order.id)) + 1;
                }
                
                // Sort orders by date (newest first)
                this.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        } catch (error) {
            console.error('Error loading orders from localStorage:', error);
            this.orders = [];
        }
    }

    /**
     * Save orders to localStorage
     */
    saveOrders() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving orders to localStorage:', error);
        }
    }

    /**
     * Create a new order
     */
    createOrder(orderData) {
        const order = {
            id: this.orderIdCounter++,
            date: new Date().toISOString(),
            status: 'pending',
            customer: 'Walk-in Customer',
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            ...orderData
        };

        // Calculate totals if items provided
        if (order.items && order.items.length > 0) {
            this.calculateOrderTotals(order);
        }

        // Add to beginning of array (newest first)
        this.orders.unshift(order);
        this.saveOrders();

        // Emit event
        this.emit('orderCreated', { order });
        this.emit('ordersUpdated', { orders: this.orders });

        return order;
    }

    /**
     * Update an existing order
     */
    updateOrder(orderId, updates) {
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            console.warn(`Order with ID ${orderId} not found`);
            return null;
        }

        const oldOrder = { ...this.orders[orderIndex] };
        this.orders[orderIndex] = { ...this.orders[orderIndex], ...updates };

        // Recalculate totals if items updated
        if (updates.items) {
            this.calculateOrderTotals(this.orders[orderIndex]);
        }

        this.saveOrders();

        // Emit events
        this.emit('orderUpdated', { 
            order: this.orders[orderIndex], 
            oldOrder,
            changes: updates 
        });
        this.emit('ordersUpdated', { orders: this.orders });

        return this.orders[orderIndex];
    }

    /**
     * Delete an order
     */
    deleteOrder(orderId) {
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            console.warn(`Order with ID ${orderId} not found`);
            return false;
        }

        const deletedOrder = this.orders.splice(orderIndex, 1)[0];
        this.saveOrders();

        // Emit events
        this.emit('orderDeleted', { order: deletedOrder });
        this.emit('ordersUpdated', { orders: this.orders });

        return true;
    }

    /**
     * Get all orders
     */
    getAllOrders() {
        return [...this.orders];
    }

    /**
     * Get order by ID
     */
    getOrderById(orderId) {
        return this.orders.find(order => order.id === orderId) || null;
    }

    /**
     * Get orders by status
     */
    getOrdersByStatus(status) {
        return this.orders.filter(order => order.status === status);
    }

    /**
     * Get orders by date range
     */
    getOrdersByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= start && orderDate <= end;
        });
    }

    /**
     * Search orders by customer name or order ID
     */
    searchOrders(query) {
        if (!query || typeof query !== 'string') {
            return this.orders;
        }

        const lowerQuery = query.toLowerCase();
        return this.orders.filter(order => {
            return (
                order.id.toString().includes(lowerQuery) ||
                order.customer.toLowerCase().includes(lowerQuery) ||
                order.items.some(item => 
                    item.name.toLowerCase().includes(lowerQuery)
                )
            );
        });
    }

    /**
     * Update order status
     */
    updateOrderStatus(orderId, newStatus) {
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(newStatus)) {
            console.warn(`Invalid order status: ${newStatus}`);
            return null;
        }

        return this.updateOrder(orderId, { status: newStatus });
    }

    /**
     * Calculate order totals
     */
    calculateOrderTotals(order) {
        if (!order.items || order.items.length === 0) {
            order.subtotal = 0;
            order.tax = 0;
            order.total = 0;
            return order;
        }

        order.subtotal = order.items.reduce((sum, item) => {
            const itemPrice = item.itemTotal || (item.price * item.quantity);
            return sum + itemPrice;
        }, 0);

        order.tax = order.subtotal * 0.21; // 21% VAT
        order.total = order.subtotal + order.tax;

        return order;
    }

    /**
     * Get order statistics
     */
    getOrderStats() {
        const stats = {
            total: this.orders.length,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            today: 0,
            thisWeek: 0,
            totalRevenue: 0,
            averageOrderValue: 0
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        this.orders.forEach(order => {
            // Count by status
            if (stats.hasOwnProperty(order.status)) {
                stats[order.status]++;
            }

            // Count today's orders
            const orderDate = new Date(order.date);
            orderDate.setHours(0, 0, 0, 0);
            if (orderDate.getTime() === today.getTime()) {
                stats.today++;
            }

            // Count this week's orders
            if (orderDate >= weekStart) {
                stats.thisWeek++;
            }

            // Calculate revenue
            if (order.status === 'completed') {
                stats.totalRevenue += order.total || 0;
            }
        });

        // Calculate average order value
        const completedOrders = this.orders.filter(order => order.status === 'completed');
        if (completedOrders.length > 0) {
            stats.averageOrderValue = stats.totalRevenue / completedOrders.length;
        }

        return stats;
    }

    /**
     * Export orders to JSON
     */
    exportOrders(dateRange = null) {
        let ordersToExport = this.orders;

        if (dateRange && dateRange.start && dateRange.end) {
            ordersToExport = this.getOrdersByDateRange(dateRange.start, dateRange.end);
        }

        return {
            exportDate: new Date().toISOString(),
            totalOrders: ordersToExport.length,
            orders: ordersToExport
        };
    }

    /**
     * Event system - Add event listener
     */
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }

    /**
     * Event system - Remove event listener
     */
    off(event, listener) {
        if (!this.eventListeners.has(event)) return;

        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Event system - Emit event
     */
    emit(event, data = {}) {
        if (!this.eventListeners.has(event)) return;

        const listeners = this.eventListeners.get(event);
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });

        // Also emit DOM event for broader compatibility
        const customEvent = new CustomEvent(`order:${event}`, {
            detail: data,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(customEvent);
    }

    /**
     * Clear all orders (for testing/reset)
     */
    clearAllOrders() {
        this.orders = [];
        this.orderIdCounter = 0;
        this.saveOrders();
        this.emit('ordersCleared');
        this.emit('ordersUpdated', { orders: this.orders });
    }

    /**
     * Migrate legacy order data
     */
    migrateLegacyData() {
        // Check for legacy data structures and migrate if needed
        const legacyOrders = this.orders.filter(order => !order.hasOwnProperty('id'));
        
        if (legacyOrders.length > 0) {
            legacyOrders.forEach((order, index) => {
                if (!order.id) {
                    order.id = this.orderIdCounter++;
                }
                if (!order.status) {
                    order.status = 'completed'; // Assume legacy orders are completed
                }
                if (!order.date) {
                    order.date = new Date().toISOString();
                }
            });

            this.saveOrders();
            this.emit('datasMigrated', { migratedCount: legacyOrders.length });
        }
    }

    /**
     * Destroy the order manager
     */
    destroy() {
        this.eventListeners.clear();
        OrderManager.instance = null;
    }
}

export default OrderManager;