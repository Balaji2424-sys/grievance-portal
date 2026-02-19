// Chat logic
const params = new URLSearchParams(window.location.search);
const TRACKING_ID = getGlobalTrackingId();
const ROLE_PARAM = params.get('role') || 'user'; // default to user
const POLL_MS = 3000;

document.getElementById('complaint-id-label').textContent = TRACKING_ID || 'No Tracking ID';

function getToken() { return localStorage.getItem('idToken') || ''; }
function esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const msgContainer = document.getElementById('messages');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const roleSelect = document.getElementById('role-select');
const loadingState = document.getElementById('loading-state');

let knownIds = new Set();
let pollTimer = null;
let isSending = false;

// Set initial role from param if provided
if (ROLE_PARAM) {
    roleSelect.value = ROLE_PARAM;
}

function scrollToBottom() { msgContainer.scrollTop = msgContainer.scrollHeight; }

function renderBubble(msg) {
    const wrap = document.createElement('div');
    // Align based on sender role relative to current view
    const side = (msg.sender === ROLE_PARAM) ? 'student' : 'committee'; // reusing existing classes for alignment
    wrap.className = `bubble-wrap ${side}`;
    wrap.innerHTML = `
        <div class="bubble" style="${msg.sender === 'admin' ? 'border-left: 3px solid #6c63ff;' : msg.sender === 'super' ? 'border-left: 3px solid #d946ef;' : ''}">
            ${esc(msg.text)}
        </div>
        <div class="bubble-meta">
            <strong style="text-transform: capitalize;">${esc(msg.sender)}</strong> · ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>`;
    msgContainer.appendChild(wrap);
}

async function fetchMessages() {
    if (!TRACKING_ID) return;
    try {
        const res = await fetch(`${API_BASE}/messages/${TRACKING_ID}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const messages = data.data || [];
        if (loadingState) loadingState.remove();

        let hasNew = false;
        messages.forEach(msg => {
            if (!knownIds.has(msg.id)) {
                knownIds.add(msg.id);
                renderBubble(msg);
                hasNew = true;
            }
        });

        if (hasNew) scrollToBottom();
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

async function sendMessage() {
    const text = msgInput.value.trim();
    const sender = roleSelect.value;
    if (!text || isSending || !TRACKING_ID) return;

    isSending = true;
    sendBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/messages/${TRACKING_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, text })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        msgInput.value = '';
        fetchMessages(); // trigger immediate refresh
    } catch (err) {
        alert(err.message);
    } finally {
        isSending = false;
        sendBtn.disabled = false;
    }
}

sendBtn.onclick = sendMessage;
msgInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

function startPolling() {
    fetchMessages();
    pollTimer = setInterval(fetchMessages, POLL_MS);
}

startPolling();
