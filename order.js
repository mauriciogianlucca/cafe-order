/* order.js — THE placeOrder CONTRACT
 * ===========================================================================
 *
 *   placeOrder(cart, discountStrategy)
 *
 *   TAKES
 *     cart              a Cart instance (see cart.js)
 *     discountStrategy  a DiscountStrategy (see discounts.js)
 *
 *   RETURNS ON SUCCESS
 *     {
 *       ok: true,
 *       order: {
 *         id:              "CC-20261003-0417"   // human-readable order number
 *         placedAt:        ISO-8601 timestamp
 *         lines:           [{ id, name, quantity, priceCents, lineTotalCents }]
 *         subtotalCents:   integer
 *         discountLabel:   string
 *         discountCents:   integer >= 0
 *         totalCents:      integer >= 0
 *       }
 *     }
 *
 *   RETURNS ON FAILURE
 *     { ok: false, code: <ERROR CODE>, message: string, details: object }
 *
 *   ERROR CODES
 *     EMPTY_CART        the cart has no lines
 *     INVALID_QUANTITY  some line has a quantity outside 1–10, or not an integer
 *                       details: { offenders: [{ id, name, quantity }] }
 *     OUT_OF_STOCK      some line refers to an item the café cannot serve
 *                       details: { offenders: [{ id, name }] }
 *
 *   GUARANTEES
 *     - Never throws for invalid input; invalid input is a return value.
 *     - Checks run in a fixed order (empty, then quantity, then stock) so the
 *       same cart always produces the same error code.
 *     - Never mutates the cart. Clearing it is the caller's decision.
 *     - totalCents is never negative; a discount larger than the subtotal is
 *       capped at the subtotal.
 *
 * ===========================================================================
 * SOLID demonstrated here:
 *   - Single Responsibility: this file validates and prices an order. It does
 *     not render, does not store, does not know a discount's internal rule.
 *   - Dependency Inversion: it depends on the DiscountStrategy interface, so a
 *     new discount requires no change in this file.
 */

var ORDER_ERRORS = {
  EMPTY_CART:       "EMPTY_CART",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  OUT_OF_STOCK:     "OUT_OF_STOCK"
};

var MIN_QUANTITY = 1;
var MAX_QUANTITY = 10;

function fail(code, message, details) {
  return { ok: false, code: code, message: message, details: details || {} };
}

/* Order id: CC-YYYYMMDD-NNNN. Readable at the counter and sortable by date. */
function buildOrderId(now) {
  var d = now || new Date();
  function pad(n, w) { var s = String(n); while (s.length < w) s = "0" + s; return s; }
  var datePart = d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2);
  var seqPart = pad(Math.floor(Math.random() * 10000), 4);
  return "CC-" + datePart + "-" + seqPart;
}

function placeOrder(cart, discountStrategy) {
  var lines = cart.getLines();

  /* 1. EMPTY_CART */
  if (lines.length === 0) {
    return fail(ORDER_ERRORS.EMPTY_CART,
      "Your cart is empty. Add at least one item before placing an order.");
  }

  /* 2. INVALID_QUANTITY — must be a whole number from 1 to 10 */
  var badQty = lines.filter(function (l) {
    return !Number.isInteger(l.quantity) ||
           l.quantity < MIN_QUANTITY ||
           l.quantity > MAX_QUANTITY;
  });
  if (badQty.length > 0) {
    var names = badQty.map(function (l) { return l.name; }).join(", ");
    return fail(ORDER_ERRORS.INVALID_QUANTITY,
      "Quantity must be a whole number between " + MIN_QUANTITY + " and " +
      MAX_QUANTITY + ". Please fix: " + names + ".",
      { offenders: badQty.map(function (l) {
          return { id: l.id, name: l.name, quantity: l.quantity };
        }) });
  }

  /* 3. OUT_OF_STOCK — stock is checked here, at the moment of ordering,
   *    not when the item was added, because stock can change in between. */
  var unavailable = [];
  for (var i = 0; i < lines.length; i++) {
    var menuItem = window.findMenuItem(lines[i].id);
    if (!menuItem || menuItem.inStock !== true) {
      unavailable.push({ id: lines[i].id, name: lines[i].name });
    }
  }
  if (unavailable.length > 0) {
    var outNames = unavailable.map(function (l) { return l.name; }).join(", ");
    return fail(ORDER_ERRORS.OUT_OF_STOCK,
      "Sorry, these items are out of stock: " + outNames +
      ". Remove them to continue.",
      { offenders: unavailable });
  }

  /* 4. Price the order */
  var priced = lines.map(function (l) {
    return {
      id: l.id, name: l.name, quantity: l.quantity,
      priceCents: l.priceCents,
      lineTotalCents: l.priceCents * l.quantity
    };
  });

  var subtotalCents = priced.reduce(function (sum, l) {
    return sum + l.lineTotalCents;
  }, 0);

  var discountCents = discountStrategy.apply(lines, subtotalCents);
  if (discountCents < 0) discountCents = 0;
  if (discountCents > subtotalCents) discountCents = subtotalCents;

  return {
    ok: true,
    order: {
      id: buildOrderId(),
      placedAt: new Date().toISOString(),
      lines: priced,
      subtotalCents: subtotalCents,
      discountLabel: discountStrategy.label,
      discountCents: discountCents,
      totalCents: subtotalCents - discountCents
    }
  };
}

window.ORDER_ERRORS = ORDER_ERRORS;
window.MIN_QUANTITY = MIN_QUANTITY;
window.MAX_QUANTITY = MAX_QUANTITY;
window.placeOrder = placeOrder;
