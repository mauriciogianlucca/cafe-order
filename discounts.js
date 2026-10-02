/* discounts.js — STRATEGY PATTERN
 * ---------------------------------------------------------------------------
 * Every discount rule is its own object behind one shared interface:
 *
 *     DiscountStrategy {
 *       id: string
 *       label: string
 *       apply(lines, subtotalCents) -> discountCents   // always >= 0
 *     }
 *
 * The cart and the order code never ask "which discount is this?". They call
 * apply() and use the number they get back. Adding a new discount means adding
 * a new object to DISCOUNTS below — no existing code is edited.
 *
 * SOLID demonstrated here:
 *   - Open/Closed Principle: open to extension (new strategy), closed to
 *     modification (nothing existing changes when a rule is added).
 *   - Single Responsibility: each strategy knows exactly one pricing rule.
 * ---------------------------------------------------------------------------
 */

/* Base class. Defines the contract; refuses to be used directly. */
function DiscountStrategy(id, label) {
  this.id = id;
  this.label = label;
}
DiscountStrategy.prototype.apply = function () {
  throw new Error("DiscountStrategy.apply() must be implemented by a subclass");
};

/* --- Strategy 1: no discount ------------------------------------------- */
function NoDiscount() {
  DiscountStrategy.call(this, "none", "None");
}
NoDiscount.prototype = Object.create(DiscountStrategy.prototype);
NoDiscount.prototype.constructor = NoDiscount;
NoDiscount.prototype.apply = function () {
  return 0;
};

/* --- Strategy 2: student, 10% off the whole order ----------------------- */
function StudentDiscount() {
  DiscountStrategy.call(this, "student", "Student (10% off)");
}
StudentDiscount.prototype = Object.create(DiscountStrategy.prototype);
StudentDiscount.prototype.constructor = StudentDiscount;
StudentDiscount.prototype.apply = function (lines, subtotalCents) {
  return Math.round(subtotalCents * 0.10);
};

/* --- Strategy 3: staff, 15% off the whole order ------------------------- */
function StaffDiscount() {
  DiscountStrategy.call(this, "staff", "Staff (15% off)");
}
StaffDiscount.prototype = Object.create(DiscountStrategy.prototype);
StaffDiscount.prototype.constructor = StaffDiscount;
StaffDiscount.prototype.apply = function (lines, subtotalCents) {
  return Math.round(subtotalCents * 0.15);
};

/* --- Strategy 4: happy hour, second drink free --------------------------
 * Rule as we implemented it, stated explicitly because the brief does not:
 * expand every drink into individual units, sort them most expensive first,
 * and make every second unit free (the 2nd, 4th, 6th ...). Sorting descending
 * means the customer keeps the expensive drink and the cheaper one is the one
 * given away, which is how cafés actually run this promotion.
 * Food never counts toward this discount.
 */
function HappyHourDiscount() {
  DiscountStrategy.call(this, "happy", "Happy Hour (second drink free)");
}
HappyHourDiscount.prototype = Object.create(DiscountStrategy.prototype);
HappyHourDiscount.prototype.constructor = HappyHourDiscount;
HappyHourDiscount.prototype.apply = function (lines) {
  var units = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.category !== "drink") continue;
    for (var q = 0; q < line.quantity; q++) units.push(line.priceCents);
  }
  units.sort(function (a, b) { return b - a; });

  var free = 0;
  for (var u = 1; u < units.length; u += 2) free += units[u];
  return free;
};

/* The registry the UI reads. Adding a rule here is the only change needed. */
window.DISCOUNTS = {
  none:    new NoDiscount(),
  student: new StudentDiscount(),
  staff:   new StaffDiscount(),
  happy:   new HappyHourDiscount()
};

/* Returns the strategy for an id, falling back to "no discount" rather than
 * throwing: an unknown id is a UI bug, not a reason to break checkout. */
window.getDiscount = function (id) {
  return window.DISCOUNTS[id] || window.DISCOUNTS.none;
};

window.DiscountStrategy = DiscountStrategy;
