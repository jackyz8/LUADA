/* ═══════════════════════════════════════════════════════════
   FFGlory — Login / Signup Page Logic
   ═══════════════════════════════════════════════════════════ */

const IS_DEV = (function () {
    const host = window.location.hostname;
    return (
        host === 'localhost' || host === '127.0.0.1' ||
        /^192\.168\./.test(host) || /^10\./.test(host) ||
        /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
        !window.location.protocol.startsWith('https')
    );
})();

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');

    if (!loginForm || !signupForm) return;

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        if (loginTab) loginTab.className = 'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-[#F5E6D3] to-[#D4C4A8] text-[#0E0E0E] shadow-sm';
        if (signupTab) signupTab.className = 'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all text-[var(--ng-text-muted)] hover:text-white hover:bg-white/5';
        if (title) title.textContent = 'Welcome Back';
        if (subtitle) subtitle.innerHTML = 'Sign in to <span class="text-[#F5E6D3] font-semibold">FFGlory</span> panel';
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        if (signupTab) signupTab.className = 'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-[#F5E6D3] to-[#D4C4A8] text-[#0E0E0E] shadow-sm';
        if (loginTab) loginTab.className = 'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all text-[var(--ng-text-muted)] hover:text-white hover:bg-white/5';
        if (title) title.textContent = 'Create Account';
        if (subtitle) subtitle.innerHTML = 'Join <span class="text-[#F5E6D3] font-semibold">FFGlory</span> today';
    }
}

let _turnstileToken = IS_DEV ? 'dev-bypass-token' : null;

function onTurnstileSuccess(token) {
    _turnstileToken = token;
    const btn = document.getElementById('signup-btn');
    if (btn) btn.disabled = false;
}

function onTurnstileExpired() {
    if (IS_DEV) return;
    _turnstileToken = null;
    const btn = document.getElementById('signup-btn');
    if (btn) btn.disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupSuccess = document.getElementById('signup-success');

    if (window.location.pathname === '/signup' || window.location.hash === '#signup') {
        switchAuthTab('signup');
    }
    if (IS_DEV) {
        const btn = document.getElementById('signup-btn');
        if (btn) btn.disabled = false;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-btn');
            const text = document.getElementById('login-text');
            const origText = text ? text.textContent : 'Sign In';

            const fd = new FormData(loginForm);
            const payload = { username: fd.get('username'), password: fd.get('password') };

            if (loginError) loginError.classList.add('hidden');
            if (btn) btn.disabled = true;
            if (text) text.textContent = 'Signing in...';

            try {
                const res = await fetch(API.login, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    // ⭐ Admin → /admin, User → /client
                    window.location.href = (data.role === 'admin') ? '/admin' : '/client';
                    return;
                }

                let errMsg = 'Login failed';
                try {
                    const data = await res.json();
                    errMsg = data.error || data.message || errMsg;
                } catch { errMsg = await res.text() || errMsg; }
                if (loginError) {
                    loginError.textContent = errMsg;
                    loginError.classList.remove('hidden');
                }
            } catch (err) {
                if (loginError) {
                    loginError.textContent = 'Network error. Please try again.';
                    loginError.classList.remove('hidden');
                }
            } finally {
                if (btn) btn.disabled = false;
                if (text) text.textContent = origText;
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwd = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm-password').value;
            const btn = document.getElementById('signup-btn');
            const text = document.getElementById('signup-text');
            const origText = text ? text.textContent : 'Create Account';

            if (signupSuccess) signupSuccess.classList.add('hidden');
            if (loginError) loginError.classList.add('hidden');

            if (pwd !== confirm) {
                if (loginError) {
                    loginError.textContent = 'Passwords do not match';
                    loginError.classList.remove('hidden');
                }
                return;
            }
            if (pwd.length < 6) {
                if (loginError) {
                    loginError.textContent = 'Password must be at least 6 characters';
                    loginError.classList.remove('hidden');
                }
                return;
            }
            if (!IS_DEV && !_turnstileToken) {
                if (loginError) {
                    loginError.textContent = 'Please complete the security check';
                    loginError.classList.remove('hidden');
                }
                return;
            }

            const fd = new FormData(signupForm);
            const payload = {
                username: fd.get('username'),
                password: pwd,
                turnstile_token: _turnstileToken || '',
                invitation_code: fd.get('invitation_code') || ''
            };

            if (btn) btn.disabled = true;
            if (text) text.textContent = 'Creating...';

            try {
                const res = await fetch(API.signup, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    if (signupSuccess) {
                        signupSuccess.textContent = 'Account created! You can now sign in.';
                        signupSuccess.classList.remove('hidden');
                    }
                    setTimeout(() => switchAuthTab('login'), 1500);
                    signupForm.reset();
                    if (!IS_DEV) _turnstileToken = null;
                } else {
                    let errMsg = 'Signup failed';
                    try {
                        const data = await res.json();
                        errMsg = data.error || data.message || errMsg;
                    } catch { errMsg = await res.text() || errMsg; }
                    if (loginError) {
                        loginError.textContent = errMsg;
                        loginError.classList.remove('hidden');
                    }
                }
            } catch (err) {
                if (loginError) {
                    loginError.textContent = 'Network error. Please try again.';
                    loginError.classList.remove('hidden');
                }
            } finally {
                if (btn) btn.disabled = false;
                if (text) text.textContent = origText;
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') && loginError) {
        loginError.textContent = params.get('msg');
        loginError.classList.remove('hidden');
    }
});