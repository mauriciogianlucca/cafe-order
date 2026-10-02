# Campus Café — Order Page

A browser based café ordering app for Week 6 of Principles and Concepts of Software Engineering at Bay Atlantic University.

**Live app:** https://astounding-pavlova-a68b85.netlify.app/  
**Unit tests:** https://astounding-pavlova-a68b85.netlify.app/tests.html

## Run the app and tests

Open `index.html` in a browser, or use the live app link above. Open `tests.html` to run the 14 unit checks. No install or build step is needed.

## Features

- Menu with nine priced items and stock status.
- Cart with add, remove, and quantity controls; totals update when the cart changes.
- None, Student (10%), Staff (15%), and Happy Hour (second drink free) discounts.
- Checkout shows an order number and receipt, or a clear validation error.

## Design patterns and SOLID

**Strategy — `discounts.js`:** each discount is a separate object implementing `apply(lines, subtotalCents)`. The order code uses the shared strategy contract, so a rule can be added without changing checkout.

**Observer — `cart.js`:** cart mutations notify subscribers. `ui.js` subscribes the cart and totals renderers so both update from cart changes.

**Single Responsibility:** `menu.js` contains menu data, `cart.js` manages cart state, `discounts.js` holds pricing rules, `order.js` validates and prices orders, and `ui.js` handles the DOM.

**Open/Closed:** adding a discount strategy does not require modifying the existing checkout logic.

## `placeOrder` contract

`placeOrder(cart, discountStrategy)` takes a `Cart` and a discount strategy. On success it returns `{ ok: true, order }` with an ID, timestamp, item lines, subtotal, discount, and total. On failure it returns `{ ok: false, code, message, details }` and never changes the cart.

| Error code | Meaning |
|---|---|
| `EMPTY_CART` | There are no items to order. |
| `INVALID_QUANTITY` | A quantity is not a whole number from 1 through 10. |
| `OUT_OF_STOCK` | An item is unavailable. |

The page handles each error; invalid quantities are highlighted.

## Project files

`index.html` and `tests.html` are the app and test runner. `styles.css` contains styling. `menu.js`, `discounts.js`, `cart.js`, `order.js`, and `ui.js` contain the application logic. `tests.js` contains the unit checks. All files are at the repository root.

## Team contributions

| Member | Contribution |
|---|---|
| Lucca Cabrera | `discounts.js` (Strategy), `order.js` (contract and validation), contract documentation |
| Palash Pratim Dev Nath | `cart.js` (Observer), `tests.js` (14 unit tests) |
| Add teammate name | `index.html`, `styles.css`, menu data |
| Add teammate name | `ui.js`, README, Netlify setup |

Fill in the teammate names and verify contributions before submission. Each team member should have commits in the repository history.

## Notes

The menu is hard-coded and orders are not persisted. Order IDs use a random suffix and are not guaranteed unique.
