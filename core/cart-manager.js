class CartManager {
    constructor() {
        this.items = [];
        this.storageManager = null;
        this.listeners = new Set();
    }

    async init(storageManager) {
        this.storageManager = storageManager;
        await this.loadCart();
    }

    async loadCart() {
        try {
            const cartData = await this.storageManager.getCart();
            this.items = cartData || [];
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.items = [];
        }
    }

    async saveCart() {
        try {
            await this.storageManager.saveCart(this.items);
        } catch (error) {
            console.error('Failed to save cart:', error);
        }
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: 1
            });
        }

        this.saveCart();
        this.notifyListeners();
        this.dispatchCartEvent('item-added', { product, cart: this.items });
    }

    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            const removedItem = this.items.splice(index, 1)[0];
            this.saveCart();
            this.notifyListeners();
            this.dispatchCartEvent('item-removed', { item: removedItem, cart: this.items });
        }
    }

    updateQuantity(itemId, newQuantity) {
        const item = this.items.find(item => item.id === itemId);
        
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.notifyListeners();
                this.dispatchCartEvent('quantity-updated', { item, cart: this.items });
            }
        }
    }

    increaseQuantity(itemId) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            this.updateQuantity(itemId, item.quantity + 1);
        }
    }

    decreaseQuantity(itemId) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            this.updateQuantity(itemId, item.quantity - 1);
        }
    }

    clear() {
        this.items = [];
        this.saveCart();
        this.notifyListeners();
        this.dispatchCartEvent('cart-cleared', { cart: this.items });
    }

    getItems() {
        return [...this.items];
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTax(taxRate = 0.1) {
        return this.getSubtotal() * taxRate;
    }

    getTotal(taxRate = 0.1) {
        return this.getSubtotal() + this.getTax(taxRate);
    }

    isEmpty() {
        return this.items.length === 0;
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback({
                    items: this.getItems(),
                    itemCount: this.getItemCount(),
                    subtotal: this.getSubtotal(),
                    total: this.getTotal()
                });
            } catch (error) {
                console.error('Error in cart listener:', error);
            }
        });
    }

    dispatchCartEvent(type, detail) {
        const event = new CustomEvent(`pos:cart:${type}`, { 
            detail,
            bubbles: true 
        });
        document.dispatchEvent(event);
    }

    applyDiscount(discountPercent) {
        return this.getSubtotal() * (1 - discountPercent / 100);
    }

    generateReceiptData() {
        return {
            items: this.getItems(),
            subtotal: this.getSubtotal(),
            tax: this.getTax(),
            total: this.getTotal(),
            timestamp: new Date().toISOString(),
            receiptNumber: this.generateReceiptNumber()
        };
    }

    generateReceiptNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${timestamp}-${random}`;
    }
}