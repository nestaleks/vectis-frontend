# Vectis Frontend

> Modern Point of Sale System with clean design and intuitive interface

Vectis is a standalone frontend implementation of a modern POS (Point of Sale) system featuring a minimalist design, responsive layout, and comprehensive product management capabilities.

## ✨ Features

- **🎨 Modern Design**: Clean, minimalist interface inspired by modern vector-based UI principles
- **📱 Responsive Layout**: Works seamlessly across desktop, tablet, and mobile devices
- **🔄 Flexbox Layout**: Stable CSS layout using Flexbox instead of CSS Grid
- **🛒 Product Management**: Complete catalog with 35+ products across 5 categories
- **🔢 Smart Numpad**: 5-column numpad with integrated Customer and Payment functions
- **📊 Category Filtering**: Easy filtering by Fruits, Drinks, Snacks, Dairy, and Bakery
- **🖼️ Product Images**: High-quality product images from Unsplash
- **💾 Local Storage**: Persistent cart and settings storage
- **⚡ Fast Performance**: Lightweight and optimized for speed

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)
- Node.js 16+ (for development tools, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nestaleks/vectis-frontend.git
   cd vectis-frontend
   ```

2. **Start the development server**
   ```bash
   # Using Python (recommended)
   python -m http.server 3000
   
   # Or using Node.js
   npm install
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
vectis-frontend/
├── core/                     # Core application logic
│   ├── app-manager.js       # Main application manager
│   └── storage-manager.js   # Local storage management
├── screens/                 # Screen components
│   └── home/
│       └── vect-home-screen.js  # Main POS interface
├── styles/                  # CSS styles
│   └── main.css            # Complete application styles
├── index.html              # Main HTML file
├── package.json            # Project configuration
└── README.md              # This file
```

## 🎯 Usage

### Basic Operations

1. **Browse Products**: View products by category using the horizontal filter buttons
2. **Add to Cart**: Click on any product to add it to your cart
3. **Manage Quantities**: Use the +/- buttons in the cart to adjust quantities
4. **Process Payment**: Click the large "Payment" button in the numpad
5. **Use Numpad**: Enter numbers, adjust prices, apply discounts

### Categories

- **🍎 Fruits**: Fresh fruits including apples, oranges, berries, and more
- **🥤 Drinks**: Beverages like juices, coffee, tea, and soft drinks
- **🍪 Snacks**: Chips, nuts, granola bars, and cookies
- **🥛 Dairy**: Milk, yogurt, cheese, butter, and cream
- **🍞 Bakery**: Fresh bread, croissants, bagels, muffins, and donuts

### Keyboard Shortcuts

- **Search**: Use the search bar to quickly find products
- **Numpad**: Click numbers for price entry and calculations
- **Categories**: Filter products by clicking category buttons

## 🎨 Design Principles

### Color Palette
- **Primary**: `#20B2AA` (Light Sea Green)
- **Background**: `#ffffff` (White)
- **Gray Scale**: `#fafafa` to `#171717`
- **Accent Colors**: Success, Warning, Error variants

### Typography
- **Font Family**: Inter, Segoe UI, system fonts
- **Sizes**: 0.75rem to 1.875rem scale
- **Weights**: 500 (medium) to 700 (bold)

### Layout
- **Flexbox-based**: Stable, responsive layout
- **Sidebar**: 380px width for cart and numpad
- **Grid**: Auto-fill product grid with 180px minimum
- **Spacing**: Consistent 8px grid system

## 🔧 Development

### Development Server
```bash
# Start development server
npm run dev

# Or using Python
python -m http.server 3000
```

### Testing (Optional)
```bash
# Install Playwright for testing
npm install
npx playwright install

# Run tests
npm test
```

### Code Style
```bash
# Format code
npm run format

# Lint code
npm run lint
```

## 📱 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Design Inspiration**: Modern vector-based UI principles
- **Images**: High-quality product photos from [Unsplash](https://unsplash.com)
- **Icons**: Emoji-based icons for cross-platform compatibility
- **Typography**: System font stack for optimal performance

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/nestaleks/vectis-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nestaleks/vectis-frontend/discussions)

---

**Vectis Frontend** - Modern POS System for the modern world 🚀
