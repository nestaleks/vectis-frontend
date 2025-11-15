class AppManager {
    constructor() {
        this.storageManager = null;
        this.cartManager = null;
        this.currentScreen = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initializing Vectis POS System...');
            
            await this.initStorageManager();
            await this.initCartManager();
            await this.loadVectTheme();
            
            this.isInitialized = true;
            console.log('✅ Vectis POS System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Vectis POS System:', error);
            this.showError('Failed to initialize system. Please refresh the page.');
        }
    }

    async initStorageManager() {
        const { default: StorageManager } = await import('./storage-manager.js');
        this.storageManager = new StorageManager();
        await this.storageManager.init();
    }

    async initCartManager() {
        // Simple cart manager for Vectis
        this.cartManager = {
            items: [],
            addItem: (item) => this.cartManager.items.push(item),
            removeItem: (index) => this.cartManager.items.splice(index, 1),
            updateQuantity: (index, quantity) => {
                if (this.cartManager.items[index]) {
                    this.cartManager.items[index].quantity = quantity;
                }
            },
            clear: () => this.cartManager.items = [],
            getTotal: () => this.cartManager.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
    }

    async loadVectTheme() {
        try {
            console.log('🎨 Loading Vect theme...');
            
            // Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = './styles/vect-theme.css';
            document.head.appendChild(cssLink);
            
            // Load and initialize Vect home screen
            const { default: VectHomeScreen } = await import('../screens/home/vect-home-screen.js');
            this.currentScreen = new VectHomeScreen(this);
            
            // Render the screen
            const mainContainer = document.getElementById('app');
            if (mainContainer) {
                mainContainer.innerHTML = await this.currentScreen.render();
                await this.currentScreen.afterRender();
                console.log('✅ Vect theme loaded successfully');
            } else {
                throw new Error('Main container #app not found');
            }
            
        } catch (error) {
            console.error('❌ Failed to load Vect theme:', error);
            throw error;
        }
    }

    // Getter methods for screen components
    getStorageManager() {
        return this.storageManager;
    }

    getCartManager() {
        return this.cartManager;
    }

    // Error handling
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">System Error</h3>
            <p style="margin: 0;">${message}</p>
        `;
        document.body.appendChild(errorDiv);
    }

    // System info
    getSystemInfo() {
        return {
            name: 'Vectis POS Frontend',
            version: '1.0.0',
            theme: 'Vect',
            initialized: this.isInitialized
        };
    }
}

export default AppManager;