/**
 * ModalManager - Singleton class for managing modal windows
 * Provides centralized modal management with accessibility features
 */
class ModalManager {
    constructor() {
        if (ModalManager.instance) {
            return ModalManager.instance;
        }

        this.modals = new Map();
        this.modalStack = [];
        this.activeModal = null;
        this.focusedElementBeforeModal = null;

        // Bind methods to preserve context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);

        ModalManager.instance = this;
    }

    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager();
        }
        return ModalManager.instance;
    }

    /**
     * Register a modal component
     */
    register(id, modalComponent) {
        this.modals.set(id, modalComponent);
    }

    /**
     * Open a modal by ID
     */
    async open(modalId, options = {}) {
        const modal = this.modals.get(modalId);
        if (!modal) {
            console.warn(`Modal with ID "${modalId}" not found`);
            return false;
        }

        try {
            // Store currently focused element
            this.focusedElementBeforeModal = document.activeElement;

            // Close previous modal if exists
            if (this.activeModal) {
                this.modalStack.push(this.activeModal);
            }

            // Create modal overlay if it doesn't exist
            let overlay = document.getElementById('modal-overlay');
            if (!overlay) {
                overlay = this.createOverlay();
            }

            // Set up modal content
            const modalContainer = overlay.querySelector('.modal-container');
            modalContainer.innerHTML = '';
            
            // Create modal content (handle async render)
            const modalContent = await this.createModalContent(modal, options);
            modalContainer.appendChild(modalContent);

            // Show overlay
            overlay.style.display = 'flex';
            document.body.classList.add('modal-open');

            // Set active modal
            this.activeModal = { id: modalId, modal, options };

            // Call afterRender if modal has this method
            if (typeof modal.afterRender === 'function') {
                await modal.afterRender();
            }

            // Add event listeners
            this.addEventListeners();

            // Focus management
            this.setInitialFocus(modalContent);

            // Trigger modal events
            this.triggerEvent('modal:opened', { modalId, options });

            return true;
        } catch (error) {
            console.error('Error opening modal:', error);
            return false;
        }
    }

    /**
     * Close the current modal
     */
    close(modalId = null) {
        if (!this.activeModal) {
            return false;
        }

        // Check if specific modal ID matches
        if (modalId && this.activeModal.id !== modalId) {
            return false;
        }

        const overlay = document.getElementById('modal-overlay');
        if (!overlay) {
            return false;
        }

        // Trigger before close event
        this.triggerEvent('modal:beforeClose', { modalId: this.activeModal.id });

        // Remove event listeners
        this.removeEventListeners();

        // Hide overlay
        overlay.style.display = 'none';
        document.body.classList.remove('modal-open');

        // Restore focus
        if (this.focusedElementBeforeModal) {
            this.focusedElementBeforeModal.focus();
            this.focusedElementBeforeModal = null;
        }

        // Store closed modal info
        const closedModalId = this.activeModal.id;

        // Check if there's a previous modal in stack
        if (this.modalStack.length > 0) {
            const previousModal = this.modalStack.pop();
            this.activeModal = previousModal;
            
            // Reopen previous modal
            setTimeout(() => {
                this.open(previousModal.id, previousModal.options);
            }, 100);
        } else {
            this.activeModal = null;
        }

        // Trigger closed event
        this.triggerEvent('modal:closed', { modalId: closedModalId });

        return true;
    }

    /**
     * Close all modals
     */
    closeAll() {
        this.modalStack = [];
        return this.close();
    }

    /**
     * Check if a modal is open
     */
    isOpen(modalId = null) {
        if (!this.activeModal) {
            return false;
        }
        return modalId ? this.activeModal.id === modalId : true;
    }

    /**
     * Get currently active modal
     */
    getActiveModal() {
        return this.activeModal;
    }

    /**
     * Create the main modal overlay
     */
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const container = document.createElement('div');
        container.className = 'modal-container';
        container.setAttribute('role', 'document');

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        return overlay;
    }

    /**
     * Create modal content element
     */
    async createModalContent(modal, options) {
        const content = document.createElement('div');
        content.className = 'modal-content';

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close-btn';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close modal');
        closeButton.addEventListener('click', () => this.close());

        content.appendChild(closeButton);

        // Add modal component content
        if (typeof modal.render === 'function') {
            const modalHtml = await modal.render(options);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = modalHtml;
            content.appendChild(wrapper);
        } else if (typeof modal === 'string') {
            content.insertAdjacentHTML('beforeend', modal);
        }

        return content;
    }

    /**
     * Add event listeners for modal functionality
     */
    addEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', this.handleBackdropClick);
        }
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown);
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.removeEventListener('click', this.handleBackdropClick);
        }
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        if (!this.activeModal) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        } else if (event.key === 'Tab') {
            this.trapFocus(event);
        }
    }

    /**
     * Handle backdrop clicks
     */
    handleBackdropClick(event) {
        if (event.target.id === 'modal-overlay') {
            this.close();
        }
    }

    /**
     * Trap focus within modal
     */
    trapFocus(event) {
        const modal = document.querySelector('.modal-content');
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }

    /**
     * Set initial focus when modal opens
     */
    setInitialFocus(modalContent) {
        const focusableElements = modalContent.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            modalContent.focus();
        }
    }

    /**
     * Trigger custom events
     */
    triggerEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Destroy the modal manager
     */
    destroy() {
        this.closeAll();
        this.removeEventListeners();
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.remove();
        }

        ModalManager.instance = null;
    }
}

export default ModalManager;