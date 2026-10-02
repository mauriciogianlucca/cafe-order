/* cart.js — OBSERVER PATTERN
 * ---------------------------------------------------------------------------
 * The cart holds the order lines and nothing else. It knows nothing about the
 * DOM, about prices on screen, or about who is listening to it.
 *
 * Anything that needs to react to a cart change calls subscribe(fn). Whenever
 * the cart mutates, it calls notify(), which pushes a snapshot to every
 * subscriber. In this app the total display and the order summary are both
 * subscribers, so they update by themselves — no caller ever has to remember
 * to refresh them.
 *
 * SOLID demonstrated here:
 *   - Single Responsibility: Cart manages cart state; rendering lives in ui.js.
 *   - Dependency Inversion: Cart depends on the abstract idea of "a function
 *     that wants to be told", not on any concrete UI component.
 * ---------------------------------------------------------------------------
 */

function Cart() {
  this.lines = [];       // [{ id, name, priceCents, category, quantity }]
  this.observers = [];   // [function(snapshot)]
}

/* --- Observer plumbing -------------------------------------------------- */

/* Register a listener. Returns an unsubscribe function. */
Cart.prototype.subscribe = function (fn) {
  if (typeof fn !== "function") throw new Error("subscribe() needs a function");
  this.observers.push(fn);
  var self = this;
  return function () {
    var i = self.observers.indexOf(fn);
    if (i !== -1) self.observers.splice(i, 1);
  };
};

/* Push the current snapshot to every observer. Called after each mutation. */
Cart.prototype.notify = function () {
  var snapshot = this.getSnapshot();
  for (var i = 0; i < this.observers.length; i++) {
    this.observers[i](snapshot);
  }
};

/* --- State -------------------------------------------------------------- */

/* A plain copy, so observers cannot mutate the cart by accident. */
Cart.prototype.getLines = function () {
  return this.lines.map(function (l) {
    return {
      id: l.id, name: l.name, priceCents: l.priceCents,
      category: l.category, quantity: l.quantity
    };
  });
};

Cart.prototype.subtotal = function () {
  var total = 0;
  for (var i = 0; i < this.lines.length; i++) {
    total += this.lines[i].priceCents * this.lines[i].quantity;
  }
  return total;
};

Cart.prototype.count = function () {
  var n = 0;
  for (var i = 0; i < this.lines.length; i++) n += this.lines[i].quantity;
  return n;
};

Cart.prototype.isEmpty = function () {
  return this.lines.length === 0;
};

Cart.prototype.getSnapshot = function () {
  return {
    lines: this.getLines(),
    subtotalCents: this.subtotal(),
    itemCount: this.count(),
    isEmpty: this.isEmpty()
  };
};

/* --- Mutations (each one notifies) -------------------------------------- */

Cart.prototype.find = function (id) {
  for (var i = 0; i < this.lines.length; i++) {
    if (this.lines[i].id === id) return this.lines[i];
  }
  return null;
};

/* Adds one unit, or increments an existing line. Out-of-stock items are
 * allowed into the cart on purpose: placeOrder is the single place where
 * stock is validated, so the error path can be demonstrated. */
Cart.prototype.add = function (menuItem) {
  var line = this.find(menuItem.id);
  if (line) {
    line.quantity += 1;
  } else {
    this.lines.push({
      id: menuItem.id,
      name: menuItem.name,
      priceCents: menuItem.priceCents,
      category: menuItem.category,
      quantity: 1
    });
  }
  this.notify();
};

Cart.prototype.remove = function (id) {
  this.lines = this.lines.filter(function (l) { return l.id !== id; });
  this.notify();
};

/* Sets an exact quantity. Values outside 1–10 are stored as given so that
 * placeOrder can reject them with INVALID_QUANTITY; quantity 0 removes the
 * line, which is what a user means when they clear the field. */
Cart.prototype.setQuantity = function (id, quantity) {
  var line = this.find(id);
  if (!line) return;
  if (quantity === 0) { this.remove(id); return; }
  line.quantity = quantity;
  this.notify();
};

Cart.prototype.clear = function () {
  this.lines = [];
  this.notify();
};

window.Cart = Cart;
