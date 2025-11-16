import componentLoader from '../../components/base/component-loader.js';

class VectHomeScreenV2 {
    constructor(app, data = {}) {
        this.app = app;
        this.data = data;
        this.cartManager = app.getCartManager();
        this.storageManager = app.getStorageManager();
        this.eventBus = app.eventBus;
        
        // Component instances
        this.components = {
            orderTabs: null,
            categories: null,
            search: null,
            productsGrid: null,
            cart: null,
            header: null
        };

        // State
        this.currentOrder = [];
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.products = [];
    }

    async render() {
        await this.loadProducts();

        return `
            <div class="pos-layout vect-theme">
                <!-- Header Component -->
                <div id="header-component"></div>

                <!-- Main Content Area -->
                <div class="vect-main">
                    <!-- Left Sidebar - Cart Component -->
                    <div id="cart-component"></div>

                    <!-- Content Area (Controls + Products) -->
                    <div class="vect-content">
                        <!-- Controls Panel -->
                        <div class="vect-controls">
                            <!-- Order Tabs Component -->
                            <div id="order-tabs-component"></div>

                            <!-- Categories and Search Container -->
                            <div class="vect-categories-search-container">
                                <!-- Categories Component -->
                                <div id="categories-component"></div>

                                <!-- Search Component -->
                                <div id="search-component"></div>
                            </div>
                        </div>

                        <!-- Products Grid Component -->
                        <div id="products-grid-component"></div>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        await this.initializeComponents();
        this.setupComponentCommunication();
    }

    async initializeComponents() {
        try {
            // Initialize Header Component
            const headerResult = await componentLoader.createComponent('header', {
                title: 'Vectis POS',
                user: 'Administrator'
            }, { eventBus: this.eventBus });
            document.getElementById('header-component').appendChild(headerResult.element);
            this.components.header = headerResult.component;

            // Initialize Order Tabs Component
            const orderTabsResult = await componentLoader.createComponent('order-tabs', {
                currentOrder: this.currentOrder,
                activeTab: 'current'
            }, { eventBus: this.eventBus });
            document.getElementById('order-tabs-component').appendChild(orderTabsResult.element);
            this.components.orderTabs = orderTabsResult.component;

            // Initialize Categories Component
            const categoriesResult = await componentLoader.createComponent('categories', {
                selectedCategory: this.selectedCategory
            }, { eventBus: this.eventBus });
            document.getElementById('categories-component').appendChild(categoriesResult.element);
            this.components.categories = categoriesResult.component;

            // Initialize Search Component
            const searchResult = await componentLoader.createComponent('search', {
                searchQuery: this.searchQuery
            }, { eventBus: this.eventBus });
            document.getElementById('search-component').appendChild(searchResult.element);
            this.components.search = searchResult.component;

            // Initialize Products Grid Component
            const productsGridResult = await componentLoader.createComponent('products-grid', {
                products: this.products,
                selectedCategory: this.selectedCategory,
                searchQuery: this.searchQuery,
                categoryTitle: this.getCategoryTitle(this.selectedCategory)
            }, { eventBus: this.eventBus });
            document.getElementById('products-grid-component').appendChild(productsGridResult.element);
            this.components.productsGrid = productsGridResult.component;

            // Initialize Cart Component
            const cartResult = await componentLoader.createComponent('cart', {
                currentOrder: this.currentOrder,
                taxRate: 0.21
            }, { eventBus: this.eventBus });
            document.getElementById('cart-component').appendChild(cartResult.element);
            this.components.cart = cartResult.component;

        } catch (error) {
            console.error('Failed to initialize components:', error);
            this.app.showError('Failed to initialize components');
        }
    }

    setupComponentCommunication() {
        // Order Tabs events
        this.components.orderTabs.on('order-tabs:switched', (data) => {
            this.handleTabSwitch(data.tabId);
        });

        // Categories events
        this.components.categories.on('categories:changed', (data) => {
            this.selectedCategory = data.categoryId;
            this.components.productsGrid.setSelectedCategory(data.categoryId);
        });

        // Search events
        this.components.search.on('search:query-changed', (data) => {
            this.searchQuery = data.query;
            this.components.productsGrid.setSearchQuery(data.query);
        });

        // Products Grid events
        this.components.productsGrid.on('products:selected', (data) => {
            this.addToCart(data.product);
        });

        // Cart events
        this.components.cart.on('cart:updated', (data) => {
            this.currentOrder = data.items;
            this.components.orderTabs.setCurrentOrder(this.currentOrder);
        });

        this.components.cart.on('cart:checkout', (data) => {
            this.processCheckout(data);
        });
    }

    handleTabSwitch(tabId) {
        switch (tabId) {
            case 'current':
                this.showMessage('Order items view', 'info');
                break;
            case 'orders':
                this.showOrderHistory();
                break;
        }
    }

    addToCart(product) {
        const existingItem = this.currentOrder.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.currentOrder.push({
                ...product,
                quantity: 1
            });
        }
        
        this.components.cart.setCurrentOrder(this.currentOrder);
    }

    processCheckout(data) {
        if (data.items.length === 0) {
            this.showMessage('Cart is empty', 'warning');
            return;
        }
        
        // Simulate payment processing
        this.showMessage('Processing payment...', 'info');
        
        setTimeout(() => {
            // Save order to history
            this.saveOrderToHistory(data);
            
            // Clear cart
            this.currentOrder = [];
            this.components.cart.setCurrentOrder(this.currentOrder);
            
            this.showMessage(`Payment successful! Total: €${data.total.toFixed(2)}`, 'success');
        }, 1500);
    }

    saveOrderToHistory(orderData) {
        // This would typically save to a backend service
        // For now, we'll use local storage
        const orderHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
        
        const newOrder = {
            id: `ORD-${Date.now()}`,
            date: new Date().toISOString(),
            customer: orderData.customer || 'Walk-in Customer',
            items: orderData.items,
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            total: orderData.total,
            paymentMethod: 'card',
            status: 'completed'
        };
        
        orderHistory.unshift(newOrder);
        
        // Keep only last 100 orders
        if (orderHistory.length > 100) {
            orderHistory.splice(100);
        }
        
        localStorage.setItem('order_history', JSON.stringify(orderHistory));
    }

    async showOrderHistory() {
        try {
            const orderHistoryResult = await componentLoader.createComponent('order-history', {}, {
                eventBus: this.eventBus
            });

            // Replace current content with order history
            const mainContainer = document.getElementById('app');
            if (mainContainer) {
                mainContainer.innerHTML = '';
                mainContainer.appendChild(orderHistoryResult.element);
                
                // Handle back to POS event
                orderHistoryResult.component.on('order-history:back-to-pos', () => {
                    this.app.loadVectTheme(); // Reload main POS view
                });
            }
        } catch (error) {
            console.error('Failed to load order history:', error);
            this.showMessage('Failed to load order history', 'error');
        }
    }

    async loadProducts() {
        try {
            // Clear old products from storage to prevent category conflicts
            localStorage.removeItem('pos_products');
            
            // Load sample products for Vect theme
            this.products = [
                // Fruits
                { id: 1, name: 'Black Grapes', price: 4.90, category: 'fruits', image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&q=80' },
                { id: 2, name: 'Bon Oranges', price: 1.98, category: 'fruits', image: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=300&q=80' },
                { id: 3, name: 'Conference Pears', price: 2.70, category: 'fruits', image: 'https://images.unsplash.com/photo-1518685101044-dea3c4e48eaf?w=300&q=80' },
                { id: 4, name: 'Golden Apples Peeled', price: 3.97, category: 'fruits', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80' },
                { id: 5, name: 'Granny Smith Apples', price: 2.99, category: 'fruits', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&q=80' },
                { id: 6, name: 'Jonagold Apples', price: 2.10, category: 'fruits', image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300&q=80' },
                { id: 7, name: 'Lemon', price: 1.49, category: 'fruits', image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=300&q=80' },
                { id: 8, name: 'Orange Butterfly', price: 7.43, category: 'fruits', image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=300&q=80' },
                { id: 9, name: 'Peach', price: 2.70, category: 'fruits', image: 'https://images.unsplash.com/photo-1629828874514-d68a47acbf8e?w=300&q=80' },
                { id: 10, name: 'Peaches', price: 5.40, category: 'fruits', image: 'https://images.unsplash.com/photo-1558254651-6bd361c44c11?w=300&q=80' },
                { id: 11, name: 'Red Grapefruit', price: 1.98, category: 'fruits', image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&q=80' },
                { id: 12, name: 'Bananas', price: 3.19, category: 'fruits', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300&q=80' },
                { id: 13, name: 'Strawberries', price: 4.50, category: 'fruits', image: 'https://images.unsplash.com/photo-1543528176-61b239494933?w=300&q=80' },
                { id: 14, name: 'Kiwi', price: 2.20, category: 'fruits', image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=300&q=80' },
                
                // Beverages
                { id: 15, name: 'Fresh Orange Juice', price: 3.50, category: 'beverages', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=80' },
                { id: 16, name: 'Sparkling Water', price: 1.20, category: 'beverages', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&q=80' },
                { id: 17, name: 'Coffee', price: 2.80, category: 'beverages', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80' },
                { id: 18, name: 'Green Tea', price: 2.50, category: 'beverages', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
                { id: 19, name: 'Cola', price: 1.80, category: 'beverages', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&q=80' },
                { id: 20, name: 'Energy Drink', price: 3.20, category: 'beverages', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
                
                // Snacks
                { id: 21, name: 'Chocolate Chips', price: 2.99, category: 'snacks', image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&q=80' },
                { id: 22, name: 'Nuts Mix', price: 4.50, category: 'snacks', image: 'https://images.unsplash.com/photo-1508747235053-6ecbcf805994?w=300&q=80' },
                { id: 23, name: 'Potato Chips', price: 1.99, category: 'snacks', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80' },
                { id: 24, name: 'Granola Bar', price: 2.20, category: 'snacks', image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300&q=80' },
                { id: 25, name: 'Cookies', price: 3.10, category: 'snacks', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80' },
                
                // Dairy
                { id: 26, name: 'Fresh Milk', price: 1.85, category: 'dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80' },
                { id: 27, name: 'Greek Yogurt', price: 3.20, category: 'dairy', image: 'https://images.unsplash.com/photo-1571212515416-fcc4de3a21a8?w=300&q=80' },
                { id: 28, name: 'Cheese', price: 4.50, category: 'dairy', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80' },
                { id: 29, name: 'Butter', price: 2.80, category: 'dairy', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80' },
                { id: 30, name: 'Cream', price: 2.40, category: 'dairy', image: 'https://images.unsplash.com/photo-1563379091339-03246963d29a?w=300&q=80' },
                
                // Bakery
                { id: 31, name: 'Fresh Bread', price: 2.40, category: 'bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80' },
                { id: 32, name: 'Croissant', price: 1.75, category: 'bakery', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
                { id: 33, name: 'Bagel', price: 1.50, category: 'bakery', image: 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=300&q=80' },
                { id: 34, name: 'Muffin', price: 2.20, category: 'bakery', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' },
                { id: 35, name: 'Donut', price: 1.90, category: 'bakery', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80' }
            ];
        } catch (error) {
            console.error('Failed to load products:', error);
            this.products = [];
        }
    }

    getCategoryTitle(categoryId) {
        const categoryTitles = {
            'all': 'All Products',
            'fruits': 'Fresh Fruits', 
            'beverages': 'Beverages',
            'snacks': 'Snacks',
            'dairy': 'Dairy Products',
            'bakery': 'Bakery'
        };
        return categoryTitles[categoryId] || 'Products';
    }

    showMessage(text, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: vectSlideIn 0.3s ease-out;
            box-shadow: var(--vect-shadow-lg);
            max-width: 300px;
        `;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.background = 'var(--vect-success)';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.background = 'var(--vect-warning)';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.background = 'var(--vect-error)';
                notification.style.color = 'white';
                break;
            default:
                notification.style.background = 'var(--vect-primary)';
                notification.style.color = 'white';
        }
        
        notification.textContent = text;
        document.body.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'vectSlideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

export default VectHomeScreenV2;