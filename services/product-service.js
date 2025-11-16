import eventBus from './event-bus.js';

class ProductService {
    constructor() {
        this.products = [];
        this.categories = [
            { id: 'all', name: 'All', icon: '📦' },
            { id: 'fruits', name: 'Fruits', icon: '🍎' },
            { id: 'beverages', name: 'Drinks', icon: '🥤' },
            { id: 'snacks', name: 'Snacks', icon: '🍪' },
            { id: 'dairy', name: 'Dairy', icon: '🥛' },
            { id: 'bakery', name: 'Bakery', icon: '🍞' }
        ];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoaded = false;
    }

    async loadProducts() {
        try {
            // Clear old products from storage to prevent category conflicts
            localStorage.removeItem('pos_products');
            
            this.products = [
                // Fruits
                { id: 1, name: 'Black Grapes', price: 4.90, category: 'fruits', image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&q=80' },
                { id: 2, name: 'Bon Oranges', price: 1.98, category: 'fruits', image: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=300&q=80' },
                { id: 3, name: 'Conference Pears', price: 2.70, category: 'fruits', image: 'https://images.unsplash.com/photo-1518685101044-dea3c4e48eaf?w=300&q=80' },
                { id: 4, name: 'Golden Apples Peeled', price: 3.97, category: 'fruits', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80' },
                { id: 5, name: 'Granny Smith Apples', price: 2.99, category: 'fruits', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&q=80' },
                { id: 6, name: 'Jonagold Apples', price: 2.10, category: 'fruits', image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300&q=80' },
                { id: 7, name: 'Lemon', price: 1.49, category: 'fruits', image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=300&q=80' },
                { id: 8, name: 'Orange Butterfly', price: 7.43, category: 'fruits', image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=300&q=80' },
                { id: 9, name: 'Peach', price: 2.70, category: 'fruits', image: 'https://images.unsplash.com/photo-1629828874514-d68a47acbf8e?w=300&q=80' },
                { id: 10, name: 'Peaches', price: 5.40, category: 'fruits', image: 'https://images.unsplash.com/photo-1558254651-6bd361c44c11?w=300&q=80' },
                { id: 11, name: 'Red Grapefruit', price: 1.98, category: 'fruits', image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&q=80' },
                { id: 12, name: 'Bananas', price: 3.19, category: 'fruits', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300&q=80' },
                { id: 13, name: 'Strawberries', price: 4.50, category: 'fruits', image: 'https://images.unsplash.com/photo-1543528176-61b239494933?w=300&q=80' },
                { id: 14, name: 'Kiwi', price: 2.20, category: 'fruits', image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=300&q=80' },
                
                // Beverages
                { id: 15, name: 'Fresh Orange Juice', price: 3.50, category: 'beverages', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=80' },
                { id: 16, name: 'Sparkling Water', price: 1.20, category: 'beverages', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&q=80' },
                { id: 17, name: 'Coffee', price: 2.80, category: 'beverages', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80' },
                { id: 18, name: 'Green Tea', price: 2.50, category: 'beverages', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
                { id: 19, name: 'Cola', price: 1.80, category: 'beverages', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&q=80' },
                { id: 20, name: 'Energy Drink', price: 3.20, category: 'beverages', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
                
                // Snacks
                { id: 21, name: 'Chocolate Chips', price: 2.99, category: 'snacks', image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&q=80' },
                { id: 22, name: 'Nuts Mix', price: 4.50, category: 'snacks', image: 'https://images.unsplash.com/photo-1508747235053-6ecbcf805994?w=300&q=80' },
                { id: 23, name: 'Potato Chips', price: 1.99, category: 'snacks', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80' },
                { id: 24, name: 'Granola Bar', price: 2.20, category: 'snacks', image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300&q=80' },
                { id: 25, name: 'Cookies', price: 3.10, category: 'snacks', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80' },
                
                // Dairy
                { id: 26, name: 'Fresh Milk', price: 1.85, category: 'dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80' },
                { id: 27, name: 'Greek Yogurt', price: 3.20, category: 'dairy', image: 'https://images.unsplash.com/photo-1571212515416-fcc4de3a21a8?w=300&q=80' },
                { id: 28, name: 'Cheese', price: 4.50, category: 'dairy', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80' },
                { id: 29, name: 'Butter', price: 2.80, category: 'dairy', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80' },
                { id: 30, name: 'Cream', price: 2.40, category: 'dairy', image: 'https://images.unsplash.com/photo-1563379091339-03246963d29a?w=300&q=80' },
                
                // Bakery
                { id: 31, name: 'Fresh Bread', price: 2.40, category: 'bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80' },
                { id: 32, name: 'Croissant', price: 1.75, category: 'bakery', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
                { id: 33, name: 'Bagel', price: 1.50, category: 'bakery', image: 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=300&q=80' },
                { id: 34, name: 'Muffin', price: 2.20, category: 'bakery', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' },
                { id: 35, name: 'Donut', price: 1.90, category: 'bakery', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80' }
            ];

            this.isLoaded = true;
            eventBus.emit(eventBus.constructor.EVENTS.PRODUCTS_LOADED, { 
                products: this.products,
                categories: this.categories 
            });

            return this.products;
        } catch (error) {
            console.error('Failed to load products:', error);
            this.products = [];
            this.isLoaded = false;
            eventBus.emit(eventBus.constructor.EVENTS.ERROR_OCCURRED, { 
                error: 'Failed to load products',
                details: error 
            });
            return [];
        }
    }

    getAllProducts() {
        return this.products;
    }

    getCategories() {
        return this.categories;
    }

    filterProducts(category = this.currentCategory, searchQuery = this.searchQuery) {
        let filtered = [...this.products];

        // Filter by category
        if (category && category !== 'all') {
            filtered = filtered.filter(product => product.category === category);
        }

        // Filter by search query
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query)
            );
        }

        eventBus.emit(eventBus.constructor.EVENTS.PRODUCTS_FILTERED, {
            products: filtered,
            category,
            searchQuery,
            totalCount: filtered.length
        });

        return filtered;
    }

    setCategory(category) {
        this.currentCategory = category;
        return this.filterProducts(category, this.searchQuery);
    }

    setSearchQuery(query) {
        this.searchQuery = query;
        return this.filterProducts(this.currentCategory, query);
    }

    getProductById(id) {
        return this.products.find(product => product.id === id);
    }

    getCategoryById(categoryId) {
        return this.categories.find(cat => cat.id === categoryId);
    }

    getCategoryName(categoryId) {
        const categoryNames = {
            'all': 'All Products',
            'fruits': 'Fresh Fruits',
            'beverages': 'Beverages',
            'snacks': 'Snacks',
            'dairy': 'Dairy Products',
            'bakery': 'Bakery'
        };
        return categoryNames[categoryId] || 'Products';
    }

    getProductStats() {
        return {
            total: this.products.length,
            byCategory: this.categories.reduce((acc, category) => {
                if (category.id === 'all') return acc;
                acc[category.id] = this.products.filter(p => p.category === category.id).length;
                return acc;
            }, {}),
            filtered: this.filterProducts().length
        };
    }

    isProductAvailable(productId) {
        return !!this.getProductById(productId);
    }

    reset() {
        this.currentCategory = 'all';
        this.searchQuery = '';
    }
}

// Export as singleton
export default new ProductService();