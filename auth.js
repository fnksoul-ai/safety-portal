// ── Safety Portal 공통 인증 모듈 ──────────────────────────────
// Google OAuth 단일 로그인 — 이메일로 관리자 자동 판별

const AUTH = (() => {
  const CLIENT_ID    = '167323077293-8gsd86rn7fjvo7dvo4994fhm6opr19cd.apps.googleusercontent.com';
  const SCOPE        = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
  const ADMIN_EMAILS = ['fnksoul@gmail.com', 'grvflow@gmail.com'];

  // ── Admin ──
  function getToken()   { return localStorage.getItem('admin_token') || ''; }
  function getExpiry()  { return parseInt(localStorage.getItem('admin_expiry') || '0'); }
  function isAdmin()    { return !!(getToken() && Date.now() < getExpiry()); }
  function getProfile() { return JSON.parse(localStorage.getItem('admin_profile') || '{}'); }

  // ── User ──
  function getUserToken()   { return localStorage.getItem('user_token') || ''; }
  function getUserExpiry()  { return parseInt(localStorage.getItem('user_expiry') || '0'); }
  function isUser()         { return !!(getUserToken() && Date.now() < getUserExpiry()); }
  function isLoggedIn()     { return isAdmin() || isUser(); }
  function getUserProfile() { return JSON.parse(localStorage.getItem('user_profile') || '{}'); }
  function getAnyProfile()  { return isAdmin() ? getProfile() : getUserProfile(); }

  function saveAdmin(resp) {
    localStorage.setItem('admin_token',  resp.access_token);
    localStorage.setItem('admin_expiry', Date.now() + (resp.expires_in - 60) * 1000);
  }
  function saveUser(resp) {
    localStorage.setItem('user_token',  resp.access_token);
    localStorage.setItem('user_expiry', Date.now() + (resp.expires_in - 60) * 1000);
  }
  function clearAdmin() {
    ['admin_token','admin_expiry','admin_profile'].forEach(k => localStorage.removeItem(k));
  }
  function clearUser() {
    ['user_token','user_expiry','user_profile'].forEach(k => localStorage.removeItem(k));
  }

  // ── Nav 버튼 주입 ──
  function injectNavButton(navEl) {
    if (document.getElementById('authNavBtn')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'authNavWrapper';
    wrapper.style.cssText = 'display:flex;align-items:center;position:relative;';
    wrapper.innerHTML = `
      <button id="authNavBtn" onclick="AUTH.toggleDropdown()"
        onmouseover="this.style.color='var(--text,#f1f5f9)';this.style.background='var(--bg3,#1e2330)'"
        onmouseout="AUTH._restoreNavBtn(this)"
        style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:6px;
               border:none;background:transparent;color:var(--muted2,#94a3b8);
               cursor:pointer;font-size:13px;font-weight:500;font-family:inherit;transition:all .15s;">
        <span id="authNavDot" style="width:6px;height:6px;border-radius:50%;background:var(--muted,#64748b);display:block;flex-shrink:0;"></span>
        <span id="authNavLabel">LOG IN</span>
      </button>

      <div id="authDropdown" style="
        display:none;position:fixed;top:60px;right:16px;width:290px;
        background:var(--bg2,#171b24);border:1px solid var(--border,#2c3347);border-radius:12px;
        padding:20px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.6);">

        <div id="authLoginView">
          <div style="font-size:14px;font-weight:700;margin-bottom:6px;">🔐 로그인</div>
          <div style="font-size:12px;color:var(--muted2,#94a3b8);margin-bottom:16px;line-height:1.6;">
            구글 계정으로 로그인하세요.<br>관리자 계정은 자동으로 인식됩니다.
          </div>
          <button onclick="AUTH.login()" style="
            width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
            padding:11px;border-radius:7px;border:1px solid #ddd;background:#fff;
            color:#333;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            구글 계정으로 로그인
          </button>
        </div>

        <div id="authLoggedView" style="display:none;">
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3,#1e2330);border-radius:8px;margin-bottom:12px;">
            <img id="authAvatar" src="" alt="" style="width:36px;height:36px;border-radius:50%;border:2px solid #22c55e;">
            <div>
              <div id="authName" style="font-size:13px;font-weight:600;"></div>
              <div id="authEmail" style="font-size:11px;color:var(--muted2,#94a3b8);"></div>
            </div>
          </div>
          <div id="authRoleBadge" style="font-size:11px;color:#22c55e;margin-bottom:12px;"></div>
          <button onclick="AUTH.logout()" style="
            width:100%;padding:8px;border-radius:7px;border:1px solid #ef4444;
            background:transparent;color:#ef4444;font-size:12px;font-weight:600;
            cursor:pointer;font-family:inherit;transition:all .15s;"
            onmouseover="this.style.background='#ef4444';this.style.color='#fff'"
            onmouseout="this.style.background='transparent';this.style.color='#ef4444'">
            로그아웃
          </button>
        </div>
      </div>
    `;

    const navLinks = navEl.querySelector('.nav-links') || navEl.querySelector('.nav-right') || navEl.querySelector('#navRight');
    if (navLinks) {
      navLinks.appendChild(wrapper);
    } else {
      navEl.appendChild(wrapper);
    }

    document.addEventListener('click', e => {
      const dd  = document.getElementById('authDropdown');
      const btn = document.getElementById('authNavBtn');
      if (dd && btn && !dd.contains(e.target) && !btn.contains(e.target)) {
        dd.style.display = 'none';
      }
    });

    updateUI();
  }

  function _restoreNavBtn(btn) {
    btn.style.background = 'transparent';
    btn.style.color = isAdmin() ? '#22c55e' : (isUser() ? '#93c5fd' : 'var(--muted2,#94a3b8)');
  }

  function toggleDropdown() {
    const dd = document.getElementById('authDropdown');
    if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  }

  // ── 통합 로그인: 이메일로 관리자 자동 판별 ──
  function login() {
    if (typeof google === 'undefined') { alert('Google API 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      prompt: 'select_account',
      callback: async (resp) => {
        if (resp.error) { showMsg('❌ 로그인 실패: ' + resp.error); return; }
        try {
          const p = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` }
          }).then(r => r.json());

          const profile = { name: p.name, email: p.email, picture: p.picture };

          if (ADMIN_EMAILS.includes(p.email)) {
            saveAdmin(resp);
            localStorage.setItem('admin_profile', JSON.stringify(profile));
            showMsg('✅ 관리자로 로그인됨');
            if (typeof window.onAdminLogin === 'function') window.onAdminLogin();
          } else {
            saveUser(resp);
            localStorage.setItem('user_profile', JSON.stringify(profile));
            showMsg('✅ 로그인됨 — 양식을 저장할 수 있습니다');
            if (typeof window.onUserLogin === 'function') window.onUserLogin();
          }
        } catch {
          saveUser(resp);
          showMsg('✅ 로그인됨');
        }
        updateUI();
        const dd = document.getElementById('authDropdown');
        if (dd) dd.style.display = 'none';
        if (typeof window.onAuthStateChange === 'function') window.onAuthStateChange();
      }
    });
    client.requestAccessToken();
  }

  // 하위 호환
  function userLogin() { login(); }

  function logout() {
    const token = getToken() || getUserToken();
    if (token) try { google.accounts.oauth2.revoke(token, () => {}); } catch {}
    clearAdmin();
    clearUser();
    updateUI();
    showMsg('로그아웃됨');
    const dd = document.getElementById('authDropdown');
    if (dd) dd.style.display = 'none';
    if (typeof window.onAdminLogout   === 'function') window.onAdminLogout();
    if (typeof window.onUserLogout    === 'function') window.onUserLogout();
    if (typeof window.onAuthStateChange === 'function') window.onAuthStateChange();
  }

  function userLogout() { logout(); }

  function updateUI() {
    const dot     = document.getElementById('authNavDot');
    const lbl     = document.getElementById('authNavLabel');
    const btn     = document.getElementById('authNavBtn');
    const loginV  = document.getElementById('authLoginView');
    const loggedV = document.getElementById('authLoggedView');
    if (!dot) return;

    const admin   = isAdmin();
    const user    = isUser();
    const profile = admin ? getProfile() : (user ? getUserProfile() : {});

    if (admin) {
      dot.style.background = '#22c55e';
      dot.style.boxShadow  = '0 0 5px #22c55e';
      btn.style.color      = '#22c55e';
      lbl.textContent      = profile.name || 'ADMIN';
    } else if (user) {
      dot.style.background = '#3b82f6';
      dot.style.boxShadow  = '0 0 5px #3b82f6';
      btn.style.color      = '#93c5fd';
      lbl.textContent      = profile.name || 'LOG IN';
    } else {
      dot.style.background = 'var(--muted,#64748b)';
      dot.style.boxShadow  = '';
      btn.style.color      = 'var(--muted2,#94a3b8)';
      lbl.textContent      = 'LOG IN';
    }

    if (loginV)  loginV.style.display  = (admin || user) ? 'none'  : 'block';
    if (loggedV) loggedV.style.display = (admin || user) ? 'block' : 'none';

    if (admin || user) {
      const av   = document.getElementById('authAvatar');
      const nm   = document.getElementById('authName');
      const em   = document.getElementById('authEmail');
      const role = document.getElementById('authRoleBadge');
      if (av) { av.src = profile.picture || ''; av.style.borderColor = admin ? '#22c55e' : '#3b82f6'; }
      if (nm && profile.name)  nm.textContent = profile.name;
      if (em && profile.email) em.textContent = profile.email;
      if (role) { role.textContent = admin ? '✅ 관리자 권한으로 로그인됨' : '✅ 로그인됨 — 양식 저장 가능'; role.style.color = admin ? '#22c55e' : '#3b82f6'; }
    }
  }

  function showMsg(msg) {
    let t = document.getElementById('authToast');
    if (!t) {
      t = document.createElement('div'); t.id = 'authToast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--bg3,#1e2330);border:1px solid var(--border,#2c3347);border-radius:8px;padding:10px 20px;font-size:13px;color:var(--text,#f1f5f9);z-index:9999;opacity:0;transition:all .3s;pointer-events:none;font-family:inherit;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 2500);
  }

  return {
    isAdmin, getToken, getExpiry, getProfile,
    isUser, getUserToken, getUserProfile, isLoggedIn, getAnyProfile,
    login, logout, userLogin, userLogout,
    toggleDropdown, toggleUserDropdown: toggleDropdown,
    injectNavButton, updateUI, showMsg,
    _restoreNavBtn
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  if (nav) AUTH.injectNavButton(nav);
});
