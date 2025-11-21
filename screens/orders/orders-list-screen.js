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
        this.handleHeaderAction = this.handleHeaderAction.bind(this);

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

    renderOrderTabs() {
        const tabs = [
            { id: 'current', name: 'Order Items', badge: 0 },
            { id: 'orders', name: 'Orders', badge: this.orders.length }
        ];

        return tabs.map(tab => `
            <button class="vect-order-tab ${tab.id === 'orders' ? 'active' : ''}" 
                    data-tab="${tab.id}">
                ${tab.name}
                ${tab.badge > 0 ? `<span class="vect-order-tab-badge">${tab.badge}</span>` : ''}
            </button>
        `).join('');
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
            <div class="order-row" data-order-id="${order.id}" data-action="view-order" style="cursor: pointer;">
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
        // Remove existing global click handler to prevent duplicates
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler);
        }

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

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vect-order-tab')) {
                this.handleTabSwitch(e.target.dataset.tab);
            }
        });

        // Direct button event listeners
        const newOrderBtn = document.querySelector('.new-order-btn[data-action="new-order"]');
        if (newOrderBtn) {
            console.log('✅ Found New Order button, attaching direct listener');
            newOrderBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔴 New Order button clicked directly!');
                await this.handleNewOrder();
            });
        } else {
            console.log('❌ New Order button not found');
        }

        // Global click handler for other buttons
        this.globalClickHandler = async (e) => {
            const action = e.target.dataset.action;
            if (action) {
                console.log('Button clicked with action:', action); // Debug log
                try {
                    await this.handleOrderAction(action, e.target);
                } catch (error) {
                    console.error('Error handling action:', action, error);
                    this.showMessage('An error occurred. Please try again.', 'error');
                }
            }
        };
        
        document.addEventListener('click', this.globalClickHandler);
    }

    handleHeaderAction(action, buttonConfig) {
        switch (action) {
            case 'new-order':
                this.handleNewOrder();
                break;
            default:
                console.log('Unhandled header action:', action);
                break;
        }
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

    handleTabSwitch(tabId) {
        // Update active tab UI
        document.querySelectorAll('.vect-order-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Handle tab switching logic
        switch (tabId) {
            case 'current':
                this.navigateToOrderCreation();
                break;
            case 'orders':
                // Already on Orders tab - no action needed
                break;
        }
    }

    async navigateToOrderCreation() {
        try {
            // Navigate to order creation screen
            await this.app.navigateToScreen('order-creation', { mode: 'create' });
        } catch (error) {
            console.error('Failed to navigate to order creation:', error);
            this.showMessage('Failed to navigate to order creation', 'error');
            
            // Reset tab selection to orders
            document.querySelectorAll('.vect-order-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === 'orders');
            });
        }
    }

    async handleOrderAction(action, element) {
        const orderId = element.dataset.orderId ? parseInt(element.dataset.orderId) : null;

        switch (action) {
            case 'new-order':
                await this.handleNewOrder();
                break;
            case 'view-order':
                if (orderId) await this.viewOrderDetails(orderId);
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
        console.log('handleNewOrder called'); // Debug log
        try {
            console.log('Attempting to navigate to order-creation screen'); // Debug log
            
            // Check if app and navigateToScreen method exist
            if (!this.app) {
                throw new Error('App instance not available');
            }
            
            if (typeof this.app.navigateToScreen !== 'function') {
                throw new Error('navigateToScreen method not available on app');
            }
            
            // Navigate to order creation screen
            await this.app.navigateToScreen('order-creation', { mode: 'create' });
            console.log('Navigation to order-creation screen completed'); // Debug log
        } catch (error) {
            console.error('Failed to navigate to order creation screen:', error);
            this.showMessage('Failed to open order creation screen', 'error');
        }
    }

    async viewOrderDetails(orderId) {
        const order = this.orderManager.getOrderById(orderId);
        if (!order) {
            this.showMessage('Order not found', 'error');
            return;
        }

        try {
            // Toggle expanded state for the order row
            this.toggleOrderExpansion(orderId);
        } catch (error) {
            console.error('Failed to show order details:', error);
            this.showMessage('Failed to show order details', 'error');
        }
    }

    toggleOrderExpansion(orderId) {
        // Find the order row
        const orderRow = document.querySelector(`[data-order-id="${orderId}"]`);
        if (!orderRow) return;

        // Check if details are already shown
        const existingDetails = orderRow.nextElementSibling;
        if (existingDetails && existingDetails.classList.contains('order-details-expansion')) {
            // Close expansion
            existingDetails.remove();
            orderRow.classList.remove('expanded');
            return;
        }

        // Close any other open expansions
        this.closeAllExpansions();

        // Create and show details expansion
        const order = this.orderManager.getOrderById(orderId);
        const detailsRow = this.createOrderDetailsExpansion(order);
        
        // Insert after the order row
        orderRow.insertAdjacentHTML('afterend', detailsRow);
        orderRow.classList.add('expanded');
    }

    closeAllExpansions() {
        // Remove all existing expansions
        document.querySelectorAll('.order-details-expansion').forEach(expansion => {
            expansion.remove();
        });
        
        // Remove expanded class from all rows
        document.querySelectorAll('.order-row.expanded').forEach(row => {
            row.classList.remove('expanded');
        });
    }

    createOrderDetailsExpansion(order) {
        const orderDate = new Date(order.date);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = orderDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="order-details-expansion">
                <div class="order-details-content">
                    <div class="order-details-header-info">
                        <div class="order-meta">
                            <strong>Order #${order.id.toString().padStart(3, '0')}</strong>
                            <span class="order-datetime">${formattedDate} at ${formattedTime}</span>
                        </div>
                    </div>

                    <div class="order-details-body">
                        <!-- Customer Information -->
                        <div class="details-section">
                            <h4>Customer Information</h4>
                            <div class="customer-details">
                                <div class="detail-item">
                                    <span class="label">Customer:</span>
                                    <span class="value">${order.customer || 'Walk-in Customer'}</span>
                                </div>
                                ${order.phone ? `
                                    <div class="detail-item">
                                        <span class="label">Phone:</span>
                                        <span class="value">${order.phone}</span>
                                    </div>
                                ` : ''}
                                ${order.email ? `
                                    <div class="detail-item">
                                        <span class="label">Email:</span>
                                        <span class="value">${order.email}</span>
                                    </div>
                                ` : ''}
                                ${order.address ? `
                                    <div class="detail-item">
                                        <span class="label">Address:</span>
                                        <span class="value">${order.address}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Order Items -->
                        <div class="details-section">
                            <h4>Order Items</h4>
                            <div class="items-details">
                                ${this.renderOrderItemsDetails(order.items)}
                            </div>
                        </div>

                        <!-- Order Summary -->
                        <div class="details-section">
                            <h4>Order Summary</h4>
                            <div class="order-summary-details">
                                ${this.renderOrderSummaryDetails(order)}
                            </div>
                        </div>

                        ${order.notes ? `
                            <div class="details-section">
                                <h4>Order Notes</h4>
                                <div class="order-notes-details">
                                    <p>${order.notes}</p>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Action Buttons -->
                        <div class="order-details-actions">
                            <button class="details-action-btn close-btn" onclick="this.closest('.order-details-expansion').previousElementSibling.click()">
                                Close Details
                            </button>
                            ${order.status !== 'completed' && order.status !== 'cancelled' ? `
                                <button class="details-action-btn edit-btn" data-action="edit-order" data-order-id="${order.id}">
                                    Edit Order
                                </button>
                            ` : ''}
                            <button class="details-action-btn print-btn" onclick="window.print()">
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderOrderItemsDetails(items) {
        if (!items || items.length === 0) {
            return '<p class="no-items">No items in this order</p>';
        }

        return `
            <div class="items-details-table">
                ${items.map(item => `
                    <div class="item-details-row">
                        <div class="item-details-name">
                            <strong>${item.name || 'Unknown Item'}</strong>
                            ${item.description ? `<br><small>${item.description}</small>` : ''}
                            
                            ${item.size ? `
                                <br><span class="size-badge">Size: ${item.size.name}</span>
                            ` : ''}
                            
                            ${item.extraIngredients && item.extraIngredients.length > 0 ? `
                                <br><small class="extras-title">Extra ingredients:</small>
                                <br>${item.extraIngredients.map(ingredient => `
                                    <span class="extra-ingredient-badge">
                                        +${ingredient.name} ${ingredient.quantity > 1 ? `x${ingredient.quantity}` : ''} 
                                        (+€${(ingredient.price * ingredient.quantity).toFixed(2)})
                                    </span>
                                `).join('')}
                            ` : ''}
                            
                            ${item.customizations && item.customizations.length > 0 ? `
                                <br><small class="customizations">+ ${item.customizations.join(', ')}</small>
                            ` : ''}
                        </div>
                        <div class="item-details-quantity">
                            <span class="quantity-badge">${item.quantity || 0}</span>
                        </div>
                        <div class="item-details-price">
                            €${(item.price || 0).toFixed(2)} each
                        </div>
                        <div class="item-details-total">
                            <strong>€${((item.itemTotal || (item.price || 0) * (item.quantity || 0))).toFixed(2)}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderOrderSummaryDetails(order) {
        const subtotal = order.items?.reduce((sum, item) => {
            return sum + ((item.price || 0) * (item.quantity || 0));
        }, 0) || 0;

        const tax = order.tax || 0;
        const discount = order.discount || 0;
        const total = order.total || subtotal + tax - discount;

        return `
            <div class="summary-details-table">
                <div class="summary-details-row">
                    <span class="summary-label">Subtotal:</span>
                    <span class="summary-value">€${subtotal.toFixed(2)}</span>
                </div>
                ${tax > 0 ? `
                    <div class="summary-details-row">
                        <span class="summary-label">Tax:</span>
                        <span class="summary-value">€${tax.toFixed(2)}</span>
                    </div>
                ` : ''}
                ${discount > 0 ? `
                    <div class="summary-details-row discount">
                        <span class="summary-label">Discount:</span>
                        <span class="summary-value">-€${discount.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="summary-details-row total-row">
                    <span class="summary-label"><strong>Total:</strong></span>
                    <span class="summary-value"><strong>€${total.toFixed(2)}</strong></span>
                </div>
            </div>
        `;
    }

    async editOrder(orderId) {
        try {
            // Navigate to order creation screen in edit mode
            await this.app.navigateToScreen('order-creation', { mode: 'edit', orderId });
        } catch (error) {
            console.error('Failed to navigate to order editing screen:', error);
            this.showMessage('Failed to open order editing screen', 'error');
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
        if (this.orderManager) {
            this.orderManager.off('ordersUpdated', this.refreshOrders);
            this.orderManager.off('orderCreated', this.refreshOrders);
            this.orderManager.off('orderUpdated', this.refreshOrders);
            this.orderManager.off('orderDeleted', this.refreshOrders);
        }
        
        // Remove global click handler
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler);
            this.globalClickHandler = null;
        }
        
        console.log('OrdersListScreen destroyed');
    }
}

export default OrdersListScreen;