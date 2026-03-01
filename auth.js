// ── Safety Portal 공통 인증 모듈 ──────────────────────────────
// 관리자(Admin) + 일반 사용자(User) Google OAuth 로그인

const AUTH = (() => {
  const CLIENT_ID = '167323077293-8gsd86rn7fjvo7dvo4994fhm6opr19cd.apps.googleusercontent.com';
  const ADMIN_SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
  const USER_SCOPE  = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

  // ── Admin ──
  function getToken()    { return localStorage.getItem('admin_token') || ''; }
  function getExpiry()   { return parseInt(localStorage.getItem('admin_expiry') || '0'); }
  function isAdmin()     { return !!(getToken() && Date.now() < getExpiry()); }
  function getProfile()  { return JSON.parse(localStorage.getItem('admin_profile') || '{}'); }

  // ── User ──
  function getUserToken()   { return localStorage.getItem('user_token') || ''; }
  function getUserExpiry()  { return parseInt(localStorage.getItem('user_expiry') || '0'); }
  function isUser()         { return !!(getUserToken() && Date.now() < getUserExpiry()); }
  function isLoggedIn()     { return isAdmin() || isUser(); }
  function getUserProfile() { return JSON.parse(localStorage.getItem('user_profile') || '{}'); }
  function getAnyProfile()  { return isAdmin() ? getProfile() : getUserProfile(); }

  function saveAdmin(resp) {
    localStorage.setItem('admin_token', resp.access_token);
    localStorage.setItem('admin_expiry', Date.now() + (resp.expires_in - 60) * 1000);
  }
  function saveUser(resp) {
    localStorage.setItem('user_token', resp.access_token);
    localStorage.setItem('user_expiry', Date.now() + (resp.expires_in - 60) * 1000);
  }
  function clearAdmin() {
    ['admin_token','admin_expiry','admin_profile'].forEach(k => localStorage.removeItem(k));
  }
  function clearUser() {
    ['user_token','user_expiry','user_profile'].forEach(k => localStorage.removeItem(k));
  }

  // ── 관리자 Nav 버튼 주입 ──
  function injectNavButton(navEl) {
    if (document.getElementById('adminNavBtn')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'authNavWrapper';
    wrapper.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:8px;position:relative;';
    wrapper.innerHTML = `
      <!-- 사용자 로그인 버튼 -->
      <button id="userNavBtn" onclick="AUTH.toggleUserDropdown()" style="
        display:flex;align-items:center;gap:7px;font-size:12px;padding:5px 12px;
        border-radius:6px;border:1px solid var(--border,#2c3347);background:var(--bg3,#1e2330);
        color:var(--muted2,#94a3b8);cursor:pointer;font-family:inherit;transition:all .15s;">
        <span id="userNavDot" style="width:7px;height:7px;border-radius:50%;background:var(--muted,#64748b);display:block;"></span>
        <span id="userNavLabel">사용자 로그인</span>
      </button>
      <!-- 관리자 로그인 버튼 -->
      <button id="adminNavBtn" onclick="AUTH.toggleDropdown()" style="
        display:flex;align-items:center;gap:7px;font-size:12px;padding:5px 12px;
        border-radius:6px;border:1px solid var(--border,#2c3347);background:var(--bg3,#1e2330);
        color:var(--muted2,#94a3b8);cursor:pointer;font-family:inherit;transition:all .15s;">
        <span id="adminNavDot" style="width:7px;height:7px;border-radius:50%;background:var(--muted,#64748b);display:block;"></span>
        <span id="adminNavLabel">관리자 로그인</span>
      </button>

      <!-- 관리자 드롭다운 -->
      <div id="adminDropdown" style="
        display:none;position:fixed;top:60px;right:16px;width:290px;
        background:var(--bg2,#171b24);border:1px solid var(--border,#2c3347);border-radius:12px;
        padding:20px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.6);">
        <div id="adminLoginView">
          <div style="font-size:14px;font-weight:700;margin-bottom:6px;">🔐 관리자 로그인</div>
          <div style="font-size:12px;color:var(--muted2,#94a3b8);margin-bottom:16px;line-height:1.6;">
            구글 계정으로 로그인하면<br>사진 업로드 및 삭제가 가능합니다.
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
        <div id="adminLoggedView" style="display:none;">
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3,#1e2330);border-radius:8px;margin-bottom:12px;">
            <img id="adminAvatar" src="" alt="" style="width:36px;height:36px;border-radius:50%;border:2px solid #22c55e;">
            <div>
              <div id="adminName" style="font-size:13px;font-weight:600;"></div>
              <div id="adminEmail" style="font-size:11px;color:var(--muted2,#94a3b8);"></div>
            </div>
          </div>
          <div style="font-size:11px;color:#22c55e;margin-bottom:12px;">✅ 관리자 권한으로 로그인됨</div>
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

      <!-- 사용자 드롭다운 -->
      <div id="userDropdown" style="
        display:none;position:fixed;top:60px;right:130px;width:290px;
        background:var(--bg2,#171b24);border:1px solid var(--border,#2c3347);border-radius:12px;
        padding:20px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.6);">
        <div id="userLoginView">
          <div style="font-size:14px;font-weight:700;margin-bottom:6px;">👤 사용자 로그인</div>
          <div style="font-size:12px;color:var(--muted2,#94a3b8);margin-bottom:16px;line-height:1.6;">
            구글 계정으로 로그인하면<br>작성한 양식을 저장하고 불러올 수 있습니다.
          </div>
          <button onclick="AUTH.userLogin()" style="
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
        <div id="userLoggedView" style="display:none;">
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3,#1e2330);border-radius:8px;margin-bottom:12px;">
            <img id="userAvatar" src="" alt="" style="width:36px;height:36px;border-radius:50%;border:2px solid #3b82f6;">
            <div>
              <div id="userName" style="font-size:13px;font-weight:600;"></div>
              <div id="userEmail" style="font-size:11px;color:var(--muted2,#94a3b8);"></div>
            </div>
          </div>
          <div style="font-size:11px;color:#3b82f6;margin-bottom:12px;">✅ 로그인됨 — 양식 저장 가능</div>
          <button onclick="AUTH.userLogout()" style="
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
    if (navLinks && navLinks.id === 'navRight') {
      navLinks.appendChild(wrapper);
      navLinks.style.marginLeft = 'auto';
    } else if (navLinks && navLinks.classList && navLinks.classList.contains('nav-links')) {
      navLinks.after(wrapper);
    } else {
      navEl.appendChild(wrapper);
    }

    // 외부 클릭 닫기
    document.addEventListener('click', e => {
      if (!e.target.closest('#adminDropdown') && !e.target.closest('#adminNavBtn')) {
        const dd = document.getElementById('adminDropdown');
        if (dd) dd.style.display = 'none';
      }
      if (!e.target.closest('#userDropdown') && !e.target.closest('#userNavBtn')) {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.style.display = 'none';
      }
    });

    updateUI();
  }

  function toggleDropdown() {
    const dd = document.getElementById('adminDropdown');
    if (!dd) return;
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    document.getElementById('userDropdown').style.display = 'none';
    updateUI();
  }

  function toggleUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (!dd) return;
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    document.getElementById('adminDropdown').style.display = 'none';
    updateUI();
  }

  function login() {
    if (typeof google === 'undefined') { alert('Google API 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: ADMIN_SCOPE,
      prompt: 'select_account',
      callback: async (resp) => {
        if (resp.error) { showMsg('❌ 로그인 실패: ' + resp.error); return; }
        saveAdmin(resp);
        try {
          const p = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` }
          }).then(r => r.json());
          localStorage.setItem('admin_profile', JSON.stringify({ name: p.name, email: p.email, picture: p.picture }));
        } catch {}
        updateUI();
        showMsg('✅ 관리자 로그인 완료');
        document.getElementById('adminDropdown').style.display = 'none';
        if (typeof window.onAdminLogin === 'function') window.onAdminLogin();
      }
    });
    client.requestAccessToken();
  }

  function userLogin() {
    if (typeof google === 'undefined') { alert('Google API 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: USER_SCOPE,
      prompt: 'select_account',
      callback: async (resp) => {
        if (resp.error) { showMsg('❌ 로그인 실패: ' + resp.error); return; }
        saveUser(resp);
        try {
          const p = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` }
          }).then(r => r.json());
          localStorage.setItem('user_profile', JSON.stringify({ name: p.name, email: p.email, picture: p.picture }));
        } catch {}
        updateUI();
        showMsg('✅ 로그인 완료 — 양식을 저장할 수 있습니다');
        document.getElementById('userDropdown').style.display = 'none';
        if (typeof window.onUserLogin === 'function') window.onUserLogin();
      }
    });
    client.requestAccessToken();
  }

  function logout() {
    const token = getToken();
    if (token) try { google.accounts.oauth2.revoke(token, ()=>{}); } catch {}
    clearAdmin();
    updateUI();
    showMsg('관리자 로그아웃됨');
    document.getElementById('adminDropdown').style.display = 'none';
    if (typeof window.onAdminLogout === 'function') window.onAdminLogout();
  }

  function userLogout() {
    const token = getUserToken();
    if (token) try { google.accounts.oauth2.revoke(token, ()=>{}); } catch {}
    clearUser();
    updateUI();
    showMsg('로그아웃됨');
    document.getElementById('userDropdown').style.display = 'none';
    if (typeof window.onUserLogout === 'function') window.onUserLogout();
  }

  function updateUI() {
    // 관리자 버튼
    const adminDot = document.getElementById('adminNavDot');
    const adminLbl = document.getElementById('adminNavLabel');
    const adminBtn = document.getElementById('adminNavBtn');
    const adminLoginV  = document.getElementById('adminLoginView');
    const adminLoggedV = document.getElementById('adminLoggedView');
    if (adminDot) {
      const admin = isAdmin();
      adminDot.style.background = admin ? '#22c55e' : 'var(--muted,#64748b)';
      adminDot.style.boxShadow  = admin ? '0 0 5px #22c55e' : '';
      adminBtn.style.borderColor = admin ? '#22c55e' : 'var(--border,#2c3347)';
      adminBtn.style.color = admin ? '#22c55e' : 'var(--muted2,#94a3b8)';
      adminLbl.textContent = admin ? '관리자' : '관리자 로그인';
      if (adminLoginV)  adminLoginV.style.display  = admin ? 'none'  : 'block';
      if (adminLoggedV) adminLoggedV.style.display = admin ? 'block' : 'none';
      if (admin) {
        const p = getProfile();
        const av = document.getElementById('adminAvatar');
        const nm = document.getElementById('adminName');
        const em = document.getElementById('adminEmail');
        if (av && p.picture) av.src = p.picture;
        if (nm && p.name)    nm.textContent = p.name;
        if (em && p.email)   em.textContent = p.email;
      }
    }
    // 사용자 버튼
    const userDot = document.getElementById('userNavDot');
    const userLbl = document.getElementById('userNavLabel');
    const userBtn = document.getElementById('userNavBtn');
    const userLoginV  = document.getElementById('userLoginView');
    const userLoggedV = document.getElementById('userLoggedView');
    if (userDot) {
      const user = isUser();
      userDot.style.background = user ? '#3b82f6' : 'var(--muted,#64748b)';
      userDot.style.boxShadow  = user ? '0 0 5px #3b82f6' : '';
      userBtn.style.borderColor = user ? '#3b82f6' : 'var(--border,#2c3347)';
      userBtn.style.color = user ? '#93c5fd' : 'var(--muted2,#94a3b8)';
      const p = getUserProfile();
      userLbl.textContent = user && p.name ? p.name : '사용자 로그인';
      if (userLoginV)  userLoginV.style.display  = user ? 'none'  : 'block';
      if (userLoggedV) userLoggedV.style.display = user ? 'block' : 'none';
      if (user) {
        const av = document.getElementById('userAvatar');
        const nm = document.getElementById('userName');
        const em = document.getElementById('userEmail');
        if (av && p.picture) av.src = p.picture;
        if (nm && p.name)    nm.textContent = p.name;
        if (em && p.email)   em.textContent = p.email;
      }
    }
    // 페이지별 UI 갱신 콜백
    if (typeof window.onAuthStateChange === 'function') window.onAuthStateChange();
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
    toggleDropdown, toggleUserDropdown,
    injectNavButton, updateUI, showMsg
  };
})();

// 페이지 로드 시 nav에 자동 주입
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  if (nav) AUTH.injectNavButton(nav);
});
