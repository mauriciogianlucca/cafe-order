/* menu.js — the café's catalogue.
 *
 * Kept in its own file on purpose: the menu is data, not behaviour.
 * Changing the menu must never require changing cart, discount or order code.
 * (SOLID — Single Responsibility.)
 *
 * All money is stored in CENTS as whole numbers. Floating point dollars
 * (3.45 + 1.15) produce rounding errors that show up in totals, so every
 * calculation in this app works in integers and formats only at display time.
 */

window.MENU = [
  { id: "esp",  name: "Espresso",          priceCents: 275, category: "drink", inStock: true  },
  { id: "lat",  name: "Latte",             priceCents: 445, category: "drink", inStock: true  },
  { id: "cap",  name: "Cappuccino",        priceCents: 425, category: "drink", inStock: true  },
  { id: "cld",  name: "Cold Brew",         priceCents: 395, category: "drink", inStock: true  },
  { id: "tea",  name: "Green Tea",         priceCents: 315, category: "drink", inStock: false },
  { id: "moc",  name: "Mocha",             priceCents: 475, category: "drink", inStock: true  },
  { id: "crs",  name: "Butter Croissant",  priceCents: 350, category: "food",  inStock: true  },
  { id: "bgl",  name: "Everything Bagel",  priceCents: 325, category: "food",  inStock: true  },
  { id: "mfn",  name: "Blueberry Muffin",  priceCents: 340, category: "food",  inStock: false }
];

/* Formats cents as a dollar string. Display concern only. */
window.formatMoney = function (cents) {
  var sign = cents < 0 ? "-" : "";
  var abs = Math.abs(cents);
  return sign + "$" + (abs / 100).toFixed(2);
};

/* Look an item up by id. Returns undefined if it is not on the menu. */
window.findMenuItem = function (id) {
  for (var i = 0; i < window.MENU.length; i++) {
    if (window.MENU[i].id === id) return window.MENU[i];
  }
  return undefined;
};
