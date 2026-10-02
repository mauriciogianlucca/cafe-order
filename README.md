# Campus Café — Order Page

A one-page ordering app for the campus café. Browse the menu, build a cart,
choose a discount, and place an order. Built for Week 1 of Principles and
Concepts of Software Engineering, Bay Atlantic University.

**Live page:** https://YOUR-USERNAME.github.io/campus-cafe/
**Tests:** https://YOUR-USERNAME.github.io/campus-cafe/tests.html

---

## How to run the app

Nothing to install. Either:

- Open the live link above, or
- Download the repository and open `index.html` in any browser.

## How to run the tests

Open `tests.html` in a browser (or the live tests link above). Results render
on the page and are printed to the browser console. All 14 tests should pass.

There is no test framework and no build step, which is deliberate: the logic
files never touch the DOM, so they can be exercised by a plain script.

---

## What the app does

- Menu of 9 items with name, price, category and stock status.
- Cart: add items, change quantity, remove lines. The total updates by itself.
- Discounts: None, Student (10% off), Staff (15% off), Happy Hour (second drink free).
- Place order: shows an order number and a receipt on success, or a clear error.

---

## Design patterns

### Strategy — `js/discounts.js`

Every discount rule is a separate object behind one interface:

```
DiscountStrategy { id, label, apply(lines, subtotalCents) -> discountCents }
```

`NoDiscount`, `StudentDiscount`, `StaffDiscount` and `HappyHourDiscount` each
implement `apply()`. Nothing outside this file knows which rule is active —
callers just call `apply()` and use the number. Adding a fifth discount means
adding one object to the `DISCOUNTS` registry; no existing code is edited.

### Observer — `js/cart.js`

`Cart` keeps the order lines and a list of subscribers. `subscribe(fn)`
registers a listener and returns an unsubscribe function; every mutation
(`add`, `remove`, `setQuantity`, `clear`) calls `notify()`, which pushes a
snapshot to all subscribers.

Two observers are registered in `js/ui.js`: `renderCart` (the table) and
`renderTotals` (the totals panel). Neither is ever called directly when the
cart changes — the cart tells them.

---

## SOLID principles

**Single Responsibility.** Each file has one job. `menu.js` is data, `cart.js`
is cart state, `discounts.js` is pricing rules, `order.js` validates and prices
an order, `ui.js` is the only file that touches the DOM. That separation is
what makes the logic unit-testable without a browser.

**Open/Closed.** `discounts.js` is open to extension and closed to
modification. A new discount is a new strategy object added to the registry.
`order.js`, `cart.js` and `ui.js` require no change, because they depend on the
`DiscountStrategy` interface rather than on any specific rule.

**Dependency Inversion** (bonus). `Cart` depends on "a function that wants to
be notified", not on any UI component, and `placeOrder` depends on the discount
interface, not on a concrete discount.

---

## The `placeOrder` contract

Defined and documented at the top of `js/order.js`.

```
placeOrder(cart, discountStrategy)
```

**Takes:** a `Cart` instance and a `DiscountStrategy`.

**Returns on success:**

```js
{
  ok: true,
  order: {
    id, placedAt, lines,
    subtotalCents, discountLabel, discountCents, totalCents
  }
}
```

**Returns on failure:**

```js
{ ok: false, code, message, details }
```

| Code | When | `details` |
|---|---|---|
| `EMPTY_CART` | The cart has no lines | `{}` |
| `INVALID_QUANTITY` | A quantity is not a whole number from 1 to 10 | `{ offenders: [{id, name, quantity}] }` |
| `OUT_OF_STOCK` | A line refers to an item that is not in stock | `{ offenders: [{id, name}] }` |

**Guarantees**

- Never throws for invalid input; invalid input is a return value.
- Checks run in a fixed order (empty, then quantity, then stock), so the same
  cart always produces the same code.
- Never mutates the cart.
- `totalCents` is never negative; a discount larger than the subtotal is capped.

**Handling.** `js/ui.js` switches on `result.code` and handles all three:
`EMPTY_CART` and `OUT_OF_STOCK` show the message; `INVALID_QUANTITY` also
highlights the offending quantity inputs in red.

---

## Design notes

**Money is in cents.** Every amount is a whole number of cents and is only
formatted for display. Dollars as floating-point numbers accumulate rounding
errors across a multi-line order.

**Stock is checked at order time, not at add time.** Out-of-stock items can
enter the cart on purpose, because stock can change between browsing and
checkout — and because it makes the error path demonstrable.

**Happy Hour is defined explicitly.** The brief says "second drink free"
without saying which drink. We expand drinks into units, sort most expensive
first, and make every second unit free, so the customer keeps the pricier
drink. Food never counts. This is stated in the code comment because an
unstated pricing rule is a defect waiting to happen.

---

## Files

```
index.html         the app
tests.html         test runner
styles.css         all styling
js/menu.js         menu data and money formatting
js/discounts.js    Strategy pattern — discount rules
js/cart.js         Observer pattern — cart state and notifications
js/order.js        placeOrder contract, validation, pricing
js/ui.js           rendering, event wiring, error display
js/tests.js        14 unit tests
```

---

## Who did what

| Member | Contribution |
|---|---|
| Lucca Cabrera | `js/discounts.js` (Strategy), `js/order.js` (contract and validation), contract documentation |
| Palash Pratim Dev Nath | `js/cart.js` (Observer), `js/tests.js` (14 unit tests) |
| [Member 3] | `index.html`, `styles.css`, menu data |
| [Member 4] | `js/ui.js` (rendering and error handling), README, GitHub Pages setup |

All members presented. Commit history reflects each member's own work.

---

## Known limitations

- The menu is hard-coded in `js/menu.js`; there is no backend or persistence.
- Orders are not stored — refreshing the page clears everything.
- Order numbers use a random four-digit suffix, so collisions are possible.
  A real system would get the number from a server.
