import BaseComponent from '../base/base-component.js';

class CategoriesComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.selectedCategory = data.selectedCategory || 'all';
        this.categories = data.categories || [
            { id: 'all', name: 'All', icon: '📦' },
            { id: 'fruits', name: 'Fruits', icon: '🍎' },
            { id: 'beverages', name: 'Drinks', icon: '🥤' },
            { id: 'snacks', name: 'Snacks', icon: '🍪' },
            { id: 'dairy', name: 'Dairy', icon: '🥛' },
            { id: 'bakery', name: 'Bakery', icon: '🍞' }
        ];
    }

    async afterRender() {
        await super.afterRender();
        this.setupEventListeners();
        this.updateActiveCategory();
    }

    setupEventListeners() {
        // Category switching
        this.addEventListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('vect-category-item')) {
                this.handleCategorySwitch(e.target.dataset.category);
            }
        });
    }

    handleCategorySwitch(categoryId) {
        if (categoryId === this.selectedCategory) return;
        
        this.selectedCategory = categoryId;
        this.updateActiveCategory();
        
        // Emit category change event
        this.emit('categories:changed', { 
            categoryId,
            categoryName: this.getCategoryName(categoryId)
        });
    }

    updateActiveCategory() {
        this.querySelectorAll('.vect-category-item').forEach(item => {
            item.classList.toggle('active', item.dataset.category === this.selectedCategory);
        });
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Products';
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
    setSelectedCategory(categoryId) {
        this.selectedCategory = categoryId;
        this.updateActiveCategory();
    }

    getSelectedCategory() {
        return this.selectedCategory;
    }

    getCategories() {
        return this.categories;
    }

    setCategories(categories) {
        this.categories = categories;
        this.renderCategories();
    }

    renderCategories() {
        const categoriesContainer = this.querySelector('#vect-categories');
        if (!categoriesContainer) return;

        categoriesContainer.innerHTML = this.categories.map(category => `
            <div class="vect-category-item ${category.id === this.selectedCategory ? 'active' : ''}" 
                 data-category="${category.id}">
                ${category.icon} ${category.name}
            </div>
        `).join('');
    }
}

export default CategoriesComponent;