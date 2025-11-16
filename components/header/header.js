import BaseComponent from '../base/base-component.js';

class HeaderComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.userInfo = data.userInfo || 'Administrator';
        this.logoText = data.logoText || 'Odoo';
    }

    setupEventListeners() {
        // Handle close session button
        const closeButton = this.querySelector('[data-action="close-session"]');
        if (closeButton) {
            this.addEventListener(closeButton, 'click', this.handleCloseSession);
        }
    }

    handleCloseSession() {
        this.emit('system:session:close', {
            timestamp: new Date().toISOString(),
            userInfo: this.userInfo
        });
        
        // Show confirmation message
        this.showMessage('Session closed', 'info');
    }

    refresh() {
        // Update user info if needed
        const userInfoElement = this.querySelector('.vect-user-info span');
        if (userInfoElement) {
            userInfoElement.textContent = this.data.userInfo || 'Administrator';
        }

        // Update logo if needed
        const logoElement = this.querySelector('.vect-logo');
        if (logoElement) {
            logoElement.textContent = this.data.logoText || 'Odoo';
        }
    }

    showMessage(text, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: vectSlideIn 0.3s ease-out;
            box-shadow: var(--vect-shadow-lg);
            max-width: 300px;
        `;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.background = 'var(--vect-success)';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.background = 'var(--vect-warning)';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.background = 'var(--vect-error)';
                notification.style.color = 'white';
                break;
            default:
                notification.style.background = 'var(--vect-primary)';
                notification.style.color = 'white';
        }
        
        notification.textContent = text;
        document.body.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'vectSlideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Public API
    updateUserInfo(userInfo) {
        this.update({ userInfo });
    }

    updateLogo(logoText) {
        this.update({ logoText });
    }

    getComponentInfo() {
        return {
            name: 'HeaderComponent',
            version: '1.0.0',
            userInfo: this.userInfo,
            logoText: this.logoText
        };
    }
}

export default HeaderComponent;