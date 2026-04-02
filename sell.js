// sell.js — handles the sell listing form

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('sellForm');
  const success = document.getElementById('sellSuccess');
  const emojiPicker = document.getElementById('emojiPicker');

  let selectedEmoji = '📦';

  // Emoji picker
  if (emojiPicker) {
    emojiPicker.querySelectorAll('.emoji-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        emojiPicker.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedEmoji = opt.dataset.emoji;
      });
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('itemTitle').value.trim();
      const category = document.getElementById('itemCategory').value;
      const condition = document.getElementById('itemCondition').value;
      const desc = document.getElementById('itemDesc').value.trim();
      const price = parseFloat(document.getElementById('itemPrice').value);
      const seller = document.getElementById('sellerName').value.trim();

      if (!title || !category || !condition || !desc || !price || !seller) {
        alert('Please fill in all required fields.');
        return;
      }

      const items = getItems();
      const newItem = {
        id: Date.now(),
        title,
        category,
        condition,
        desc,
        price,
        seller,
        emoji: selectedEmoji,
        date: new Date().toISOString().split('T')[0]
      };

      items.unshift(newItem);
      saveItems(items);

      form.classList.add('hidden');
      success.classList.remove('hidden');
    });
  }
});
