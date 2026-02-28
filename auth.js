// ── Safety Portal 공통 관리자 인증 모듈 ──────────────────────
// 모든 페이지에서 공유되는 Google OAuth 관리자 로그인

const AUTH = (() => {
  const CLIENT_ID = '167323077293-8gsd86rn7fjvo7dvo4994fhm6opr19cd.apps.googleusercontent.com';
  const SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

  function getToken()   { return localStorage.getItem('admin_token') || ''; }
  function getExpiry()  { return parseInt(localStorage.getItem('admin_expiry') || '0'); }
  function isAdmin()    { return !!(getToken() && Date.now() < getExpiry()); }
  function getProfile() { return JSON.parse(localStorage.getItem('admin_profile') || '{}'); }

  function save(resp) {
    localStorage.setItem('admin_token', resp.access_token);
    localStorage.setItem('admin_expiry', Date.now() + (resp.expires_in - 60) * 1000);
  }
  function clear() {
    ['admin_token','admin_expiry','admin_profile'].forEach(k => localStorage.removeItem(k));
  }

  // 네비게이션 HTML 주입
  function injectNavButton(navEl) {
    // 이미 있으면 스킵
    if (document.getElementById('adminNavBtn')) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:10px;position:relative;';
    wrapper.innerHTML = `
      <button id="adminNavBtn" onclick="AUTH.toggleDropdown()" style="
        display:flex;align-items:center;gap:7px;font-size:12px;padding:5px 12px;
        border-radius:6px;border:1px solid var(--border);background:var(--bg3);
        color:var(--muted2);cursor:pointer;font-family:inherit;transition:all .15s;">
        <span id="adminNavDot" style="width:7px;height:7px;border-radius:50%;background:var(--muted);display:block;"></span>
        <span id="adminNavLabel">관리자 로그인</span>
      </button>
      <div id="adminDropdown" style="
        display:none;position:fixed;top:60px;right:16px;width:290px;
        background:var(--bg2);border:1px solid var(--border);border-radius:12px;
        padding:20px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.6);">
        <div id="adminLoginView">
          <div style="font-size:14px;font-weight:700;margin-bottom:6px;">🔐 관리자 로그인</div>
          <div style="font-size:12px;color:var(--muted2);margin-bottom:16px;line-height:1.6;">
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
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:8px;margin-bottom:12px;">
            <img id="adminAvatar" src="" alt="" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--green);">
            <div>
              <div id="adminName" style="font-size:13px;font-weight:600;"></div>
              <div id="adminEmail" style="font-size:11px;color:var(--muted2);"></div>
            </div>
          </div>
          <div style="font-size:11px;color:var(--green);margin-bottom:12px;">✅ 관리자 권한으로 로그인됨</div>
          <button onclick="AUTH.logout()" style="
            width:100%;padding:8px;border-radius:7px;border:1px solid var(--red);
            background:transparent;color:var(--red);font-size:12px;font-weight:600;
            cursor:pointer;font-family:inherit;transition:all .15s;"
            onmouseover="this.style.background='var(--red)';this.style.color='#fff'"
            onmouseout="this.style.background='transparent';this.style.color='var(--red)'">
            로그아웃
          </button>
        </div>
      </div>`;

    // nav에서 nav-links 다음 or nav 끝에 추가
    const navLinks = navEl.querySelector('.nav-links') || navEl.querySelector('.nav-right');
    if (navLinks && navLinks.classList.contains('nav-links')) {
      navLinks.style.marginLeft = 'auto';
      navLinks.after(wrapper);
      navLinks.style.marginLeft = '';
    } else {
      navEl.appendChild(wrapper);
    }

    // 외부 클릭 닫기
    document.addEventListener('click', e => {
      if (!e.target.closest('#adminDropdown') && !e.target.closest('#adminNavBtn')) {
        const dd = document.getElementById('adminDropdown');
        if (dd) dd.style.display = 'none';
      }
    });

    updateUI();
  }

  function toggleDropdown() {
    const dd = document.getElementById('adminDropdown');
    if (!dd) return;
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    updateUI();
  }

  function login() {
    if (typeof google === 'undefined') { alert('Google API 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      prompt: 'select_account',
      callback: async (resp) => {
        if (resp.error) { showMsg('❌ 로그인 실패: ' + resp.error); return; }
        save(resp);
        // 프로필 가져오기
        try {
          const p = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` }
          }).then(r => r.json());
          localStorage.setItem('admin_profile', JSON.stringify({ name: p.name, email: p.email, picture: p.picture }));
        } catch {}
        updateUI();
        showMsg('✅ 관리자 로그인 완료');
        document.getElementById('adminDropdown').style.display = 'none';
        // 페이지별 콜백
        if (typeof window.onAdminLogin === 'function') window.onAdminLogin();
      }
    });
    client.requestAccessToken();
  }

  function logout() {
    const token = getToken();
    if (token) try { google.accounts.oauth2.revoke(token, ()=>{}); } catch {}
    clear();
    updateUI();
    showMsg('로그아웃됨');
    document.getElementById('adminDropdown').style.display = 'none';
    if (typeof window.onAdminLogout === 'function') window.onAdminLogout();
  }

  function updateUI() {
    const admin = isAdmin();
    const dot   = document.getElementById('adminNavDot');
    const lbl   = document.getElementById('adminNavLabel');
    const btn   = document.getElementById('adminNavBtn');
    const loginV  = document.getElementById('adminLoginView');
    const loggedV = document.getElementById('adminLoggedView');
    if (!dot) return;
    if (admin) {
      dot.style.background = 'var(--green)'; dot.style.boxShadow = '0 0 5px var(--green)';
      btn.style.borderColor = 'var(--green)'; btn.style.color = 'var(--green)';
      lbl.textContent = '관리자';
      if (loginV)  loginV.style.display  = 'none';
      if (loggedV) loggedV.style.display = 'block';
      const p = getProfile();
      const av = document.getElementById('adminAvatar');
      const nm = document.getElementById('adminName');
      const em = document.getElementById('adminEmail');
      if (av && p.picture) av.src = p.picture;
      if (nm && p.name)    nm.textContent = p.name;
      if (em && p.email)   em.textContent = p.email;
    } else {
      dot.style.background = 'var(--muted)'; dot.style.boxShadow = '';
      btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--muted2)';
      lbl.textContent = '관리자 로그인';
      if (loginV)  loginV.style.display  = 'block';
      if (loggedV) loggedV.style.display = 'none';
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

  return { isAdmin, getToken, getExpiry, getProfile, login, logout, toggleDropdown, injectNavButton, updateUI };
})();

// 페이지 로드 시 nav에 자동 주입
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  if (nav) AUTH.injectNavButton(nav);
});
