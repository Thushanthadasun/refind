// Sample item data — stored in localStorage for persistence
const SAMPLE_ITEMS = [
  { id: 1, title: "Vintage Acoustic Guitar", category: "music", condition: "Good", price: 120, seller: "Marcus", emoji: "🎸", desc: "Beautiful 1970s acoustic guitar. Some wear but plays beautifully. Great for beginners.", date: "2025-01-10" },
  { id: 2, title: "Canon AE-1 Film Camera", category: "electronics", condition: "Like New", price: 85, seller: "Sofia", emoji: "📷", desc: "Classic 35mm SLR. Works perfectly. Includes 50mm f/1.8 lens and original case.", date: "2025-01-12" },
  { id: 3, title: "Mid-Century Coffee Table", category: "furniture", condition: "Good", price: 220, seller: "James", emoji: "🛋️", desc: "Solid teak wood, hairpin legs. A few minor scratches but very sturdy. 120cm x 60cm.", date: "2025-01-08" },
  { id: 4, title: "Levi's 501 Jeans W32 L32", category: "clothing", condition: "Like New", price: 45, seller: "Priya", emoji: "👕", desc: "Only worn twice. Classic blue wash. Perfect condition.", date: "2025-01-14" },
  { id: 5, title: "Mountain Bike — Trek 820", category: "sports", condition: "Good", price: 340, seller: "Alex", emoji: "🚲", desc: "21-speed Trek mountain bike. New brakes and tires. Rides great. Small scuff on frame.", date: "2025-01-07" },
  { id: 6, title: "Complete Harry Potter Set", category: "books", condition: "Fair", price: 30, seller: "Emma", emoji: "📚", desc: "All 7 books. Some covers creased from reading. Great set for any Potter fan!", date: "2025-01-15" },
  { id: 7, title: "iPhone 13 — 128GB", category: "electronics", condition: "Good", price: 480, seller: "Raj", emoji: "📱", desc: "Midnight blue. Screen protector always on. No damage. Battery at 91% health. Unlocked.", date: "2025-01-11" },
  { id: 8, title: "Vintage Seiko Watch", category: "clothing", condition: "Like New", price: 160, seller: "Nina", emoji: "⌚", desc: "1980s Seiko automatic. Recently serviced. Keeps perfect time. Original bracelet.", date: "2025-01-09" },
  { id: 9, title: "MacBook Air M1 2020", category: "electronics", condition: "Like New", price: 750, seller: "Tom", emoji: "💻", desc: "Space grey, 8GB RAM, 256GB SSD. Perfect condition. Includes original charger and box.", date: "2025-01-13" },
  { id: 10, title: "Yoga Mat + Blocks Set", category: "sports", condition: "Good", price: 25, seller: "Laura", emoji: "🧘", desc: "Thick non-slip mat + 2 foam blocks. Lightly used. Clean and odor-free.", date: "2025-01-06" },
  { id: 11, title: "Abstract Canvas Painting", category: "furniture", condition: "Like New", price: 75, seller: "Chris", emoji: "🎨", desc: "Original acrylic on canvas. 60x80cm. Warm earth tones. Signed by local artist.", date: "2025-01-05" },
  { id: 12, title: "Nike Air Max 90 — UK9", category: "clothing", condition: "Good", price: 60, seller: "Jamie", emoji: "👟", desc: "Classic colourway. Light crease on toe box. Soles still solid. Comes with box.", date: "2025-01-16" }
];

function getItems() {
  try {
    const stored = localStorage.getItem('refind_items');
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  // seed with samples
  localStorage.setItem('refind_items', JSON.stringify(SAMPLE_ITEMS));
  return SAMPLE_ITEMS;
}

function saveItems(items) {
  localStorage.setItem('refind_items', JSON.stringify(items));
}

function getCart() {
  try {
    const c = localStorage.getItem('refind_cart');
    return c ? JSON.parse(c) : [];
  } catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem('refind_cart', JSON.stringify(cart));
}

function addToCart(itemId) {
  const items = getItems();
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  const cart = getCart();
  // Prevent duplicate (each used item is unique)
  if (cart.find(c => c.id === itemId)) return;
  cart.push(item);
  saveCart(cart);
  updateCartCount();
}

function removeFromCart(itemId) {
  let cart = getCart();
  cart = cart.filter(c => c.id !== itemId);
  saveCart(cart);
}

function updateCartCount() {
  const count = getCart().length;
  document.querySelectorAll('#navCartCount').forEach(el => {
    el.textContent = count;
  });
}
