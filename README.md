# 🛍️ ReFind — Second-Hand Marketplace

A clean, fully functional second-hand marketplace website you can deploy for free on GitHub Pages.

---

## ✅ Features

- **Browse listings** with category filters and sorting
- **Add items to cart** (persisted in localStorage)
- **Sell items** via a listing form
- **Stripe payment integration** (test mode ready, live mode instructions below)
- Mobile-friendly responsive design
- No backend needed for basic functionality

---

## 🚀 Deploy to GitHub Pages (Step-by-Step)

### Step 1 — Create a GitHub Account

Go to [https://github.com](https://github.com) and sign up (free).

---

### Step 2 — Create a New Repository

1. Click the **+** icon (top right) → **New repository**
2. Name it: `refind` (or any name you like)
3. Set it to **Public**
4. Do **NOT** check "Initialize with README" (we'll upload our files)
5. Click **Create repository**

---

### Step 3 — Upload Your Website Files

**Option A — Upload via browser (easiest):**
1. In your new repository, click **"uploading an existing file"**
2. Drag and drop ALL these files at once:
   - `index.html`
   - `sell.html`
   - `cart.html`
   - `styles.css`
   - `data.js`
   - `app.js`
   - `sell.js`
   - `checkout.js`
3. Scroll down, click **Commit changes**

**Option B — Upload via Git (for developers):**
```bash
# In the folder where your files are saved:
git init
git add .
git commit -m "Initial commit — ReFind marketplace"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/refind.git
git push -u origin main
```

---

### Step 4 — Enable GitHub Pages

1. In your repository, click **Settings** (top menu)
2. Scroll down to **Pages** (left sidebar)
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1–2 minutes. GitHub will show you a URL like:
   `https://YOUR_USERNAME.github.io/refind`

🎉 **Your site is live!**

---

## 💳 Setting Up Stripe Payments

### Test Mode (No real money — start here)

1. Go to [https://stripe.com](https://stripe.com) and create a free account
2. In the Stripe Dashboard, go to **Developers → API Keys**
3. Copy your **Publishable key** (starts with `pk_test_...`)
4. Open `checkout.js` and replace this line:
   ```javascript
   const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE';
   ```
   with:
   ```javascript
   const STRIPE_PUBLISHABLE_KEY = 'pk_test_abc123yourrealkeyhere';
   ```
5. Save and re-upload `checkout.js` to GitHub

**Test card numbers:**
| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | ✅ Payment succeeds |
| `4000 0000 0000 9995` | ❌ Payment declined |

Use any future expiry date and any 3-digit CVC.

---

### ⚠️ Important: Adding a Real Backend for Live Payments

The demo simulates payment by creating a payment method client-side.
**For real live payments**, you need a backend server to:

1. Create a Stripe **PaymentIntent** (must be done server-side for security)
2. Return the `client_secret` to the frontend
3. The frontend then calls `stripe.confirmCardPayment(clientSecret, ...)`

**Easiest free backend options:**
- [Netlify Functions](https://www.netlify.com/products/functions/) — deploy site on Netlify instead of GitHub Pages
- [Vercel Serverless Functions](https://vercel.com/docs/functions) — free tier available
- [Supabase Edge Functions](https://supabase.com/edge-functions) — free tier available
- [Railway](https://railway.app) — easy Node.js hosting

**Example backend (Node.js / Express):**
```javascript
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');

app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // in cents
    currency: 'usd',
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

Then in `checkout.js`, replace the demo section with:
```javascript
// 1. Call your backend
const res = await fetch('/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: totalCents })
});
const { clientSecret } = await res.json();

// 2. Confirm payment with Stripe
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement, billing_details: { name, email } }
});

if (error) { /* handle error */ }
else { showPaymentSuccess(); }
```

---

## 🔄 Making Updates After Deployment

Every time you change a file:
1. Edit the file locally
2. Go to your GitHub repository
3. Click the file → ✏️ Edit → paste new content → **Commit changes**
4. Your live site updates automatically in ~1 minute

---

## 📁 File Structure

```
refind/
├── index.html       ← Main shop page
├── sell.html        ← Sell an item
├── cart.html        ← Cart + checkout
├── styles.css       ← All styling
├── data.js          ← Data storage + cart logic
├── app.js           ← Shop listings + filtering
├── sell.js          ← Sell form logic
├── checkout.js      ← Stripe payment logic
└── README.md        ← This file
```

---

## 🛠️ Customisation Tips

| What | Where |
|---|---|
| Change site name | Search "ReFind" in all `.html` files |
| Change colours | Edit `--accent` variable in `styles.css` |
| Add categories | Edit `cat-grid` in `index.html` and `sell.html` |
| Change platform fee | Edit `* 0.05` in `checkout.js` |
| Add sample listings | Edit `SAMPLE_ITEMS` array in `data.js` |
| Change currency | Replace `$` with your currency symbol in HTML/JS files |

---

## ❓ Common Issues

**"My site shows a 404 error"**
→ Make sure `index.html` is in the root of your repository (not in a subfolder)

**"GitHub Pages isn't updating"**
→ Wait 2–3 minutes and hard refresh (Ctrl+Shift+R)

**"Stripe card element isn't showing"**
→ Make sure you replaced the placeholder key in `checkout.js`

**"Items I listed disappear on refresh"**
→ This is expected — items are stored in your browser's localStorage. Different browsers/devices won't see each other's listings. For a real shared database, you'd need a backend service like Firebase or Supabase.
