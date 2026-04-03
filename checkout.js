// checkout.js — cart display + Stripe payment
// SECURITY FIXES:
// [FIX-3] Price re-verified from source items — cart editing cannot change amount charged
// [FIX-10] Email validated before submission
// [FIX-11] Pay button double-submit prevented (disabled immediately on first click)
// [FIX-12] No secret key — only publishable key lives here (secret key belongs on backend only)
// [FIX-1]  XSS: cart rendered via DOM API (textContent), never raw innerHTML with user data

// ── STRIPE CONFIGURATION ─────────────────────────────────────────────────────
// SAFE: Publishable keys (pk_test_ / pk_live_) are ALWAYS public-facing.
// NEVER put your secret key (sk_test_ / sk_live_) in any frontend file.
// Get your publishable key from: https://dashboard.stripe.com/test/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE';
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();
  initStripe();
});

function renderCart() {
  const cartItems      = document.getElementById('cartItems');
  const checkoutForm   = document.getElementById('checkoutForm');
  const emptyMsg       = document.getElementById('emptyCartMsg');
  const summarySubtotal= document.getElementById('summarySubtotal');
  const summaryFee     = document.getElementById('summaryFee');
  const summaryTotal   = document.getElementById('summaryTotal');

  // [FIX-3] getCart() already re-validates prices from source — no tampering possible
  const cart = getCart();

  if (cart.length === 0) {
    cartItems.innerHTML = '';
    const msg = document.createElement('p');
    msg.style.cssText = 'font-size:1.1rem;text-align:center;padding:40px 0;color:#888;';
    msg.textContent = 'Your cart is empty.';
    cartItems.appendChild(msg);
    if (checkoutForm) checkoutForm.classList.add('hidden');
    if (emptyMsg)     emptyMsg.classList.remove('hidden');
    return;
  }

  if (emptyMsg)     emptyMsg.classList.add('hidden');
  if (checkoutForm) checkoutForm.classList.remove('hidden');

  // [FIX-1] Build cart items with DOM API — no innerHTML with user data
  cartItems.innerHTML = '';
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const icon = document.createElement('div');
    icon.className = 'cart-item-icon';
    icon.textContent = item.emoji; // emoji is whitelist-validated

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const h4 = document.createElement('h4');
    h4.textContent = item.title; // textContent — safe

    const p = document.createElement('p');
    p.textContent = item.condition + ' · Sold by ' + item.seller;

    info.appendChild(h4);
    info.appendChild(p);

    const price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = '$' + item.price.toFixed(2);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cart-remove';
    removeBtn.title = 'Remove item';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.id);
      updateCartCount();
      renderCart();
    });

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(price);
    row.appendChild(removeBtn);
    cartItems.appendChild(row);
  });

  // [FIX-3] Totals computed from verified cart (prices from source, not localStorage)
  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);
  const fee      = subtotal * 0.05;
  const total    = subtotal + fee;

  summarySubtotal.textContent = '$' + subtotal.toFixed(2);
  summaryFee.textContent      = '$' + fee.toFixed(2);
  summaryTotal.textContent    = '$' + total.toFixed(2);
}

// ── Stripe ───────────────────────────────────────────────────────────────────
let stripe, cardElement;

function initStripe() {
  if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE') {
    showStripeSetupWarning();
    return;
  }

  // Validate key format before calling Stripe (never pass an sk_ key)
  if (!/^pk_(test|live)_[a-zA-Z0-9]{10,}$/.test(STRIPE_PUBLISHABLE_KEY)) {
    console.error('Invalid Stripe key format. Only publishable keys (pk_) are allowed here.');
    showStripeSetupWarning();
    return;
  }

  try {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();

    cardElement = elements.create('card', {
      style: {
        base: {
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '16px',
          color: '#1a1a1a',
          '::placeholder': { color: '#aaa' }
        }
      }
    });

    const cardBox = document.getElementById('card-element');
    if (cardBox) {
      cardElement.mount('#card-element');
      cardElement.on('focus', () => cardBox.classList.add('focused'));
      cardElement.on('blur',  () => cardBox.classList.remove('focused'));
      cardElement.on('change', e => {
        const errEl = document.getElementById('card-errors');
        if (errEl) errEl.textContent = e.error ? e.error.message : '';
      });
    }
  } catch (err) {
    console.warn('Stripe init error:', err);
    showStripeSetupWarning();
    return;
  }

  const payBtn = document.getElementById('payBtn');
  if (payBtn) payBtn.addEventListener('click', handlePayment);
}

// [FIX-10] Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let paymentInProgress = false; // [FIX-11] double-submit guard

async function handlePayment() {
  if (paymentInProgress) return; // [FIX-11] block duplicate clicks

  const nameInput  = document.getElementById('buyerName');
  const emailInput = document.getElementById('buyerEmail');
  const errEl      = document.getElementById('card-errors');
  const payBtn     = document.getElementById('payBtn');

  const name  = nameInput?.value.trim()  || '';
  const email = emailInput?.value.trim() || '';

  // [FIX-10] Input validation
  if (!name || name.length < 2) {
    if (errEl) errEl.textContent = 'Please enter your full name.';
    nameInput?.focus();
    return;
  }
  if (!isValidEmail(email)) {
    if (errEl) errEl.textContent = 'Please enter a valid email address.';
    emailInput?.focus();
    return;
  }

  // [FIX-3] Re-read cart from source to get verified prices
  const cart = getCart();
  if (cart.length === 0) {
    if (errEl) errEl.textContent = 'Your cart is empty.';
    return;
  }

  // [FIX-11] Disable button immediately — prevents double charge
  paymentInProgress = true;
  if (payBtn) {
    payBtn.textContent = 'Processing…';
    payBtn.disabled    = true;
  }
  if (errEl) errEl.textContent = '';

  // [FIX-3] Compute total from verified prices (not from any stored value)
  const subtotal   = cart.reduce((sum, i) => sum + i.price, 0);
  const fee        = subtotal * 0.05;
  const totalCents = Math.round((subtotal + fee) * 100);

  // ── What happens here in DEMO vs PRODUCTION ──────────────────────────────
  //
  // DEMO (current): We call stripe.createPaymentMethod() to validate the card
  // without charging it. This is safe — no money moves.
  //
  // PRODUCTION: You must:
  //   1. POST { totalCents, cartIds } to YOUR backend (e.g. Supabase Edge Function)
  //   2. Backend creates a PaymentIntent with Stripe using the SECRET key
  //   3. Backend returns { clientSecret }
  //   4. You call stripe.confirmCardPayment(clientSecret, { payment_method: ... })
  //
  // The secret key (sk_test_ / sk_live_) NEVER appears in frontend code.
  // See README.md for the full backend integration guide.
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: { name, email }
    });

    if (error) {
      if (errEl) errEl.textContent = error.message;
      resetPayButton();
      return;
    }

    // Demo: card is valid. Log for transparency — no real charge occurs.
    console.info('[ReFind demo] Payment method validated:', paymentMethod.id,
                 '| Amount would be:', (totalCents / 100).toFixed(2), 'USD');
    showPaymentSuccess();

  } catch (err) {
    if (errEl) errEl.textContent = 'Payment failed. Please try again.';
    resetPayButton();
  }
}

function resetPayButton() {
  paymentInProgress = false;
  const payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.textContent = 'Pay Now';
    payBtn.disabled    = false;
  }
}

function showPaymentSuccess() {
  saveCart([]);
  updateCartCount();

  const form    = document.getElementById('checkoutForm');
  const success = document.getElementById('paySuccess');
  const items   = document.getElementById('cartItems');
  const heading = document.querySelector('.order-summary h3');

  if (form)    form.classList.add('hidden');
  if (success) success.classList.remove('hidden');
  if (heading) heading.textContent = 'Order Confirmed';
  if (items) {
    items.innerHTML = '';
    const msg = document.createElement('p');
    msg.style.cssText = 'text-align:center;padding:24px 0;color:#3a7d44;font-weight:500;';
    msg.textContent = 'Order placed successfully!';
    items.appendChild(msg);
  }
}

function showStripeSetupWarning() {
  const cardBox = document.getElementById('card-element');
  const payBtn  = document.getElementById('payBtn');

  if (cardBox) {
    // [FIX-1] Use textContent / DOM API — no raw HTML injection
    cardBox.innerHTML = '';
    const warn = document.createElement('div');
    warn.style.cssText = 'padding:8px 0;font-size:0.85rem;color:#b85c38;';

    const text = document.createTextNode('⚠️ Stripe not configured. Add your publishable key to checkout.js. ');
    const link = document.createElement('a');
    link.href   = 'https://dashboard.stripe.com/test/apikeys';
    link.target = '_blank';
    link.rel    = 'noopener noreferrer'; // security: prevent opener access
    link.style.cssText = 'color:#b85c38;text-decoration:underline;';
    link.textContent   = 'Get your test key →';

    warn.appendChild(text);
    warn.appendChild(link);
    cardBox.appendChild(warn);
  }

  if (payBtn) {
    payBtn.disabled    = true;
    payBtn.textContent = 'Configure Stripe to Pay';
    payBtn.style.background = '#ccc';
    payBtn.style.cursor     = 'not-allowed';
  }
}
