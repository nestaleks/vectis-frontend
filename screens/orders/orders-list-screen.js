import OrderManager from '../../managers/order-manager.js';
import ModalManager from '../../components/modals/modal-manager.js';

/**
 * OrdersListScreen - Main screen showing all orders with "New Order" functionality
 */
class OrdersListScreen {
    constructor(app, data = {}) {
        this.app = app;
        this.data = data;
        this.orderManager = OrderManager.getInstance();
        this.modalManager = ModalManager.getInstance();
        
        this.orders = [];
        this.filteredOrders = [];
        this.searchQuery = '';
        this.statusFilter = 'all';
        this.sortBy = 'date';
        this.sortOrder = 'desc';

        // Bind methods
        this.handleSearch = this.handleSearch.bind(this);
        this.handleStatusFilter = this.handleStatusFilter.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleNewOrder = this.handleNewOrder.bind(this);
        this.handleOrderAction = this.handleOrderAction.bind(this);
        this.refreshOrders = this.refreshOrders.bind(this);

        // Listen for order updates
        this.orderManager.on('ordersUpdated', this.refreshOrders);
        this.orderManager.on('orderCreated', this.refreshOrders);
        this.orderManager.on('orderUpdated', this.refreshOrders);
        this.orderManager.on('orderDeleted', this.refreshOrders);
    }

    async render() {
        await this.loadOrders();

        return `
            <div class="orders-list-screen">
                <!-- Header -->
                <div class="orders-header">
                    <div class="orders-header-left">
                        <div class="orders-logo">Vectis POS</div>
                        <div class="orders-title">Orders Management</div>
                    </div>
                    
                    <div class="orders-header-right">
                        <button class="new-order-btn" data-action="new-order">
                            <span class="new-order-icon">+</span>
                            <span class="new-order-text">New Order</span>
                        </button>
                    </div>
                </div>

                <!-- Statistics -->
                <div class="orders-stats">
                    ${this.renderOrderStats()}
                </div>

                <!-- Controls -->
                <div class="orders-controls">
                    <div class="orders-controls-left">
                        <!-- Search -->
                        <div class="search-container">
                            <div class="search-icon">🔍</div>
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="Search orders..." 
                                id="orders-search-input"
                                value="${this.searchQuery}"
                            />
                        </div>

                        <!-- Status Filter -->
                        <div class="status-filter-container">
                            <select class="status-filter" id="status-filter">
                                <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Orders</option>
                                <option value="pending" ${this.statusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${this.statusFilter === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="preparing" ${this.statusFilter === 'preparing' ? 'selected' : ''}>Preparing</option>
                                <option value="ready" ${this.statusFilter === 'ready' ? 'selected' : ''}>Ready</option>
                                <option value="completed" ${this.statusFilter === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${this.statusFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div class="orders-controls-right">
                        <!-- Sort Options -->
                        <div class="sort-container">
                            <select class="sort-select" id="sort-select">
                                <option value="date" ${this.sortBy === 'date' ? 'selected' : ''}>Sort by Date</option>
                                <option value="total" ${this.sortBy === 'total' ? 'selected' : ''}>Sort by Total</option>
                                <option value="status" ${this.sortBy === 'status' ? 'selected' : ''}>Sort by Status</option>
                                <option value="customer" ${this.sortBy === 'customer' ? 'selected' : ''}>Sort by Customer</option>
                            </select>
                            
                            <button class="sort-order-btn" data-action="toggle-sort" title="Toggle sort order">
                                ${this.sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Orders List -->
                <div class="orders-list">
                    ${this.renderOrdersList()}
                </div>

                <!-- Empty State -->
                ${this.filteredOrders.length === 0 ? this.renderEmptyState() : ''}
            </div>
        `;
    }

    async loadOrders() {
        try {
            this.orders = this.orderManager.getAllOrders();
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load orders:', error);
            this.orders = [];
            this.filteredOrders = [];
        }
    }

    renderOrderStats() {
        const stats = this.orderManager.getOrderStats();
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.pending + stats.confirmed + stats.preparing}</div>
                        <div class="stat-label">Active Orders</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.completed}</div>
                        <div class="stat-label">Completed Today</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-number">€${stats.totalRevenue.toFixed(2)}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderOrdersList() {
        if (this.filteredOrders.length === 0) {
            return '';
        }

        return `
            <div class="orders-table">
                <div class="orders-table-header">
                    <div class="table-cell">Order #</div>
                    <div class="table-cell">Date & Time</div>
                    <div class="table-cell">Customer</div>
                    <div class="table-cell">Items</div>
                    <div class="table-cell">Status</div>
                    <div class="table-cell">Total</div>
                    <div class="table-cell">Actions</div>
                </div>
                
                <div class="orders-table-body">
                    ${this.filteredOrders.map(order => this.renderOrderRow(order)).join('')}
                </div>
            </div>
        `;
    }

    renderOrderRow(order) {
        const orderDate = new Date(order.date);
        const formattedDate = orderDate.toLocaleDateString();
        const formattedTime = orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const statusColors = {
            'pending': '#fbbf24',
            'confirmed': '#3b82f6',
            'preparing': '#f97316',
            'ready': '#10b981',
            'completed': '#059669',
            'cancelled': '#ef4444'
        };

        return `
            <div class="order-row" data-order-id="${order.id}">
                <div class="table-cell">
                    <div class="order-id">#${order.id.toString().padStart(3, '0')}</div>
                </div>
                
                <div class="table-cell">
                    <div class="order-date">${formattedDate}</div>
                    <div class="order-time">${formattedTime}</div>
                </div>
                
                <div class="table-cell">
                    <div class="customer-name">${order.customer}</div>
                </div>
                
                <div class="table-cell">
                    <div class="items-count">${order.items.length} items</div>
                    <div class="items-preview">${this.getItemsPreview(order.items)}</div>
                </div>
                
                <div class="table-cell">
                    <span class="status-badge" style="background-color: ${statusColors[order.status]}">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>
                
                <div class="table-cell">
                    <div class="order-total">€${order.total.toFixed(2)}</div>
                </div>
                
                <div class="table-cell">
                    <div class="action-buttons">
                        <button class="action-btn view-btn" data-action="view-order" data-order-id="${order.id}" title="View Details">
                            👁️
                        </button>
                        
                        ${order.status !== 'completed' && order.status !== 'cancelled' ? `
                            <button class="action-btn edit-btn" data-action="edit-order" data-order-id="${order.id}" title="Edit Order">
                                ✏️
                            </button>
                        ` : ''}
                        
                        ${order.status === 'pending' ? `
                            <button class="action-btn confirm-btn" data-action="confirm-order" data-order-id="${order.id}" title="Confirm Order">
                                ✓
                            </button>
                        ` : ''}
                        
                        <button class="action-btn delete-btn" data-action="delete-order" data-order-id="${order.id}" title="Delete Order">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-title">
                    ${this.searchQuery || this.statusFilter !== 'all' 
                        ? 'No orders match your filters' 
                        : 'No orders yet'
                    }
                </div>
                <div class="empty-description">
                    ${this.searchQuery || this.statusFilter !== 'all'
                        ? 'Try adjusting your search or filter settings'
                        : 'Create your first order to get started'
                    }
                </div>
                ${!this.searchQuery && this.statusFilter === 'all' ? `
                    <button class="empty-action-btn" data-action="new-order">
                        Create New Order
                    </button>
                ` : ''}
            </div>
        `;
    }

    getItemsPreview(items) {
        if (!items || items.length === 0) return '';
        
        const preview = items.slice(0, 2).map(item => item.name).join(', ');
        return items.length > 2 ? `${preview}...` : preview;
    }

    applyFilters() {
        let filtered = [...this.orders];

        // Apply search filter
        if (this.searchQuery) {
            filtered = this.orderManager.searchOrders(this.searchQuery);
        }

        // Apply status filter
        if (this.statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === this.statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
                case 'date':
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case 'total':
                    aValue = a.total || 0;
                    bValue = b.total || 0;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'customer':
                    aValue = a.customer;
                    bValue = b.customer;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredOrders = filtered;
    }

    async afterRender() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('orders-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch);
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', this.handleStatusFilter);
        }

        // Sort options
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSort);
        }

        // Global click handler for buttons
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleOrderAction(action, e.target);
            }
        });
    }

    handleSearch(event) {
        this.searchQuery = event.target.value;
        this.applyFilters();
        this.updateOrdersList();
    }

    handleStatusFilter(event) {
        this.statusFilter = event.target.value;
        this.applyFilters();
        this.updateOrdersList();
    }

    handleSort(event) {
        this.sortBy = event.target.value;
        this.applyFilters();
        this.updateOrdersList();
    }

    async handleOrderAction(action, element) {
        const orderId = element.dataset.orderId ? parseInt(element.dataset.orderId) : null;

        switch (action) {
            case 'new-order':
                await this.handleNewOrder();
                break;
            case 'view-order':
                if (orderId) this.viewOrderDetails(orderId);
                break;
            case 'edit-order':
                if (orderId) await this.editOrder(orderId);
                break;
            case 'confirm-order':
                if (orderId) this.confirmOrder(orderId);
                break;
            case 'delete-order':
                if (orderId) this.deleteOrder(orderId);
                break;
            case 'toggle-sort':
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                this.applyFilters();
                this.updateOrdersList();
                break;
        }
    }

    async handleNewOrder() {
        try {
            // Import OrderModal dynamically
            const { default: OrderModal } = await import('../../components/modals/order-modal.js');
            
            // Register modal if not already registered
            if (!this.modalManager.modals.has('new-order')) {
                const orderModal = new OrderModal(this.app);
                this.modalManager.register('new-order', orderModal);
            }
            
            // Open modal
            this.modalManager.open('new-order');
        } catch (error) {
            console.error('Failed to open new order modal:', error);
            this.showMessage('Failed to open order creation window', 'error');
        }
    }

    viewOrderDetails(orderId) {
        const order = this.orderManager.getOrderById(orderId);
        if (!order) return;

        // Create a detailed view modal or expand the row
        console.log('View order details for:', order);
        // TODO: Implement order details modal
        this.showMessage(`Viewing order #${orderId}`, 'info');
    }

    async editOrder(orderId) {
        try {
            const { default: OrderModal } = await import('../../components/modals/order-modal.js');
            
            if (!this.modalManager.modals.has('edit-order')) {
                const orderModal = new OrderModal(this.app);
                this.modalManager.register('edit-order', orderModal);
            }
            
            // Open modal with existing order data
            this.modalManager.open('edit-order', { orderId, mode: 'edit' });
        } catch (error) {
            console.error('Failed to open edit order modal:', error);
            this.showMessage('Failed to open order editing window', 'error');
        }
    }

    confirmOrder(orderId) {
        if (confirm('Confirm this order?')) {
            this.orderManager.updateOrderStatus(orderId, 'confirmed');
            this.showMessage('Order confirmed successfully', 'success');
        }
    }

    deleteOrder(orderId) {
        if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            this.orderManager.deleteOrder(orderId);
            this.showMessage('Order deleted successfully', 'success');
        }
    }

    refreshOrders() {
        this.loadOrders().then(() => {
            this.updateOrdersList();
            this.updateStats();
        });
    }

    updateOrdersList() {
        const ordersList = document.querySelector('.orders-list');
        if (ordersList) {
            ordersList.innerHTML = this.renderOrdersList();
        }

        // Update empty state
        const emptyState = document.querySelector('.empty-state');
        if (this.filteredOrders.length === 0) {
            if (!emptyState) {
                const ordersListScreen = document.querySelector('.orders-list-screen');
                if (ordersListScreen) {
                    ordersListScreen.insertAdjacentHTML('beforeend', this.renderEmptyState());
                }
            }
        } else if (emptyState) {
            emptyState.remove();
        }
    }

    updateStats() {
        const statsContainer = document.querySelector('.orders-stats');
        if (statsContainer) {
            statsContainer.innerHTML = this.renderOrderStats();
        }
    }

    showMessage(text, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = text;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease-out'
        });

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }

        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    destroy() {
        // Remove event listeners
        this.orderManager.off('ordersUpdated', this.refreshOrders);
        this.orderManager.off('orderCreated', this.refreshOrders);
        this.orderManager.off('orderUpdated', this.refreshOrders);
        this.orderManager.off('orderDeleted', this.refreshOrders);
    }
}

export default OrdersListScreen;