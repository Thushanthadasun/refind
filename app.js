// app.js — runs on all pages
// SECURITY FIXES:
// [FIX-1] XSS: all user data inserted via esc() before innerHTML, or via textContent
// [FIX-7] CSP-friendly: no eval(), no new Function(), no javascript: URLs

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();

  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  let activeCategory = 'all';
  let sortOrder = 'newest';

  function renderListings() {
    let items = getItems();

    if (activeCategory !== 'all') {
      items = items.filter(i => i.category === activeCategory);
    }

    if (sortOrder === 'price-low')  items.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') items.sort((a, b) => b.price - a.price);
    else items.sort((a, b) => new Date(b.date) - new Date(a.date));

    const cart    = getCart();
    const cartIds = new Set(cart.map(c => c.id));

    grid.innerHTML = '';

    if (items.length === 0) {
      const msg = document.createElement('p');
      msg.style.cssText = 'color:#888;padding:40px 0;';
      msg.textContent = 'No items in this category yet.';
      grid.appendChild(msg);
      return;
    }

    // [FIX-1] Build cards using DOM API + textContent — never raw innerHTML with user data
    items.forEach(item => {
      const inCart = cartIds.has(item.id);

      const card = document.createElement('div');
      card.className = 'item-card';
      card.dataset.id = item.id;

      // Emoji is validated against a whitelist in data.js — safe to use directly
      const imgDiv = document.createElement('div');
      imgDiv.className = 'item-card-img';
      imgDiv.textContent = item.emoji;

      const body = document.createElement('div');
      body.className = 'item-card-body';

      const h3 = document.createElement('h3');
      h3.textContent = item.title; // textContent, NOT innerHTML

      const meta = document.createElement('div');
      meta.className = 'item-card-meta';

      const condBadge = document.createElement('span');
      condBadge.className = 'item-condition';
      condBadge.textContent = item.condition;

      const sellerSpan = document.createElement('span');
      sellerSpan.className = 'item-seller';
      sellerSpan.textContent = 'by ' + item.seller;

      meta.appendChild(condBadge);
      meta.appendChild(sellerSpan);

      const descP = document.createElement('p');
      descP.style.cssText = 'font-size:0.82rem;color:#888;margin-bottom:10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;';
      descP.textContent = item.desc;

      const footer = document.createElement('div');
      footer.className = 'item-card-footer';

      const priceSpan = document.createElement('span');
      priceSpan.className = 'item-price';
      priceSpan.textContent = '$' + item.price.toFixed(2);

      const btn = document.createElement('button');
      btn.className = 'add-to-cart';
      btn.dataset.id = item.id;
      btn.disabled = inCart;
      btn.textContent = inCart ? 'In Cart ✓' : 'Add to Cart';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        addToCart(id);
        btn.textContent = 'In Cart ✓';
        btn.disabled = true;
        showToast('Item added to cart!');
      });

      footer.appendChild(priceSpan);
      footer.appendChild(btn);

      body.appendChild(h3);
      body.appendChild(meta);
      body.appendChild(descP);
      body.appendChild(footer);

      card.appendChild(imgDiv);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.cat;
      renderListings();
    });
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortOrder = sortSelect.value;
      renderListings();
    });
  }

  renderListings();
});

// Toast — message is always a hardcoded string, never user data
function showToast(msg) {
  const existing = document.getElementById('refind-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'refind-toast';
  toast.textContent = msg; // textContent — safe even if msg were user-supplied
  toast.style.cssText = [
    'position:fixed','bottom:24px','right:24px',
    'background:#1a1a1a','color:#fff',
    'padding:12px 22px','border-radius:100px',
    'font-size:0.9rem','font-weight:500',
    'box-shadow:0 8px 24px rgba(0,0,0,0.2)',
    'z-index:9999','animation:slideUp 0.3s ease'
  ].join(';');

  if (!document.getElementById('refind-toast-style')) {
    const style = document.createElement('style');
    style.id = 'refind-toast-style';
    style.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
