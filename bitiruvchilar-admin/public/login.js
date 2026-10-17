document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('err'), go = document.getElementById('go');
  err.textContent = ''; go.disabled = true;
  try {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: document.getElementById('login').value, password: document.getElementById('password').value }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { err.textContent = j.error || 'Kirib boʻlmadi.'; go.disabled = false; return; }
    location.href = '/panel';
  } catch { err.textContent = 'Server bilan aloqa yoʻq.'; go.disabled = false; }
});
