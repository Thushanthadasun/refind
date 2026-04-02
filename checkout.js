// checkout.js — cart display + Stripe payment

// =========================================================
// STRIPE CONFIGURATION
// Replace the key below with your own Stripe Publishable Key
// Get it from: https://dashboard.stripe.com/test/apikeys
// =========================================================
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE';
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();
  initStripe();
});

function renderCart() {
  const cart = getCart();
  const cartItems = document.getElementById('cartItems');
  const checkoutForm = document.getElementById('checkoutForm');
  const emptyMsg = document.getElementById('emptyCartMsg');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryFee = document.getElementById('summaryFee');
  const summaryTotal = document.getElementById('summaryTotal');

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart"><p style="font-size:1.1rem;">Your cart is empty.</p></div>';
    if (checkoutForm) checkoutForm.classList.add('hidden');
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }

  if (emptyMsg) emptyMsg.classList.add('hidden');
  if (checkoutForm) checkoutForm.classList.remove('hidden');

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-icon">${item.emoji}</div>
      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <p>${item.condition} · Sold by ${item.seller}</p>
      </div>
      <span class="cart-item-price">$${item.price.toFixed(2)}</span>
      <button class="cart-remove" data-id="${item.id}" title="Remove">×</button>
    </div>
  `).join('');

  // Remove buttons
  cartItems.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(parseInt(btn.dataset.id));
      updateCartCount();
      renderCart();
    });
  });

  // Totals
  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);
  const fee = subtotal * 0.05;
  const total = subtotal + fee;

  summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
  summaryFee.textContent = `$${fee.toFixed(2)}`;
  summaryTotal.textContent = `$${total.toFixed(2)}`;
}

// ===== STRIPE =====
let stripe, cardElement;

function initStripe() {
  // Check if Stripe key is configured
  if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE') {
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
      cardElement.on('blur', () => cardBox.classList.remove('focused'));
      cardElement.on('change', e => {
        document.getElementById('card-errors').textContent = e.error ? e.error.message : '';
      });
    }
  } catch(err) {
    console.warn('Stripe init error:', err);
    showStripeSetupWarning();
    return;
  }

  const payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', handlePayment);
  }
}

async function handlePayment() {
  const name = document.getElementById('buyerName')?.value.trim();
  const email = document.getElementById('buyerEmail')?.value.trim();
  const cart = getCart();

  if (!name || !email) { alert('Please enter your name and email.'); return; }
  if (cart.length === 0) { alert('Your cart is empty.'); return; }

  const payBtn = document.getElementById('payBtn');
  payBtn.textContent = 'Processing...';
  payBtn.disabled = true;

  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);
  const fee = subtotal * 0.05;
  const totalCents = Math.round((subtotal + fee) * 100);

  // -------------------------------------------------------
  // IMPORTANT: In a real deployment you need a backend to:
  // 1. Create a PaymentIntent via Stripe API (server-side)
  // 2. Return the client_secret to the frontend
  // 3. Then call stripe.confirmCardPayment(clientSecret, ...)
  //
  // For this demo, we simulate a successful payment using
  // Stripe's test card: 4242 4242 4242 4242
  //
  // See README.md for how to add a real backend.
  // -------------------------------------------------------

  try {
    // Demo: create a test payment method to validate card input
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: { name, email }
    });

    if (error) {
      document.getElementById('card-errors').textContent = error.message;
      payBtn.textContent = 'Pay Now';
      payBtn.disabled = false;
      return;
    }

    // In production: send paymentMethod.id + totalCents to your backend,
    // create a PaymentIntent, then confirmCardPayment with client_secret.

    // Demo success simulation (card validated successfully):
    console.log('Payment method created:', paymentMethod.id, 'Amount:', totalCents, 'cents');
    showPaymentSuccess();

  } catch (err) {
    document.getElementById('card-errors').textContent = 'Payment failed. Please try again.';
    payBtn.textContent = 'Pay Now';
    payBtn.disabled = false;
  }
}

function showPaymentSuccess() {
  saveCart([]);
  updateCartCount();

  const form = document.getElementById('checkoutForm');
  const success = document.getElementById('paySuccess');
  const items = document.getElementById('cartItems');
  const summary = document.querySelector('.order-summary h3');

  if (form) form.classList.add('hidden');
  if (items) items.innerHTML = '<div class="empty-cart"><p>Order placed successfully!</p></div>';
  if (summary) summary.textContent = 'Order Confirmed';
  if (success) success.classList.remove('hidden');
}

function showStripeSetupWarning() {
  const cardBox = document.getElementById('card-element');
  const payBtn = document.getElementById('payBtn');

  if (cardBox) {
    cardBox.innerHTML = `
      <div style="padding:8px 0;font-size:0.85rem;color:#b85c38;">
        ⚠️ Stripe not configured yet. Add your publishable key to <code>checkout.js</code> to enable payments.
        <br/><a href="https://dashboard.stripe.com/test/apikeys" target="_blank" style="color:#b85c38;text-decoration:underline;">Get your test key →</a>
      </div>
    `;
  }

  if (payBtn) {
    payBtn.disabled = true;
    payBtn.textContent = 'Configure Stripe to Pay';
    payBtn.style.background = '#ccc';
    payBtn.style.cursor = 'not-allowed';
  }
}
