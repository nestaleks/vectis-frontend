import BaseComponent from '../base/base-component.js';

class ProductsGridComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.products = data.products || [];
        this.filteredProducts = [];
        this.selectedCategory = data.selectedCategory || 'all';
        this.searchQuery = data.searchQuery || '';
        this.categoryTitle = data.categoryTitle || 'Fresh Fruits';
    }

    async afterRender() {
        await super.afterRender();
        this.setupEventListeners();
        this.updateProducts();
    }

    setupEventListeners() {
        // Product selection
        this.addEventListener(this.element, 'click', (e) => {
            if (e.target.closest('.vect-product-card')) {
                const card = e.target.closest('.vect-product-card');
                this.handleProductSelection({
                    id: parseInt(card.dataset.productId),
                    name: card.dataset.productName,
                    price: parseFloat(card.dataset.productPrice)
                });
            }
        });

        // Listen for category changes
        this.on('categories:changed', (data) => {
            this.selectedCategory = data.categoryId;
            this.categoryTitle = this.getCategoryTitle(data.categoryId);
            this.updateProducts();
        });

        // Listen for search changes
        this.on('search:query-changed', (data) => {
            this.searchQuery = data.query;
            this.updateProducts();
        });
    }

    handleProductSelection(product) {
        // Add visual feedback
        const card = this.querySelector(`[data-product-id="${product.id}"]`);
        if (card) {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        }
        
        // Emit product selection event
        this.emit('products:selected', { product });
    }

    filterProducts() {
        let filtered = this.products;

        // Filter by category
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === this.selectedCategory);
        }

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    updateProducts() {
        this.filteredProducts = this.filterProducts();
        this.renderProducts();
        this.updateStats();
        this.updateCategoryTitle();
    }

    renderProducts() {
        const productsGrid = this.querySelector('#vect-products-grid');
        if (!productsGrid) return;

        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = this.renderEmptyState();
            return;
        }

        productsGrid.innerHTML = this.filteredProducts.map(product => this.renderProductCard(product)).join('');
    }

    renderProductCard(product) {
        return `
            <div class="vect-product-card" 
                 data-product-id="${product.id}"
                 data-product-name="${product.name}"
                 data-product-price="${product.price}">
                <div class="vect-product-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" />` : 
                        `<div class="vect-product-placeholder"></div>`
                    }
                    ${product.badge ? `<div class="vect-product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="vect-product-info">
                    <div class="vect-product-name">${product.name}</div>
                    <div class="vect-product-price">€${product.price.toFixed(2)}</div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="vect-empty-state" style="grid-column: 1 / -1;">
                <div class="vect-empty-icon">📦</div>
                <div class="vect-empty-title">No products found</div>
                <div class="vect-empty-description">
                    ${this.searchQuery ? 
                        'Try adjusting your search or category filter' : 
                        'No products available in this category'}
                </div>
            </div>
        `;
    }

    updateStats() {
        const productsStats = this.querySelector('#vect-products-stats');
        if (productsStats) {
            const count = this.filteredProducts.length;
            productsStats.textContent = `${count} product${count !== 1 ? 's' : ''} found`;
        }
    }

    updateCategoryTitle() {
        const categoryTitleEl = this.querySelector('#vect-category-title');
        if (categoryTitleEl) {
            categoryTitleEl.textContent = this.categoryTitle;
        }
    }

    getCategoryTitle(categoryId) {
        const categoryTitles = {
            'all': 'All Products',
            'fruits': 'Fresh Fruits', 
            'beverages': 'Beverages',
            'snacks': 'Snacks',
            'dairy': 'Dairy Products',
            'bakery': 'Bakery'
        };
        return categoryTitles[categoryId] || 'Products';
    }

    // Public API
    setProducts(products) {
        this.products = products || [];
        this.updateProducts();
    }

    getProducts() {
        return this.products;
    }

    getFilteredProducts() {
        return this.filteredProducts;
    }

    setSelectedCategory(categoryId) {
        this.selectedCategory = categoryId;
        this.categoryTitle = this.getCategoryTitle(categoryId);
        this.updateProducts();
    }

    setSearchQuery(query) {
        this.searchQuery = query || '';
        this.updateProducts();
    }

    addProduct(product) {
        if (product && !this.products.find(p => p.id === product.id)) {
            this.products.push(product);
            this.updateProducts();
        }
    }

    removeProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.updateProducts();
    }

    updateProduct(productId, updates) {
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            this.products[productIndex] = { ...this.products[productIndex], ...updates };
            this.updateProducts();
        }
    }

    refresh() {
        this.updateProducts();
    }
}

export default ProductsGridComponent;