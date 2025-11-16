import eventBus from './event-bus.js';

class OrderHistoryService {
    constructor() {
        this.orders = [];
        this.currentPage = 1;
        this.ordersPerPage = 10;
        this.filters = {
            dateRange: 'all',
            status: 'all',
            searchQuery: ''
        };
        this.loadSampleData();
    }

    loadSampleData() {
        // Real products from the POS system
        const products = [
            // Pizza
            { id: 1, name: 'Margherita', price: 12.90, category: 'pizza' },
            { id: 2, name: 'Pepperoni', price: 15.50, category: 'pizza' },
            { id: 3, name: 'Quattro Stagioni', price: 17.80, category: 'pizza' },
            { id: 4, name: 'Diavola', price: 16.20, category: 'pizza' },
            { id: 5, name: 'Capricciosa', price: 18.50, category: 'pizza' },
            { id: 6, name: 'Marinara', price: 11.90, category: 'pizza' },
            { id: 7, name: 'Prosciutto e Funghi', price: 17.20, category: 'pizza' },
            { id: 8, name: 'Quattro Formaggi', price: 19.80, category: 'pizza' },
            
            // White Pizza
            { id: 9, name: 'Bianca Tradizionale', price: 14.50, category: 'white-pizza' },
            { id: 10, name: 'Bianca con Salsiccia', price: 18.90, category: 'white-pizza' },
            { id: 11, name: 'Bianca con Spinaci', price: 16.80, category: 'white-pizza' },
            { id: 12, name: 'Bianca Mortadella e Pistacchi', price: 21.50, category: 'white-pizza' },
            
            // Salads
            { id: 17, name: 'Caesar Salad', price: 9.50, category: 'salads' },
            { id: 18, name: 'Greek Salad', price: 8.80, category: 'salads' },
            { id: 19, name: 'Caprese Salad', price: 12.90, category: 'salads' },
            { id: 20, name: 'Arugula Salad', price: 10.50, category: 'salads' },
            
            // Desserts
            { id: 25, name: 'Tiramisu', price: 6.50, category: 'desserts' },
            { id: 26, name: 'Panna Cotta', price: 5.80, category: 'desserts' },
            { id: 27, name: 'Gelato Siciliano', price: 4.20, category: 'desserts' },
            { id: 28, name: 'Cannoli Siciliani', price: 7.90, category: 'desserts' },
            
            // Hot Drinks
            { id: 33, name: 'Espresso', price: 2.20, category: 'hot-drinks' },
            { id: 34, name: 'Cappuccino', price: 3.50, category: 'hot-drinks' },
            { id: 35, name: 'Latte', price: 4.20, category: 'hot-drinks' },
            { id: 36, name: 'Hot Chocolate', price: 4.80, category: 'hot-drinks' },
            
            // Cold Drinks
            { id: 41, name: 'Coca Cola', price: 3.50, category: 'cold-drinks' },
            { id: 42, name: 'Fresh Orange Juice', price: 4.80, category: 'cold-drinks' },
            { id: 43, name: 'Lemonade', price: 4.20, category: 'cold-drinks' },
            { id: 44, name: 'Iced Tea', price: 3.80, category: 'cold-drinks' },
            
            // Alcohol
            { id: 49, name: 'Heineken Beer 0.33L', price: 4.20, category: 'alcohol' },
            { id: 50, name: 'Corona Extra 0.33L', price: 4.50, category: 'alcohol' },
            { id: 54, name: 'Prosecco Bottle 0.75L', price: 18.50, category: 'alcohol' }
        ];

        // Available modifiers for pizzas
        const pizzaModifiers = [
            { id: 1, name: 'Extra Mozzarella', price: 2.50 },
            { id: 2, name: 'Pepperoni', price: 3.00 },
            { id: 3, name: 'Mushrooms', price: 2.00 },
            { id: 4, name: 'Bell Peppers', price: 2.00 },
            { id: 5, name: 'Red Onions', price: 1.50 },
            { id: 6, name: 'Olives', price: 2.50 },
            { id: 7, name: 'Tomatoes', price: 2.00 },
            { id: 8, name: 'Basil', price: 1.50 },
            { id: 9, name: 'Prosciutto', price: 4.00 },
            { id: 10, name: 'Salami', price: 3.50 },
            { id: 11, name: 'Arugula', price: 2.00 },
            { id: 12, name: 'Parmesan', price: 3.00 }
        ];

        const sampleOrders = [];
        const statuses = ['completed', 'pending', 'cancelled'];
        const customers = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Mike Brown', 'Sarah Connor', 'Tony Stark', 'Peter Parker', 'Bruce Wayne', 'Clark Kent'];
        
        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
            
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const customer = customers[Math.floor(Math.random() * customers.length)];
            
            // Generate random items for each order (1-4 items per order)
            const itemCount = Math.floor(Math.random() * 4) + 1;
            const items = [];
            let subtotal = 0;
            
            for (let j = 0; j < itemCount; j++) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
                
                // Create item based on product
                const item = {
                    id: randomProduct.id,
                    name: randomProduct.name,
                    basePrice: randomProduct.price,
                    price: randomProduct.price,
                    quantity: quantity,
                    category: randomProduct.category
                };

                // Add modifiers for pizza items (0-4 random modifiers)
                if (randomProduct.category === 'pizza' || randomProduct.category === 'white-pizza') {
                    const modifierCount = Math.floor(Math.random() * 5); // 0-4 modifiers
                    if (modifierCount > 0) {
                        const selectedModifiers = [];
                        const availableModifiers = [...pizzaModifiers];
                        
                        for (let k = 0; k < modifierCount; k++) {
                            const randomIndex = Math.floor(Math.random() * availableModifiers.length);
                            const modifier = availableModifiers.splice(randomIndex, 1)[0];
                            selectedModifiers.push(modifier);
                        }
                        
                        if (selectedModifiers.length > 0) {
                            item.modifiers = selectedModifiers;
                            const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
                            item.itemTotal = (randomProduct.price + modifiersTotal) * quantity;
                        } else {
                            item.itemTotal = randomProduct.price * quantity;
                        }
                    } else {
                        item.itemTotal = randomProduct.price * quantity;
                    }
                } else {
                    item.itemTotal = randomProduct.price * quantity;
                }
                
                items.push(item);
                subtotal += item.itemTotal;
            }
            
            const tax = subtotal * 0.21;
            const total = subtotal + tax;
            
            sampleOrders.push({
                id: `ORD-${String(i).padStart(4, '0')}`,
                date: date.toISOString(),
                customer: customer,
                status: status,
                items: items,
                subtotal: parseFloat(subtotal.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                paymentMethod: Math.random() > 0.5 ? 'card' : 'cash'
            });
        }
        
        // Sort by date (newest first)
        this.orders = sampleOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getFilteredOrders() {
        let filtered = [...this.orders];

        // Filter by date range
        if (this.filters.dateRange !== 'all') {
            const now = new Date();
            let startDate;

            switch (this.filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(order => new Date(order.date) >= startDate);
            }
        }

        // Filter by status
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === this.filters.status);
        }

        // Filter by search query
        if (this.filters.searchQuery) {
            const query = this.filters.searchQuery.toLowerCase();
            filtered = filtered.filter(order => 
                order.id.toLowerCase().includes(query) ||
                order.customer.toLowerCase().includes(query) ||
                order.items.some(item => item.name.toLowerCase().includes(query))
            );
        }

        return filtered;
    }

    getPaginatedOrders() {
        const filtered = this.getFilteredOrders();
        const startIndex = (this.currentPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        
        return {
            orders: filtered.slice(startIndex, endIndex),
            totalOrders: filtered.length,
            totalPages: Math.ceil(filtered.length / this.ordersPerPage),
            currentPage: this.currentPage
        };
    }

    setDateFilter(dateRange) {
        this.filters.dateRange = dateRange;
        this.currentPage = 1; // Reset to first page
        this.emitOrdersUpdate();
    }

    setStatusFilter(status) {
        this.filters.status = status;
        this.currentPage = 1; // Reset to first page
        this.emitOrdersUpdate();
    }

    setSearchQuery(query) {
        this.filters.searchQuery = query;
        this.currentPage = 1; // Reset to first page
        this.emitOrdersUpdate();
    }

    nextPage() {
        const { totalPages } = this.getPaginatedOrders();
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.emitOrdersUpdate();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.emitOrdersUpdate();
        }
    }

    goToPage(page) {
        const { totalPages } = this.getPaginatedOrders();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.emitOrdersUpdate();
        }
    }

    getOrderById(orderId) {
        return this.orders.find(order => order.id === orderId);
    }

    getStats() {
        const filtered = this.getFilteredOrders();
        
        const totalOrders = filtered.length;
        const totalRevenue = filtered
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + order.total, 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalOrders,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            avgOrderValue: parseFloat(avgOrderValue.toFixed(2))
        };
    }

    addOrder(orderData) {
        const newOrder = {
            id: `ORD-${String(this.orders.length + 1).padStart(4, '0')}`,
            date: new Date().toISOString(),
            ...orderData
        };

        this.orders.unshift(newOrder); // Add to beginning (newest first)
        this.saveToStorage();
        this.emitOrdersUpdate();
        
        return newOrder;
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.getOrderById(orderId);
        if (order) {
            order.status = newStatus;
            this.saveToStorage();
            this.emitOrdersUpdate();
            
            eventBus.emit('order:status:updated', {
                orderId,
                oldStatus: order.status,
                newStatus
            });
        }
    }

    deleteOrder(orderId) {
        const index = this.orders.findIndex(order => order.id === orderId);
        if (index !== -1) {
            const deletedOrder = this.orders.splice(index, 1)[0];
            this.saveToStorage();
            this.emitOrdersUpdate();
            
            eventBus.emit('order:deleted', {
                order: deletedOrder
            });
            
            return deletedOrder;
        }
    }

    // Storage methods
    saveToStorage() {
        try {
            localStorage.setItem('vectis_order_history', JSON.stringify({
                orders: this.orders,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Failed to save order history:', error);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('vectis_order_history');
            if (stored) {
                const data = JSON.parse(stored);
                this.orders = data.orders || [];
            }
        } catch (error) {
            console.error('Failed to load order history:', error);
            this.loadSampleData(); // Fallback to sample data
        }
    }

    clearStorage() {
        try {
            localStorage.removeItem('vectis_order_history');
            this.orders = [];
            this.emitOrdersUpdate();
        } catch (error) {
            console.error('Failed to clear order history:', error);
        }
    }

    // Event emission
    emitOrdersUpdate() {
        const paginatedData = this.getPaginatedOrders();
        const stats = this.getStats();
        
        eventBus.emit('order-history:updated', {
            ...paginatedData,
            stats,
            filters: { ...this.filters }
        });
    }

    // Utility methods
    exportOrders(format = 'json') {
        const filtered = this.getFilteredOrders();
        
        switch (format) {
            case 'csv':
                return this.exportToCsv(filtered);
            case 'json':
            default:
                return JSON.stringify(filtered, null, 2);
        }
    }

    exportToCsv(orders) {
        const headers = ['Order ID', 'Date', 'Customer', 'Status', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment Method'];
        const rows = orders.map(order => [
            order.id,
            new Date(order.date).toLocaleDateString(),
            order.customer,
            order.status,
            order.items.length,
            `€${order.subtotal.toFixed(2)}`,
            `€${order.tax.toFixed(2)}`,
            `€${order.total.toFixed(2)}`,
            order.paymentMethod
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return csvContent;
    }

    reset() {
        this.currentPage = 1;
        this.filters = {
            dateRange: 'all',
            status: 'all',
            searchQuery: ''
        };
    }
}

// Export as singleton
export default new OrderHistoryService();