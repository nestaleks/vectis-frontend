# Project Refactoring Plan: Orders List Main Screen

**Date:** 2025-11-17  
**Objective:** Restructure the application to show an orders list as the main screen with a "New Order" button that opens a modal for order creation

## Problem Analysis

Currently, the application starts directly with a POS interface for creating orders. We need to change this to:
- Main screen: List of all orders (both pending and completed)
- Top button: "New Order" that opens a modal window
- Modal content: Current POS interface (product selection, cart, pizza customization)

## Research Insights

### POS System Architecture Patterns
- **Modular Architecture**: Separation of UI, business logic, and data layers
- **Dashboard Design**: Quick overview of key information with customizable stats
- **Context-Aware Design**: Optimized for high-pressure retail environments
- **Performance**: Fast checkout processes and single-touch operations

### Modal Window Architecture
- **Singleton Pattern**: ModalManager class to ensure only one instance manages all modals
- **Object-Oriented Approach**: Separate classes for different modal types
- **Event-Driven Architecture**: Lifecycle events for modal management
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation support

### State Management Patterns
- **Store Pattern**: Centralized state management with single Store class
- **Order Index Pattern**: Using order properties with count values for sorting
- **Timestamp Pattern**: Natural ordering using timestamps
- **Array-Based Storage**: Storing sorted arrays in localStorage

## Technical Architecture

### New File Structure
```
screens/
├── orders/
│   ├── orders-list-screen.js (NEW - main screen)
│   └── order-creation-screen.js (RENAMED from vect-home-screen.js)
components/
├── modals/
│   ├── modal-manager.js (NEW)
│   └── order-modal.js (NEW)
managers/
└── order-manager.js (NEW)
```

### Component Responsibilities

#### 1. OrdersListScreen (NEW)
- **Purpose**: Main application screen showing all orders
- **Features**:
  - Display orders in a table/card layout
  - Show order status, date, total amount, items
  - "New Order" button at the top
  - Search and filter functionality
  - Order status management (pending, completed, cancelled)
- **Data Source**: localStorage 'vect_confirmed_orders'

#### 2. OrderModal (NEW)
- **Purpose**: Modal container for order creation
- **Features**:
  - Full-screen or large modal overlay
  - Contains the entire order creation interface
  - Handles modal open/close events
  - Manages escape key and backdrop click
- **Content**: OrderCreationScreen component

#### 3. OrderCreationScreen (RENAMED)
- **Purpose**: Order creation interface (current VectHomeScreen functionality)
- **Changes**: 
  - Remove main layout wrapper
  - Focus on order creation components only
  - Emit events instead of direct DOM manipulation
- **Components**: Products grid, cart, pizza customization, payment

#### 4. ModalManager (NEW)
- **Purpose**: Global modal management system
- **Features**:
  - Singleton pattern implementation
  - Modal stack management
  - Accessibility features (focus trapping, aria attributes)
  - Animation and transition handling
- **API**: open(), close(), closeAll(), isOpen()

#### 5. OrderManager (NEW)
- **Purpose**: Centralized order state management
- **Features**:
  - CRUD operations for orders
  - localStorage persistence with proper ordering
  - Event emission for UI updates
  - Order status lifecycle management
- **Methods**: createOrder(), updateOrder(), deleteOrder(), getOrders()

### Data Flow

1. **App Start**: Load OrdersListScreen as main screen
2. **Order List**: OrderManager fetches orders from localStorage
3. **New Order**: Click button → ModalManager opens OrderModal
4. **Order Creation**: OrderCreationScreen handles product selection and cart
5. **Order Complete**: Save to OrderManager → Close modal → Refresh list
6. **Order Management**: Update status, view details, delete orders

### UI/UX Design

#### Orders List Screen Layout
```
┌─────────────────────────────────────────┐
│ Header: Vectis POS | [New Order Button] │
├─────────────────────────────────────────┤
│ Search/Filters: [🔍 Search] [Filter ▼]  │
├─────────────────────────────────────────┤
│ Orders Table/Grid:                      │
│ ┌─────────────────────────────────────┐ │
│ │ Order #001 | 2025-11-17 | €25.50   │ │
│ │ Status: Completed | 3 items         │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Order #002 | 2025-11-17 | €18.20   │ │
│ │ Status: Pending | 2 items           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Order Modal Layout
```
┌───────────────────────────────────────────────┐
│ ╔═════════════════════════════════════════════╗ │
│ ║ [X] New Order                               ║ │
│ ║ ┌─────────────┬─────────────────────────────┐║ │
│ ║ │   CART      │     PRODUCTS GRID           │║ │
│ ║ │             │                             │║ │
│ ║ │   [Items]   │  [Pizza] [Drinks] [Salads] │║ │
│ ║ │             │                             │║ │
│ ║ │  [Total]    │     [Product Cards]         │║ │
│ ║ │ [Confirm]   │                             │║ │
│ ║ └─────────────┴─────────────────────────────┘║ │
│ ╚═════════════════════════════════════════════╝ │
└───────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create ModalManager class
2. Create OrderManager class  
3. Update app-manager.js to use new architecture
4. Create basic OrdersListScreen

### Phase 2: Modal System
1. Create OrderModal component
2. Rename and refactor VectHomeScreen to OrderCreationScreen
3. Integrate modal with existing order creation logic
4. Test modal functionality

### Phase 3: Orders List Interface
1. Design orders list UI components
2. Implement search and filter functionality
3. Add order status management
4. Create order detail view

### Phase 4: Integration & Polish
1. Connect all components through event system
2. Update CSS for modal and list layouts
3. Add animations and transitions
4. Test end-to-end workflow

### Phase 5: Testing & Deployment
1. Test all user scenarios
2. Fix bugs and edge cases
3. Update documentation
4. Deploy to production

## Success Criteria

- ✅ Application starts with orders list screen
- ✅ "New Order" button opens modal with order creation interface
- ✅ All existing order creation functionality preserved
- ✅ Orders are properly saved and displayed in list
- ✅ Modal can be closed and reopened without issues
- ✅ Responsive design works on all screen sizes
- ✅ No breaking changes to existing data structure
- ✅ Performance remains optimal

## Risk Mitigation

### Potential Risks
1. **Data Loss**: Changing localStorage structure might lose existing orders
2. **Performance**: Modal rendering might be slow with large orders
3. **UX Disruption**: Users familiar with current interface might be confused
4. **Mobile Compatibility**: Modal might not work well on small screens

### Mitigation Strategies
1. **Data Migration**: Create migration script for existing localStorage data
2. **Performance Optimization**: Lazy load modal content, use efficient rendering
3. **User Training**: Provide clear visual cues and familiar design patterns  
4. **Responsive Design**: Design mobile-first modal interface

## Timeline Estimate

- **Phase 1-2**: 2-3 hours (Core infrastructure + Modal system)
- **Phase 3**: 1-2 hours (Orders list interface)  
- **Phase 4**: 1 hour (Integration & polish)
- **Phase 5**: 30 minutes (Testing & deployment)

**Total Estimated Time**: 4.5-6.5 hours

## Next Steps

1. Create TodoWrite task list with specific implementation steps
2. Begin with Phase 1: Core Infrastructure
3. Test each phase thoroughly before proceeding
4. Commit changes incrementally for easy rollback if needed