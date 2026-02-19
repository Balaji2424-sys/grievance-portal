// Tracking logic
const input = document.getElementById('tracking-input');
const trackBtn = document.getElementById('track-btn');
const spinner = document.getElementById('spinner');
const btnLabel = document.getElementById('btn-label');
const result = document.getElementById('result');

const STATUS_META = {
    'Pending': { color: '#f59e0b', icon: '🕐', label: 'Pending' },
    'Under Review': { color: '#3b82f6', icon: '⚙️', label: 'Under Review' },
    'Investigation': { color: '#a78bfa', icon: '🔍', label: 'Investigation' },
    'Resolved': { color: '#10b981', icon: '✅', label: 'Resolved' },
    'Rejected': { color: '#f87171', icon: '❌', label: 'Rejected' },
};

function esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function fetchStatus() {
    const tid = input.value.trim().toUpperCase();
    if (!tid) return;

    trackBtn.disabled = true;
    spinner.style.display = 'block';
    btnLabel.textContent = '…';
    result.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(tid)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Not found');

        const c = data.data;
        const meta = STATUS_META[c.status] || { color: '#94a3b8', icon: '❓', label: c.status };

        result.className = '';
        result.style.display = 'block';
        result.innerHTML = `
            <div class="status-card" style="--status-color: ${meta.color}; padding-left: 1.8rem;">
                <div class="badge" style="color:${meta.color}">${meta.icon} &nbsp;${meta.label}</div>
                <div class="card-title">${esc(c.title)}</div>
                <p style="font-size:0.85rem; color:var(--muted); margin-bottom:1rem;">${esc(c.description)}</p>
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="key">Tracking ID</span>
                        <span class="val tracking-pill">${esc(c.trackingId)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="key">Submitted</span>
                        <span class="val">${formatDate(c.createdAt)}</span>
                    </div>
                </div>
                <div class="divider"></div>
                <button id="contact-admin-btn" class="track-btn" style="width:100%; margin-top:0.5rem; background: var(--surface-2); border: 1px solid var(--border); box-shadow:none;">
                    💬 Contact Admin via Chat
                </button>
            </div>`;

        document.getElementById('contact-admin-btn').onclick = () => {
            window.location.href = `chat.html?id=${c.trackingId}&role=user`;
        };

    } catch (err) {
        result.className = 'error';
        result.style.display = 'block';
        result.innerHTML = `<p>⚠️ ${esc(err.message)}</p>`;
    } finally {
        trackBtn.disabled = false;
        spinner.style.display = 'none';
        btnLabel.textContent = 'Track';
    }
}

trackBtn.onclick = fetchStatus;
input.onkeydown = (e) => { if (e.key === 'Enter') fetchStatus(); };

// ── Persistence & Auto-fetch ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const tid = getGlobalTrackingId();
    if (tid) {
        input.value = tid;
        fetchStatus();
    }
});
