/* ============================================================
   Cupertino Florist — Cart Management
   Uses localStorage key: 'cf_cart'
   ============================================================ */

const CART_KEY = 'cf_cart';

/** Return the current cart array */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

/** Save cart back to localStorage */
function _saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Find the product object by id from window.PRODUCTS (if available).
 * Returns null if PRODUCTS not loaded.
 */
function _findProduct(productId) {
  if (!window.PRODUCTS) return null;
  return window.PRODUCTS.find(p => p.id === productId) || null;
}

/**
 * Add a product to cart (or increment qty if already present).
 * @param {string} productId
 * @param {string} size  - 's', 'm', or 'l'
 * @returns {boolean} success
 */
function addToCart(productId, size) {
  const product = _findProduct(productId);
  if (!product) {
    console.warn('addToCart: product not found', productId);
    return false;
  }

  const sizeKey = (size || 's').toLowerCase();
  const price   = product.prices[sizeKey];
  if (price === undefined) {
    console.warn('addToCart: invalid size', size);
    return false;
  }

  const sizeLabelMap = { s: 'Small', m: 'Medium', l: 'Large' };
  const cart = getCart();
  const existing = cart.find(i => i.productId === productId && i.size === sizeKey);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      productId,
      size: sizeKey,
      sizeLabel: sizeLabelMap[sizeKey] || sizeKey.toUpperCase(),
      qty: 1,
      name: product.name,
      price,
      img: product.img,
      delivery: product.delivery || 'Hand Delivery'
    });
  }

  _saveCart(cart);
  updateCartBadge();
  return true;
}

/**
 * Remove a line item from the cart.
 */
function removeFromCart(productId, size) {
  const sizeKey = (size || 's').toLowerCase();
  let cart = getCart();
  cart = cart.filter(i => !(i.productId === productId && i.size === sizeKey));
  _saveCart(cart);
  updateCartBadge();
}

/**
 * Update the quantity of a cart line item.
 * Removes the item if qty <= 0.
 */
function updateQty(productId, size, qty) {
  const sizeKey = (size || 's').toLowerCase();
  let cart = getCart();
  const item = cart.find(i => i.productId === productId && i.size === sizeKey);
  if (!item) return;

  if (qty <= 0) {
    removeFromCart(productId, size);
    return;
  }

  item.qty = qty;
  _saveCart(cart);
  updateCartBadge();
}

/** Total number of items (sum of qty) */
function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

/** Total price */
function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

/** Empty the cart */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

/**
 * Update every .cart-count element in the DOM with the current item count.
 * Shows/hides the badge element based on count.
 */
function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

/** Show a brief toast message */
function showToast(message) {
  let toast = document.getElementById('cf-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cf-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '<span class="toast-check">&#10003;</span>' + message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/** Convenience: add to cart + show confirmation toast */
function addToCartWithFeedback(productId, size, buttonEl) {
  const success = addToCart(productId, size);
  if (success) {
    const product = _findProduct(productId);
    const name = product ? product.name : 'Item';
    showToast(name + ' added to cart!');
    if (buttonEl) {
      const origText = buttonEl.textContent;
      buttonEl.textContent = 'Added!';
      buttonEl.classList.add('added');
      setTimeout(() => {
        buttonEl.textContent = origText;
        buttonEl.classList.remove('added');
      }, 1600);
    }
  }
}

/* Run on every page load */
document.addEventListener('DOMContentLoaded', updateCartBadge);
