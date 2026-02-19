// API_BASE is loaded from js/config.js

// ── Role Config ─────────────────────────────────────────────────────────────
const STATUSES = ['Pending', 'Under Review', 'Investigation', 'Resolved', 'Rejected'];

let allComplaints = [];

// ── Auth ────────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('idToken') || '';
}

// ── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = (type === 'success' ? '✅ ' : '⚠️ ') + msg;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3000);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status) {
  const classMap = {
    'Pending': 'status-pending',
    'Under Review': 'status-review',
    'Investigation': 'status-investigation',
    'Resolved': 'status-resolved',
    'Rejected': 'status-rejected'
  };
  const cls = classMap[status] || 'status-pending';
  return `<span class="status-badge ${cls}">${escHtml(status)}</span>`;
}

// ── Update stats counters ────────────────────────────────────────────────────
function updateStats(complaints) {
  document.getElementById('stat-total').textContent = complaints.length;
  document.getElementById('stat-pending').textContent = complaints.filter(c => c.status === 'Pending').length;
  document.getElementById('stat-progress').textContent = complaints.filter(c => c.status === 'Under Review' || c.status === 'Investigation').length;
  document.getElementById('stat-resolved').textContent = complaints.filter(c => c.status === 'Resolved').length;
  document.getElementById('stat-rejected').textContent = complaints.filter(c => c.status === 'Rejected').length;
}

// ── Render table ─────────────────────────────────────────────────────────────
function renderTable(complaints) {
  const tbody = document.getElementById('table-body');

  if (!complaints.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="table-state">
          <div class="icon">📭</div>
          <p>No complaints found.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => `
    <tr data-id="${escHtml(c.id)}">
      <td><span class="tracking-code">${escHtml(c.trackingId || '—')}</span></td>
      <td><div class="cell-title" title="${escHtml(c.title)}">${escHtml(c.title || '—')}</div></td>
      <td><span class="cell-category">${escHtml(c.category || '—')}</span></td>
      <td><span class="cell-date">${formatDate(c.createdAt)}</span></td>
      <td id="status-cell-${escHtml(c.id)}">${statusBadge(c.status)}</td>
      <td>
        <div class="update-cell">
          <select id="sel-${escHtml(c.id)}" aria-label="Select new status">
            ${STATUSES.map(s =>
    `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`
  ).join('')}
          </select>
          <button class="save-btn" id="btn-${escHtml(c.id)}" onclick="updateStatus('${escHtml(c.id)}')">Save</button>
          <button class="save-btn" style="background:var(--surface-2); margin-left: 5px;" onclick="openChat('${escHtml(c.trackingId)}')">Chat</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Fetch all complaints ─────────────────────────────────────────────────────
async function loadComplaints() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = `
    <tr><td colspan="6">
      <div class="table-state">
        <div class="loader"></div>
        <p>Loading complaints…</p>
      </div>
    </td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/admin/complaints`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

    allComplaints = data.data || [];
    updateStats(allComplaints);
    renderTable(allComplaints);

  } catch (err) {
    console.error('Load error:', err);
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="table-state error">
          <div class="icon">⚠️</div>
          <p>${escHtml(err.message || 'Failed to load complaints.')}</p>
        </div>
      </td></tr>`;
  }
}

// ── Update complaint status ──────────────────────────────────────────────────
async function updateStatus(id) {
  const sel = document.getElementById(`sel-${id}`);
  const btn = document.getElementById(`btn-${id}`);
  const newStatus = sel.value;

  btn.disabled = true;
  btn.textContent = '…';

  try {
    const res = await fetch(`${API_BASE}/admin/complaints/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

    // Update badge in-place
    document.getElementById(`status-cell-${id}`).innerHTML = statusBadge(newStatus);

    // Sync local data
    const item = allComplaints.find(c => c.id === id);
    if (item) item.status = newStatus;
    updateStats(allComplaints);

    showToast(`Status updated to "${newStatus}".`, 'success');

  } catch (err) {
    console.error('Update error:', err);
    showToast(err.message || 'Failed to update status.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

function openChat(trackingId) {
  setGlobalTrackingId(trackingId);
  window.location.href = `chat.html?id=${trackingId}&role=admin`;
}

// ── Event listeners ──────────────────────────────────────────────────────────
document.getElementById('refresh-btn').onclick = loadComplaints;
document.getElementById('filter-status').onchange = (e) => {
  const filter = e.target.value;
  const filtered = filter ? allComplaints.filter(c => c.status === filter) : allComplaints;
  renderTable(filtered);
};

// Initial load
loadComplaints();
