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
        this.showingCustomization = false;
        this.customizationProduct = null;
        this.confirmedOrders = [];
        this.isProcessingOrder = false; // Prevent double-clicks
    }

    async render() {
        await this.loadProducts();

        return `
            <div class="pos-layout vect-theme">
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

                        <!-- Order Confirmation -->
                        <div class="vect-order-actions">
                            ${this.renderOrderActions()}
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
                                <h2 class="vect-category-title" id="vect-category-title">All Menu</h2>
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
            { id: 'current', name: 'Order Items', badge: this.currentOrder.length },
            { id: 'orders', name: 'Orders', badge: this.confirmedOrders.length }
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
            { id: 'pizza', name: 'Pizza', icon: '🍕' },
            { id: 'white-pizza', name: 'White Pizza', icon: '🧀' },
            { id: 'salads', name: 'Salads', icon: '🥗' },
            { id: 'desserts', name: 'Desserts', icon: '🍰' },
            { id: 'hot-drinks', name: 'Hot Drinks', icon: '☕' },
            { id: 'cold-drinks', name: 'Cold Drinks', icon: '🥤' },
            { id: 'alcohol', name: 'Alcohol', icon: '🍷' }
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
        // Show customization view if active
        if (this.showingCustomization && this.customizationProduct) {
            return this.renderPizzaCustomization(this.customizationProduct);
        }

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
                    ${item.modifiers && item.modifiers.length > 0 ? `
                        <div class="vect-cart-item-modifiers">
                            ${item.modifiers.map(mod => `<span class="vect-modifier">+${mod.name}</span>`).join(', ')}
                        </div>
                    ` : ''}
                    <div class="vect-cart-item-price">€${(item.basePrice || item.price).toFixed(2)}</div>
                    ${item.modifiers && item.modifiers.length > 0 ? `
                        <div class="vect-cart-item-total">Total: €${(item.itemTotal || item.price * item.quantity).toFixed(2)}</div>
                    ` : ''}
                    <button class="vect-remove-btn" data-action="remove" data-item-index="${index}" title="Remove from cart">
                        <span class="vect-remove-icon">🗑️</span>
                        <span class="vect-remove-text">Remove</span>
                    </button>
                </div>
                <div class="vect-cart-item-controls">
                    <button class="vect-quantity-btn" data-action="decrease" data-item-index="${index}">-</button>
                    <input type="number" class="vect-quantity-input" value="${item.quantity}" min="1" data-item-index="${index}" />
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

    renderOrderActions() {
        if (this.currentOrder.length === 0) {
            return '';
        }

        return `
            <button class="vect-confirm-order-btn" data-action="confirm-order">
                <span class="vect-confirm-icon">✓</span>
                <span class="vect-confirm-text">Confirm Order</span>
            </button>
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
            // Load confirmed orders from localStorage
            const savedOrders = localStorage.getItem('vect_confirmed_orders');
            if (savedOrders) {
                this.confirmedOrders = JSON.parse(savedOrders);
            }

            // Clear old products from storage to prevent category conflicts
            localStorage.removeItem('pos_products');
            
            // Always use our Vect theme products for now to avoid category mismatch
            const storedProducts = null; // this.storageManager.getProducts();
            if (storedProducts && storedProducts.length > 0) {
                this.products = storedProducts;
            } else {
                // Pizzeria menu with categories
                this.products = [
                    // Pizza
                    { id: 1, name: 'Margherita', price: 12.90, category: 'pizza', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&q=80' },
                    { id: 2, name: 'Pepperoni', price: 15.50, category: 'pizza', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&q=80' },
                    { id: 3, name: 'Quattro Stagioni', price: 17.80, category: 'pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
                    { id: 4, name: 'Diavola', price: 16.20, category: 'pizza', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&q=80' },
                    { id: 5, name: 'Capricciosa', price: 18.50, category: 'pizza', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb5d2c4?w=300&q=80' },
                    { id: 6, name: 'Marinara', price: 11.90, category: 'pizza', image: 'https://images.unsplash.com/photo-1506280754576-f6fa8a873550?w=300&q=80' },
                    { id: 7, name: 'Prosciutto e Funghi', price: 17.20, category: 'pizza', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=300&q=80' },
                    { id: 8, name: 'Quattro Formaggi', price: 19.80, category: 'pizza', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300&q=80' },
                    
                    // White Pizza
                    { id: 9, name: 'Bianca Tradizionale', price: 14.50, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1540071719381-3c634a4a2ca8?w=300&q=80' },
                    { id: 10, name: 'Bianca con Salsiccia', price: 18.90, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1610207715542-bb0419e19fca?w=300&q=80' },
                    { id: 11, name: 'Bianca con Spinaci', price: 16.80, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=300&q=80' },
                    { id: 12, name: 'Bianca Mortadella e Pistacchi', price: 21.50, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=300&q=80' },
                    { id: 13, name: 'Bianca con Bresaola', price: 22.80, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=300&q=80' },
                    { id: 14, name: 'Bianca Parmigiana', price: 19.20, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=300&q=80' },
                    { id: 15, name: 'Bianca con Burrata', price: 24.90, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=300&q=80' },
                    { id: 16, name: 'Bianca Tartufo', price: 28.50, category: 'white-pizza', image: 'https://images.unsplash.com/photo-1606750718050-0b0e52295ba7?w=300&q=80' },
                    
                    // Salads
                    { id: 17, name: 'Caesar Salad', price: 9.50, category: 'salads', image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=300&q=80' },
                    { id: 18, name: 'Greek Salad', price: 8.80, category: 'salads', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80' },
                    { id: 19, name: 'Caprese Salad', price: 12.90, category: 'salads', image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=300&q=80' },
                    { id: 20, name: 'Arugula Salad', price: 10.50, category: 'salads', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
                    { id: 21, name: 'Mixed Green Salad', price: 7.80, category: 'salads', image: 'https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=300&q=80' },
                    { id: 22, name: 'Quinoa Salad', price: 11.20, category: 'salads', image: 'https://images.unsplash.com/photo-1505253213348-cd54c92b37ed?w=300&q=80' },
                    { id: 23, name: 'Tuna Salad', price: 13.50, category: 'salads', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&q=80' },
                    { id: 24, name: 'Chicken Salad', price: 12.80, category: 'salads', image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=300&q=80' },
                    
                    // Desserts
                    { id: 25, name: 'Tiramisu', price: 6.50, category: 'desserts', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&q=80' },
                    { id: 26, name: 'Panna Cotta', price: 5.80, category: 'desserts', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80' },
                    { id: 27, name: 'Gelato Siciliano', price: 4.20, category: 'desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&q=80' },
                    { id: 28, name: 'Cannoli Siciliani', price: 7.90, category: 'desserts', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80' },
                    { id: 29, name: 'Chocolate Lava Cake', price: 6.90, category: 'desserts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
                    { id: 30, name: 'Cheesecake', price: 5.90, category: 'desserts', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
                    { id: 31, name: 'Apple Strudel', price: 4.80, category: 'desserts', image: 'https://images.unsplash.com/photo-1549007908-56e169d60ad5?w=300&q=80' },
                    { id: 32, name: 'Profiteroles', price: 7.50, category: 'desserts', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80' },
                    
                    // Hot Drinks
                    { id: 33, name: 'Espresso', price: 2.20, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80' },
                    { id: 34, name: 'Cappuccino', price: 3.50, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&q=80' },
                    { id: 35, name: 'Latte', price: 4.20, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=300&q=80' },
                    { id: 36, name: 'Hot Chocolate', price: 4.80, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1542990253-a781e04c0082?w=300&q=80' },
                    { id: 37, name: 'Green Tea', price: 3.20, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&q=80' },
                    { id: 38, name: 'Earl Grey Tea', price: 3.50, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1597318181409-cf85222c0e95?w=300&q=80' },
                    { id: 39, name: 'Chamomile Tea', price: 3.20, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&q=80' },
                    { id: 40, name: 'Macchiato', price: 3.80, category: 'hot-drinks', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80' },
                    
                    // Cold Drinks
                    { id: 41, name: 'Coca Cola', price: 3.50, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&q=80' },
                    { id: 42, name: 'Fresh Orange Juice', price: 4.80, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=80' },
                    { id: 43, name: 'Lemonade', price: 4.20, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&q=80' },
                    { id: 44, name: 'Iced Tea', price: 3.80, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&q=80' },
                    { id: 45, name: 'Sparkling Water', price: 2.50, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&q=80' },
                    { id: 46, name: 'Mineral Water', price: 2.20, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&q=80' },
                    { id: 47, name: 'Iced Coffee', price: 4.50, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=80' },
                    { id: 48, name: 'Energy Drink', price: 4.80, category: 'cold-drinks', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
                    
                    // Alcohol (bottles only, low alcohol)
                    { id: 49, name: 'Heineken Beer 0.33L', price: 4.20, category: 'alcohol', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&q=80' },
                    { id: 50, name: 'Corona Extra 0.33L', price: 4.50, category: 'alcohol', image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=300&q=80' },
                    { id: 51, name: 'Stella Artois 0.33L', price: 4.80, category: 'alcohol', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=300&q=80' },
                    { id: 52, name: 'Peroni Nastro Azzurro 0.33L', price: 4.30, category: 'alcohol', image: 'https://images.unsplash.com/photo-1618885472179-5ac593f2c531?w=300&q=80' },
                    { id: 53, name: 'Moretti Beer 0.33L', price: 4.00, category: 'alcohol', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
                    { id: 54, name: 'Prosecco Bottle 0.75L', price: 18.50, category: 'alcohol', image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=300&q=80' },
                    { id: 55, name: 'White Wine 0.75L', price: 16.80, category: 'alcohol', image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=300&q=80' },
                    { id: 56, name: 'Red Wine 0.75L', price: 17.20, category: 'alcohol', image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300&q=80' }
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

        // Cart quantity controls and remove button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vect-quantity-btn')) {
                const action = e.target.dataset.action;
                const index = parseInt(e.target.dataset.itemIndex);
                this.handleQuantityChange(action, index);
            } else if (e.target.classList.contains('vect-remove-btn') || e.target.closest('.vect-remove-btn')) {
                const button = e.target.classList.contains('vect-remove-btn') ? e.target : e.target.closest('.vect-remove-btn');
                const index = parseInt(button.dataset.itemIndex);
                this.handleItemRemove(index);
            }
        });

        // Quantity input field handling
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('vect-quantity-input')) {
                const index = parseInt(e.target.dataset.itemIndex);
                const newQuantity = parseInt(e.target.value) || 1;
                this.handleQuantityInputChange(index, newQuantity);
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
            // Check for direct data-action or parent with data-action
            let actionElement = e.target;
            let action = actionElement.dataset.action;
            
            // If no action on direct target, check parent elements
            if (!action) {
                actionElement = e.target.closest('[data-action]');
                action = actionElement ? actionElement.dataset.action : null;
            }
            
            if (action) {
                console.log('Action triggered:', action, 'on element:', actionElement); // Debug log
                e.preventDefault();
                e.stopPropagation();
                this.handleAction(action);
            }
        });

        // Ingredient selection for pizza customization
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.name === 'ingredient' && this.showingCustomization) {
                this.handleIngredientSelection(e.target);
            } else if (e.target.type === 'radio' && e.target.name === 'pizza-size' && this.showingCustomization) {
                this.handleSizeSelection(e.target);
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
                this.showMessage('Order items view', 'info');
                break;
            case 'orders':
                this.showOrderHistory();
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
            'all': 'All Menu',
            'pizza': 'Traditional Pizza',
            'white-pizza': 'White Pizza',
            'salads': 'Fresh Salads',
            'desserts': 'Desserts',
            'hot-drinks': 'Hot Drinks',
            'cold-drinks': 'Cold Drinks',
            'alcohol': 'Alcoholic Beverages'
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
        
        // Get full product details
        const fullProduct = this.products.find(p => p.id === product.id);
        
        // Check if product is pizza and show customization view
        if (fullProduct && (fullProduct.category === 'pizza' || fullProduct.category === 'white-pizza')) {
            this.showPizzaCustomization(fullProduct);
            return;
        }
        
        // Add to cart normally for non-pizza items
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
            if (item.quantity > 1) {
                item.quantity -= 1;
            }
        }
        
        this.updateCartDisplay();
    }

    handleQuantityInputChange(index, newQuantity) {
        if (index < 0 || index >= this.currentOrder.length) return;
        if (newQuantity < 1) newQuantity = 1;
        
        const item = this.currentOrder[index];
        item.quantity = newQuantity;
        
        this.updateCartDisplay();
    }

    handleItemRemove(index) {
        if (index < 0 || index >= this.currentOrder.length) return;
        
        this.currentOrder.splice(index, 1);
        this.updateCartDisplay();
        this.showMessage('Item removed from cart', 'info');
    }

    showPizzaCustomization(pizza) {
        this.showingCustomization = true;
        this.customizationProduct = pizza;
        this.selectedModifiers = [];
        this.selectedPizzaSize = { id: '30cm', name: '30cm (Standard)', multiplier: 1.0 }; // Default size
        this.updateProductDisplay();
    }

    hidePizzaCustomization() {
        this.showingCustomization = false;
        this.customizationProduct = null;
        this.selectedModifiers = [];
        this.selectedPizzaSize = null;
        this.updateProductDisplay();
    }

    renderPizzaCustomization(pizza) {
        // Define available ingredients
        const availableIngredients = [
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

        // Define pizza sizes with price multipliers
        const availableSizes = [
            { id: '30cm', name: '30cm (Standard)', multiplier: 1.0 },
            { id: '40cm', name: '40cm (Large)', multiplier: 1.5 }
        ];

        if (!this.selectedModifiers) {
            this.selectedModifiers = [];
        }

        if (!this.selectedPizzaSize) {
            this.selectedPizzaSize = availableSizes[0]; // Default to 30cm
        }

        const basePrice = pizza.price * this.selectedPizzaSize.multiplier;
        const modifiersTotal = this.selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
        const currentTotal = basePrice + modifiersTotal;

        return `
            <div class="pizza-customization-view">
                <div class="pizza-customization-header">
                    <h2>Customize ${pizza.name}</h2>
                    <button class="pizza-back-btn" data-action="back-to-products">← Back to Menu</button>
                </div>
                
                <div class="pizza-customization-content">
                    <div class="pizza-image-section">
                        <img src="${pizza.image}" alt="${pizza.name}" class="pizza-image" />
                        <div class="pizza-base-price">Base Price: €${basePrice.toFixed(2)}</div>
                    </div>
                    
                    <div class="pizza-options-section">
                        <div class="pizza-size-section">
                            <h3>Pizza Size</h3>
                            <div class="pizza-size-options">
                                ${availableSizes.map(size => `
                                    <div class="size-option ${this.selectedPizzaSize.id === size.id ? 'selected' : ''}" 
                                         data-size-id="${size.id}">
                                        <input type="radio" name="pizza-size" value="${size.id}" id="size-${size.id}"
                                               ${this.selectedPizzaSize.id === size.id ? 'checked' : ''} />
                                        <label for="size-${size.id}" class="size-label">
                                            <span class="size-name">${size.name}</span>
                                            <span class="size-price">€${(pizza.price * size.multiplier).toFixed(2)}</span>
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="pizza-ingredients-section">
                            <h3>Additional Ingredients</h3>
                            <div class="ingredients-grid">
                                ${availableIngredients.map(ingredient => `
                                    <div class="ingredient-item" data-ingredient-id="${ingredient.id}">
                                        <label class="ingredient-checkbox">
                                            <input type="checkbox" name="ingredient" value="${ingredient.id}" 
                                                   ${this.selectedModifiers.some(mod => mod.id === ingredient.id) ? 'checked' : ''} />
                                            <span class="checkmark"></span>
                                            <span class="ingredient-name">${ingredient.name}</span>
                                            <span class="ingredient-price">+€${ingredient.price.toFixed(2)}</span>
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="pizza-customization-footer">
                    <div class="pizza-total">
                        <span>Total: €<span id="pizza-total-amount">${currentTotal.toFixed(2)}</span></span>
                    </div>
                    <div class="pizza-actions">
                        <button class="pizza-cancel-btn" data-action="back-to-products">Cancel</button>
                        <button class="pizza-add-btn" data-action="add-custom-pizza">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }

    addCustomPizzaToCart() {
        if (!this.customizationProduct || !this.selectedPizzaSize) return;
        
        const basePrice = this.customizationProduct.price * this.selectedPizzaSize.multiplier;
        const modifiersTotal = this.selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
        const total = basePrice + modifiersTotal;
        
        const customizedPizza = {
            id: this.customizationProduct.id,
            name: `${this.customizationProduct.name} (${this.selectedPizzaSize.name})`,
            basePrice: this.customizationProduct.price,
            price: this.customizationProduct.price,
            itemTotal: total,
            quantity: 1,
            modifiers: this.selectedModifiers,
            size: this.selectedPizzaSize,
            category: this.customizationProduct.category,
            image: this.customizationProduct.image
        };

        this.currentOrder.push(customizedPizza);
        this.updateCartDisplay();
        
        const sizeInfo = this.selectedPizzaSize.name;
        const modifierNames = this.selectedModifiers.length > 0 ? ` with ${this.selectedModifiers.map(m => m.name).join(', ')}` : '';
        this.showMessage(`Added ${this.customizationProduct.name} ${sizeInfo}${modifierNames} to cart`, 'success');
        
        // Return to product view
        this.hidePizzaCustomization();
    }

    handleIngredientSelection(checkbox) {
        const availableIngredients = [
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

        const ingredientId = parseInt(checkbox.value);
        const ingredient = availableIngredients.find(ing => ing.id === ingredientId);
        
        if (!this.selectedModifiers) {
            this.selectedModifiers = [];
        }

        if (checkbox.checked) {
            if (!this.selectedModifiers.some(mod => mod.id === ingredientId)) {
                this.selectedModifiers.push(ingredient);
            }
        } else {
            this.selectedModifiers = this.selectedModifiers.filter(mod => mod.id !== ingredientId);
        }

        // Update total price display
        this.updatePizzaTotalDisplay();
    }

    handleSizeSelection(radioButton) {
        const availableSizes = [
            { id: '30cm', name: '30cm (Standard)', multiplier: 1.0 },
            { id: '40cm', name: '40cm (Large)', multiplier: 1.5 }
        ];

        const sizeId = radioButton.value;
        const selectedSize = availableSizes.find(size => size.id === sizeId);
        
        if (selectedSize) {
            this.selectedPizzaSize = selectedSize;
            
            // Update visual selection
            document.querySelectorAll('.size-option').forEach(option => {
                option.classList.toggle('selected', option.dataset.sizeId === sizeId);
            });
            
            // Update base price display
            const basePriceElement = document.querySelector('.pizza-base-price');
            if (basePriceElement && this.customizationProduct) {
                const basePrice = this.customizationProduct.price * selectedSize.multiplier;
                basePriceElement.textContent = `Base Price: €${basePrice.toFixed(2)}`;
            }
            
            // Update total price
            this.updatePizzaTotalDisplay();
        }
    }

    updatePizzaTotalDisplay() {
        if (!this.customizationProduct || !this.selectedPizzaSize) return;
        
        const basePrice = this.customizationProduct.price * this.selectedPizzaSize.multiplier;
        const modifiersTotal = this.selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
        const currentTotal = basePrice + modifiersTotal;
        
        const totalElement = document.getElementById('pizza-total-amount');
        if (totalElement) {
            totalElement.textContent = currentTotal.toFixed(2);
        }
    }

    addCustomizedPizzaToCart(pizza, modifiers, total) {
        const customizedPizza = {
            id: pizza.id,
            name: pizza.name,
            basePrice: pizza.price,
            price: pizza.price,
            itemTotal: total,
            quantity: 1,
            modifiers: modifiers,
            category: pizza.category,
            image: pizza.image
        };

        this.currentOrder.push(customizedPizza);
        this.updateCartDisplay();
        
        const modifierNames = modifiers.length > 0 ? ` with ${modifiers.map(m => m.name).join(', ')}` : '';
        this.showMessage(`Added ${pizza.name}${modifierNames} to cart`, 'success');
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
            case 'back-to-products':
                this.hidePizzaCustomization();
                break;
            case 'add-custom-pizza':
                this.addCustomPizzaToCart();
                break;
            case 'confirm-order':
                this.confirmOrder();
                break;
        }
    }

    confirmOrder() {
        console.log('confirmOrder called, current order length:', this.currentOrder.length, 'isProcessing:', this.isProcessingOrder); // Debug log
        
        // Prevent double clicks
        if (this.isProcessingOrder) {
            console.log('Order already being processed, ignoring click'); // Debug log
            return;
        }
        
        if (this.currentOrder.length === 0) {
            this.showMessage('Cart is empty', 'warning');
            return;
        }

        // Set processing flag
        this.isProcessingOrder = true;
        console.log('Setting isProcessingOrder to true'); // Debug log

        console.log('Current order items:', this.currentOrder); // Debug log

        // Calculate order totals
        const subtotal = this.currentOrder.reduce((sum, item) => {
            const itemPrice = item.itemTotal || item.price * item.quantity;
            return sum + itemPrice;
        }, 0);
        const tax = subtotal * 0.21;
        const total = subtotal + tax;

        console.log('Order totals - Subtotal:', subtotal, 'Tax:', tax, 'Total:', total); // Debug log

        // Create order object
        const order = {
            id: Date.now(), // Simple ID generation
            date: new Date().toISOString(),
            items: [...this.currentOrder], // Deep copy of items
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: 'confirmed',
            customer: 'Walk-in Customer'
        };

        console.log('Created order object:', order); // Debug log

        // Add to confirmed orders list
        this.confirmedOrders.push(order);
        console.log('Total confirmed orders:', this.confirmedOrders.length); // Debug log

        // Save to localStorage for persistence
        localStorage.setItem('vect_confirmed_orders', JSON.stringify(this.confirmedOrders));
        console.log('Saved orders to localStorage'); // Debug log

        // Clear current order
        this.currentOrder = [];
        console.log('Cleared current order'); // Debug log

        // Update displays
        this.updateCartDisplay();
        this.updateOrderTabsDisplay();
        console.log('Updated displays'); // Debug log

        // Show success message
        this.showMessage(`Order #${order.id} confirmed successfully!`, 'success');
        console.log('Showed success message'); // Debug log
        
        // Reset processing flag after a short delay
        setTimeout(() => {
            this.isProcessingOrder = false;
            console.log('Reset isProcessingOrder to false'); // Debug log
        }, 1000);
    }

    updateOrderTabsDisplay() {
        const orderTabs = document.getElementById('vect-order-tabs');
        if (orderTabs) {
            orderTabs.innerHTML = this.renderOrderTabs();
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

        // Update order actions
        const orderActions = document.querySelector('.vect-order-actions');
        if (orderActions) {
            orderActions.innerHTML = this.renderOrderActions();
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

    showOrderHistory() {
        // Load order history component dynamically
        import('../../components/base/component-loader.js')
            .then(({ default: componentLoader }) => {
                return componentLoader.createComponent('order-history', {}, {
                    eventBus: this.app.eventBus
                });
            })
            .then(({ component, element }) => {
                // Replace current content with order history
                const mainContainer = document.getElementById('app');
                if (mainContainer) {
                    mainContainer.innerHTML = '';
                    mainContainer.appendChild(element);
                    
                    // Handle back to POS event
                    component.on('order-history:back-to-pos', () => {
                        this.app.loadVectTheme(); // Reload main POS view
                    });
                }
            })
            .catch(error => {
                console.error('Failed to load order history:', error);
                this.showMessage('Failed to load order history', 'error');
            });
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