/* ui.js — rendering and wiring.
 * ---------------------------------------------------------------------------
 * This is the only file that touches the DOM. Cart, discounts and order logic
 * have no idea a browser exists, which is exactly why they can be unit tested
 * without one.
 *
 * Two OBSERVERS are registered on the cart below. Neither is called directly
 * when something changes — the cart notifies them.
 * ---------------------------------------------------------------------------
 */

(function () {
  "use strict";

  var cart = new window.Cart();
  var currentDiscountId = "none";

  var el = {
    menu:        document.getElementById("menu"),
    cartBody:    document.getElementById("cart-body"),
    cartEmpty:   document.getElementById("cart-empty"),
    discount:    document.getElementById("discount"),
    subtotal:    document.getElementById("subtotal"),
    discountRow: document.getElementById("discount-row"),
    discountAmt: document.getElementById("discount-amount"),
    total:       document.getElementById("total"),
    count:       document.getElementById("item-count"),
    error:       document.getElementById("error"),
    receipt:     document.getElementById("receipt"),
    placeBtn:    document.getElementById("place-order")
  };

  /* ---------- menu ---------- */
  function renderMenu() {
    el.menu.innerHTML = "";
    window.MENU.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "menu-item" + (item.inStock ? "" : " oos");

      var info = document.createElement("div");
      var name = document.createElement("div");
      name.className = "mi-name";
      name.textContent = item.name;
      var meta = document.createElement("div");
      meta.className = "mi-meta";
      meta.textContent = window.formatMoney(item.priceCents) + " · " + item.category +
        (item.inStock ? "" : " · out of stock");
      info.appendChild(name);
      info.appendChild(meta);

      var btn = document.createElement("button");
      btn.className = "add";
      btn.type = "button";
      btn.textContent = "Add";
      btn.setAttribute("aria-label", "Add " + item.name + " to cart");
      btn.addEventListener("click", function () {
        cart.add(item);           // the cart notifies; nothing is refreshed here
        clearMessages();
      });

      card.appendChild(info);
      card.appendChild(btn);
      el.menu.appendChild(card);
    });
  }

  /* ---------- OBSERVER 1: the cart table ---------- */
  function renderCart(snapshot) {
    el.cartBody.innerHTML = "";
    el.cartEmpty.hidden = !snapshot.isEmpty;

    snapshot.lines.forEach(function (line) {
      var tr = document.createElement("tr");

      var tdName = document.createElement("td");
      tdName.textContent = line.name;

      var tdQty = document.createElement("td");
      var qty = document.createElement("input");
      qty.type = "number";
      qty.min = "0";
      qty.max = "99";
      qty.value = String(line.quantity);
      qty.className = "qty";
      qty.id = "qty-" + line.id;
      qty.setAttribute("aria-label", "Quantity for " + line.name);
      if (line.quantity < 1 || line.quantity > 10) qty.classList.add("bad");
      qty.addEventListener("change", function () {
        var v = parseInt(qty.value, 10);
        cart.setQuantity(line.id, isNaN(v) ? 0 : v);
        clearMessages();
      });
      tdQty.appendChild(qty);

      var tdPrice = document.createElement("td");
      tdPrice.className = "num";
      tdPrice.textContent = window.formatMoney(line.priceCents * line.quantity);

      var tdDel = document.createElement("td");
      var del = document.createElement("button");
      del.type = "button";
      del.className = "remove";
      del.textContent = "Remove";
      del.setAttribute("aria-label", "Remove " + line.name);
      del.addEventListener("click", function () {
        cart.remove(line.id);
        clearMessages();
      });
      tdDel.appendChild(del);

      tr.appendChild(tdName);
      tr.appendChild(tdQty);
      tr.appendChild(tdPrice);
      tr.appendChild(tdDel);
      el.cartBody.appendChild(tr);
    });
  }

  /* ---------- OBSERVER 2: the totals panel ---------- */
  function renderTotals(snapshot) {
    var strategy = window.getDiscount(currentDiscountId);
    var discountCents = strategy.apply(snapshot.lines, snapshot.subtotalCents);
    if (discountCents > snapshot.subtotalCents) discountCents = snapshot.subtotalCents;

    el.count.textContent = snapshot.itemCount + (snapshot.itemCount === 1 ? " item" : " items");
    el.subtotal.textContent = window.formatMoney(snapshot.subtotalCents);
    el.discountRow.hidden = discountCents === 0;
    el.discountAmt.textContent = "-" + window.formatMoney(discountCents);
    el.total.textContent = window.formatMoney(snapshot.subtotalCents - discountCents);
  }

  /* Register both observers. From here on the cart drives the screen. */
  cart.subscribe(renderCart);
  cart.subscribe(renderTotals);

  /* ---------- discount selector ---------- */
  function renderDiscountOptions() {
    el.discount.innerHTML = "";
    Object.keys(window.DISCOUNTS).forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = window.DISCOUNTS[id].label;
      el.discount.appendChild(opt);
    });
    el.discount.value = currentDiscountId;
    el.discount.addEventListener("change", function () {
      currentDiscountId = el.discount.value;
      renderTotals(cart.getSnapshot());   // discount is not cart state
      clearMessages();
    });
  }

  /* ---------- messages ---------- */
  function clearMessages() {
    el.error.hidden = true;
    el.error.textContent = "";
  }

  function showError(result) {
    el.receipt.hidden = true;
    el.error.hidden = false;
    el.error.textContent = "[" + result.code + "] " + result.message;
    el.error.focus();
  }

  function showReceipt(order) {
    clearMessages();
    el.receipt.hidden = false;
    el.receipt.innerHTML = "";

    var h = document.createElement("h3");
    h.textContent = "Order " + order.id + " placed";
    el.receipt.appendChild(h);

    var ul = document.createElement("ul");
    order.lines.forEach(function (l) {
      var li = document.createElement("li");
      li.textContent = l.quantity + " x " + l.name + " — " +
                       window.formatMoney(l.lineTotalCents);
      ul.appendChild(li);
    });
    el.receipt.appendChild(ul);

    [["Subtotal", window.formatMoney(order.subtotalCents)],
     [order.discountLabel, "-" + window.formatMoney(order.discountCents)],
     ["Total", window.formatMoney(order.totalCents)]
    ].forEach(function (row, i) {
      var p = document.createElement("p");
      p.className = "rc-row" + (i === 2 ? " rc-total" : "");
      var a = document.createElement("span"); a.textContent = row[0];
      var b = document.createElement("span"); b.textContent = row[1];
      p.appendChild(a); p.appendChild(b);
      el.receipt.appendChild(p);
    });
  }

  /* ---------- place order: every contract error code is handled ---------- */
  el.placeBtn.addEventListener("click", function () {
    var result = window.placeOrder(cart, window.getDiscount(currentDiscountId));

    if (result.ok) {
      showReceipt(result.order);
      cart.clear();
      return;
    }

    switch (result.code) {
      case window.ORDER_ERRORS.EMPTY_CART:
        showError(result);
        break;
      case window.ORDER_ERRORS.INVALID_QUANTITY:
        showError(result);
        result.details.offenders.forEach(function (o) {
          var input = document.getElementById("qty-" + o.id);
          if (input) input.classList.add("bad");
        });
        break;
      case window.ORDER_ERRORS.OUT_OF_STOCK:
        showError(result);
        break;
      default:
        showError({ code: "UNKNOWN", message: "Something went wrong. Please try again." });
    }
  });

  /* ---------- start ---------- */
  renderMenu();
  renderDiscountOptions();
  cart.notify();   // paint the empty state through the same observer path
})();
