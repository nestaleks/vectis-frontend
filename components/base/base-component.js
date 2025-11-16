class BaseComponent {
    constructor(data = {}, services = {}) {
        this.data = data;
        this.services = services;
        this.element = null;
        this.eventListeners = [];
    }

    createElementFromTemplate(templateHtml) {
        const div = document.createElement('div');
        div.innerHTML = templateHtml.trim();
        return div.firstElementChild;
    }

    async render(templateHtml) {
        this.element = this.createElementFromTemplate(templateHtml);
        await this.afterRender();
        return this.element;
    }

    async afterRender() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Override in subclasses
    }

    addEventListener(element, event, handler, options = {}) {
        const boundHandler = handler.bind(this);
        element.addEventListener(event, boundHandler, options);
        this.eventListeners.push({ element, event, handler: boundHandler, options });
        return boundHandler;
    }

    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
    }

    update(newData) {
        Object.assign(this.data, newData);
        this.refresh();
    }

    refresh() {
        // Override in subclasses to handle data updates
    }

    destroy() {
        this.removeEventListeners();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    emit(eventName, data = {}) {
        if (this.services.eventBus) {
            this.services.eventBus.emit(eventName, data);
        }
    }

    on(eventName, handler) {
        if (this.services.eventBus) {
            this.services.eventBus.on(eventName, handler.bind(this));
        }
    }

    off(eventName, handler) {
        if (this.services.eventBus) {
            this.services.eventBus.off(eventName, handler);
        }
    }

    querySelector(selector) {
        return this.element ? this.element.querySelector(selector) : null;
    }

    querySelectorAll(selector) {
        return this.element ? this.element.querySelectorAll(selector) : [];
    }
}

export default BaseComponent;