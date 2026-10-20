/* ═══════════════════════════════════════════════════════════
   FFGlory — Shared JS
   API endpoints + helper functions
   ═══════════════════════════════════════════════════════════ */

// ═══════════════ API Endpoints ═══════════════
const API = {
    // Auth
    me:                     '/api/me',
    logout:                 '/api/logout',
    login:                  '/api/auth/login',
    signup:                 '/api/auth/signup',
    changePassword:         '/api/auth/change-password',

    // Credits / Transactions
    transactions:           '/api/transactions',
    buyCredits:             '/api/buyCredits',
    cancelTransaction:      '/api/transaction/cancel',
    updateTransactionOrderId: '/api/transaction/update-order-id',
    pricing:                '/api/pricing',

    // Notifications
    notifications:          '/api/notifications',
    vapidPublicKey:         '/api/vapid-public-key',
    pushSubscribe:          '/api/push/subscribe',

    // Inbox
    inboxMessages:          '/api/inbox/messages',
    inboxMarkRead:          '/api/inbox/mark-read',
    inboxMarkAllRead:       '/api/inbox/mark-all-read',
    inboxDismiss:           '/api/inbox/dismiss',

    // Groups (Client)
    clientGroups:           '/api/client/groups',
    clientLaunch:           '/api/client/launch',
    clientAction:           '/api/client/group-action',
    activityLog:            '/api/client/activity-log',

    // Coupons
    createCoupon:           '/api/coupons/create',
    myCoupons:              '/api/coupons/mine',
    redeemCoupon:           '/api/coupons/redeem',
    redeemedCoupons:        '/api/coupons/redeemed',
    cancelCoupon:           '/api/coupons/cancel',

    // Client alerts
    clientActiveAlert:      '/api/client/active-alert',
    clientDismissAlert:     '/api/client/dismiss-alert'
};

// ═══════════════ Global state ═══════════════
let currentUser = null;
let swRegistration = null;
let regionPricing = {};

// ═══════════════ Clipboard helper ═══════════════
async function clipCopy(text) {
    if (!text) return false;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        // Fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch (e) {
        console.error('clipCopy failed:', e);
        return false;
    }
}

// ═══════════════ HTML Escape ═══════════════
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ═══════════════ Toast Notifications ═══════════════
function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function showToast(message, type = 'info', duration = 3500) {
    const container = ensureToastContainer();
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span style="font-size:16px;">${icons[type] || icons.info}</span>
        <span style="flex:1;">${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ═══════════════ Message Modal (legacy helper) ═══════════════
function showMessage(title, body, type = 'info') {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="ng-card p-6 max-w-sm w-full modal-slide-up text-center">
            <div style="font-size:48px; margin-bottom:12px;">${icons[type] || 'ℹ️'}</div>
            <h3 class="heading text-lg font-bold mb-2" style="color:#fff;">${escapeHtml(title)}</h3>
            <p style="color:#a0a0b0; font-size:14px; margin-bottom:20px;">${escapeHtml(body)}</p>
            <button class="ng-btn-primary" onclick="this.closest('.fixed').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ═══════════════ Loading Overlay helpers ═══════════════
function showGroupsLoading() {
    const el = document.getElementById('groups-loading-overlay');
    if (el) el.classList.add('active');
}
function hideGroupsLoading() {
    const el = document.getElementById('groups-loading-overlay');
    if (el) el.classList.remove('active');
}

// ═══════════════ Refresh button spinner ═══════════════
function animateRefreshButton(btn) {
    const icon = btn.querySelector('.refresh-icon') || btn.querySelector('svg');
    if (!icon) return;
    icon.classList.add('spinning');
    setTimeout(() => icon.classList.remove('spinning'), 700);
}

// ═══════════════ Public contact info fetch ═══════════════
async function fetchPublicContactInfo() {
    try {
        const res = await fetch('/api/public/contact-info');
        if (!res.ok) return;
        const data = await res.json();
        if (data.telegram) {
            document.querySelectorAll('a[href*="t.me"], a[href*="telegram"], .social-telegram')
                .forEach(a => a.href = data.telegram);
        }
        if (data.whatsapp) {
            document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')
                .forEach(a => a.href = data.whatsapp);
        }
    } catch (e) {
        // silent
    }
}

// ═══════════════ Navigation helper ═══════════════
function goto(path) {
    window.location.href = path;
}

// ═══════════════ Format helpers ═══════════════
function formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return Number(n).toLocaleString();
}

function formatMoney(n) {
    if (n === null || n === undefined || isNaN(n)) return '0.00';
    return Number(n).toFixed(2);
}

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString();
    } catch { return iso; }
}