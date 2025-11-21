import BaseComponent from '../base/base-component.js';

class CartComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.currentOrder = data.currentOrder || [];
        this.customer = data.customer || null;
        this.taxRate = data.taxRate || 0.21; // 21% VAT
    }

    async afterRender() {
        await super.afterRender();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    setupEventListeners() {
        // Unified click handler for all cart interactions
        this.addEventListener(this.element, 'click', (e) => {
            const action = e.target.dataset.action;
            const itemIndex = parseInt(e.target.dataset.itemIndex);
            
            switch (action) {
                case 'decrease':
                case 'increase':
                    if (e.target.classList.contains('vect-quantity-btn')) {
                        this.handleQuantityChange(action, itemIndex);
                    }
                    break;
                    
                case 'change-size':
                    const sizeId = e.target.dataset.sizeId;
                    this.handleSizeChange(itemIndex, sizeId);
                    break;
                    
                case 'ingredient-decrease':
                case 'ingredient-increase':
                    const ingredientId = e.target.dataset.ingredientId;
                    this.handleIngredientQuantityChange(action, itemIndex, ingredientId);
                    break;
                    
                default:
                    // Handle remove item buttons (no action attribute)
                    if (e.target.classList.contains('vect-remove-item')) {
                        this.removeItem(itemIndex);
                    }
                    break;
            }
        });

        // Clear cart button
        const clearCartBtn = this.querySelector('#clear-cart-btn');
        if (clearCartBtn) {
            this.addEventListener(clearCartBtn, 'click', () => {
                this.clearCart();
            });
        }

        // Checkout button
        const checkoutBtn = this.querySelector('#checkout-btn');
        if (checkoutBtn) {
            this.addEventListener(checkoutBtn, 'click', () => {
                this.handleCheckout();
            });
        }

        // Listen for product selection
        this.on('products:selected', (data) => {
            this.addItem(data.product);
        });
    }

    addItem(product) {
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
        this.emitCartUpdate();
    }

    removeItem(index) {
        if (index >= 0 && index < this.currentOrder.length) {
            this.currentOrder.splice(index, 1);
            this.updateCartDisplay();
            this.emitCartUpdate();
        }
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
        this.emitCartUpdate();
    }

    clearCart() {
        if (this.currentOrder.length === 0) return;
        
        // Show confirmation
        const confirmed = confirm('Are you sure you want to clear the cart?');
        if (confirmed) {
            this.currentOrder = [];
            this.updateCartDisplay();
            this.emitCartUpdate();
            this.showMessage('Cart cleared', 'info');
        }
    }

    handleCheckout() {
        if (this.currentOrder.length === 0) {
            this.showMessage('Cart is empty', 'warning');
            return;
        }

        const total = this.calculateTotal();
        this.emit('cart:checkout', {
            items: [...this.currentOrder],
            total: total.total,
            subtotal: total.subtotal,
            tax: total.tax,
            customer: this.customer
        });
    }

    updateCartDisplay() {
        this.updateCartItems();
        this.updateCartSummary();
        this.updateCartCount();
        this.updateCheckoutButton();
    }

    updateCartItems() {
        const cartItems = this.querySelector('#vect-cart-items');
        if (!cartItems) return;

        if (this.currentOrder.length === 0) {
            cartItems.innerHTML = this.renderEmptyState();
        } else {
            cartItems.innerHTML = this.currentOrder.map((item, index) => 
                this.renderCartItem(item, index)
            ).join('');
        }
    }

    updateCartSummary() {
        const cartSummary = this.querySelector('#vect-cart-summary');
        if (!cartSummary) return;

        cartSummary.innerHTML = this.renderCartSummary();
    }

    updateCartCount() {
        const cartCount = this.querySelector('#vect-cart-count');
        if (cartCount) {
            const totalItems = this.currentOrder.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    updateCheckoutButton() {
        const checkoutBtn = this.querySelector('#checkout-btn');
        if (checkoutBtn) {
            const total = this.calculateTotal();
            checkoutBtn.textContent = this.currentOrder.length > 0 ? 
                `Checkout - €${total.total.toFixed(2)}` : 
                'Checkout';
            checkoutBtn.disabled = this.currentOrder.length === 0;
        }
    }

    renderCartItem(item, index) {
        const isPizza = this.isPizzaItem(item);
        const unitPrice = this.getUnitPrice(item);
        
        return `
            <div class="vect-cart-item ${isPizza ? 'pizza-item' : ''}" data-item-index="${index}">
                <!-- Row 1: Product name, price, quantity controls, delete icon -->
                <div class="vect-cart-item-row-1">
                    <div class="vect-cart-item-main-info">
                        <div class="vect-cart-item-name">${item.name}</div>
                        <div class="vect-cart-item-price">€${unitPrice.toFixed(2)}</div>
                    </div>
                    <div class="vect-cart-item-controls">
                        <div class="vect-cart-item-quantity">
                            <button class="vect-quantity-btn" data-action="decrease" data-item-index="${index}" 
                                    title="Decrease quantity">-</button>
                            <span class="vect-quantity-value">${item.quantity}</span>
                            <button class="vect-quantity-btn" data-action="increase" data-item-index="${index}" 
                                    title="Increase quantity">+</button>
                        </div>
                        <button class="vect-remove-item" data-item-index="${index}" title="Remove item">🗑️</button>
                    </div>
                </div>

                <!-- Row 2: Size selection (conditional for pizza) -->
                ${isPizza ? `
                <div class="vect-cart-item-row-2">
                    <div class="vect-size-selector">
                        <span class="vect-size-label">Size:</span>
                        <div class="vect-size-buttons">
                            ${item.availableSizes?.map(size => `
                                <button class="vect-size-btn ${item.size?.id === size.id ? 'active' : ''}" 
                                        data-action="change-size" 
                                        data-item-index="${index}" 
                                        data-size-id="${size.id}"
                                        title="Select ${size.name}">
                                    ${size.name}
                                </button>
                            `).join('') || ''}
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Row 3: Extra ingredients (conditional for pizza) -->
                ${isPizza && item.extraIngredients?.length > 0 ? `
                <div class="vect-cart-item-row-3">
                    <div class="vect-extras-section">
                        <span class="vect-extras-label">Extras:</span>
                        <div class="vect-extras-list">
                            ${item.extraIngredients.map(ingredient => `
                                <div class="vect-extra-item" data-ingredient-id="${ingredient.id}">
                                    <span class="vect-extra-name">${ingredient.name}</span>
                                    <div class="vect-extra-controls">
                                        <button class="vect-extra-btn" 
                                                data-action="ingredient-decrease" 
                                                data-item-index="${index}" 
                                                data-ingredient-id="${ingredient.id}"
                                                title="Decrease ${ingredient.name}">-</button>
                                        <span class="vect-extra-quantity">${ingredient.quantity}</span>
                                        <button class="vect-extra-btn" 
                                                data-action="ingredient-increase" 
                                                data-item-index="${index}" 
                                                data-ingredient-id="${ingredient.id}"
                                                title="Increase ${ingredient.name}">+</button>
                                        <span class="vect-extra-price">+€${(ingredient.price * ingredient.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="vect-empty-state">
                <div class="vect-empty-icon">🛒</div>
                <div class="vect-empty-title">Cart is empty</div>
                <div class="vect-empty-description">Add products to start an order</div>
            </div>
        `;
    }

    renderCartSummary() {
        const totals = this.calculateTotal();

        return `
            <div class="vect-summary-line">
                <span>Items (${this.currentOrder.length})</span>
                <span>${this.getTotalItemCount()}</span>
            </div>
            <div class="vect-summary-line">
                <span>Subtotal</span>
                <span>€${totals.subtotal.toFixed(2)}</span>
            </div>
            <div class="vect-summary-line">
                <span>Tax (${(this.taxRate * 100)}%)</span>
                <span>€${totals.tax.toFixed(2)}</span>
            </div>
            <div class="vect-summary-line total">
                <span>Total</span>
                <span>€${totals.total.toFixed(2)}</span>
            </div>
        `;
    }

    calculateTotal() {
        const subtotal = this.currentOrder.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
        const tax = subtotal * this.taxRate;
        const total = subtotal + tax;

        return { subtotal, tax, total };
    }

    // Helper method to check if item is pizza
    isPizzaItem(item) {
        return item && (item.category === 'pizza' || item.category === 'white-pizza');
    }

    // Calculate unit price including size multiplier and ingredients
    getUnitPrice(item) {
        if (!this.isPizzaItem(item)) {
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

    // Calculate total price for an item including quantity
    calculateItemTotal(item) {
        if (!this.isPizzaItem(item)) {
            // Non-pizza items: just base price * quantity
            return item.price * item.quantity;
        }

        // Pizza items: calculate with size multiplier + extra ingredients, then multiply by quantity
        const unitPrice = this.getUnitPrice(item);
        return unitPrice * item.quantity;
    }

    // Handle pizza size change
    handleSizeChange(itemIndex, sizeId) {
        if (itemIndex < 0 || itemIndex >= this.currentOrder.length) return;
        
        const item = this.currentOrder[itemIndex];
        if (!this.isPizzaItem(item) || !item.availableSizes) return;
        
        const newSize = item.availableSizes.find(size => size.id === sizeId);
        if (!newSize) return;
        
        // Update item size
        item.size = { ...newSize };
        
        // Update cart display and emit events
        this.updateCartDisplay();
        this.emitCartUpdate();
    }

    // Handle ingredient quantity change
    handleIngredientQuantityChange(action, itemIndex, ingredientId) {
        if (itemIndex < 0 || itemIndex >= this.currentOrder.length) return;
        
        const item = this.currentOrder[itemIndex];
        if (!this.isPizzaItem(item) || !item.extraIngredients) return;
        
        const ingredient = item.extraIngredients.find(ei => ei.id === parseInt(ingredientId));
        if (!ingredient) return;
        
        if (action === 'ingredient-increase') {
            ingredient.quantity += 1;
        } else if (action === 'ingredient-decrease') {
            ingredient.quantity -= 1;
            
            // Remove ingredient if quantity reaches 0
            if (ingredient.quantity <= 0) {
                const ingredientIndex = item.extraIngredients.findIndex(ei => ei.id === parseInt(ingredientId));
                if (ingredientIndex !== -1) {
                    item.extraIngredients.splice(ingredientIndex, 1);
                }
            }
        }
        
        // Update cart display and emit events
        this.updateCartDisplay();
        this.emitCartUpdate();
    }

    getTotalItemCount() {
        return this.currentOrder.reduce((sum, item) => sum + item.quantity, 0);
    }

    emitCartUpdate() {
        this.emit('cart:updated', {
            items: [...this.currentOrder],
            totals: this.calculateTotal(),
            itemCount: this.getTotalItemCount()
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

    // Public API
    getCurrentOrder() {
        return this.currentOrder;
    }

    setCurrentOrder(order) {
        this.currentOrder = order || [];
        this.updateCartDisplay();
        this.emitCartUpdate();
    }

    getCustomer() {
        return this.customer;
    }

    setCustomer(customer) {
        this.customer = customer;
        this.updateCartDisplay();
    }

    setTaxRate(rate) {
        this.taxRate = rate;
        this.updateCartDisplay();
    }

    getTotalAmount() {
        return this.calculateTotal().total;
    }

    getItemCount() {
        return this.getTotalItemCount();
    }
}

export default CartComponent;