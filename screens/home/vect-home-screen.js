class VectHomeScreen {
    constructor(app, data = {}) {
        this.app = app;
        this.data = data;
        this.cartManager = app.getCartManager();
        this.storageManager = app.getStorageManager();
        this.currentOrder = [];
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.products = [];
    }

    async render() {
        await this.loadProducts();

        return `
            <div class="pos-layout vect-theme">
                <!-- Theme Switcher -->
                <div class="theme-switcher">
                    <button class="theme-btn" data-theme="evolution">Evolution</button>
                    <button class="theme-btn" data-theme="restaurant">Restaurant</button>
                    <button class="theme-btn" data-theme="oblivion">Oblivion</button>
                    <button class="theme-btn active" data-theme="vect">Vect</button>
                </div>

                <!-- Header -->
                <div class="vect-header">
                    <div class="vect-header-left">
                        <div class="vect-logo">Odoo</div>
                        <div class="vect-user-info">
                            <span style="font-size: 0.875rem; color: var(--vect-gray-600);">Administrator</span>
                        </div>
                    </div>
                    
                    <div class="vect-header-center">
                        <!-- Header Center Content -->
                    </div>
                    
                    <div class="vect-header-right">
                        <button class="vect-btn" data-action="close-session">Close</button>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="vect-main">
                    <!-- Left Sidebar - Cart & Numpad -->
                    <div class="vect-sidebar">
                        <!-- Customer Info -->
                        <div class="vect-cart-header">
                            <div class="vect-cart-title">
                                🛒 Customer
                                <span class="vect-cart-count" id="vect-cart-count">0</span>
                            </div>
                        </div>

                        <!-- Cart Items -->
                        <div class="vect-cart-items" id="vect-cart-items">
                            ${this.renderCartItems()}
                        </div>

                        <!-- Cart Summary -->
                        <div class="vect-cart-summary">
                            ${this.renderCartSummary()}
                        </div>

                        <!-- Numpad -->
                        <div class="vect-numpad">
                            <div class="vect-numpad-grid" id="vect-numpad">
                                ${this.renderNumpad()}
                            </div>
                        </div>
                    </div>

                    <!-- Content Area (Controls + Products) -->
                    <div class="vect-content">
                        <!-- Controls Panel - Order tabs, Categories, Search -->
                        <div class="vect-controls">
                            <!-- Order Tabs -->
                            <div class="vect-order-tabs" id="vect-order-tabs">
                                ${this.renderOrderTabs()}
                            </div>

                            <!-- Categories and Search Container -->
                            <div class="vect-categories-search-container">
                                <!-- Categories Section -->
                                <div class="vect-categories-section">
                                    <div class="vect-category-list" id="vect-categories">
                                        ${this.renderCategories()}
                                    </div>
                                </div>

                                <!-- Search Section -->
                                <div class="vect-search-section">
                                    <div class="vect-search-container">
                                        <div class="vect-search-icon">🔍</div>
                                        <input 
                                            type="text" 
                                            class="vect-search-input" 
                                            placeholder="Search products..." 
                                            id="vect-search-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Products Area -->
                        <div class="vect-products">
                            <div class="vect-products-header">
                                <h2 class="vect-category-title" id="vect-category-title">Fresh Fruits</h2>
                                <div class="vect-products-stats" id="vect-products-stats">
                                    ${this.renderProductsStats()}
                                </div>
                            </div>
                            
                            <div class="vect-products-grid" id="vect-products-grid">
                                ${this.renderProducts()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderOrderTabs() {
        const tabs = [
            { id: 'current', name: 'Current Order', badge: this.currentOrder.length },
            { id: 'orders', name: 'Orders', badge: 3 },
            { id: 'receipts', name: 'Receipts', badge: 0 }
        ];

        return tabs.map(tab => `
            <button class="vect-order-tab ${tab.id === 'current' ? 'active' : ''}" 
                    data-tab="${tab.id}">
                ${tab.name}
                ${tab.badge > 0 ? `<span class="vect-order-tab-badge">${tab.badge}</span>` : ''}
            </button>
        `).join('');
    }

    renderCategories() {
        const categories = [
            { id: 'all', name: 'All', icon: '📦' },
            { id: 'fruits', name: 'Fruits', icon: '🍎' },
            { id: 'beverages', name: 'Drinks', icon: '🥤' },
            { id: 'snacks', name: 'Snacks', icon: '🍪' },
            { id: 'dairy', name: 'Dairy', icon: '🥛' },
            { id: 'bakery', name: 'Bakery', icon: '🍞' }
        ];

        return categories.map(category => `
            <div class="vect-category-item ${category.id === this.selectedCategory ? 'active' : ''}" 
                 data-category="${category.id}">
                ${category.icon} ${category.name}
            </div>
        `).join('');
    }

    renderProductsStats() {
        const filtered = this.filterProducts();
        return `${filtered.length} products found`;
    }

    renderProducts() {
        const filteredProducts = this.filterProducts();
        
        if (filteredProducts.length === 0) {
            return this.renderEmptyState();
        }

        return filteredProducts.map(product => `
            <div class="vect-product-card" 
                 data-product-id="${product.id}"
                 data-product-name="${product.name}"
                 data-product-price="${product.price}">
                <div class="vect-product-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" />` : 
                        `<div class="vect-product-placeholder"></div>`
                    }
                    ${product.badge ? `<div class="vect-product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="vect-product-info">
                    <div class="vect-product-name">${product.name}</div>
                    <div class="vect-product-price">€${product.price.toFixed(2)}</div>
                </div>
            </div>
        `).join('');
    }

    renderCartItems() {
        if (this.currentOrder.length === 0) {
            return `
                <div class="vect-empty-state">
                    <div class="vect-empty-icon"></div>
                    <div class="vect-empty-title">Cart is empty</div>
                    <div class="vect-empty-description">Add products to start an order</div>
                </div>
            `;
        }

        return this.currentOrder.map((item, index) => `
            <div class="vect-cart-item" data-item-index="${index}">
                <div class="vect-cart-item-image"></div>
                <div class="vect-cart-item-info">
                    <div class="vect-cart-item-name">${item.name}</div>
                    <div class="vect-cart-item-price">€${item.price.toFixed(2)}</div>
                </div>
                <div class="vect-cart-item-quantity">
                    <button class="vect-quantity-btn" data-action="decrease" data-item-index="${index}">-</button>
                    <span class="vect-quantity-value">${item.quantity}</span>
                    <button class="vect-quantity-btn" data-action="increase" data-item-index="${index}">+</button>
                </div>
            </div>
        `).join('');
    }

    renderCartSummary() {
        const subtotal = this.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.21; // 21% VAT
        const total = subtotal + tax;

        return `
            <div class="vect-summary-line">
                <span>Subtotal</span>
                <span>€${subtotal.toFixed(2)}</span>
            </div>
            <div class="vect-summary-line">
                <span>Tax (21%)</span>
                <span>€${tax.toFixed(2)}</span>
            </div>
            <div class="vect-summary-line total">
                <span>Total</span>
                <span>€${total.toFixed(2)}</span>
            </div>
        `;
    }

    renderNumpad() {
        return `
            <!-- Row 1: Customer button + 7, 8, 9, Backspace -->
            <button class="vect-numpad-btn customer" data-action="customer">Customer</button>
            <button class="vect-numpad-btn" data-number="7">7</button>
            <button class="vect-numpad-btn" data-number="8">8</button>
            <button class="vect-numpad-btn" data-number="9">9</button>
            <button class="vect-numpad-btn action" data-action="backspace">⌫</button>
            
            <!-- Row 2-4: Payment button + numbers and functions -->
            <button class="vect-numpad-btn payment" data-action="payment">Payment</button>
            <button class="vect-numpad-btn" data-number="4">4</button>
            <button class="vect-numpad-btn" data-number="5">5</button>
            <button class="vect-numpad-btn" data-number="6">6</button>
            <button class="vect-numpad-btn action" data-action="qty">Qty</button>
            
            <!-- Row 3 -->
            <button class="vect-numpad-btn" data-number="1">1</button>
            <button class="vect-numpad-btn" data-number="2">2</button>
            <button class="vect-numpad-btn" data-number="3">3</button>
            <button class="vect-numpad-btn action" data-action="disc">Disc</button>
            
            <!-- Row 4 -->
            <button class="vect-numpad-btn" data-number="+/-">+/-</button>
            <button class="vect-numpad-btn zero" data-number="0">0</button>
            <button class="vect-numpad-btn" data-number=".">,</button>
            <button class="vect-numpad-btn action" data-action="price">Price</button>
        `;
    }

    renderEmptyState() {
        return `
            <div class="vect-empty-state" style="grid-column: 1 / -1;">
                <div class="vect-empty-icon"></div>
                <div class="vect-empty-title">No products found</div>
                <div class="vect-empty-description">Try adjusting your search or category filter</div>
            </div>
        `;
    }

    async loadProducts() {
        try {
            // Clear old products from storage to prevent category conflicts
            localStorage.removeItem('pos_products');
            
            // Always use our Vect theme products for now to avoid category mismatch
            const storedProducts = null; // this.storageManager.getProducts();
            if (storedProducts && storedProducts.length > 0) {
                this.products = storedProducts;
            } else {
                // Default Vect theme products with temporary images
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
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            this.products = [];
        }
        
    }

    filterProducts() {
        let filtered = this.products;

        // Filter by category
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === this.selectedCategory);
        }

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    async afterRender() {
        this.setupEventListeners();
        this.updateCartDisplay();
        // Ensure initial product display is updated
        this.updateProductDisplay();
    }

    setupEventListeners() {
        // Theme switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-btn')) {
                this.handleThemeSwitch(e.target.dataset.theme, e.target);
            }
        });

        // Order tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vect-order-tab')) {
                this.handleTabSwitch(e.target.dataset.tab);
            }
        });

        // Category switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vect-category-item')) {
                this.handleCategorySwitch(e.target.dataset.category);
            }
        });

        // Product selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.vect-product-card')) {
                const card = e.target.closest('.vect-product-card');
                this.handleProductSelection({
                    id: parseInt(card.dataset.productId),
                    name: card.dataset.productName,
                    price: parseFloat(card.dataset.productPrice)
                });
            }
        });

        // Cart quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vect-quantity-btn')) {
                const action = e.target.dataset.action;
                const index = parseInt(e.target.dataset.itemIndex);
                this.handleQuantityChange(action, index);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('vect-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.updateProductDisplay();
            });
        }

        // Action buttons
        document.addEventListener('click', (e) => {
            if (e.target.dataset.action) {
                this.handleAction(e.target.dataset.action);
            }
        });

        // Numpad
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vect-numpad-btn')) {
                this.handleNumpadInput(e.target.dataset.number);
            }
        });
    }

    handleThemeSwitch(theme, button) {
        // Update active state
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (theme === 'evolution') {
            this.app.loadEvolutionTheme();
        } else if (theme === 'restaurant') {
            this.app.loadRestaurantTheme();
        } else if (theme === 'oblivion') {
            this.app.loadOblivionTheme();
        }
        // Stay on Vect theme if theme === 'vect'
    }

    handleTabSwitch(tabId) {
        // Update active tab
        document.querySelectorAll('.vect-order-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Handle tab functionality
        switch (tabId) {
            case 'current':
                this.showMessage('Current order selected', 'info');
                break;
            case 'orders':
                this.showMessage('Orders history', 'info');
                break;
            case 'receipts':
                this.showMessage('Receipts view', 'info');
                break;
        }
    }

    handleCategorySwitch(categoryId) {
        this.selectedCategory = categoryId;
        
        // Update active category
        document.querySelectorAll('.vect-category-item').forEach(item => {
            item.classList.toggle('active', item.dataset.category === categoryId);
        });
        
        // Update category title
        const categoryNames = {
            'all': 'All Products',
            'fruits': 'Fresh Fruits', 
            'beverages': 'Beverages',
            'snacks': 'Snacks',
            'dairy': 'Dairy Products',
            'bakery': 'Bakery'
        };
        
        const titleElement = document.getElementById('vect-category-title');
        if (titleElement) {
            titleElement.textContent = categoryNames[categoryId] || 'Products';
        }
        
        this.updateProductDisplay();
    }

    handleProductSelection(product) {
        // Add visual feedback
        const card = document.querySelector(`[data-product-id="${product.id}"]`);
        if (card) {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        }
        
        // Add to cart
        const existingItem = this.currentOrder.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.currentOrder.push({
                ...product,
                quantity: 1
            });
        }
        
        this.updateCartDisplay();
    }

    handleQuantityChange(action, index) {
        if (index < 0 || index >= this.currentOrder.length) return;
        
        const item = this.currentOrder[index];
        
        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                this.currentOrder.splice(index, 1);
            }
        }
        
        this.updateCartDisplay();
    }

    handleAction(action) {
        switch (action) {
            case 'checkout':
            case 'payment':
                this.processCheckout();
                break;
            case 'quantity':
            case 'qty':
                this.showMessage('Quantity adjustment mode', 'info');
                break;
            case 'discount':
            case 'disc':
                this.showMessage('Discount mode', 'info');
                break;
            case 'price':
                this.showMessage('Price override mode', 'info');
                break;
            case 'customer':
                this.showMessage('Customer selection mode', 'info');
                break;
            case 'backspace':
                this.showMessage('Backspace pressed', 'info');
                break;
            case 'close-session':
                this.showMessage('Session closed', 'info');
                break;
        }
    }

    handleNumpadInput(number) {
        console.log('Numpad input:', number);
        // Add visual feedback
        const btn = document.querySelector(`[data-number="${number}"]`);
        if (btn) {
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 100);
        }
    }

    updateProductDisplay() {
        const productsGrid = document.getElementById('vect-products-grid');
        if (productsGrid) {
            productsGrid.innerHTML = this.renderProducts();
        }
        
        // Update products stats
        const productsStats = document.getElementById('vect-products-stats');
        if (productsStats) {
            productsStats.innerHTML = this.renderProductsStats();
        }
    }

    updateCartDisplay() {
        // Update cart items
        const cartItems = document.getElementById('vect-cart-items');
        if (cartItems) {
            cartItems.innerHTML = this.renderCartItems();
        }
        
        // Update cart summary
        const cartSummary = document.querySelector('.vect-cart-summary');
        if (cartSummary) {
            cartSummary.innerHTML = this.renderCartSummary();
        }
        
        // Update cart count
        const cartCount = document.getElementById('vect-cart-count');
        if (cartCount) {
            const totalItems = this.currentOrder.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
        
        // Update order tabs
        const orderTabs = document.getElementById('vect-order-tabs');
        if (orderTabs) {
            orderTabs.innerHTML = this.renderOrderTabs();
        }
        
        // Update products stats
        const productsStats = document.getElementById('vect-products-stats');
        if (productsStats) {
            productsStats.innerHTML = this.renderProductsStats();
        }
    }

    processCheckout() {
        if (this.currentOrder.length === 0) {
            this.showMessage('Cart is empty', 'warning');
            return;
        }

        const total = this.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Simulate payment processing
        this.showMessage('Processing payment...', 'info');
        
        setTimeout(() => {
            this.currentOrder = [];
            this.updateCartDisplay();
            this.showMessage(`Payment successful! Total: €${total.toFixed(2)}`, 'success');
        }, 1500);
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

export default VectHomeScreen;