class EventBus {
    constructor() {
        this.events = {};
        this.debug = false;
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(callback);
        
        if (this.debug) {
            console.log(`[EventBus] Registered listener for "${eventName}". Total listeners: ${this.events[eventName].length}`);
        }

        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    off(eventName, callback) {
        if (!this.events[eventName]) {
            return;
        }

        const index = this.events[eventName].indexOf(callback);
        if (index > -1) {
            this.events[eventName].splice(index, 1);
            
            if (this.debug) {
                console.log(`[EventBus] Removed listener for "${eventName}". Remaining listeners: ${this.events[eventName].length}`);
            }

            // Clean up empty event arrays
            if (this.events[eventName].length === 0) {
                delete this.events[eventName];
            }
        }
    }

    emit(eventName, data = {}) {
        if (this.debug) {
            console.log(`[EventBus] Emitting "${eventName}" with data:`, data);
        }

        if (!this.events[eventName]) {
            if (this.debug) {
                console.log(`[EventBus] No listeners for "${eventName}"`);
            }
            return;
        }

        // Create a copy of listeners to avoid issues if listeners are modified during emission
        const listeners = [...this.events[eventName]];
        
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventBus] Error in listener for "${eventName}":`, error);
            }
        });

        if (this.debug) {
            console.log(`[EventBus] Called ${listeners.length} listeners for "${eventName}"`);
        }
    }

    once(eventName, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(eventName, onceWrapper);
        };
        
        return this.on(eventName, onceWrapper);
    }

    clear(eventName) {
        if (eventName) {
            delete this.events[eventName];
            if (this.debug) {
                console.log(`[EventBus] Cleared all listeners for "${eventName}"`);
            }
        } else {
            this.events = {};
            if (this.debug) {
                console.log(`[EventBus] Cleared all events`);
            }
        }
    }

    getEventNames() {
        return Object.keys(this.events);
    }

    getListenerCount(eventName) {
        return this.events[eventName] ? this.events[eventName].length : 0;
    }

    getAllListenerCounts() {
        const counts = {};
        for (const eventName of Object.keys(this.events)) {
            counts[eventName] = this.events[eventName].length;
        }
        return counts;
    }

    enableDebug(enabled = true) {
        this.debug = enabled;
        console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Common POS events
    static EVENTS = {
        // Product events
        PRODUCT_SELECTED: 'product:selected',
        PRODUCTS_LOADED: 'products:loaded',
        PRODUCTS_FILTERED: 'products:filtered',
        
        // Cart events  
        CART_ITEM_ADDED: 'cart:item:added',
        CART_ITEM_REMOVED: 'cart:item:removed',
        CART_ITEM_UPDATED: 'cart:item:updated',
        CART_CLEARED: 'cart:cleared',
        CART_UPDATED: 'cart:updated',
        
        // UI events
        CATEGORY_CHANGED: 'ui:category:changed',
        SEARCH_CHANGED: 'ui:search:changed',
        TAB_CHANGED: 'ui:tab:changed',
        
        // System events
        CHECKOUT_STARTED: 'system:checkout:started',
        CHECKOUT_COMPLETED: 'system:checkout:completed',
        ERROR_OCCURRED: 'system:error',
        NOTIFICATION_SHOW: 'system:notification:show'
    };
}

// Export as singleton
export default new EventBus();