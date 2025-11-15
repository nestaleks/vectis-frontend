class StorageManager {
    constructor() {
        this.storagePrefix = 'pos_';
        this.products = [];
        this.settings = {};
    }

    async init() {
        try {
            await this.loadProducts();
            await this.loadSettings();
            console.log('Storage Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Storage Manager:', error);
        }
    }

    async loadProducts() {
        try {
            const storedProducts = this.getLocal('products');
            
            if (storedProducts) {
                this.products = storedProducts;
            } else {
                const response = await fetch('./data/products.json');
                if (response.ok) {
                    this.products = await response.json();
                    this.setLocal('products', this.products);
                } else {
                    throw new Error('Failed to fetch products');
                }
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            this.products = this.getDefaultProducts();
        }
    }

    async loadSettings() {
        try {
            const storedSettings = this.getLocal('settings');
            
            if (storedSettings) {
                this.settings = storedSettings;
            } else {
                this.settings = this.getDefaultSettings();
                this.setLocal('settings', this.settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getProducts() {
        return [...this.products];
    }

    getProductById(id) {
        return this.products.find(product => product.id === id);
    }

    getProductsByCategory(category) {
        if (!category) return this.products;
        return this.products.filter(product => product.category === category);
    }

    searchProducts(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.products.filter(product => 
            product.name.toLowerCase().includes(lowercaseQuery) ||
            product.category.toLowerCase().includes(lowercaseQuery) ||
            (product.barcode && product.barcode.includes(query))
        );
    }

    getCategories() {
        const categories = [...new Set(this.products.map(product => product.category))];
        return categories.sort();
    }

    async saveCart(cartItems) {
        this.setLocal('cart', cartItems);
    }

    async getCart() {
        return this.getLocal('cart') || [];
    }

    async clearCart() {
        this.removeLocal('cart');
    }

    getSettings() {
        return { ...this.settings };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.setLocal('settings', this.settings);
    }

    setLocal(key, value) {
        try {
            const fullKey = this.storagePrefix + key;
            localStorage.setItem(fullKey, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save to localStorage: ${key}`, error);
        }
    }

    getLocal(key) {
        try {
            const fullKey = this.storagePrefix + key;
            const value = localStorage.getItem(fullKey);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Failed to read from localStorage: ${key}`, error);
            return null;
        }
    }

    removeLocal(key) {
        try {
            const fullKey = this.storagePrefix + key;
            localStorage.removeItem(fullKey);
        } catch (error) {
            console.error(`Failed to remove from localStorage: ${key}`, error);
        }
    }

    clearAll() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }

    getDefaultProducts() {
        return [
            {
                id: 1,
                name: 'White Bread',
                price: 2.50,
                category: 'Bakery',
                image: 'assets/product-images/bread.jpg',
                barcode: '1234567890123'
            },
            {
                id: 2,
                name: 'Milk 3.2%',
                price: 1.80,
                category: 'Dairy',
                image: 'assets/product-images/milk.jpg',
                barcode: '1234567890124'
            }
        ];
    }

    getDefaultSettings() {
        return {
            taxRate: 0.2, // 20% VAT for EU
            currency: '€',
            locale: 'en-EU',
            theme: 'light',
            gridSize: 'medium',
            showPrices: true,
            autoLogout: 300000, // 5 minutes
            soundEnabled: true,
            vibrationEnabled: true
        };
    }

    exportData() {
        return {
            products: this.products,
            settings: this.settings,
            cart: this.getLocal('cart'),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.products) {
                this.products = data.products;
                this.setLocal('products', this.products);
            }
            
            if (data.settings) {
                this.settings = data.settings;
                this.setLocal('settings', this.settings);
            }
            
            if (data.cart) {
                this.setLocal('cart', data.cart);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}