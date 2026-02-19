// API_BASE is loaded from js/config.js

// ── Retrieve a Firebase ID token ──────────────────────────────────────────
async function getAuthToken() {
    return localStorage.getItem('idToken') || '';
}

// ── DOM refs ────────────────────────────────────────────────────────────────
const form = document.getElementById('complaint-form');
const submitBtn = document.getElementById('submit-btn');
const spinner = document.getElementById('spinner');
const btnLabel = document.getElementById('btn-label');
const successBox = document.getElementById('success-box');
const errorBox = document.getElementById('error-box');
const errorMsg = document.getElementById('error-msg');
const trackingIdEl = document.getElementById('tracking-id-text');
const copyBtn = document.getElementById('copy-btn');

// ── Helpers ─────────────────────────────────────────────────────────────────
function setLoading(on) {
    submitBtn.disabled = on;
    spinner.style.display = on ? 'block' : 'none';
    btnLabel.textContent = on ? 'Submitting…' : 'Submit Complaint';
}

function showSuccess(trackingId) {
    successBox.style.display = 'block';
    errorBox.style.display = 'none';
    trackingIdEl.textContent = trackingId;
}

function showError(message) {
    errorBox.style.display = 'block';
    successBox.style.display = 'none';
    errorMsg.textContent = message;
}

function hideResults() {
    successBox.style.display = 'none';
    errorBox.style.display = 'none';
}

// ── Form submit ─────────────────────────────────────────────────────────────
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideResults();

        const title = document.getElementById('title').value.trim();
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();

        // Client-side validation
        if (!title) return showError('Please enter a complaint title.');
        if (!category) return showError('Please select a category.');
        if (!description) return showError('Please provide a description.');

        setLoading(true);

        try {
            const token = await getAuthToken();

            const response = await fetch(`${API_BASE}/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ title, category, description }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server error (${response.status})`);
            }

            const trackingId = data.data.trackingId;

            // ── Persistence & Redirection ───────────────────────────────────
            setGlobalTrackingId(trackingId);

            showSuccess(trackingId);
            form.reset();

            // Notify user and redirect after a short delay
            setTimeout(() => {
                window.location.href = `track.html?id=${trackingId}`;
            }, 2000);

        } catch (err) {
            console.error('Submission error:', err);
            showError(err.message || 'Network error. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    });
}

// ── Copy tracking ID ────────────────────────────────────────────────────────
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const id = trackingIdEl.textContent;
        if (!id || id === '—') return;

        try {
            await navigator.clipboard.writeText(id);
            copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>`;
            setTimeout(() => {
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>`;
            }, 2000);
        } catch {
            // Fallback for older browsers
            const range = document.createRange();
            range.selectNode(trackingIdEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
        }
    });
}
