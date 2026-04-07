/* ============================================================
   NexaGrant — NGO Management Portal
   script.js  (fixed: registration flow + post-login redirect)
   ============================================================ */

'use strict';

/* ════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════ */
var DASHBOARD_URL = 'https://abufirnas-md.github.io/NGO-filling-Page/';

/* ════════════════════════════════════════
   STORAGE HELPERS
════════════════════════════════════════ */
function getAccounts() {
  try { return JSON.parse(localStorage.getItem('ng_accounts') || '{}'); }
  catch (e) { return {}; }
}
function saveAccounts(data) {
  localStorage.setItem('ng_accounts', JSON.stringify(data));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('ng_session') || 'null'); }
  catch (e) { return null; }
}
function saveSession(data) {
  localStorage.setItem('ng_session', JSON.stringify(data));
}
function clearSession() {
  localStorage.removeItem('ng_session');
}

/* ════════════════════════════════════════
   APP STATE
════════════════════════════════════════ */
var reg = { org: '', regNo: '', email: '', phone: '', otp: '', username: '' };
var timerHandle = null;

/* ════════════════════════════════════════
   UTILITY
════════════════════════════════════════ */
function el(id) { return document.getElementById(id); }

function htmlEsc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════ */
function switchTab(tab) {
  var isSignin = (tab === 'signin');
  el('tab-signin').classList.toggle('tab-active', isSignin);
  el('tab-register').classList.toggle('tab-active', !isSignin);
  el('tab-track').classList.toggle('to-right', !isSignin);
  el('form-signin').classList.toggle('hidden', !isSignin);
  el('form-register').classList.toggle('hidden', isSignin);
  clearAllMessages();
  if (!isSignin) { goToStep(1); updateStepDots(1); }
}

/* ════════════════════════════════════════
   MESSAGE HELPERS
════════════════════════════════════════ */
function showMsg(id, type, text) {
  var e = el(id);
  if (!e) return;
  e.textContent = text;
  e.className = 'msg-box ' + type + ' show';
}
function hideMsg(id) {
  var e = el(id);
  if (e) e.className = 'msg-box';
}
function clearAllMessages() {
  document.querySelectorAll('.msg-box').forEach(function (e) { e.className = 'msg-box'; });
}

/* ════════════════════════════════════════
   PASSWORD TOGGLE
════════════════════════════════════════ */
function togglePwd(inputId, btn) {
  var inp = el(inputId);
  if (!inp) return;
  var nowPwd = inp.type === 'password';
  inp.type = nowPwd ? 'text' : 'password';
  btn.querySelector('.ic-eye-show').style.display = nowPwd ? 'none' : '';
  btn.querySelector('.ic-eye-hide').style.display = nowPwd ? '' : 'none';
}

/* ════════════════════════════════════════
   PASSWORD STRENGTH
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var passInput = el('r-pass');
  if (!passInput) return;
  passInput.addEventListener('input', function () {
    var v = passInput.value, score = 0;
    if (v.length >= 8)          score++;
    if (/[A-Z]/.test(v))        score++;
    if (/[0-9]/.test(v))        score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    var levels = [
      { w:'0%',   bg:'transparent', txt:'',         col:'transparent'},
      { w:'25%',  bg:'#e53e3e',     txt:'Weak',     col:'#e53e3e'    },
      { w:'50%',  bg:'#dd6b20',     txt:'Fair',     col:'#dd6b20'    },
      { w:'75%',  bg:'#c8911f',     txt:'Good',     col:'#c8911f'    },
      { w:'100%', bg:'#0b7b6b',     txt:'Strong ✓', col:'#0b7b6b'    }
    ];
    var lv = levels[score];
    var fill = el('strength-fill'), label = el('strength-text');
    if (fill)  { fill.style.width = lv.w;  fill.style.background = lv.bg; }
    if (label) { label.textContent = lv.txt; label.style.color = lv.col;  }
  });
});

/* ════════════════════════════════════════
   OTP INPUT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var ids   = ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6'];
  var boxes = ids.map(function (id) { return el(id); }).filter(Boolean);
  boxes.forEach(function (box, idx) {
    box.addEventListener('input', function (e) {
      var digit = e.target.value.replace(/\D/g, '');
      e.target.value = digit ? digit[digit.length - 1] : '';
      box.classList.toggle('filled', !!e.target.value);
      if (digit && idx < boxes.length - 1) boxes[idx + 1].focus();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        boxes[idx-1].value = ''; boxes[idx-1].classList.remove('filled'); boxes[idx-1].focus();
      }
    });
    box.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
      boxes.forEach(function (b, i) { b.value = pasted[i]||''; b.classList.toggle('filled',!!b.value); });
      boxes[Math.min(pasted.length, boxes.length-1)].focus();
    });
  });
});

/* ════════════════════════════════════════
   STEP NAVIGATION
════════════════════════════════════════ */
function goToStep(stepNum) {
  ['rp-1','rp-2','rp-3','rp-success'].forEach(function (id) {
    var e = el(id); if (e) e.classList.add('hidden');
  });
  var targetId = (stepNum === 'success') ? 'rp-success' : 'rp-' + stepNum;
  var target = el(targetId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('fade-in');
    setTimeout(function () { target.classList.remove('fade-in'); }, 300);
  }
  if (typeof stepNum === 'number') updateStepDots(stepNum);
  var note = el('reg-switch-note');
  if (note) note.style.display = (stepNum === 'success') ? 'none' : '';
}

function updateStepDots(activeStep) {
  [1,2,3].forEach(function (i) {
    var node = el('sn-'+i); if (!node) return;
    node.classList.remove('active','done');
    if (i < activeStep)  node.classList.add('done');
    if (i === activeStep) node.classList.add('active');
  });
  var l1 = el('sl-1'), l2 = el('sl-2');
  if (l1) l1.classList.toggle('done', activeStep > 1);
  if (l2) l2.classList.toggle('done', activeStep > 2);
}

/* ════════════════════════════════════════
   STEP 1 — Organisation Details
════════════════════════════════════════ */
function step1Next() {
  hideMsg('r1-msg');
  var org   = el('r-org').value.trim();
  var regNo = el('r-regnum').value.trim();
  var email = el('r-email').value.trim();
  var phone = el('r-phone').value.trim();

  if (!org)   { showMsg('r1-msg','err','Organisation name is required.'); return; }
  if (!regNo) { showMsg('r1-msg','err','Registration / CIN number is required.'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMsg('r1-msg','err','Please enter a valid email address.'); return;
  }
  if (!phone || phone.replace(/\D/g,'').length < 7) {
    showMsg('r1-msg','err','Please enter a valid contact number.'); return;
  }

  reg.org = org; reg.regNo = regNo; reg.email = email; reg.phone = phone;

  reg.otp = String(Math.floor(100000 + Math.random() * 900000));
  el('otp-demo-code').textContent = reg.otp;
  el('otp-subtitle').textContent  = 'Step 2 of 3 — OTP sent to ' + email + ' (demo — shown above)';

  ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6'].forEach(function (id) {
    var b = el(id); if (b) { b.value = ''; b.classList.remove('filled'); }
  });
  hideMsg('r2-msg');
  goToStep(2);
  startResendTimer();
  setTimeout(function () { var f = el('oi-1'); if (f) f.focus(); }, 120);
}

/* ════════════════════════════════════════
   OTP RESEND TIMER
════════════════════════════════════════ */
function startResendTimer() {
  var secs = 30, timerEl = el('resend-timer'), resendBtn = el('resend-btn');
  if (resendBtn) resendBtn.style.display = 'none';
  if (timerEl)   timerEl.textContent = 'Resend OTP in ' + secs + 's';
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(function () {
    secs--;
    if (secs <= 0) {
      clearInterval(timerHandle); timerHandle = null;
      if (timerEl) timerEl.textContent = '';
      if (resendBtn) resendBtn.style.display = '';
    } else {
      if (timerEl) timerEl.textContent = 'Resend OTP in ' + secs + 's';
    }
  }, 1000);
}

function resendOtp() {
  reg.otp = String(Math.floor(100000 + Math.random() * 900000));
  el('otp-demo-code').textContent = reg.otp;
  ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6'].forEach(function (id) {
    var b = el(id); if (b) { b.value = ''; b.classList.remove('filled'); }
  });
  hideMsg('r2-msg');
  startResendTimer();
  var f = el('oi-1'); if (f) f.focus();
}

/* ════════════════════════════════════════
   STEP 2 — OTP Verification
════════════════════════════════════════ */
function step2Next() {
  hideMsg('r2-msg');
  var entered = ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6']
    .map(function (id) { var b = el(id); return b ? b.value : ''; }).join('');
  if (entered.length < 6) { showMsg('r2-msg','err','Please enter all 6 digits.'); return; }
  if (entered !== reg.otp) { showMsg('r2-msg','err','Incorrect OTP. Try again or request a new one.'); return; }
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  goToStep(3);
  setTimeout(function () { var f = el('r-user'); if (f) f.focus(); }, 120);
}

/* ════════════════════════════════════════
   STEP 3 — Create Credentials
════════════════════════════════════════ */
function step3Complete() {
  hideMsg('r3-msg');
  var username = el('r-user').value.trim();
  var pass     = el('r-pass').value;
  var pass2    = el('r-pass2').value;
  var terms    = el('r-terms').checked;

  if (!username) { showMsg('r3-msg','err','Please choose a username.'); return; }
  if (!/^[a-z0-9_]+$/.test(username)) { showMsg('r3-msg','err','Username: lowercase, numbers, underscores only.'); return; }
  if (pass.length < 8) { showMsg('r3-msg','err','Password must be at least 8 characters.'); return; }
  if (pass !== pass2)  { showMsg('r3-msg','err','Passwords do not match.'); return; }
  if (!terms) { showMsg('r3-msg','err','You must agree to the Terms of Service.'); return; }

  var accounts = getAccounts();
  if (accounts[username]) { showMsg('r3-msg','err','Username already taken. Please choose another.'); return; }

  accounts[username] = {
    org: reg.org, regNo: reg.regNo, email: reg.email,
    phone: reg.phone, password: pass, created: new Date().toISOString()
  };
  saveAccounts(accounts);
  reg.username = username;

  var card = el('cred-card');
  if (card) {
    card.innerHTML =
      credRow('Organisation', reg.org) +
      credRow('Reg. Number',  reg.regNo) +
      credRow('Email',        reg.email) +
      credRow('Username',     username);
  }

  goToStep('success');
  updateStepDots(4);
}

function credRow(label, value) {
  return '<div class="cred-row"><span class="cred-lbl">'+htmlEsc(label)+'</span><span class="cred-val">'+htmlEsc(value)+'</span></div>';
}

function proceedToSignIn() {
  switchTab('signin');
  var uField = el('si-user'), oField = el('si-org');
  if (uField) uField.value = reg.username;
  if (oField) oField.value = reg.org;
  var pField = el('si-pass'); if (pField) pField.focus();
}

/* ════════════════════════════════════════
   SIGN IN  →  redirect to dashboard
════════════════════════════════════════ */
function doSignIn() {
  hideMsg('signin-msg');
  var orgVal   = el('si-org').value.trim();
  var userVal  = el('si-user').value.trim();
  var passVal  = el('si-pass').value;
  var remember = el('si-remember').checked;

  if (!orgVal)  { showMsg('signin-msg','err','Please enter your organisation name.'); return; }
  if (!userVal) { showMsg('signin-msg','err','Please enter your username.'); return; }
  if (!passVal) { showMsg('signin-msg','err','Please enter your password.'); return; }

  var accounts = getAccounts();

  if (!accounts[userVal]) {
    showMsg('signin-msg','err','Username not found. Please register first.');
    return;
  }

  var account = accounts[userVal];

  if (account.org.toLowerCase() !== orgVal.toLowerCase()) {
    showMsg('signin-msg','err','Organisation name does not match this username.');
    return;
  }

  if (account.password !== passVal) {
    showMsg('signin-msg','err','Incorrect password. Please try again.');
    return;
  }

  // ── Authenticated ──
  if (remember) saveSession({ username: userVal, org: account.org });
  else clearSession();

  showMsg('signin-msg','ok','✓  Welcome, ' + account.org + '! Redirecting to your dashboard…');

  // Disable button to prevent double submit
  var btn = document.querySelector('#form-signin .btn-primary');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

  setTimeout(function () {
    window.location.href = DASHBOARD_URL;
  }, 1600);
}

/* ════════════════════════════════════════
   FORGOT PASSWORD MODAL
════════════════════════════════════════ */
function openForgot() {
  el('modal-forgot').classList.remove('hidden');
  var f = el('forgot-email'); if (f) setTimeout(function () { f.focus(); }, 80);
}
function closeForgot() {
  el('modal-forgot').classList.add('hidden');
  hideMsg('forgot-msg');
  var f = el('forgot-email'); if (f) f.value = '';
}
function handleModalClick(e) {
  if (e.target === el('modal-forgot')) closeForgot();
}
function doForgot() {
  hideMsg('forgot-msg');
  var email = el('forgot-email').value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMsg('forgot-msg','err','Please enter a valid email address.'); return;
  }
  var accounts = getAccounts();
  var exists = Object.values(accounts).some(function (a) { return a.email === email; });
  showMsg('forgot-msg','ok',
    exists ? 'Reset link sent to ' + email + '. Check your inbox. (Demo mode)'
           : 'If that address is registered, a reset link will be sent.');
}

/* ════════════════════════════════════════
   AI CHAT
════════════════════════════════════════ */
var chatIsOpen = false;

function toggleChat() {
  chatIsOpen = !chatIsOpen;
  el('chat-panel').classList.toggle('hidden', !chatIsOpen);
  el('chat-bubble').setAttribute('aria-expanded', String(chatIsOpen));
  if (chatIsOpen) { var inp = el('chat-inp'); if (inp) setTimeout(function(){inp.focus();},80); }
}

function quickReply(text) {
  var chips = el('quick-chips'); if (chips) chips.remove();
  addUserMsg(text); getBotResponse(text);
}
function sendChat() {
  var inp = el('chat-inp'), text = inp ? inp.value.trim() : '';
  if (!text) return;
  inp.value = '';
  var chips = el('quick-chips'); if (chips) chips.remove();
  addUserMsg(text); getBotResponse(text);
}
function addUserMsg(text) {
  var body = el('chat-body'); if (!body) return;
  var d = document.createElement('div');
  d.className = 'chat-msg user fade-in';
  d.innerHTML = '<p>' + htmlEsc(text) + '</p>';
  body.appendChild(d); body.scrollTop = body.scrollHeight;
}
function addBotMsg(html, isTyping) {
  var body = el('chat-body'); if (!body) return null;
  var d = document.createElement('div');
  d.className = 'chat-msg bot' + (isTyping ? ' typing' : '') + ' fade-in';
  d.innerHTML = '<p>' + html + '</p>';
  body.appendChild(d); body.scrollTop = body.scrollHeight;
  return d;
}

async function getBotResponse(userText) {
  var typing = addBotMsg('Thinking…', true);
  try {
    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are the NexaGrant AI assistant. Only help with NGO registration steps, login issues, portal features, and admin escalation (admin@nexagrant.in / +91-11-4000-9000). Reply in 2–4 sentences max. Friendly language only. Never discuss anything outside NexaGrant.',
        messages: [{ role: 'user', content: userText }]
      })
    });
    var data  = await resp.json();
    var reply = (data.content||[]).map(function(b){return b.text||'';}).join('') || 'Could not get a response. Please try again.';
    if (typing) typing.remove();
    addBotMsg(htmlEsc(reply));
  } catch(_e) {
    if (typing) typing.remove();
    addBotMsg('Sorry, I\'m having trouble connecting. For help, email <strong>admin@nexagrant.in</strong> or call <strong>+91-11-4000-9000</strong>.');
  }
}

/* ════════════════════════════════════════
   SESSION RESTORE
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var session = getSession(); if (!session) return;
  var uField = el('si-user'), oField = el('si-org'), rem = el('si-remember');
  if (uField && session.username) uField.value = session.username;
  if (oField && session.org)      oField.value = session.org;
  if (rem) rem.checked = true;
});

/* ════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════ */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var modal = el('modal-forgot');
  if (modal && !modal.classList.contains('hidden')) { closeForgot(); return; }
  if (chatIsOpen) toggleChat();
});
