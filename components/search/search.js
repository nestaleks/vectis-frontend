import BaseComponent from '../base/base-component.js';

class SearchComponent extends BaseComponent {
    constructor(data = {}, services = {}) {
        super(data, services);
        this.searchQuery = data.searchQuery || '';
        this.debounceTimeout = null;
        this.debounceDelay = 300; // ms
    }

    async afterRender() {
        await super.afterRender();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        const searchInput = this.querySelector('#vect-search-input');
        const clearButton = this.querySelector('#vect-search-clear');

        if (searchInput) {
            // Input event for real-time search
            this.addEventListener(searchInput, 'input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            // Focus and blur events for better UX
            this.addEventListener(searchInput, 'focus', () => {
                this.element.classList.add('vect-search-focused');
            });

            this.addEventListener(searchInput, 'blur', () => {
                this.element.classList.remove('vect-search-focused');
            });

            // Enter key to prevent form submission
            this.addEventListener(searchInput, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
        }

        if (clearButton) {
            this.addEventListener(clearButton, 'click', () => {
                this.clearSearch();
            });
        }
    }

    handleSearchInput(value) {
        this.searchQuery = value;
        this.updateUI();
        
        // Debounce search to avoid too many events
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.performSearch(value);
        }, this.debounceDelay);
    }

    performSearch(query) {
        // Emit search event
        this.emit('search:query-changed', { 
            query: query.trim(),
            isEmpty: !query.trim()
        });
    }

    updateUI() {
        const searchInput = this.querySelector('#vect-search-input');
        const clearButton = this.querySelector('#vect-search-clear');

        if (searchInput && searchInput.value !== this.searchQuery) {
            searchInput.value = this.searchQuery;
        }

        if (clearButton) {
            clearButton.style.display = this.searchQuery ? 'block' : 'none';
        }
    }

    clearSearch() {
        this.searchQuery = '';
        this.updateUI();
        this.performSearch('');
        
        // Focus back to input
        const searchInput = this.querySelector('#vect-search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // Public API
    setSearchQuery(query) {
        this.searchQuery = query || '';
        this.updateUI();
    }

    getSearchQuery() {
        return this.searchQuery;
    }

    focus() {
        const searchInput = this.querySelector('#vect-search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    blur() {
        const searchInput = this.querySelector('#vect-search-input');
        if (searchInput) {
            searchInput.blur();
        }
    }

    setPlaceholder(placeholder) {
        const searchInput = this.querySelector('#vect-search-input');
        if (searchInput) {
            searchInput.placeholder = placeholder;
        }
    }

    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }
}

export default SearchComponent;