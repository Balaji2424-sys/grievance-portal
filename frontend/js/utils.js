/**
 * Global Utilities for Grievance Portal
 */

// ── Persistence ─────────────────────────────────────────────────────────────

/**
 * Get tracking ID from URL query param (?id=...) or localStorage.
 * URL parameter always takes precedence.
 */
function getGlobalTrackingId() {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id') || params.get('trackingId');

    if (idFromUrl) {
        return idFromUrl.trim().toUpperCase();
    }

    return localStorage.getItem('trackingId') || '';
}

/**
 * Store tracking ID in localStorage for persistence across sessions.
 */
function setGlobalTrackingId(id) {
    if (id) {
        localStorage.setItem('trackingId', id.trim().toUpperCase());
    }
}

// ── UI Components ───────────────────────────────────────────────────────────

/**
 * Dynamically loads the navbar.html component and injects it into #navbar.
 * Also highlights the active link.
 */
async function loadNavbar() {
    const navbarDiv = document.getElementById('navbar');
    if (!navbarDiv) return;

    try {
        const response = await fetch('components/navbar.html');
        if (!response.ok) throw new Error('Failed to load navbar component');

        const html = await response.text();
        navbarDiv.innerHTML = html;

        // Highlight active link
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const linkIdMap = {
            'index.html': 'nav-home',
            'track.html': 'nav-track',
            'chat.html': 'nav-chat',
            'admin.html': 'nav-admin',
            'super.html': 'nav-super'
        };

        const activeId = linkIdMap[currentPath];
        if (activeId) {
            const activeLink = document.getElementById(activeId);
            if (activeLink) activeLink.classList.add('active');
        }

    } catch (err) {
        console.error('Navbar error:', err);
    }
}

// ── Auto-Initialization ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadNavbar();
});
