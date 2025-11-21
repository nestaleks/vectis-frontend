/**
 * OrderDetailsModal - Modal component for viewing order details
 * Shows comprehensive order information in a read-only format
 */
class OrderDetailsModal {
    constructor(app) {
        this.app = app;
        this.order = null;
    }

    /**
     * Render the order details modal content
     */
    async render(options = {}) {
        const { orderId } = options;
        
        // Get order data
        if (orderId && this.app.getOrderManager) {
            this.order = this.app.getOrderManager().getOrderById(orderId);
        }

        if (!this.order) {
            return this.renderError();
        }

        const orderDate = new Date(this.order.date);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = orderDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusColors = {
            'pending': '#fbbf24',
            'confirmed': '#3b82f6', 
            'preparing': '#f97316',
            'ready': '#10b981',
            'completed': '#059669',
            'cancelled': '#ef4444'
        };

        return `
            <div class="order-details-modal">
                <!-- Header -->
                <div class="order-details-header">
                    <div class="order-header-left">
                        <h2 class="order-title">Order #${this.order.id.toString().padStart(3, '0')}</h2>
                        <div class="order-subtitle">
                            <span class="order-date">${formattedDate} at ${formattedTime}</span>
                        </div>
                    </div>
                    <div class="order-header-right">
                        <span class="order-status-badge" style="background-color: ${statusColors[this.order.status]}">
                            ${this.order.status.charAt(0).toUpperCase() + this.order.status.slice(1)}
                        </span>
                    </div>
                </div>

                <!-- Customer Information -->
                <div class="order-section">
                    <h3 class="section-title">Customer Information</h3>
                    <div class="customer-info">
                        <div class="info-item">
                            <span class="info-label">Customer:</span>
                            <span class="info-value">${this.order.customer || 'Walk-in Customer'}</span>
                        </div>
                        ${this.order.phone ? `
                            <div class="info-item">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${this.order.phone}</span>
                            </div>
                        ` : ''}
                        ${this.order.email ? `
                            <div class="info-item">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${this.order.email}</span>
                            </div>
                        ` : ''}
                        ${this.order.address ? `
                            <div class="info-item">
                                <span class="info-label">Address:</span>
                                <span class="info-value">${this.order.address}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Order Items -->
                <div class="order-section">
                    <h3 class="section-title">Order Items</h3>
                    <div class="order-items">
                        ${this.renderOrderItems()}
                    </div>
                </div>

                <!-- Order Summary -->
                <div class="order-section">
                    <h3 class="section-title">Order Summary</h3>
                    <div class="order-summary">
                        ${this.renderOrderSummary()}
                    </div>
                </div>

                <!-- Order Notes -->
                ${this.order.notes ? `
                    <div class="order-section">
                        <h3 class="section-title">Order Notes</h3>
                        <div class="order-notes">
                            <p>${this.order.notes}</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="order-actions">
                    <button class="action-btn secondary-btn" data-action="close-modal">
                        Close
                    </button>
                    ${this.order.status !== 'completed' && this.order.status !== 'cancelled' ? `
                        <button class="action-btn primary-btn" data-action="edit-order" data-order-id="${this.order.id}">
                            Edit Order
                        </button>
                    ` : ''}
                    <button class="action-btn secondary-btn" data-action="print-order" data-order-id="${this.order.id}">
                        Print Receipt
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render error state when order not found
     */
    renderError() {
        return `
            <div class="order-details-error">
                <div class="error-icon">❌</div>
                <h3>Order Not Found</h3>
                <p>The requested order could not be found.</p>
                <button class="action-btn primary-btn" data-action="close-modal">
                    Close
                </button>
            </div>
        `;
    }

    /**
     * Render the order items list
     */
    renderOrderItems() {
        if (!this.order.items || this.order.items.length === 0) {
            return '<p class="empty-items">No items in this order</p>';
        }

        return `
            <div class="items-table">
                <div class="items-header">
                    <div class="item-name-col">Item</div>
                    <div class="item-qty-col">Qty</div>
                    <div class="item-price-col">Price</div>
                    <div class="item-total-col">Total</div>
                </div>
                <div class="items-body">
                    ${this.order.items.map(item => this.renderOrderItem(item)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a single order item
     */
    renderOrderItem(item) {
        const itemTotal = item.itemTotal || (item.price || 0) * (item.quantity || 0);
        
        return `
            <div class="item-row">
                <div class="item-name-col">
                    <div class="item-name">${item.name || 'Unknown Item'}</div>
                    ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                    
                    ${item.size ? `
                        <div class="item-size">
                            <span class="size-badge">Size: ${item.size.name}</span>
                        </div>
                    ` : ''}
                    
                    ${item.extraIngredients && item.extraIngredients.length > 0 ? `
                        <div class="item-extra-ingredients">
                            <div class="extras-title">Extra ingredients:</div>
                            ${item.extraIngredients.map(ingredient => `
                                <span class="extra-ingredient-badge">
                                    +${ingredient.name} ${ingredient.quantity > 1 ? `x${ingredient.quantity}` : ''} 
                                    (+€${(ingredient.price * ingredient.quantity).toFixed(2)})
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${item.customizations && item.customizations.length > 0 ? `
                        <div class="item-customizations">
                            ${item.customizations.map(c => `<span class="customization">${c}</span>`).join(', ')}
                        </div>
                    ` : ''}
                </div>
                <div class="item-qty-col">
                    <span class="item-quantity">${item.quantity || 0}</span>
                </div>
                <div class="item-price-col">
                    <span class="item-price">€${(item.price || 0).toFixed(2)}</span>
                </div>
                <div class="item-total-col">
                    <span class="item-total">€${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render order summary with totals
     */
    renderOrderSummary() {
        const subtotal = this.order.items?.reduce((sum, item) => {
            return sum + ((item.price || 0) * (item.quantity || 0));
        }, 0) || 0;

        const tax = this.order.tax || 0;
        const discount = this.order.discount || 0;
        const total = this.order.total || subtotal + tax - discount;

        return `
            <div class="summary-table">
                <div class="summary-row">
                    <span class="summary-label">Subtotal:</span>
                    <span class="summary-value">€${subtotal.toFixed(2)}</span>
                </div>
                ${tax > 0 ? `
                    <div class="summary-row">
                        <span class="summary-label">Tax:</span>
                        <span class="summary-value">€${tax.toFixed(2)}</span>
                    </div>
                ` : ''}
                ${discount > 0 ? `
                    <div class="summary-row discount-row">
                        <span class="summary-label">Discount:</span>
                        <span class="summary-value">-€${discount.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="summary-row total-row">
                    <span class="summary-label">Total:</span>
                    <span class="summary-value">€${total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Called after the modal is rendered
     */
    async afterRender() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for the modal
     */
    setupEventListeners() {
        // Handle action buttons
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const orderId = e.target.dataset.orderId;

            switch (action) {
                case 'close-modal':
                    this.close();
                    break;
                case 'edit-order':
                    this.editOrder(parseInt(orderId));
                    break;
                case 'print-order':
                    this.printReceipt(parseInt(orderId));
                    break;
            }
        });
    }

    /**
     * Close the modal
     */
    close() {
        const modalManager = this.app.getModalManager?.();
        if (modalManager) {
            modalManager.close();
        }
    }

    /**
     * Edit the order
     */
    async editOrder(orderId) {
        try {
            // Close current modal
            this.close();
            
            // Open edit modal
            const { default: OrderModal } = await import('./order-modal.js');
            const modalManager = this.app.getModalManager?.();
            
            if (modalManager) {
                if (!modalManager.modals.has('edit-order')) {
                    const orderModal = new OrderModal(this.app);
                    modalManager.register('edit-order', orderModal);
                }
                
                await modalManager.open('edit-order', { orderId, mode: 'edit' });
            }
        } catch (error) {
            console.error('Failed to open edit modal:', error);
        }
    }

    /**
     * Print receipt for the order
     */
    printReceipt(orderId) {
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        const receiptHtml = this.generateReceiptHtml();
        
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    /**
     * Generate print-friendly HTML for receipt
     */
    generateReceiptHtml() {
        const orderDate = new Date(this.order.date);
        const formattedDateTime = orderDate.toLocaleString();

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order #${this.order.id} Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-title { font-size: 24px; font-weight: bold; }
                    .order-info { margin: 20px 0; }
                    .items-table { width: 100%; border-collapse: collapse; }
                    .items-table th, .items-table td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    .items-table th { background-color: #f5f5f5; }
                    .summary { margin-top: 20px; }
                    .total-row { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <div class="receipt-title">Vectis POS</div>
                    <div>Order Receipt</div>
                </div>
                
                <div class="order-info">
                    <strong>Order #${this.order.id}</strong><br>
                    Date: ${formattedDateTime}<br>
                    Customer: ${this.order.customer || 'Walk-in Customer'}<br>
                    Status: ${this.order.status}
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.order.items?.map(item => `
                            <tr>
                                <td>
                                    ${item.name}
                                    ${item.size ? `<br><small>Size: ${item.size.name}</small>` : ''}
                                    ${item.extraIngredients && item.extraIngredients.length > 0 ? `
                                        <br><small>Extras: ${item.extraIngredients.map(ing => 
                                            `+${ing.name}${ing.quantity > 1 ? ` x${ing.quantity}` : ''}`
                                        ).join(', ')}</small>
                                    ` : ''}
                                </td>
                                <td>${item.quantity}</td>
                                <td>€${item.price?.toFixed(2)}</td>
                                <td>€${(item.itemTotal || (item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="total-row">
                        <strong>Total: €${this.order.total?.toFixed(2) || '0.00'}</strong>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Get modal configuration
     */
    getModalConfig() {
        return {
            size: 'large',
            closeOnBackdrop: true,
            closeOnEscape: true,
            showCloseButton: true,
            className: 'order-details-modal'
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.order = null;
    }
}

export default OrderDetailsModal;