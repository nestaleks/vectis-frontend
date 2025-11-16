class ComponentLoader {
    constructor() {
        this.templateCache = new Map();
        this.componentCache = new Map();
    }

    async loadTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }

        try {
            const response = await fetch(`./components/templates/${templateName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${templateName}`);
            }
            
            const templateHtml = await response.text();
            this.templateCache.set(templateName, templateHtml);
            return templateHtml;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            throw error;
        }
    }

    async loadComponentClass(componentName) {
        const cacheKey = componentName;
        if (this.componentCache.has(cacheKey)) {
            return this.componentCache.get(cacheKey);
        }

        try {
            const module = await import(`../${componentName}/${componentName}.js`);
            const ComponentClass = module.default;
            this.componentCache.set(cacheKey, ComponentClass);
            return ComponentClass;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            throw error;
        }
    }

    async createComponent(componentName, data = {}, services = {}) {
        try {
            const [templateHtml, ComponentClass] = await Promise.all([
                this.loadTemplate(componentName),
                this.loadComponentClass(componentName)
            ]);

            const component = new ComponentClass(data, services);
            const element = await component.render(templateHtml);
            
            return { component, element };
        } catch (error) {
            console.error(`Error creating component ${componentName}:`, error);
            throw error;
        }
    }

    clearCache() {
        this.templateCache.clear();
        this.componentCache.clear();
    }

    clearTemplateCache() {
        this.templateCache.clear();
    }

    clearComponentCache() {
        this.componentCache.clear();
    }

    getCacheStats() {
        return {
            templates: this.templateCache.size,
            components: this.componentCache.size
        };
    }
}

// Export as singleton
export default new ComponentLoader();