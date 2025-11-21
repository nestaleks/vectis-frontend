import BaseComponent from '../base/base-component.js';

class HeaderComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.userInfo = data.userInfo || 'Administrator';
        this.logoText = data.logoText || 'Vectis POS';
        this.pageTitle = data.pageTitle || '';
        this.centerContent = data.centerContent || '';
        this.buttons = data.buttons || [];
    }

    async render() {
        const template = `
            <div class="vect-header">
                <div class="vect-header-left">
                    <div class="vect-logo">${this.logoText}</div>
                    <div class="vect-user-info">
                        <span style="font-size: 0.875rem; color: var(--vect-gray-600);">${this.pageTitle}</span>
                    </div>
                </div>
                
                <div class="vect-header-center">
                    ${this.centerContent}
                </div>
                
                <div class="vect-header-right">
                    ${this.renderButtons()}
                </div>
            </div>
        `;

        this.element = this.createElementFromTemplate(template);
        await this.afterRender();
        return this.element.outerHTML;
    }

    renderButtons() {
        return this.buttons.map(button => `
            <button class="${button.className || 'vect-btn'}" 
                    data-action="${button.action}"
                    ${button.id ? `id="${button.id}"` : ''}>
                ${button.icon ? `<span class="${button.iconClass || 'btn-icon'}">${button.icon}</span>` : ''}
                <span class="${button.textClass || 'btn-text'}">${button.text}</span>
            </button>
        `).join('');
    }

    setupEventListeners() {
        // Handle all button clicks
        this.buttons.forEach(button => {
            const buttonElement = this.querySelector(`[data-action="${button.action}"]`);
            if (buttonElement) {
                this.addEventListener(buttonElement, 'click', (e) => {
                    e.preventDefault();
                    this.handleButtonClick(button.action, button);
                });
            }
        });
    }

    handleButtonClick(action, buttonConfig) {
        this.emit('header:button:click', { 
            action, 
            buttonConfig,
            timestamp: new Date().toISOString()
        });

        // Handle built-in actions
        switch (action) {
            case 'close-session':
                this.handleCloseSession();
                break;
            default:
                // Let the parent component handle custom actions
                break;
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
            userInfoElement.textContent = this.data.pageTitle || '';
        }

        // Update logo if needed
        const logoElement = this.querySelector('.vect-logo');
        if (logoElement) {
            logoElement.textContent = this.data.logoText || 'Vectis POS';
        }

        // Update center content
        const centerElement = this.querySelector('.vect-header-center');
        if (centerElement) {
            centerElement.innerHTML = this.data.centerContent || '';
        }

        // Update buttons
        const rightElement = this.querySelector('.vect-header-right');
        if (rightElement) {
            rightElement.innerHTML = this.renderButtons();
            this.setupEventListeners();
        }
    }

    updateConfig(newConfig = {}) {
        Object.assign(this.data, newConfig);
        this.pageTitle = newConfig.pageTitle || this.pageTitle;
        this.centerContent = newConfig.centerContent || this.centerContent;
        this.buttons = newConfig.buttons || this.buttons;
        this.refresh();
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

    updatePageTitle(pageTitle) {
        this.updateConfig({ pageTitle });
    }

    updateCenterContent(centerContent) {
        this.updateConfig({ centerContent });
    }

    updateButtons(buttons) {
        this.updateConfig({ buttons });
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