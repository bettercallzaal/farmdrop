(async function () {
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

    // Render a comma-separated string as a series of <span class="tag"> children
    // Use: <div data-render="tags" data-source="events.may24.tags" data-tag-class="tag"></div>
    document.querySelectorAll('[data-render="tags"]').forEach((el) => {
      const raw = resolve(el.dataset.source);
      if (typeof raw !== 'string') return;
      const tagClass = el.dataset.tagClass || 'tag';
      const firstClass = el.dataset.firstClass; // optional: apply to first tag
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

    // YouTube iframe embed - shows iframe when URL is set, hides otherwise
    // Use: <div data-render="youtube" data-source="interview.youtube_url"></div>
    const ytId = (s) => {
      if (!s) return null;
      const str = String(s).trim();
      if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
      const m = str.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
      return m ? m[1] : null;
    };
    document.querySelectorAll('[data-render="youtube"]').forEach((el) => {
      const id = ytId(resolve(el.dataset.source));
      if (!id) { el.style.display = 'none'; el.dataset.hasVideo = ''; return; }
      el.dataset.hasVideo = '1';
      el.style.removeProperty('display');
      el.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
        '?rel=0" title="YouTube video" frameborder="0" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
        'allowfullscreen loading="lazy"></iframe>';
    });

    // Element is shown only when a data-source has NO youtube URL (fallback CTA)
    // Use: <a data-render="youtube-fallback" data-source="interview.youtube_url" ...>
    document.querySelectorAll('[data-render="youtube-fallback"]').forEach((el) => {
      const id = ytId(resolve(el.dataset.source));
      if (id) el.style.display = 'none';
    });

    // Render an array of strings as a list of chips
    // Use: <div data-render="chips" data-source="markets" data-chip-class="market-chip"></div>
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
})();
