import BaseComponent from '../base/base-component.js';

class OrderTabsComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.currentOrder = data.currentOrder || [];
        this.activeTab = data.activeTab || 'current';
    }

    async afterRender() {
        await super.afterRender();
        this.setupEventListeners();
        this.updateBadges();
    }

    setupEventListeners() {
        // Tab switching
        this.addEventListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('vect-order-tab')) {
                this.handleTabSwitch(e.target.dataset.tab);
            }
        });

        // Listen for cart updates to update badge
        this.on('cart:updated', (data) => {
            this.currentOrder = data.items || [];
            this.updateBadges();
        });
    }

    handleTabSwitch(tabId) {
        // Update active tab UI
        this.querySelectorAll('.vect-order-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        this.activeTab = tabId;
        
        // Emit tab switch event
        this.emit('order-tabs:switched', { 
            tabId,
            currentOrder: this.currentOrder 
        });
    }

    updateBadges() {
        const orderItemsBadge = this.querySelector('#order-items-badge');
        if (orderItemsBadge) {
            const itemCount = this.currentOrder.reduce((sum, item) => sum + item.quantity, 0);
            orderItemsBadge.textContent = itemCount;
            orderItemsBadge.style.display = itemCount > 0 ? 'inline' : 'none';
        }
    }

    // Public API
    setCurrentOrder(order) {
        this.currentOrder = order || [];
        this.updateBadges();
    }

    setActiveTab(tabId) {
        this.activeTab = tabId;
        this.querySelectorAll('.vect-order-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
    }

    getCurrentOrder() {
        return this.currentOrder;
    }

    getActiveTab() {
        return this.activeTab;
    }
}

export default OrderTabsComponent;