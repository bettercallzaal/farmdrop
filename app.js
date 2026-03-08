// ── Data ──
const REGIONS = [
  { id: 'unity', name: 'Unity / Central Maine' },
  { id: 'newport', name: 'Newport' },
  { id: 'midcoast', name: 'Midcoast' },
  { id: 'bluehill', name: 'Blue Hill' },
  { id: 'mdi', name: 'Mount Desert Island' },
  { id: 'portland', name: 'Portland' },
];

function loadData(key, fallback) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

let products = loadData('fd_products', []);
let demos = loadData('fd_demos', []);

// ── Tab Navigation ──
const navBtns = document.querySelectorAll('.nav-btn');
const tabs = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ── Populate region selects ──
function populateRegionSelects() {
  const selects = [
    document.getElementById('filter-region'),
    document.getElementById('filter-demo-region'),
    document.getElementById('demo-region'),
  ];

  selects.forEach(sel => {
    const isFilter = sel.id.startsWith('filter');
    const existing = sel.value;
    sel.innerHTML = isFilter ? '<option value="all">All Regions</option>' : '';
    REGIONS.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      sel.appendChild(opt);
    });
    if (existing) sel.value = existing;
  });
}

function populateRegionPriceInputs(existingPrices) {
  const container = document.getElementById('region-prices');
  container.innerHTML = '';
  REGIONS.forEach(r => {
    const div = document.createElement('div');
    div.className = 'region-price-input';
    const val = existingPrices && existingPrices[r.id] != null ? existingPrices[r.id] : '';
    div.innerHTML = `
      <label>${r.name}</label>
      <input type="number" step="0.01" min="0" name="price_${r.id}" placeholder="$0.00" value="${val}">
    `;
    container.appendChild(div);
  });
}

// ── Products ──
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');

document.getElementById('add-product-btn').addEventListener('click', () => {
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('edit-product-id').value = '';
  productForm.reset();
  populateRegionPriceInputs();
  productModal.classList.remove('hidden');
});

document.getElementById('cancel-product').addEventListener('click', () => {
  productModal.classList.add('hidden');
});

productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const category = document.getElementById('product-category').value;
  const unit = document.getElementById('product-unit').value.trim();

  const prices = {};
  REGIONS.forEach(r => {
    const input = productForm.querySelector(`[name="price_${r.id}"]`);
    const val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) prices[r.id] = val;
  });

  if (id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, category, unit, prices };
    }
  } else {
    products.push({
      id: 'p_' + Date.now(),
      name,
      category,
      unit,
      prices,
      created: new Date().toISOString(),
    });
  }

  saveData('fd_products', products);
  productModal.classList.add('hidden');
  renderProducts();
  renderDashboard();
});

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('edit-product-id').value = p.id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-category').value = p.category;
  document.getElementById('product-unit').value = p.unit;
  populateRegionPriceInputs(p.prices);
  productModal.classList.remove('hidden');
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  products = products.filter(p => p.id !== id);
  saveData('fd_products', products);
  renderProducts();
  renderDashboard();
}

function renderProducts() {
  const container = document.getElementById('product-list');
  const regionFilter = document.getElementById('filter-region').value;
  const catFilter = document.getElementById('filter-category').value;

  let filtered = products;
  if (catFilter !== 'all') {
    filtered = filtered.filter(p => p.category === catFilter);
  }
  if (regionFilter !== 'all') {
    filtered = filtered.filter(p => p.prices[regionFilter] != null);
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-msg">No products match your filters.</p>';
    return;
  }

  container.innerHTML = filtered.map(p => {
    const priceItems = REGIONS
      .filter(r => p.prices[r.id] != null)
      .map(r => `
        <div class="price-item">
          <span class="region-name">${r.name}</span>
          <span class="price-value">$${p.prices[r.id].toFixed(2)}/${p.unit}</span>
        </div>
      `).join('');

    return `
      <div class="product-card">
        <div class="product-card-header">
          <div>
            <h3>${escapeHtml(p.name)}</h3>
            <span class="badge">${p.category}</span>
          </div>
        </div>
        <div class="price-grid">${priceItems || '<em style="color:#999">No regional prices set</em>'}</div>
        <div class="card-actions">
          <button class="btn-edit" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('filter-region').addEventListener('change', renderProducts);
document.getElementById('filter-category').addEventListener('change', renderProducts);

// ── Demos ──
const demoModal = document.getElementById('demo-modal');
const demoForm = document.getElementById('demo-form');

document.getElementById('add-demo-btn').addEventListener('click', () => {
  document.getElementById('demo-modal-title').textContent = 'Schedule a Demo';
  document.getElementById('edit-demo-id').value = '';
  demoForm.reset();
  populateDemoProductChecklist();
  demoModal.classList.remove('hidden');
});

document.getElementById('cancel-demo').addEventListener('click', () => {
  demoModal.classList.add('hidden');
});

function populateDemoProductChecklist(selected) {
  const container = document.getElementById('demo-products-checklist');
  if (products.length === 0) {
    container.innerHTML = '<em style="color:#999;font-size:0.85rem">Add products first</em>';
    return;
  }
  const sel = selected || [];
  container.innerHTML = products.map(p => `
    <label>
      <input type="checkbox" name="demo_product" value="${p.id}" ${sel.includes(p.id) ? 'checked' : ''}>
      ${escapeHtml(p.name)}
    </label>
  `).join('');
}

demoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-demo-id').value;
  const title = document.getElementById('demo-title').value.trim();
  const region = document.getElementById('demo-region').value;
  const date = document.getElementById('demo-date').value;
  const time = document.getElementById('demo-time').value;
  const description = document.getElementById('demo-description').value.trim();
  const checkedProducts = Array.from(demoForm.querySelectorAll('[name="demo_product"]:checked')).map(c => c.value);

  if (id) {
    const idx = demos.findIndex(d => d.id === id);
    if (idx !== -1) {
      demos[idx] = { ...demos[idx], title, region, date, time, description, products: checkedProducts };
    }
  } else {
    demos.push({
      id: 'd_' + Date.now(),
      title,
      region,
      date,
      time,
      description,
      products: checkedProducts,
      created: new Date().toISOString(),
    });
  }

  saveData('fd_demos', demos);
  demoModal.classList.add('hidden');
  renderDemos();
  renderDashboard();
});

function editDemo(id) {
  const d = demos.find(x => x.id === id);
  if (!d) return;
  document.getElementById('demo-modal-title').textContent = 'Edit Demo';
  document.getElementById('edit-demo-id').value = d.id;
  document.getElementById('demo-title').value = d.title;
  document.getElementById('demo-region').value = d.region;
  document.getElementById('demo-date').value = d.date;
  document.getElementById('demo-time').value = d.time;
  document.getElementById('demo-description').value = d.description || '';
  populateDemoProductChecklist(d.products);
  demoModal.classList.remove('hidden');
}

function deleteDemo(id) {
  if (!confirm('Delete this demo?')) return;
  demos = demos.filter(d => d.id !== id);
  saveData('fd_demos', demos);
  renderDemos();
  renderDashboard();
}

function renderDemos() {
  const container = document.getElementById('demo-list');
  const regionFilter = document.getElementById('filter-demo-region').value;

  let filtered = demos;
  if (regionFilter !== 'all') {
    filtered = filtered.filter(d => d.region === regionFilter);
  }

  filtered.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-msg">No demos scheduled.</p>';
    return;
  }

  container.innerHTML = filtered.map(d => {
    const regionName = REGIONS.find(r => r.id === d.region)?.name || d.region;
    const featuredProducts = (d.products || [])
      .map(pid => products.find(p => p.id === pid))
      .filter(Boolean)
      .map(p => `<span class="demo-product-tag">${escapeHtml(p.name)}</span>`)
      .join('');

    const dateStr = new Date(d.date + 'T' + d.time).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    const timeStr = new Date('2000-01-01T' + d.time).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    });

    return `
      <div class="demo-card">
        <div class="demo-card-header">
          <h3>${escapeHtml(d.title)}</h3>
          <span class="badge">${regionName}</span>
        </div>
        <div class="demo-details">
          <span>${dateStr}</span>
          <span>${timeStr}</span>
        </div>
        ${d.description ? `<p class="demo-description">${escapeHtml(d.description)}</p>` : ''}
        ${featuredProducts ? `<div class="demo-products-list">${featuredProducts}</div>` : ''}
        <div class="card-actions">
          <button class="btn-edit" onclick="editDemo('${d.id}')">Edit</button>
          <button class="btn-danger" onclick="deleteDemo('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('filter-demo-region').addEventListener('change', renderDemos);

// ── Dashboard ──
function renderDashboard() {
  document.getElementById('stat-products').textContent = products.length;
  document.getElementById('stat-demos').textContent = demos.length;

  // Recent products
  const recentProducts = document.getElementById('recent-products');
  if (products.length === 0) {
    recentProducts.innerHTML = '<p class="empty-msg">No products yet. Add some in the Products tab.</p>';
  } else {
    const recent = products.slice(-3).reverse();
    recentProducts.innerHTML = recent.map(p => {
      const priceCount = Object.keys(p.prices).length;
      return `<div style="padding:0.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
        <span><strong>${escapeHtml(p.name)}</strong> <span class="badge">${p.category}</span></span>
        <span style="color:#666;font-size:0.85rem">${priceCount} region${priceCount !== 1 ? 's' : ''}</span>
      </div>`;
    }).join('');
  }

  // Upcoming demos
  const upcomingDemos = document.getElementById('upcoming-demos');
  const today = new Date().toISOString().split('T')[0];
  const upcoming = demos.filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  if (upcoming.length === 0) {
    upcomingDemos.innerHTML = '<p class="empty-msg">No upcoming demos.</p>';
  } else {
    upcomingDemos.innerHTML = upcoming.map(d => {
      const regionName = REGIONS.find(r => r.id === d.region)?.name || d.region;
      return `<div style="padding:0.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
        <span><strong>${escapeHtml(d.title)}</strong> <span class="badge">${regionName}</span></span>
        <span style="color:#666;font-size:0.85rem">${d.date}</span>
      </div>`;
    }).join('');
  }
}

// ── Helpers ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ──
populateRegionSelects();
renderProducts();
renderDemos();
renderDashboard();
