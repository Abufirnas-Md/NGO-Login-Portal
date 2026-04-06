/* ============================================================
   NexaGrant — NGO Management Portal  |  script.js
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────
   localStorage helpers
   ──────────────────────────────────────────────── */
function getAccounts() {
  try { return JSON.parse(localStorage.getItem('nexagrant_accounts') || '{}'); }
  catch { return {}; }
}
function saveAccounts(obj) {
  localStorage.setItem('nexagrant_accounts', JSON.stringify(obj));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('nexagrant_session') || 'null'); }
  catch { return null; }
}
function saveSession(data) {
  localStorage.setItem('nexagrant_session', JSON.stringify(data));
}

/* ────────────────────────────────────────────────
   State
   ──────────────────────────────────────────────── */
let reg = { org: '', regNo: '', email: '', phone: '', otp: '', username: '' };
let resendInterval = null;

/* ────────────────────────────────────────────────
   Tab switching
   ──────────────────────────────────────────────── */
function switchTab(tab) {
  const isLogin = tab === 'login';

  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
  document.getElementById('tab-slider').classList.toggle('right', !isLogin);

  document.getElementById('form-login').classList.toggle('hidden', !isLogin);
  document.getElementById('form-register').classList.toggle('hidden', isLogin);

  clearAllAlerts();

  if (!isLogin) {
    // Reset registration to step 1
    showRegStep(1);
    resetStepDots(1);
  }
}

/* ────────────────────────────────────────────────
   Alert helpers
   ──────────────────────────────────────────────── */
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert-msg ${type} show`;
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert-msg';
}
function clearAllAlerts() {
  document.querySelectorAll('.alert-msg').forEach(el => el.className = 'alert-msg');
}

/* ────────────────────────────────────────────────
   Password toggle
   ──────────────────────────────────────────────── */
function togglePwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.querySelector('.eye-open').style.display  = show ? 'none' : '';
  btn.querySelector('.eye-closed').style.display = show ? '' : 'none';
}

/* ────────────────────────────────────────────────
   Password strength meter
   ──────────────────────────────────────────────── */
(function initStrength() {
  const inp = document.getElementById('r-pass');
  if (!inp) return;
  inp.addEventListener('input', () => {
    const v = inp.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    const fill  = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    const map = [
      { w: '0%',   bg: 'transparent', txt: '',          col: '' },
      { w: '25%',  bg: '#c53030',     txt: 'Weak',      col: '#c53030' },
      { w: '50%',  bg: '#dd6b20',     txt: 'Fair',      col: '#dd6b20' },
      { w: '75%',  bg: '#c9902b',     txt: 'Good',      col: '#c9902b' },
      { w: '100%', bg: '#0a7c6e',     txt: 'Strong ✓',  col: '#0a7c6e' },
    ];
    const s = map[score];
    if (fill)  { fill.style.width = s.w; fill.style.background = s.bg; }
    if (label) { label.textContent = s.txt; label.style.color = s.col; }
  });
})();

/* ────────────────────────────────────────────────
   OTP keyboard navigation
   ──────────────────────────────────────────────── */
(function initOtp() {
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach((box, idx) => {
    box.addEventListener('input', e => {
      const digit = e.target.value.replace(/\D/g, '');
      e.target.value = digit ? digit.slice(-1) : '';
      box.classList.toggle('filled', !!e.target.value);
      if (digit && idx < boxes.length - 1) boxes[idx + 1].focus();
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        boxes[idx - 1].focus();
        boxes[idx - 1].classList.remove('filled');
      }
    });
    box.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      [...boxes].forEach((b, i) => {
        b.value = pasted[i] || '';
        b.classList.toggle('filled', !!b.value);
      });
      boxes[Math.min(pasted.length, boxes.length - 1)].focus();
    });
  });
})();

/* ────────────────────────────────────────────────
   Registration: step display
   ──────────────────────────────────────────────── */
function showRegStep(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`reg-step-${i}`);
    const suc = document.getElementById('reg-success');
    if (el) el.classList.toggle('hidden', i !== n);
    if (suc) suc.classList.add('hidden');
  });
}

function resetStepDots(current) {
  [1, 2, 3].forEach(i => {
    const dot = document.querySelector(`.step-dot[data-step="${i}"]`);
    if (!dot) return;
    dot.classList.remove('active', 'done');
    if (i < current) dot.classList.add('done');
    else if (i === current) dot.classList.add('active');
  });
  document.getElementById('line-1-2').classList.toggle('active', current > 1);
  document.getElementById('line-2-3').classList.toggle('active', current > 2);
}

function regGoBack(toStep) {
  showRegStep(toStep);
  resetStepDots(toStep);
}

/* ────────────────────────────────────────────────
   Registration: Step 1 — Organisation details
   ──────────────────────────────────────────────── */
function regStep1Next() {
  hideAlert('r1-msg');

  const org   = document.getElementById('r-org').value.trim();
  const regNo = document.getElementById('r-reg').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const phone = document.getElementById('r-phone').value.trim();

  if (!org)   return showAlert('r1-msg', 'error', 'Organisation name is required.');
  if (!regNo) return showAlert('r1-msg', 'error', 'Registration / CIN number is required.');
  if (!email || !email.includes('@')) return showAlert('r1-msg', 'error', 'Please enter a valid email address.');
  if (!phone || phone.replace(/\D/g, '').length < 7) return showAlert('r1-msg', 'error', 'Please enter a valid contact number.');

  reg.org   = org;
  reg.regNo = regNo;
  reg.email = email;
  reg.phone = phone;

  // Generate demo OTP
  reg.otp = String(Math.floor(100000 + Math.random() * 900000));
  document.getElementById('otp-demo-value').textContent = reg.otp;
  document.getElementById('otp-subtitle').textContent   = `OTP sent to ${email} (demo — shown above)`;

  // Clear previous OTP inputs
  document.querySelectorAll('.otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });

  showRegStep(2);
  resetStepDots(2);
  startResendTimer();
  setTimeout(() => document.getElementById('o1').focus(), 100);
}

/* ────────────────────────────────────────────────
   Registration: Step 2 — OTP verification
   ──────────────────────────────────────────────── */
function startResendTimer() {
  let seconds = 30;
  const timerEl  = document.getElementById('resend-timer');
  const resendBtn = document.getElementById('resend-btn');

  resendBtn.style.display = 'none';
  if (timerEl) timerEl.textContent = `Resend OTP in ${seconds}s`;

  if (resendInterval) clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(resendInterval);
      if (timerEl)   timerEl.textContent = '';
      if (resendBtn) resendBtn.style.display = '';
    } else {
      if (timerEl) timerEl.textContent = `Resend OTP in ${seconds}s`;
    }
  }, 1000);
}

function resendOtp() {
  reg.otp = String(Math.floor(100000 + Math.random() * 900000));
  document.getElementById('otp-demo-value').textContent = reg.otp;
  document.querySelectorAll('.otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
  hideAlert('r2-msg');
  startResendTimer();
  document.getElementById('o1').focus();
}

function regStep2Next() {
  hideAlert('r2-msg');

  const entered = ['o1','o2','o3','o4','o5','o6'].map(id => document.getElementById(id).value).join('');
  if (entered.length < 6) return showAlert('r2-msg', 'error', 'Please enter all 6 OTP digits.');
  if (entered !== reg.otp)  return showAlert('r2-msg', 'error', 'Incorrect OTP. Please try again or request a new one.');

  if (resendInterval) clearInterval(resendInterval);
  showRegStep(3);
  resetStepDots(3);
  setTimeout(() => document.getElementById('r-user').focus(), 100);
}

/* ────────────────────────────────────────────────
   Registration: Step 3 — Credentials
   ──────────────────────────────────────────────── */
function regComplete() {
  hideAlert('r3-msg');

  const username = document.getElementById('r-user').value.trim();
  const pass     = document.getElementById('r-pass').value;
  const pass2    = document.getElementById('r-pass2').value;
  const terms    = document.getElementById('r-terms').checked;

  if (!username)                    return showAlert('r3-msg', 'error', 'Please choose a username.');
  if (!/^[a-z0-9_]+$/.test(username)) return showAlert('r3-msg', 'error', 'Username: lowercase letters, numbers, and underscores only.');
  if (pass.length < 8)              return showAlert('r3-msg', 'error', 'Password must be at least 8 characters.');
  if (pass !== pass2)               return showAlert('r3-msg', 'error', 'Passwords do not match.');
  if (!terms)                       return showAlert('r3-msg', 'error', 'Please accept the Terms of Service to continue.');

  const accounts = getAccounts();
  if (accounts[username]) return showAlert('r3-msg', 'error', 'This username is already taken. Please choose another.');

  accounts[username] = { org: reg.org, regNo: reg.regNo, email: reg.email, phone: reg.phone, password: pass };
  saveAccounts(accounts);
  reg.username = username;

  // Populate credential summary
  const summary = document.getElementById('cred-summary');
  summary.innerHTML = `
    <div class="cred-row"><span class="lbl">Organisation</span><span class="val">${reg.org}</span></div>
    <div class="cred-row"><span class="lbl">Reg. Number</span><span class="val">${reg.regNo}</span></div>
    <div class="cred-row"><span class="lbl">Username</span><span class="val">${username}</span></div>
    <div class="cred-row"><span class="lbl">Email</span><span class="val">${reg.email}</span></div>
  `;

  // Hide all steps, show success
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`reg-step-${i}`);
    if (el) el.classList.add('hidden');
  });
  document.getElementById('reg-success').classList.remove('hidden');

  // Mark all dots done
  [1, 2, 3].forEach(i => {
    const dot = document.querySelector(`.step-dot[data-step="${i}"]`);
    if (dot) { dot.classList.remove('active'); dot.classList.add('done'); }
  });
  document.getElementById('line-1-2').classList.add('active');
  document.getElementById('line-2-3').classList.add('active');
}

function goToLogin() {
  const registeredUser = reg.username;
  switchTab('login');
  const userInp = document.getElementById('l-user');
  const orgInp  = document.getElementById('l-org');
  if (userInp) userInp.value = registeredUser;
  if (orgInp && reg.org) orgInp.value = reg.org;
  document.getElementById('l-pass').focus();
}

/* ────────────────────────────────────────────────
   LOGIN
   ──────────────────────────────────────────────── */
function doLogin() {
  hideAlert('login-msg');

  const orgInput  = document.getElementById('l-org').value.trim();
  const username  = document.getElementById('l-user').value.trim();
  const password  = document.getElementById('l-pass').value;
  const remember  = document.getElementById('l-remember').checked;

  if (!orgInput)  return showAlert('login-msg', 'error', 'Please enter your organisation name.');
  if (!username)  return showAlert('login-msg', 'error', 'Please enter your username.');
  if (!password)  return showAlert('login-msg', 'error', 'Please enter your password.');

  const accounts = getAccounts();

  if (!accounts[username]) return showAlert('login-msg', 'error', 'Username not found. Please register first or check for typos.');

  const account = accounts[username];

  // Optional: verify org name matches (case-insensitive)
  if (account.org.toLowerCase() !== orgInput.toLowerCase()) {
    return showAlert('login-msg', 'error', 'Organisation name does not match this username.');
  }

  if (account.password !== password) return showAlert('login-msg', 'error', 'Incorrect password. Please try again.');

  // Save session if remember checked
  if (remember) saveSession({ username, org: account.org });

  showAlert('login-msg', 'success', `✓  Welcome back, ${account.org}! Redirecting to dashboard…`);

  setTimeout(() => {
    alert(
      `✅ Sign in successful!\n\nOrganisation : ${account.org}\nUsername     : ${username}\n\n` +
      `(Redirect to dashboard in a real app.)`
    );
    hideAlert('login-msg');
  }, 2000);
}

/* ────────────────────────────────────────────────
   FORGOT PASSWORD MODAL
   ──────────────────────────────────────────────── */
function openForgot() {
  document.getElementById('forgot-modal').classList.remove('hidden');
  document.getElementById('forgot-email').focus();
}
function closeForgot(event) {
  if (event && event.target !== document.getElementById('forgot-modal')) return;
  document.getElementById('forgot-modal').classList.add('hidden');
  hideAlert('forgot-msg');
  document.getElementById('forgot-email').value = '';
}
function doForgot() {
  hideAlert('forgot-msg');
  const email = document.getElementById('forgot-email').value.trim();
  if (!email || !email.includes('@')) return showAlert('forgot-msg', 'error', 'Please enter a valid email address.');

  // Check if email exists in any account
  const accounts = getAccounts();
  const found = Object.values(accounts).some(a => a.email === email);

  showAlert('forgot-msg', 'success',
    found
      ? `Reset link sent to ${email}. Please check your inbox. (Demo mode)`
      : `If that email is registered, a reset link will be sent.`
  );
}

/* ────────────────────────────────────────────────
   AI SUPPORT CHAT
   ──────────────────────────────────────────────── */
let chatOpen = false;

function toggleChat() {
  chatOpen = !chatOpen;
  const panel  = document.getElementById('ai-chat-panel');
  const bubble = document.getElementById('ai-bubble');
  panel.classList.toggle('hidden', !chatOpen);
  if (chatOpen) {
    document.getElementById('chat-input').focus();
    bubble.style.transform = 'translateY(-3px)';
  } else {
    bubble.style.transform = '';
  }
}

function quickReply(text) {
  document.getElementById('chat-quick').remove();
  appendUserMsg(text);
  getBotReply(text);
}

function sendChat() {
  const inp  = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';

  // Remove quick replies if still visible
  const qr = document.getElementById('chat-quick');
  if (qr) qr.remove();

  appendUserMsg(text);
  getBotReply(text);
}

function appendUserMsg(text) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'chat-msg user fadeUp';
  div.innerHTML = `<p>${escapeHtml(text)}</p>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendBotMsg(text, isTyping = false) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = `chat-msg bot${isTyping ? ' typing' : ''} fadeUp`;
  div.innerHTML = `<p>${text}</p>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function getBotReply(userText) {
  const typingDiv = appendBotMsg('Thinking…', true);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are the NexaGrant AI support assistant — a helpful, professional assistant for NGOs using the NexaGrant management portal.
You ONLY assist with:
- Registration queries (how to register an NGO, required fields, OTP issues)
- Login issues (forgotten password, username problems, organisation name mismatch)
- Portal features overview (dashboards, grant management, compliance tools)
- Escalating to admin (if the issue is complex, say: "For urgent issues, please email admin@nexagrant.in or call +91-11-4000-9000")

Keep responses concise (2-4 sentences max). Use plain, friendly language. Do NOT assist with topics outside the portal.`,
        messages: [{ role: 'user', content: userText }]
      })
    });

    const data = await response.json();
    const reply = data.content?.map(b => b.text || '').join('') || 'I could not get a response. Please try again.';
    typingDiv.remove();
    appendBotMsg(escapeHtml(reply));

  } catch {
    typingDiv.remove();
    appendBotMsg('Sorry, I\'m having trouble connecting. For urgent help, please email <strong>admin@nexagrant.in</strong> or call <strong>+91-11-4000-9000</strong>.');
  }
}

/* ────────────────────────────────────────────────
   Session restore (optional — pre-fill login)
   ──────────────────────────────────────────────── */
(function restoreSession() {
  const session = getSession();
  if (!session) return;
  const userInp = document.getElementById('l-user');
  const orgInp  = document.getElementById('l-org');
  if (userInp && session.username) userInp.value = session.username;
  if (orgInp  && session.org)      orgInp.value  = session.org;
  const rem = document.getElementById('l-remember');
  if (rem) rem.checked = true;
})();

/* ────────────────────────────────────────────────
   Keyboard: close modal on Escape
   ──────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('forgot-modal');
    if (!modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      hideAlert('forgot-msg');
    }
    if (chatOpen) toggleChat();
  }
});

/* ────────────────────────────────────────────────
   Keyboard accessibility: bubble Enter key
   ──────────────────────────────────────────────── */
document.getElementById('ai-bubble').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChat(); }
});
