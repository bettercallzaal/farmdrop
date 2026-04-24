(function () {
  async function applyContent() {
    try {
      const res = await fetch('/api/content?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const content = await res.json();

      const resolve = (path) =>
        path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), content);

      // Text swap for any element with data-field
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

      // href swap
      document.querySelectorAll('[data-field-href]').forEach((el) => {
        const val = resolve(el.dataset.fieldHref);
        if (val !== undefined && val !== null && val !== '') {
          el.setAttribute('href', val);
        } else if (val === '') {
          el.style.display = 'none';
        }
      });

      // YouTube iframe embed
      const ytId = (s) => {
        if (!s) return null;
        const str = String(s).trim();
        if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
        const m = str.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : null;
      };
      document.querySelectorAll('[data-render="youtube"]').forEach((el) => {
        const id = ytId(resolve(el.dataset.source));
        if (!id) { el.style.display = 'none'; return; }
        el.style.removeProperty('display');
        el.innerHTML =
          '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
          '?rel=0" title="YouTube video" frameborder="0" ' +
          'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
          'allowfullscreen loading="lazy"></iframe>';
      });

      document.querySelectorAll('[data-render="youtube-fallback"]').forEach((el) => {
        const id = ytId(resolve(el.dataset.source));
        if (id) el.style.display = 'none';
        else el.style.removeProperty('display');
      });

      // Tag rendering
      document.querySelectorAll('[data-render="tags"]').forEach((el) => {
        const raw = resolve(el.dataset.source);
        if (typeof raw !== 'string') return;
        const tagClass = el.dataset.tagClass || 'tag';
        const firstClass = el.dataset.firstClass;
        el.innerHTML = '';
        raw.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((label, i) => {
            const span = document.createElement('span');
            span.className = tagClass + (i === 0 && firstClass ? ' ' + firstClass : '');
            span.textContent = label;
            el.appendChild(span);
          });
      });

      // Chip list rendering
      document.querySelectorAll('[data-render="chips"]').forEach((el) => {
        const arr = resolve(el.dataset.source);
        if (!Array.isArray(arr)) return;
        const chipClass = el.dataset.chipClass || 'chip';
        el.innerHTML = '';
        arr.forEach((label) => {
          if (!label) return;
          const span = document.createElement('span');
          span.className = chipClass;
          span.textContent = String(label);
          el.appendChild(span);
        });
      });
    } catch (e) {
      console.warn('Content load failed, using static HTML:', e);
    }
  }

  // Initial render
  applyContent();

  // If the browser restores this page from bfcache (back/forward nav), the
  // DOM snapshot is the pre-swap version. Re-apply content so the user
  // doesn't see a stale flash.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) applyContent();
  });
})();
