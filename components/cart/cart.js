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
        // Quantity controls
        this.addEventListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('vect-quantity-btn')) {
                const action = e.target.dataset.action;
                const index = parseInt(e.target.dataset.itemIndex);
                this.handleQuantityChange(action, index);
            }
        });

        // Remove item buttons
        this.addEventListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('vect-remove-item')) {
                const index = parseInt(e.target.dataset.itemIndex);
                this.removeItem(index);
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
        return `
            <div class="vect-cart-item" data-item-index="${index}">
                <div class="vect-cart-item-image">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}" />` : 
                        `<div class="vect-cart-item-placeholder"></div>`
                    }
                </div>
                <div class="vect-cart-item-info">
                    <div class="vect-cart-item-name">${item.name}</div>
                    <div class="vect-cart-item-price">€${item.price.toFixed(2)}</div>
                </div>
                <div class="vect-cart-item-quantity">
                    <button class="vect-quantity-btn" data-action="decrease" data-item-index="${index}">-</button>
                    <span class="vect-quantity-value">${item.quantity}</span>
                    <button class="vect-quantity-btn" data-action="increase" data-item-index="${index}">+</button>
                </div>
                <div class="vect-cart-item-total">
                    €${(item.price * item.quantity).toFixed(2)}
                </div>
                <button class="vect-remove-item" data-item-index="${index}" title="Remove item">✕</button>
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
        const subtotal = this.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * this.taxRate;
        const total = subtotal + tax;

        return { subtotal, tax, total };
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