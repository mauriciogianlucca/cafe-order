/* tests.js — unit tests for the total and discount logic.
 * ---------------------------------------------------------------------------
 * No framework and nothing to install. Open tests.html in a browser; the
 * results render on the page and are also printed to the console.
 *
 * These test the logic files only (cart.js, discounts.js, order.js). They never
 * touch the DOM, which is possible precisely because those files do not either.
 * ---------------------------------------------------------------------------
 */

(function () {
  "use strict";

  var results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name: name, pass: true });
    } catch (e) {
      results.push({ name: name, pass: false, why: e.message });
    }
  }

  function assertEqual(actual, expected, what) {
    if (actual !== expected) {
      throw new Error((what || "value") + ": expected " + expected + ", got " + actual);
    }
  }

  function assertTrue(value, what) {
    if (value !== true) throw new Error((what || "value") + " should be true");
  }

  /* Helper: a cart holding the given [menuId, quantity] pairs. */
  function cartWith(pairs) {
    var c = new window.Cart();
    pairs.forEach(function (p) {
      var item = window.findMenuItem(p[0]);
      c.add(item);
      if (p[1] !== 1) c.setQuantity(p[0], p[1]);
    });
    return c;
  }

  /* ===================== TOTALS ===================== */

  test("1. Subtotal sums price x quantity across lines", function () {
    // Latte 445 x 2 = 890, Croissant 350 x 1 = 350  ->  1240
    var c = cartWith([["lat", 2], ["crs", 1]]);
    assertEqual(c.subtotal(), 1240, "subtotal");
  });

  test("2. Empty cart has a subtotal of zero and reports itself empty", function () {
    var c = new window.Cart();
    assertEqual(c.subtotal(), 0, "subtotal");
    assertTrue(c.isEmpty(), "isEmpty()");
  });

  /* ===================== DISCOUNT STRATEGIES ===================== */

  test("3. Student strategy takes 10% off the subtotal", function () {
    var c = cartWith([["lat", 2]]);                      // 890
    var d = window.DISCOUNTS.student.apply(c.getLines(), c.subtotal());
    assertEqual(d, 89, "student discount");
  });

  test("4. Staff strategy takes 15% off the subtotal", function () {
    var c = cartWith([["lat", 2]]);                      // 890
    var d = window.DISCOUNTS.staff.apply(c.getLines(), c.subtotal());
    assertEqual(d, 134, "staff discount");               // round(133.5) = 134
  });

  test("5. Happy Hour makes the cheaper of two drinks free", function () {
    // Mocha 475 + Espresso 275. Sorted desc: [475, 275]; the 2nd unit is free.
    var c = cartWith([["moc", 1], ["esp", 1]]);
    var d = window.DISCOUNTS.happy.apply(c.getLines(), c.subtotal());
    assertEqual(d, 275, "happy hour discount");
  });

  test("6. Happy Hour ignores food and gives nothing for a single drink", function () {
    var c = cartWith([["lat", 1], ["crs", 1], ["bgl", 1]]);
    var d = window.DISCOUNTS.happy.apply(c.getLines(), c.subtotal());
    assertEqual(d, 0, "happy hour discount");
  });

  test("7. No discount strategy returns zero", function () {
    var c = cartWith([["lat", 3]]);
    assertEqual(window.DISCOUNTS.none.apply(c.getLines(), c.subtotal()), 0, "none");
  });

  /* ===================== placeOrder CONTRACT ===================== */

  test("8. placeOrder succeeds and total = subtotal - discount", function () {
    var c = cartWith([["lat", 2], ["crs", 1]]);          // 1240
    var r = window.placeOrder(c, window.DISCOUNTS.student);
    assertTrue(r.ok, "r.ok");
    assertEqual(r.order.subtotalCents, 1240, "subtotal");
    assertEqual(r.order.discountCents, 124, "discount");
    assertEqual(r.order.totalCents, 1116, "total");
  });

  test("9. placeOrder returns EMPTY_CART for an empty cart", function () {
    var r = window.placeOrder(new window.Cart(), window.DISCOUNTS.none);
    assertEqual(r.ok, false, "r.ok");
    assertEqual(r.code, "EMPTY_CART", "error code");
  });

  test("10. placeOrder returns INVALID_QUANTITY above 10", function () {
    var c = cartWith([["lat", 11]]);
    var r = window.placeOrder(c, window.DISCOUNTS.none);
    assertEqual(r.code, "INVALID_QUANTITY", "error code");
    assertEqual(r.details.offenders.length, 1, "offender count");
  });

  test("11. placeOrder returns OUT_OF_STOCK for an unavailable item", function () {
    var c = cartWith([["tea", 1]]);                      // Green Tea is out of stock
    var r = window.placeOrder(c, window.DISCOUNTS.none);
    assertEqual(r.code, "OUT_OF_STOCK", "error code");
  });

  test("12. Checks run in a fixed order: quantity is reported before stock", function () {
    var c = cartWith([["tea", 20]]);                     // both rules broken
    var r = window.placeOrder(c, window.DISCOUNTS.none);
    assertEqual(r.code, "INVALID_QUANTITY", "error code");
  });

  test("13. A discount can never push the total below zero", function () {
    var c = cartWith([["esp", 1]]);                      // 275
    var huge = { label: "Test", apply: function () { return 99999; } };
    var r = window.placeOrder(c, huge);
    assertEqual(r.order.totalCents, 0, "total");
    assertEqual(r.order.discountCents, 275, "discount capped at subtotal");
  });

  /* ===================== OBSERVER ===================== */

  test("14. The cart notifies its observers when it changes", function () {
    var c = new window.Cart();
    var calls = 0, lastSubtotal = -1;
    c.subscribe(function (snap) { calls++; lastSubtotal = snap.subtotalCents; });
    c.add(window.findMenuItem("esp"));                   // 275
    assertEqual(calls, 1, "notifications after add");
    assertEqual(lastSubtotal, 275, "subtotal seen by observer");
    c.setQuantity("esp", 2);
    assertEqual(calls, 2, "notifications after setQuantity");
    assertEqual(lastSubtotal, 550, "updated subtotal");
  });

  /* ===================== REPORT ===================== */

  var passed = results.filter(function (r) { return r.pass; }).length;
  var total = results.length;

  results.forEach(function (r) {
    if (r.pass) console.log("PASS — " + r.name);
    else console.error("FAIL — " + r.name + " :: " + r.why);
  });
  console.log(passed + "/" + total + " tests passed");

  var out = document.getElementById("test-output");
  if (out) {
    var summary = document.createElement("p");
    summary.className = "summary " + (passed === total ? "pass" : "fail");
    summary.textContent = passed + " of " + total + " tests passed";
    out.appendChild(summary);

    var ul = document.createElement("ul");
    ul.className = "test-list";
    results.forEach(function (r) {
      var li = document.createElement("li");
      var b = document.createElement("span");
      b.className = "badge " + (r.pass ? "pass" : "fail");
      b.textContent = r.pass ? "PASS" : "FAIL";
      var text = document.createElement("span");
      text.textContent = r.name;
      if (!r.pass) {
        var why = document.createElement("span");
        why.className = "test-why";
        why.textContent = r.why;
        text.appendChild(why);
      }
      li.appendChild(b);
      li.appendChild(text);
      ul.appendChild(li);
    });
    out.appendChild(ul);
  }
})();
