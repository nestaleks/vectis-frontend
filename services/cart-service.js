import eventBus from './event-bus.js';

class CartService {
    constructor() {
        this.items = [];
        this.taxRate = 0.21; // 21% VAT
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
            eventBus.emit(eventBus.constructor.EVENTS.CART_ITEM_UPDATED, {
                item: existingItem,
                action: 'increased'
            });
        } else {
            const newItem = {
                ...product,
                quantity: 1,
                addedAt: new Date().toISOString()
            };
            this.items.push(newItem);
            eventBus.emit(eventBus.constructor.EVENTS.CART_ITEM_ADDED, {
                item: newItem
            });
        }

        this.emitCartUpdate();
        return this.items;
    }

    removeItem(productId) {
        const index = this.items.findIndex(item => item.id === productId);
        
        if (index !== -1) {
            const removedItem = this.items.splice(index, 1)[0];
            eventBus.emit(eventBus.constructor.EVENTS.CART_ITEM_REMOVED, {
                item: removedItem,
                index
            });
            this.emitCartUpdate();
        }

        return this.items;
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        
        if (item) {
            const oldQuantity = item.quantity;
            
            if (quantity <= 0) {
                return this.removeItem(productId);
            }
            
            item.quantity = quantity;
            eventBus.emit(eventBus.constructor.EVENTS.CART_ITEM_UPDATED, {
                item,
                oldQuantity,
                newQuantity: quantity,
                action: quantity > oldQuantity ? 'increased' : 'decreased'
            });
            
            this.emitCartUpdate();
        }

        return this.items;
    }

    increaseQuantity(productId) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            return this.updateQuantity(productId, item.quantity + 1);
        }
        return this.items;
    }

    decreaseQuantity(productId) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            return this.updateQuantity(productId, item.quantity - 1);
        }
        return this.items;
    }

    clear() {
        const clearedItems = [...this.items];
        this.items = [];
        
        eventBus.emit(eventBus.constructor.EVENTS.CART_CLEARED, {
            clearedItems,
            itemCount: clearedItems.length
        });
        
        this.emitCartUpdate();
        return this.items;
    }

    getItems() {
        return this.items;
    }

    getItem(productId) {
        return this.items.find(item => item.id === productId);
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTax() {
        return this.getSubtotal() * this.taxRate;
    }

    getTotal() {
        return this.getSubtotal() + this.getTax();
    }

    getSummary() {
        const subtotal = this.getSubtotal();
        const tax = this.getTax();
        const total = this.getTotal();
        const itemCount = this.getItemCount();

        return {
            items: this.items,
            itemCount,
            subtotal,
            tax,
            total,
            taxRate: this.taxRate
        };
    }

    isEmpty() {
        return this.items.length === 0;
    }

    hasItem(productId) {
        return this.items.some(item => item.id === productId);
    }

    getItemQuantity(productId) {
        const item = this.getItem(productId);
        return item ? item.quantity : 0;
    }

    setTaxRate(rate) {
        this.taxRate = rate;
        this.emitCartUpdate();
    }

    // Persistence methods
    saveToStorage() {
        try {
            localStorage.setItem('vectis_cart', JSON.stringify({
                items: this.items,
                taxRate: this.taxRate,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Failed to save cart to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('vectis_cart');
            if (stored) {
                const cartData = JSON.parse(stored);
                this.items = cartData.items || [];
                this.taxRate = cartData.taxRate || 0.21;
                this.emitCartUpdate();
            }
        } catch (error) {
            console.error('Failed to load cart from storage:', error);
            this.items = [];
        }
    }

    clearStorage() {
        try {
            localStorage.removeItem('vectis_cart');
        } catch (error) {
            console.error('Failed to clear cart storage:', error);
        }
    }

    // Checkout methods
    validateForCheckout() {
        const errors = [];
        
        if (this.isEmpty()) {
            errors.push('Cart is empty');
        }

        // Check for any items with zero or negative quantities
        const invalidItems = this.items.filter(item => item.quantity <= 0);
        if (invalidItems.length > 0) {
            errors.push('Some items have invalid quantities');
        }

        // Check for any items with zero or negative prices
        const invalidPrices = this.items.filter(item => item.price <= 0);
        if (invalidPrices.length > 0) {
            errors.push('Some items have invalid prices');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    prepareCheckoutData() {
        const validation = this.validateForCheckout();
        if (!validation.isValid) {
            throw new Error(`Cannot checkout: ${validation.errors.join(', ')}`);
        }

        const summary = this.getSummary();
        return {
            ...summary,
            checkoutId: `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };
    }

    // Event emission helper
    emitCartUpdate() {
        const summary = this.getSummary();
        eventBus.emit(eventBus.constructor.EVENTS.CART_UPDATED, summary);
        
        // Auto-save to storage
        this.saveToStorage();
    }

    // Utility methods
    getFormattedTotal() {
        return `€${this.getTotal().toFixed(2)}`;
    }

    getFormattedSubtotal() {
        return `€${this.getSubtotal().toFixed(2)}`;
    }

    getFormattedTax() {
        return `€${this.getTax().toFixed(2)}`;
    }

    clone() {
        const cloned = new CartService();
        cloned.items = JSON.parse(JSON.stringify(this.items));
        cloned.taxRate = this.taxRate;
        return cloned;
    }

    // Debug methods
    log() {
        console.table(this.items);
        console.log('Summary:', this.getSummary());
    }
}

// Export as singleton
export default new CartService();