class AppManager {
    constructor() {
        this.storageManager = null;
        this.cartManager = null;
        this.orderManager = null;
        this.modalManager = null;
        this.currentScreen = null;
        this.isInitialized = false;
        this.eventBus = null;
    }

    async init() {
        try {
            console.log('🚀 Initializing Vectis POS System...');
            
            await this.initEventBus();
            await this.initStorageManager();
            await this.initCartManager();
            await this.initOrderManager();
            await this.initModalManager();
            await this.loadOrdersListTheme();
            
            this.isInitialized = true;
            console.log('✅ Vectis POS System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Vectis POS System:', error);
            this.showError('Failed to initialize system. Please refresh the page.');
        }
    }

    async initEventBus() {
        const { default: EventBus } = await import('../services/event-bus.js');
        this.eventBus = EventBus;
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

    async initOrderManager() {
        const { default: OrderManager } = await import('../managers/order-manager.js');
        this.orderManager = OrderManager.getInstance();
        
        // Create sample data for testing
        this.orderManager.createSampleData();
    }

    async initModalManager() {
        const { default: ModalManager } = await import('../components/modals/modal-manager.js');
        this.modalManager = ModalManager.getInstance();
    }

    async loadOrdersListTheme() {
        try {
            console.log('🎨 Loading Orders List theme...');
            
            // Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = './styles/main.css';
            document.head.appendChild(cssLink);
            
            // Load and initialize Orders List screen
            const { default: OrdersListScreen } = await import('../screens/orders/orders-list-screen.js');
            this.currentScreen = new OrdersListScreen(this);
            
            // Render the screen
            const mainContainer = document.getElementById('app');
            if (mainContainer) {
                mainContainer.innerHTML = await this.currentScreen.render();
                await this.currentScreen.afterRender();
                console.log('✅ Orders List screen loaded successfully');
            } else {
                throw new Error('Main container #app not found');
            }
            
        } catch (error) {
            console.error('❌ Failed to load Orders List screen:', error);
            throw error;
        }
    }

    // Legacy method for backward compatibility
    async loadVectTheme() {
        return this.loadOrdersListTheme();
    }

    // Getter methods for screen components
    getStorageManager() {
        return this.storageManager;
    }

    getCartManager() {
        return this.cartManager;
    }

    getOrderManager() {
        return this.orderManager;
    }

    getModalManager() {
        return this.modalManager;
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

    // Navigation methods
    async navigateToScreen(screenName, options = {}) {
        console.log(`🧭 Starting navigation to: ${screenName}`, options);
        try {
            let screen;
            const mainContainer = document.getElementById('app');
            
            console.log(`📱 Main container found:`, !!mainContainer);
            if (!mainContainer) {
                throw new Error('Main container #app not found');
            }

            console.log(`🎯 Creating screen for: ${screenName}`);
            switch (screenName) {
                case 'orders-list':
                    const { default: OrdersListScreen } = await import('../screens/orders/orders-list-screen.js');
                    screen = new OrdersListScreen(this, options);
                    console.log(`✅ OrdersListScreen created`);
                    break;
                    
                case 'order-creation':
                    const { default: OrderCreationScreen } = await import('../screens/orders/order-creation-screen.js');
                    screen = new OrderCreationScreen(this, options);
                    console.log(`✅ OrderCreationScreen created`);
                    break;
                    
                default:
                    throw new Error(`Unknown screen: ${screenName}`);
            }

            // Clean up current screen
            console.log(`🧹 Cleaning up current screen:`, !!this.currentScreen);
            if (this.currentScreen && typeof this.currentScreen.destroy === 'function') {
                this.currentScreen.destroy();
                console.log(`✅ Previous screen destroyed`);
            }

            // Set new screen
            this.currentScreen = screen;
            console.log(`📄 Rendering new screen...`);
            
            // Render new screen
            mainContainer.innerHTML = await screen.render();
            console.log(`✅ Screen HTML rendered`);
            
            // Initialize screen
            console.log(`🔧 Initializing screen...`);
            if (typeof screen.afterRender === 'function') {
                await screen.afterRender();
                console.log(`✅ Screen afterRender completed`);
            }

            console.log(`✅ Successfully navigated to ${screenName} screen`);
            
        } catch (error) {
            console.error(`❌ Failed to navigate to ${screenName}:`, error);
            throw error;
        }
    }

    async navigateBack() {
        // Default back navigation - go to orders list
        await this.navigateToScreen('orders-list');
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