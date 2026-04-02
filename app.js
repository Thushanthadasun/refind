// app.js — runs on all pages

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();

  // Only run listing logic on index page
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  let activeCategory = 'all';
  let sortOrder = 'newest';

  function renderListings() {
    let items = getItems();

    // Filter
    if (activeCategory !== 'all') {
      items = items.filter(i => i.category === activeCategory);
    }

    // Sort
    if (sortOrder === 'price-low') items.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') items.sort((a, b) => b.price - a.price);
    else items.sort((a, b) => new Date(b.date) - new Date(a.date));

    const cart = getCart();
    const cartIds = cart.map(c => c.id);

    if (items.length === 0) {
      grid.innerHTML = '<p style="color:#888;padding:40px 0;">No items in this category yet.</p>';
      return;
    }

    grid.innerHTML = items.map(item => {
      const inCart = cartIds.includes(item.id);
      return `
        <div class="item-card" data-id="${item.id}">
          <div class="item-card-img">${item.emoji}</div>
          <div class="item-card-body">
            <h3>${item.title}</h3>
            <div class="item-card-meta">
              <span class="item-condition">${item.condition}</span>
              <span class="item-seller">by ${item.seller}</span>
            </div>
            <p style="font-size:0.82rem;color:#888;margin-bottom:10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${item.desc}</p>
            <div class="item-card-footer">
              <span class="item-price">$${item.price}</span>
              <button class="add-to-cart" data-id="${item.id}" ${inCart ? 'disabled' : ''}>
                ${inCart ? 'In Cart ✓' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach add-to-cart events
    grid.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        addToCart(id);
        btn.textContent = 'In Cart ✓';
        btn.disabled = true;
        showToast('Item added to cart!');
      });
    });
  }

  // Category pills
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.cat;
      renderListings();
    });
  });

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortOrder = sortSelect.value;
      renderListings();
    });
  }

  renderListings();
});

// Toast notification
function showToast(msg) {
  const existing = document.getElementById('refind-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'refind-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px;
    background: #1a1a1a; color: #fff;
    padding: 12px 22px; border-radius: 100px;
    font-size: 0.9rem; font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 9999; animation: slideUp 0.3s ease;
  `;

  const style = document.createElement('style');
  style.textContent = '@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }';
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
