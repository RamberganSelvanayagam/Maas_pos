# User Stories - SwiftStock

This document defines the core user requirements for the SwiftStock system from the perspective of different roles.

## 👤 Store Owner (Admin & Inventory)

### 1. Product Intake & Scanning
**As a** Store Owner,
**I want to** scan a product's barcode using my mobile camera,
**so that** I can quickly check if it's already in the system or add it as a new item without manual typing.

**Acceptance Criteria:**
- The camera scanner opens quickly and reliably.
- If the barcode is found, it automatically pulls up the current name, price, and supplier.
- If the barcode is new, it opens a blank "Add Product" form.

### 2. Pricing & Margin Management
**As a** Store Owner,
**I want to** enter the cost price and the selling price for each batch I purchase,
**so that** I can ensure my profit margins are healthy.

**Acceptance Criteria:**
- Forms include clear fields for Purchase Price and Selling Price.
- Changes to price are reflected immediately in the POS module.

### 3. Expiry Date Management
**As a** Store Owner,
**I want to** add an expiry date to products during intake or skip it for non-perishable items,
**so that** I can track aging stock and offer promotional discounts in the future.

**Acceptance Criteria:**
- Expiry date field is visible by default.
- "No Expiry Date" checkbox allows skipping the field.
- Admin dashboard highlights items nearing expiry (within 7 days).

### 4. Inventory Tracking
**As a** Store Owner,
**I want to** see real-time stock levels and receive alerts for low stock,
**so that** I can restock before items run out.

**Acceptance Criteria:**
- Dashboard shows a "Low Stock" badge for items with quantity < 5.
- Stock is automatically deducted when a sale happens in the POS.

### 5. Sales Reporting
**As a** Store Owner,
**I want to** view a history of all sales and total revenue for the day,
**so that** I can track the performance of my business.

**Acceptance Criteria:**
- Admin dashboard shows a "Today's Revenue" metric.
- A "Sales History" page lists every transaction with items and timestamps.

---

## 🛒 Cashier (Point of Sale)

### 6. Rapid Checkout
**As a** Cashier,
**I want to** scan items quickly during a customer checkout,
**so that** the checkout process is fast and prevents queues.

**Acceptance Criteria:**
- Scanning an item adds it to the cart immediately.
- Multiple scans of the same item increment the quantity in the cart.

### 7. Cart Management
**As a** Cashier,
**I want to** manually adjust item quantities or remove items from the cart,
**so that** I can handle customer requests or errors during checkout.

**Acceptance Criteria:**
- Clear "plus" and "minus" buttons for each item in the cart.
- Total calculation updates instantly as quantities change.

### 8. Payment Handling
**As a** Cashier,
**I want to** select whether a customer is paying by Cash or Card,
**so that** the sales reports accurately reflect our cash flow.

**Acceptance Criteria:**
- Secure toggle between "Cash" and "Card".
- The final transaction is recorded with the chosen payment method.
