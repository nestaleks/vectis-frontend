/**
 * OrderModal - Modal component for order creation and editing
 * Wraps the order creation interface in a modal window
 */
class OrderModal {
    constructor(app) {
        this.app = app;
        this.orderCreationScreen = null;
        this.currentOrder = null;
        this.mode = 'create'; // 'create' or 'edit'
        
        // Bind methods
        this.handleModalClose = this.handleModalClose.bind(this);
        this.handleOrderComplete = this.handleOrderComplete.bind(this);
    }

    /**
     * Render the modal content
     */
    async render(options = {}) {
        this.mode = options.mode || 'create';
        this.currentOrder = options.orderId ? 
            this.app.getOrderManager ? this.app.getOrderManager().getOrderById(options.orderId) : null : null;

        // Dynamically import OrderCreationScreen
        let OrderCreationScreen;
        try {
            const module = await import('../../screens/orders/order-creation-screen.js');
            OrderCreationScreen = module.default;
        } catch (error) {
            console.warn('OrderCreationScreen not found, using VectHomeScreen');
            const module = await import('../../screens/home/vect-home-screen.js');
            OrderCreationScreen = module.default;
        }

        // Create order creation screen instance
        this.orderCreationScreen = new OrderCreationScreen(this.app, {
            mode: this.mode,
            existingOrder: this.currentOrder,
            isModal: true
        });

        const screenHtml = await this.orderCreationScreen.render();

        return `
            <div class="order-modal">
                <div class="order-modal-header">
                    <h2 class="order-modal-title">
                        ${this.mode === 'edit' ? 'Edit Order' : 'New Order'}
                        ${this.currentOrder ? ` #${this.currentOrder.id}` : ''}
                    </h2>
                    <button class="order-modal-close" data-action="close-modal" aria-label="Close">
                        ×
                    </button>
                </div>
                
                <div class="order-modal-content">
                    ${screenHtml}
                </div>
                
                <div class="order-modal-footer">
                    <div class="modal-actions">
                        <button class="modal-cancel-btn" data-action="close-modal">
                            Cancel
                        </button>
                        <button class="modal-save-btn" data-action="save-order" style="display: none;">
                            Save Order
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Called after the modal content is rendered
     */
    async afterRender() {
        // Initialize the order creation screen
        if (this.orderCreationScreen && typeof this.orderCreationScreen.afterRender === 'function') {
            await this.orderCreationScreen.afterRender();
        }

        this.setupEventListeners();
        this.setupModalIntegration();
    }

    /**
     * Setup event listeners for modal functionality
     */
    setupEventListeners() {
        // Listen for modal close events
        document.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'close-modal') {
                this.handleModalClose();
            } else if (e.target.dataset.action === 'save-order') {
                this.handleOrderSave();
            }
        });

        // Listen for order completion from the order creation screen
        document.addEventListener('order:completed', this.handleOrderComplete);
        document.addEventListener('order:cancelled', this.handleModalClose);

        // Listen for escape key
        this.handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.handleModalClose();
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Setup integration between modal and order creation screen
     */
    setupModalIntegration() {
        // Override the order creation screen's success handler
        if (this.orderCreationScreen) {
            // Store original confirmOrder method
            const originalConfirmOrder = this.orderCreationScreen.confirmOrder;
            
            // Override with modal-aware version
            this.orderCreationScreen.confirmOrder = () => {
                // Call original method
                if (originalConfirmOrder) {
                    originalConfirmOrder.call(this.orderCreationScreen);
                }

                // Close modal after successful order
                setTimeout(() => {
                    this.handleOrderComplete();
                }, 1000);
            };

            // Override showMessage to work in modal context
            const originalShowMessage = this.orderCreationScreen.showMessage;
            this.orderCreationScreen.showMessage = (text, type) => {
                if (originalShowMessage) {
                    originalShowMessage.call(this.orderCreationScreen, text, type);
                }
            };

            // Hide certain elements that don't make sense in modal context
            this.hideModalIncompatibleElements();
        }
    }

    /**
     * Hide elements that don't make sense in modal context
     */
    hideModalIncompatibleElements() {
        setTimeout(() => {
            // Hide header if it exists
            const header = document.querySelector('.vect-header');
            if (header) {
                header.style.display = 'none';
            }

            // Modify layout for modal
            const mainContent = document.querySelector('.vect-main');
            if (mainContent) {
                mainContent.style.height = 'auto';
                mainContent.style.minHeight = '0';
            }

            // Focus on product grid or first interactive element
            const firstInteractive = document.querySelector('.vect-products-grid, .vect-search-input, button');
            if (firstInteractive) {
                firstInteractive.focus();
            }
        }, 100);
    }

    /**
     * Handle modal close
     */
    handleModalClose() {
        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                return;
            }
        }

        // Clean up
        this.cleanup();

        // Close modal
        const modalManager = this.app.getModalManager ? this.app.getModalManager() : null;
        if (modalManager) {
            modalManager.close();
        } else {
            // Fallback: try to close via event
            document.dispatchEvent(new CustomEvent('modal:close'));
        }
    }

    /**
     * Handle order completion
     */
    handleOrderComplete(event = null) {
        // Clean up
        this.cleanup();

        // Emit success event
        document.dispatchEvent(new CustomEvent('order:modal:completed', {
            detail: {
                orderId: event?.detail?.orderId,
                mode: this.mode
            }
        }));

        // Close modal
        const modalManager = this.app.getModalManager ? this.app.getModalManager() : null;
        if (modalManager) {
            modalManager.close();
        }
    }

    /**
     * Handle manual order save (for edit mode)
     */
    handleOrderSave() {
        if (this.orderCreationScreen && this.orderCreationScreen.confirmOrder) {
            this.orderCreationScreen.confirmOrder();
        }
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        // In create mode, check if cart has items
        if (this.mode === 'create' && this.orderCreationScreen) {
            return this.orderCreationScreen.currentOrder && 
                   this.orderCreationScreen.currentOrder.length > 0;
        }

        // In edit mode, compare with original order
        if (this.mode === 'edit' && this.orderCreationScreen && this.currentOrder) {
            // Simple check - could be more sophisticated
            return JSON.stringify(this.orderCreationScreen.currentOrder) !== 
                   JSON.stringify(this.currentOrder.items);
        }

        return false;
    }

    /**
     * Get current modal size based on content
     */
    getModalSize() {
        // Full screen for order creation
        return 'fullscreen';
    }

    /**
     * Get modal configuration
     */
    getModalConfig() {
        return {
            size: this.getModalSize(),
            closeOnBackdrop: false, // Don't close on backdrop click - too risky
            closeOnEscape: true,
            showCloseButton: true,
            className: 'order-creation-modal'
        };
    }

    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('order:completed', this.handleOrderComplete);
        document.removeEventListener('order:cancelled', this.handleModalClose);
        
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }

        // Clean up order creation screen
        if (this.orderCreationScreen && typeof this.orderCreationScreen.destroy === 'function') {
            this.orderCreationScreen.destroy();
        }

        this.orderCreationScreen = null;
        this.currentOrder = null;
    }

    /**
     * Destroy the modal
     */
    destroy() {
        this.cleanup();
    }
}

export default OrderModal;