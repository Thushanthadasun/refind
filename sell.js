// sell.js — listing form
// SECURITY FIXES:
// [FIX-1] XSS: all values passed through validateItem() in data.js before storage
// [FIX-2] Input validation: category/condition/emoji locked to whitelist values
// [FIX-8] Rate limiting: max 5 listings per 10 minutes (stored in localStorage)
// [FIX-9] Price validation: enforced client-side (backend must re-validate too)
// [FIX-6] IDs: crypto.randomUUID() via generateId()

const RATE_LIMIT_MAX      = 5;    // max listings
const RATE_LIMIT_WINDOW   = 10 * 60 * 1000; // per 10 minutes (ms)

document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('sellForm');
  const success = document.getElementById('sellSuccess');
  const picker  = document.getElementById('emojiPicker');

  let selectedEmoji = '📦';

  if (picker) {
    picker.querySelectorAll('.emoji-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        picker.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedEmoji = opt.dataset.emoji;
      });
    });
  }

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();

    // [FIX-8] Rate limit check
    if (isRateLimited()) {
      showFormError('You have posted too many listings recently. Please wait a few minutes and try again.');
      return;
    }

    const title     = document.getElementById('itemTitle').value.trim();
    const category  = document.getElementById('itemCategory').value;
    const condition = document.getElementById('itemCondition').value;
    const desc      = document.getElementById('itemDesc').value.trim();
    const priceRaw  = document.getElementById('itemPrice').value;
    const seller    = document.getElementById('sellerName').value.trim();
    const price     = parseFloat(priceRaw);

    // [FIX-9] Client-side validation (mirrors server-side rules in validateItem)
    let hasError = false;
    if (!title || title.length < 3) {
      showFieldError('itemTitle', 'Title must be at least 3 characters.'); hasError = true;
    }
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      showFieldError('itemCategory', 'Please select a category.'); hasError = true;
    }
    if (!condition || !ALLOWED_CONDITIONS.includes(condition)) {
      showFieldError('itemCondition', 'Please select a condition.'); hasError = true;
    }
    if (!desc || desc.length < 10) {
      showFieldError('itemDesc', 'Description must be at least 10 characters.'); hasError = true;
    }
    if (isNaN(price) || price < 0.01 || price > 99999) {
      showFieldError('itemPrice', 'Price must be between $0.01 and $99,999.'); hasError = true;
    }
    if (!seller || seller.length < 2) {
      showFieldError('sellerName', 'Please enter your name.'); hasError = true;
    }
    if (hasError) return;

    // [FIX-2] Emoji validated against whitelist
    const safeEmoji = ALLOWED_EMOJIS.includes(selectedEmoji) ? selectedEmoji : '📦';

    const rawItem = {
      id:        generateId(), // [FIX-6] crypto.randomUUID()
      title,
      category,
      condition,
      desc,
      price:     Math.round(price * 100) / 100, // round to 2 decimal places
      seller,
      emoji:     safeEmoji,
      date:      new Date().toISOString().split('T')[0]
    };

    // validateItem() in data.js will sanitize & re-validate before storage
    const items = getItems();
    items.unshift(rawItem);
    saveItems(items);

    recordSubmission(); // [FIX-8] update rate limit counter
    form.classList.add('hidden');
    success.classList.remove('hidden');
  });
});

// ── Rate limiting ────────────────────────────────────────────────────────────
function isRateLimited() {
  try {
    const raw = localStorage.getItem('refind_submissions');
    const timestamps = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    return recent.length >= RATE_LIMIT_MAX;
  } catch {
    return false;
  }
}

function recordSubmission() {
  try {
    const raw = localStorage.getItem('refind_submissions');
    const timestamps = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    recent.push(now);
    localStorage.setItem('refind_submissions', JSON.stringify(recent));
  } catch {}
}

// ── Field-level error display ────────────────────────────────────────────────
function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.style.borderColor = '#c0392b';
  let errEl = field.parentElement.querySelector('.field-error');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.className = 'field-error';
    errEl.style.cssText = 'color:#c0392b;font-size:0.8rem;margin-top:4px;';
    field.parentElement.appendChild(errEl);
  }
  errEl.textContent = msg; // textContent — safe
}

function showFormError(msg) {
  let errEl = document.getElementById('formError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'formError';
    errEl.style.cssText = 'color:#c0392b;font-size:0.9rem;margin-bottom:16px;padding:12px;background:#fdecea;border-radius:8px;';
    const form = document.getElementById('sellForm');
    form.insertBefore(errEl, form.firstChild);
  }
  errEl.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('input,select,textarea').forEach(el => {
    el.style.borderColor = '';
  });
  const formErr = document.getElementById('formError');
  if (formErr) formErr.remove();
}
