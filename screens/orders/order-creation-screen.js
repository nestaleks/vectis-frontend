class OrderCreationScreen {
    constructor(app, data = {}) {
        this.app = app;
        this.data = data;
        this.cartManager = app.getCartManager();
        this.storageManager = app.getStorageManager();
        
        // Modal-specific properties
        this.isModal = data.isModal || false;
        this.mode = data.mode || 'create'; // 'create' or 'edit'
        this.existingOrder = data.existingOrder || null;
        
        this.currentOrder = [];
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.products = [];
        this.confirmedOrders = [];
        this.isProcessingOrder = false; // Prevent double-clicks

        // Pizza customization constants
        this.PIZZA_SIZES = [
            { id: '30cm', name: '30cm (Standard)', multiplier: 1.0 },
            { id: '40cm', name: '40cm (Large)', multiplier: 1.5 }
        ];

        this.EXTRA_INGREDIENTS = [
            { id: 1, name: 'Extra Mozzarella', price: 2.50, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=64&h=64&fit=crop&crop=center' },
            { id: 2, name: 'Pepperoni', price: 3.00, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=64&h=64&fit=crop&crop=center' },
            { id: 3, name: 'Mushrooms', price: 2.00, image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=64&h=64&fit=crop&crop=center' },
            { id: 4, name: 'Bell Peppers', price: 2.00, image: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9a8?w=64&h=64&fit=crop&crop=center' },
            { id: 5, name: 'Red Onions', price: 1.50, image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=64&h=64&fit=crop&crop=center' },
            { id: 6, name: 'Olives', price: 2.50, image: 'https://images.unsplash.com/photo-1452827073306-6e6e661baf57?w=64&h=64&fit=crop&crop=center' },
            { id: 7, name: 'Tomatoes', price: 2.00, image: 'https://images.unsplash.com/photo-1546470427-e5da40c4e6b0?w=64&h=64&fit=crop&crop=center' },
            { id: 8, name: 'Basil', price: 1.50, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=center' },
            { id: 9, name: 'Prosciutto', price: 4.00, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=64&h=64&fit=crop&crop=center' },
            { id: 10, name: 'Salami', price: 3.50, image: 'https://images.unsplash.com/photo-1562887189-51d2ae565fbf?w=64&h=64&fit=crop&crop=center' },
            { id: 11, name: 'Arugula', price: 2.00, image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=64&h=64&fit=crop&crop=center' },
            { id: 12, name: 'Parmesan', price: 3.00, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=64&h=64&fit=crop&crop=center' }
        ];

        // Load existing order if in edit mode
        if (this.mode === 'edit' && this.existingOrder) {
            this.currentOrder = [...this.existingOrder.items];
        }
    }

    async render() {
        await this.loadProducts();

        // Return modal-friendly layout
        if (this.isModal) {
            return this.renderModalContent();
        }

        return `
            <div class="pos-layout vect-theme">
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
                        <!-- Controls Panel - Categories, Search -->
                        <div class="vect-controls">
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

    renderModalContent() {
        return `
            <div class="order-creation-modal-content">
                <!-- Main Content Area for Modal -->
                <div class="modal-pos-main">
                    <!-- Left Sidebar - Cart & Numpad -->
                    <div class="modal-sidebar">
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
                    <div class="modal-content-area">
                        <!-- Controls Panel - Categories, Search -->
                        <div class="modal-controls">
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
                        <div class="modal-products">
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
            { id: 'orders', name: 'Orders', badge: 0 }
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

        return this.currentOrder.map((item, index) => {
            const isPizza = this.isPizzaProduct(item);
            const unitPrice = this.getUnitPrice(item);
            const totalPrice = this.calculateItemPrice(item);

            return `
                <div class="vect-cart-item ${isPizza ? 'pizza-item' : ''}" data-item-index="${index}">
                    <div class="vect-cart-item-header">
                        <div class="vect-cart-item-info">
                            <div class="vect-cart-item-name">${item.name}</div>
                            
                            <!-- Show size for pizzas -->
                            ${isPizza && item.size ? `
                                <div class="vect-cart-item-size">Size: ${item.size.name}</div>
                            ` : ''}
                            
                            <!-- Show legacy modifiers for non-pizza items -->
                            ${!isPizza && item.modifiers && item.modifiers.length > 0 ? `
                                <div class="vect-cart-item-modifiers">
                                    ${item.modifiers.map(mod => `<span class="vect-modifier">+${mod.name}</span>`).join(', ')}
                                </div>
                            ` : ''}
                            
                            <button class="vect-remove-btn" data-action="remove" data-item-index="${index}" title="Remove from cart">
                                <span class="vect-remove-icon">🗑️</span>
                                <span class="vect-remove-text">Remove</span>
                            </button>
                        </div>
                        
                        <div class="vect-cart-item-pricing">
                            <div class="vect-cart-item-unit-price">€${unitPrice.toFixed(2)}</div>
                            ${item.quantity > 1 ? `
                                <div class="vect-cart-item-total">Total: €${totalPrice.toFixed(2)}</div>
                            ` : ''}
                        </div>
                        
                        <div class="vect-cart-item-controls">
                            <button class="vect-quantity-btn" data-action="decrease" data-item-index="${index}">-</button>
                            <input type="number" class="vect-quantity-input" value="${item.quantity}" min="1" data-item-index="${index}" />
                            <button class="vect-quantity-btn" data-action="increase" data-item-index="${index}">+</button>
                        </div>
                    </div>
                    
                    <!-- Show extra ingredients list for pizzas (under header) -->
                    ${isPizza && item.extraIngredients && item.extraIngredients.length > 0 ? `
                        <div class="vect-cart-item-extras-list">
                            ${item.extraIngredients.map(ingredient => `
                                <div class="vect-cart-item-extra">
                                    <div class="extra-ingredient-info">
                                        <img class="extra-ingredient-image" src="${ingredient.image}" alt="${ingredient.name}" />
                                        <span class="extra-ingredient-name">+ ${ingredient.name}</span>
                                        ${ingredient.quantity > 1 ? `<span class="ingredient-quantity">x${ingredient.quantity}</span>` : ''}
                                    </div>
                                    <span class="extra-ingredient-cost">€${(ingredient.price * ingredient.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Pizza customization section -->
                    ${isPizza ? `
                        <div class="vect-cart-item-customization">
                            ${this.renderPizzaSizeSelector(item, index)}
                            ${this.renderPizzaIngredients(item, index)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderCartSummary() {
        const subtotal = this.currentOrder.reduce((sum, item) => sum + this.calculateItemPrice(item), 0);
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

    handleHeaderAction(action, buttonConfig) {
        switch (action) {
            case 'cancel-order':
                this.handleCancelOrder();
                break;
            default:
                console.log('Unhandled header action:', action);
                break;
        }
    }

    handleCancelOrder() {
        // Navigate back to orders list
        if (this.app && typeof this.app.navigateToScreen === 'function') {
            this.app.navigateToScreen('orders-list');
        }
    }

    setupEventListeners() {
        // Back to orders navigation
        document.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'back-to-orders') {
                this.handleBackToOrders();
            }
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vect-order-tab')) {
                this.handleTabSwitch(e.target.dataset.tab);
            }
        });

        // Theme switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-btn')) {
                this.handleThemeSwitch(e.target.dataset.theme, e.target);
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

        // Pizza customization event listeners
        document.addEventListener('click', (e) => {
            // Handle pizza size change
            if (e.target.dataset.action === 'change-size') {
                const itemIndex = parseInt(e.target.dataset.itemIndex);
                const sizeId = e.target.dataset.sizeId;
                this.handleSizeChange(itemIndex, sizeId);
            }
            // Handle ingredient quantity controls
            else if (e.target.dataset.action === 'increase-ingredient') {
                const itemIndex = parseInt(e.target.dataset.itemIndex);
                const ingredientId = e.target.dataset.ingredientId;
                this.handleIngredientQuantityChange(itemIndex, ingredientId, 'increase');
            }
            else if (e.target.dataset.action === 'decrease-ingredient') {
                const itemIndex = parseInt(e.target.dataset.itemIndex);
                const ingredientId = e.target.dataset.ingredientId;
                this.handleIngredientQuantityChange(itemIndex, ingredientId, 'decrease');
            }
            // Handle ingredient removal
            else if (e.target.dataset.action === 'remove-ingredient') {
                const itemIndex = parseInt(e.target.dataset.itemIndex);
                const ingredientId = e.target.dataset.ingredientId;
                this.handleIngredientRemove(itemIndex, ingredientId);
            }
            // Handle accordion toggle
            else if (e.target.dataset.action === 'toggle-ingredients' || 
                     e.target.closest('.ingredients-accordion-header')) {
                const accordionHeader = e.target.dataset.action === 'toggle-ingredients' 
                    ? e.target 
                    : e.target.closest('.ingredients-accordion-header');
                
                if (accordionHeader && accordionHeader.dataset.itemIndex) {
                    const itemIndex = parseInt(accordionHeader.dataset.itemIndex);
                    this.handleIngredientsToggle(itemIndex);
                }
            }
            // Handle ingredient selection from list
            else if (e.target.dataset.action === 'add-ingredient' || 
                     e.target.closest('.available-ingredient-item')) {
                const ingredientItem = e.target.dataset.action === 'add-ingredient' 
                    ? e.target 
                    : e.target.closest('.available-ingredient-item');
                
                if (ingredientItem && ingredientItem.dataset.itemIndex && ingredientItem.dataset.ingredientId) {
                    const itemIndex = parseInt(ingredientItem.dataset.itemIndex);
                    const ingredientId = ingredientItem.dataset.ingredientId;
                    this.handleIngredientAdd(itemIndex, ingredientId);
                }
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
        document.addEventListener('click', async (e) => {
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
                await this.handleAction(action);
            }
        });


    }

    handleTabSwitch(tabId) {
        // Update active tab UI
        document.querySelectorAll('.vect-order-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Handle tab switching logic
        switch (tabId) {
            case 'current':
                // Already on Order Items tab - no action needed
                break;
            case 'orders':
                this.navigateToOrdersList();
                break;
        }
    }

    async navigateToOrdersList() {
        try {
            // Check if there are unsaved changes
            if (this.currentOrder.length > 0) {
                const confirmed = confirm('You have items in your cart. Switch to Orders list? You can return to continue working on this order.');
                if (!confirmed) {
                    // Reset tab selection to current
                    document.querySelectorAll('.vect-order-tab').forEach(tab => {
                        tab.classList.toggle('active', tab.dataset.tab === 'current');
                    });
                    return;
                }
            }

            // Navigate to orders list screen
            await this.app.navigateToScreen('orders-list');
        } catch (error) {
            console.error('Failed to navigate to orders list:', error);
            this.showMessage('Failed to navigate to orders list', 'error');
            
            // Reset tab selection to current
            document.querySelectorAll('.vect-order-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === 'current');
            });
        }
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
        
        // Check if product already exists in cart
        const existingItemIndex = this.currentOrder.findIndex(item => 
            item.id === product.id && 
            // For pizzas, check if it's the same size and ingredients
            (!this.isPizzaProduct(fullProduct) || 
             (item.size && item.size.id === '30cm' && (!item.extraIngredients || item.extraIngredients.length === 0)))
        );
        
        if (existingItemIndex !== -1) {
            // Increment quantity of existing item
            this.currentOrder[existingItemIndex].quantity += 1;
        } else {
            // Create new cart item
            const cartItem = {
                ...product,
                quantity: 1
            };
            
            // Add pizza-specific properties if it's a pizza
            if (fullProduct && this.isPizzaProduct(fullProduct)) {
                cartItem.category = fullProduct.category;
                cartItem.size = { ...this.PIZZA_SIZES[0] }; // Default to 30cm
                cartItem.extraIngredients = [];
                cartItem.availableSizes = [...this.PIZZA_SIZES];
                cartItem.availableIngredients = [...this.EXTRA_INGREDIENTS];
                cartItem.basePrice = fullProduct.price;
                cartItem.ingredientsExpanded = false; // Start with accordion closed
            }
            
            this.currentOrder.push(cartItem);
        }
        
        this.updateCartDisplay();
        
        // Show success message
        const itemName = fullProduct ? fullProduct.name : product.name;
        this.showMessage(`${itemName} added to cart`, 'success');
    }

    // Helper method to check if product is pizza
    isPizzaProduct(product) {
        return product && (product.category === 'pizza' || product.category === 'white-pizza');
    }

    // Calculate total price for an item including size and extra ingredients
    calculateItemPrice(item) {
        if (!this.isPizzaProduct(item)) {
            // Non-pizza items: just base price * quantity
            return item.price * item.quantity;
        }

        // Pizza items: calculate base price with size multiplier + extra ingredients
        const basePrice = (item.basePrice || item.price) * (item.size ? item.size.multiplier : 1);
        let extraIngredientsCost = 0;
        
        if (item.extraIngredients && item.extraIngredients.length > 0) {
            extraIngredientsCost = item.extraIngredients.reduce((sum, ingredient) => {
                return sum + (ingredient.price * ingredient.quantity);
            }, 0);
        }

        const singleItemTotal = basePrice + extraIngredientsCost;
        return singleItemTotal * item.quantity;
    }

    // Get the unit price for display (without quantity multiplier)
    getUnitPrice(item) {
        if (!this.isPizzaProduct(item)) {
            return item.price;
        }

        const basePrice = (item.basePrice || item.price) * (item.size ? item.size.multiplier : 1);
        let extraIngredientsCost = 0;
        
        if (item.extraIngredients && item.extraIngredients.length > 0) {
            extraIngredientsCost = item.extraIngredients.reduce((sum, ingredient) => {
                return sum + (ingredient.price * ingredient.quantity);
            }, 0);
        }

        return basePrice + extraIngredientsCost;
    }

    // Render pizza size selector component
    renderPizzaSizeSelector(item, index) {
        if (!this.isPizzaProduct(item) || !item.availableSizes) {
            return '';
        }

        const currentSizeId = item.size ? item.size.id : '30cm';

        return `
            <div class="pizza-size-selector" data-item-index="${index}">
                <label class="size-selector-label">Size:</label>
                <div class="size-buttons">
                    ${item.availableSizes.map(size => `
                        <button class="size-btn ${size.id === currentSizeId ? 'active' : ''}" 
                                data-action="change-size" 
                                data-item-index="${index}" 
                                data-size-id="${size.id}">
                            ${size.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render pizza ingredients component
    renderPizzaIngredients(item, index) {
        if (!this.isPizzaProduct(item) || !item.availableIngredients) {
            return '';
        }

        // Show selected extra ingredients for management
        const selectedIngredients = item.extraIngredients && item.extraIngredients.length > 0 ? `
            <div class="selected-ingredients">
                ${item.extraIngredients.map(ingredient => `
                    <div class="ingredient-item" data-ingredient-id="${ingredient.id}">
                        <div class="ingredient-info">
                            <img class="ingredient-image small" src="${ingredient.image}" alt="${ingredient.name}" />
                            <span class="ingredient-name">${ingredient.name}</span>
                        </div>
                        <div class="ingredient-controls">
                            <button class="qty-btn" data-action="decrease-ingredient" 
                                    data-item-index="${index}" 
                                    data-ingredient-id="${ingredient.id}">-</button>
                            <span class="ingredient-qty">${ingredient.quantity}</span>
                            <button class="qty-btn" data-action="increase-ingredient" 
                                    data-item-index="${index}" 
                                    data-ingredient-id="${ingredient.id}">+</button>
                        </div>
                        <span class="ingredient-price">+€${(ingredient.price * ingredient.quantity).toFixed(2)}</span>
                        <button class="remove-ingredient-btn" data-action="remove-ingredient" 
                                data-item-index="${index}" 
                                data-ingredient-id="${ingredient.id}">×</button>
                    </div>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="pizza-ingredients" data-item-index="${index}">
                <!-- Accordion Header -->
                <div class="ingredients-accordion-header" data-action="toggle-ingredients" data-item-index="${index}">
                    <span class="ingredients-accordion-label">Extra Ingredients</span>
                    <span class="ingredients-accordion-icon ${item.ingredientsExpanded ? 'expanded' : ''}">▼</span>
                </div>
                
                <!-- Accordion Content -->
                <div class="ingredients-accordion-content ${item.ingredientsExpanded ? 'expanded' : ''}">
                    <!-- Available ingredients list -->
                    <div class="available-ingredients-list">
                        ${item.availableIngredients.map(ingredient => {
                            const isAlreadySelected = item.extraIngredients && 
                                                   item.extraIngredients.some(ei => ei.id === ingredient.id);
                            return `
                                <div class="available-ingredient-item ${isAlreadySelected ? 'selected' : ''}" 
                                     data-action="add-ingredient" 
                                     data-item-index="${index}" 
                                     data-ingredient-id="${ingredient.id}">
                                    <div class="ingredient-info">
                                        <img class="ingredient-image" src="${ingredient.image}" alt="${ingredient.name}" />
                                        <span class="available-ingredient-name">${ingredient.name}</span>
                                    </div>
                                    <span class="available-ingredient-price">+€${ingredient.price.toFixed(2)}</span>
                                    ${isAlreadySelected ? '<span class="ingredient-selected-icon">✓</span>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <!-- Selected ingredients management -->
                    ${selectedIngredients}
                </div>
            </div>
        `;
    }

    // Handle pizza size change
    handleSizeChange(itemIndex, sizeId) {
        if (itemIndex < 0 || itemIndex >= this.currentOrder.length) return;
        
        const item = this.currentOrder[itemIndex];
        if (!this.isPizzaProduct(item) || !item.availableSizes) return;
        
        const newSize = item.availableSizes.find(size => size.id === sizeId);
        if (!newSize) return;
        
        // Update item size
        item.size = { ...newSize };
        
        // Update cart display to reflect new price
        this.updateCartDisplay();
        
        // Show feedback message
        this.showMessage(`Pizza size changed to ${newSize.name}`, 'success');
    }

    // Handle adding ingredient to pizza
    handleIngredientAdd(itemIndex, ingredientId) {
        if (itemIndex < 0 || itemIndex >= this.currentOrder.length) return;
        
        const item = this.currentOrder[itemIndex];
        if (!this.isPizzaProduct(item) || !item.availableIngredients) return;
        
        const ingredient = item.availableIngredients.find(ing => ing.id === parseInt(ingredientId));
        if (!ingredient) return;
        
        // Check if ingredient is already added
        const existingIngredient = item.extraIngredients.find(ei => ei.id === ingredient.id);
        if (existingIngredient) {
            // Increase quantity if already exists
            existingIngredient.quantity += 1;
        } else {
            // Add new ingredient
            if (!item.extraIngredients) item.extraIngredients = [];
            item.extraIngredients.push({
                ...ingredient,
                quantity: 1
            });
            
            // Auto-expand accordion when first ingredient is added
            if (!item.ingredientsExpanded) {
                item.ingredientsExpanded = true;
            }
        }
        
        // Update cart display
        this.updateCartDisplay();
        
        // Show feedback message
        this.showMessage(`Added ${ingredient.name} to pizza`, 'success');
    }

    // Handle removing ingredient from pizza
    handleIngredientRemove(itemIndex, ingredientId) {
        if (itemIndex < 0 || itemIndex >= this.currentOrder.length) return;
        
        const item = this.currentOrder[itemIndex];
        if (!this.isPizzaProduct(item) || !item.extraIngredients) return;
        
        // Find and remove ingredient
        const ingredientIndex = item.extraIngredients.findIndex(ei => ei.id === parseInt(ingredientId));
        if (ingredientIndex !== -1) {
            const removedIngredient = item.extraIngredients[ingredientIndex];
            item.extraIngredients.splice(ingredientIndex, 1);
            
            // Update cart display
            this.updateCartDisplay();
            
            // Show feedback message
            this.showMessage(`Removed ${removedIngredient.name} from pizza`, 'success');
        }
    }

    // Handle changing ingredient quantity
    handleIngredientQuantityChange(itemIndex, ingredientId, action) {
        if (itemIndex < 0 || itemIndex >= this.currentOrder.length) return;
        
        const item = this.currentOrder[itemIndex];
        if (!this.isPizzaProduct(item) || !item.extraIngredients) return;
        
        const ingredient = item.extraIngredients.find(ei => ei.id === parseInt(ingredientId));
        if (!ingredient) return;
        
        if (action === 'increase') {
            ingredient.quantity += 1;
        } else if (action === 'decrease') {
            if (ingredient.quantity > 1) {
                ingredient.quantity -= 1;
            } else {
                // Remove ingredient if quantity becomes 0
                this.handleIngredientRemove(itemIndex, ingredientId);
                return;
            }
        }
        
        // Update cart display
        this.updateCartDisplay();
    }

    // Handle ingredients accordion toggle
    handleIngredientsToggle(itemIndex) {
        if (itemIndex < 0 || itemIndex >= this.currentOrder.length) return;
        
        const item = this.currentOrder[itemIndex];
        if (!this.isPizzaProduct(item)) return;
        
        // Toggle expanded state
        item.ingredientsExpanded = !item.ingredientsExpanded;
        
        // Update cart display to reflect new state
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









    async handleAction(action) {
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
            case 'cancel-order':
                await this.handleCancelOrder();
                break;
            case 'back-to-products':
                // No longer needed with inline customization
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

        // Save order using OrderManager
        const orderManager = this.app.getOrderManager();
        if (orderManager) {
            orderManager.createOrder(order);
            console.log('Saved order via OrderManager'); // Debug log
        } else {
            // Fallback to old method
            this.confirmedOrders.push(order);
            localStorage.setItem('vect_confirmed_orders', JSON.stringify(this.confirmedOrders));
            console.log('Saved orders to localStorage (fallback)'); // Debug log
        }

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
        
        // Reset processing flag and navigate back to orders after delay
        setTimeout(async () => {
            this.isProcessingOrder = false;
            console.log('Reset isProcessingOrder to false'); // Debug log
            
            // Navigate back to orders list if not in modal mode
            if (!this.isModal) {
                try {
                    await this.app.navigateBack();
                } catch (error) {
                    console.error('Failed to navigate back after order creation:', error);
                }
            }
        }, 1500);
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

    /**
     * Handle back to orders navigation
     */
    async handleBackToOrders() {
        // Check if there are unsaved changes
        if (this.currentOrder.length > 0) {
            const confirmed = confirm('You have items in your cart. Are you sure you want to go back? All unsaved changes will be lost.');
            if (!confirmed) {
                return;
            }
        }

        try {
            // Navigate back to orders list
            await this.app.navigateBack();
        } catch (error) {
            console.error('Failed to navigate back to orders list:', error);
            this.showMessage('Failed to return to orders list', 'error');
        }
    }

    /**
     * Handle cancel order action
     */
    async handleCancelOrder() {
        // Check if there are unsaved changes
        if (this.currentOrder.length > 0) {
            const confirmed = confirm('You have items in your cart. Are you sure you want to cancel? All unsaved changes will be lost.');
            if (!confirmed) {
                return;
            }
        }

        try {
            // Navigate back to orders list
            await this.app.navigateBack();
        } catch (error) {
            console.error('Failed to navigate back to orders list:', error);
            this.showMessage('Failed to return to orders list', 'error');
        }
    }

    /**
     * Cleanup method for proper navigation
     */
    destroy() {
        // Clear any active intervals or listeners
        this.isProcessingOrder = false;
        
        // Clear current order if not saved
        if (this.mode === 'create') {
            this.currentOrder = [];
        }
        
        console.log('OrderCreationScreen destroyed');
    }
}

export default OrderCreationScreen;