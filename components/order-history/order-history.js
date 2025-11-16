import BaseComponent from '../base/base-component.js';
import orderHistoryService from '../../services/order-history-service.js';

class OrderHistoryComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.orderHistoryService = orderHistoryService;
    }

    async afterRender() {
        await super.afterRender();
        this.loadOrderHistory();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Back to POS button
        const backButton = this.querySelector('#back-to-pos');
        if (backButton) {
            this.addEventListener(backButton, 'click', this.handleBackToPOS);
        }

        // Date filter
        const dateFilter = this.querySelector('#date-filter');
        if (dateFilter) {
            this.addEventListener(dateFilter, 'change', (e) => {
                this.orderHistoryService.setDateFilter(e.target.value);
            });
        }

        // Status filter
        const statusFilter = this.querySelector('#status-filter');
        if (statusFilter) {
            this.addEventListener(statusFilter, 'change', (e) => {
                this.orderHistoryService.setStatusFilter(e.target.value);
            });
        }

        // Search input
        const searchInput = this.querySelector('#order-search');
        if (searchInput) {
            this.addEventListener(searchInput, 'input', (e) => {
                this.orderHistoryService.setSearchQuery(e.target.value);
            });
        }

        // Pagination buttons
        const prevButton = this.querySelector('#prev-page');
        const nextButton = this.querySelector('#next-page');
        
        if (prevButton) {
            this.addEventListener(prevButton, 'click', () => {
                this.orderHistoryService.previousPage();
            });
        }

        if (nextButton) {
            this.addEventListener(nextButton, 'click', () => {
                this.orderHistoryService.nextPage();
            });
        }

        // Listen for order history updates
        this.on('order-history:updated', this.updateDisplay);

        // Order row clicks
        this.addEventListener(this.element, 'click', (e) => {
            const orderRow = e.target.closest('.vect-order-row');
            if (orderRow) {
                const orderId = orderRow.dataset.orderId;
                console.log('Order clicked:', orderId); // Debug log
                this.handleOrderClick(orderId);
            }
        });
    }

    loadOrderHistory() {
        this.orderHistoryService.emitOrdersUpdate();
    }

    updateDisplay = (data) => {
        this.updateStats(data.stats);
        this.updateOrdersList(data.orders);
        this.updatePagination(data);
    }

    updateStats(stats) {
        const totalOrdersEl = this.querySelector('#total-orders');
        const totalRevenueEl = this.querySelector('#total-revenue');
        const avgOrderValueEl = this.querySelector('#avg-order-value');

        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders;
        if (totalRevenueEl) totalRevenueEl.textContent = `€${stats.totalRevenue.toFixed(2)}`;
        if (avgOrderValueEl) avgOrderValueEl.textContent = `€${stats.avgOrderValue.toFixed(2)}`;
    }

    updateOrdersList(orders) {
        console.log('updateOrdersList called with:', orders); // Debug log
        const ordersList = this.querySelector('#order-history-list');
        if (!ordersList) {
            console.error('order-history-list element not found!');
            return;
        }

        console.log('Found ordersList element:', ordersList);

        if (orders.length === 0) {
            ordersList.innerHTML = this.renderEmptyState();
            return;
        }

        const ordersHTML = orders.map(order => this.renderOrderRow(order)).join('');
        console.log('Generated orders HTML:', ordersHTML); // Debug log
        ordersList.innerHTML = ordersHTML;
    }

    updatePagination(data) {
        const prevButton = this.querySelector('#prev-page');
        const nextButton = this.querySelector('#next-page');
        const pageInfo = this.querySelector('#page-info');

        if (prevButton) {
            prevButton.disabled = data.currentPage <= 1;
        }

        if (nextButton) {
            nextButton.disabled = data.currentPage >= data.totalPages;
        }

        if (pageInfo) {
            pageInfo.textContent = `Page ${data.currentPage} of ${data.totalPages}`;
        }
    }

    renderOrderRow(order) {
        const date = new Date(order.date);
        const statusClass = `vect-status vect-status-${order.status}`;
        
        return `
            <div class="vect-order-row" data-order-id="${order.id}">
                <div class="vect-order-info">
                    <div class="vect-order-id">${order.id}</div>
                    <div class="vect-order-date">${date.toLocaleDateString()}</div>
                </div>
                
                <div class="vect-order-customer">
                    <div class="vect-customer-name">${order.customer}</div>
                    <div class="vect-order-items">${order.items.length} items</div>
                </div>
                
                <div class="vect-order-status">
                    <span class="${statusClass}">${this.formatStatus(order.status)}</span>
                </div>
                
                <div class="vect-order-total">
                    <div class="vect-total-amount">€${order.total.toFixed(2)}</div>
                    <div class="vect-payment-method">${this.formatPaymentMethod(order.paymentMethod)}</div>
                </div>
                
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="vect-empty-state">
                <div class="vect-empty-icon">📋</div>
                <div class="vect-empty-title">No orders found</div>
                <div class="vect-empty-description">
                    Try adjusting your filters or check back later for new orders.
                </div>
            </div>
        `;
    }

    formatStatus(status) {
        switch (status) {
            case 'completed': return 'Completed';
            case 'pending': return 'Pending';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    }

    formatPaymentMethod(method) {
        switch (method) {
            case 'card': return 'Card';
            case 'cash': return 'Cash';
            default: return method;
        }
    }

    handleBackToPOS() {
        this.emit('order-history:back-to-pos');
    }

    handleOrderClick(orderId) {
        console.log('handleOrderClick called with:', orderId); // Debug log
        const order = this.orderHistoryService.getOrderById(orderId);
        console.log('Found order:', order); // Debug log
        if (order) {
            this.emit('order-history:order-selected', { order });
            this.showOrderDetails(order);
        } else {
            console.error('Order not found:', orderId);
        }
    }

    viewOrderDetails(orderId) {
        this.handleOrderClick(orderId);
    }

    showOrderDetails(order) {
        const detailsPanel = this.querySelector('#order-details-panel');
        if (!detailsPanel) return;

        // Highlight selected order in the list
        this.updateSelectedOrder(order.id);

        detailsPanel.innerHTML = `
            <div class="vect-order-details-content">
                <div class="vect-order-details-header">
                    <h3>Order Details - ${order.id}</h3>
                    <span class="vect-status vect-status-${order.status}">
                        ${this.formatStatus(order.status)}
                    </span>
                </div>
                
                <div class="vect-order-details-info">
                    <div class="vect-detail-group">
                        <label>Date:</label>
                        <span>${new Date(order.date).toLocaleString()}</span>
                    </div>
                    
                    <div class="vect-detail-group">
                        <label>Customer:</label>
                        <span>${order.customer}</span>
                    </div>
                    
                    <div class="vect-detail-group">
                        <label>Payment Method:</label>
                        <span>${this.formatPaymentMethod(order.paymentMethod)}</span>
                    </div>
                </div>
                
                <div class="vect-order-items-detail">
                    <h4>Order Items:</h4>
                    <div class="vect-items-list">
                        ${order.items.map(item => `
                            <div class="vect-item-row">
                                <div class="vect-item-info">
                                    <div class="item-name">${item.name}</div>
                                    ${item.modifiers && item.modifiers.length > 0 ? `
                                        <div class="item-modifiers">
                                            ${item.modifiers.map(mod => `
                                                <span class="modifier-badge">+${mod.name} (+€${mod.price.toFixed(2)})</span>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="vect-item-pricing">
                                    <div class="vect-item-quantity">Qty: ${item.quantity}</div>
                                    <div class="vect-item-price">
                                        <div class="base-price">€${(item.basePrice || item.price).toFixed(2)}</div>
                                        ${item.modifiers && item.modifiers.length > 0 ? `
                                            <div class="modifier-total">+€${item.modifiers.reduce((sum, mod) => sum + mod.price, 0).toFixed(2)}</div>
                                        ` : ''}
                                    </div>
                                    <div class="vect-item-total">€${(item.itemTotal || item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="vect-order-summary">
                    <div class="vect-summary-row">
                        <span>Subtotal:</span>
                        <span>€${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="vect-summary-row">
                        <span>Tax (21%):</span>
                        <span>€${order.tax.toFixed(2)}</span>
                    </div>
                    <div class="vect-summary-row vect-summary-total">
                        <span>Total:</span>
                        <span>€${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateSelectedOrder(orderId) {
        // Remove previous selection
        const prevSelected = this.querySelector('.vect-order-row.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Add selection to current order
        const currentOrder = this.querySelector(`[data-order-id="${orderId}"]`);
        if (currentOrder) {
            currentOrder.classList.add('selected');
        }
    }

    // Public API
    refresh() {
        this.loadOrderHistory();
    }

    exportOrders(format = 'json') {
        return this.orderHistoryService.exportOrders(format);
    }

    clearFilters() {
        this.orderHistoryService.reset();
        
        // Reset UI elements
        const dateFilter = this.querySelector('#date-filter');
        const statusFilter = this.querySelector('#status-filter');
        const searchInput = this.querySelector('#order-search');
        
        if (dateFilter) dateFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        if (searchInput) searchInput.value = '';
    }
}

export default OrderHistoryComponent;