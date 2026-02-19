// Super Head logic

function getToken() { return localStorage.getItem('idToken') || ''; }

function esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function statusBadge(status) {
    const classMap = {
        'Pending': 'status-pending',
        'Under Review': 'status-review',
        'Investigation': 'status-investigation',
        'Resolved': 'status-resolved',
        'Rejected': 'status-rejected'
    };
    const cls = classMap[status] || 'status-pending';
    return `<span class="status-badge ${cls}">${esc(status)}</span>`;
}

async function loadData() {
    const tbody = document.getElementById('table-body');
    try {
        const res = await fetch(`${API_BASE}/super/complaints`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const complaints = data.data || [];
        tbody.innerHTML = complaints.map(c => `
            <tr>
                <td><span class="tracking-code">${esc(c.trackingId)}</span></td>
                <td>${esc(c.title)}</td>
                <td>${esc(c.category)}</td>
                <td>${statusBadge(c.status)}</td>
                <td>${esc(c.name || 'Anonymous')}</td>
                <td>${esc(c.email || '—')}</td>
                <td>${esc(c.phone || '—')}</td>
                <td>
                    <button class="action-btn" onclick="openChat('${c.trackingId}')">Chat</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--error)">${esc(err.message)}</td></tr>`;
    }
}

function openChat(tid) {
    setGlobalTrackingId(tid);
    window.location.href = `chat.html?id=${tid}&role=super`;
}

document.getElementById('refresh-btn').onclick = loadData;
loadData();
