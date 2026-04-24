(async function () {
  try {
    const res = await fetch('/content.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const content = await res.json();

    const resolve = (path) =>
      path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), content);

    document.querySelectorAll('[data-field]').forEach((el) => {
      const val = resolve(el.dataset.field);
      if (val !== undefined && val !== null && val !== '') {
        el.textContent = val;
        el.style.removeProperty('display');
      } else if (val === '') {
        if (el.tagName === 'A' || el.tagName === 'SPAN') {
          el.style.display = 'none';
        }
      }
    });

    document.querySelectorAll('[data-field-href]').forEach((el) => {
      const val = resolve(el.dataset.fieldHref);
      if (val !== undefined && val !== null && val !== '') {
        el.setAttribute('href', val);
      } else if (val === '') {
        el.style.display = 'none';
      }
    });
  } catch (e) {
    console.warn('Content load failed, using static HTML:', e);
  }
})();
