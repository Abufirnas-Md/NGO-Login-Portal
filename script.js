/* ============================================================
   NexaGrant — NGO Management Portal
   script.js
   ============================================================ */

'use strict';

/* ════════════════════════════════════════
   STORAGE HELPERS
════════════════════════════════════════ */
function getAccounts() {
  try { return JSON.parse(localStorage.getItem('ng_accounts') || '{}'); }
  catch { return {}; }
}
function saveAccounts(data) {
  localStorage.setItem('ng_accounts', JSON.stringify(data));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('ng_session') || 'null'); }
  catch { return null; }
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
const reg = { org: '', regNo: '', email: '', phone: '', otp: '', username: '' };
let timerHandle = null;

/* ════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════ */
function switchTab(tab) {
  const isSignin = tab === 'signin';

  // Tab buttons
  document.getElementById('tab-signin').classList.toggle('tab-active', isSignin);
  document.getElementById('tab-register').classList.toggle('tab-active', !isSignin);

  // Sliding track
  document.getElementById('tab-track').classList.toggle('to-right', !isSignin);

  // Forms
  document.getElementById('form-signin').classList.toggle('hidden', !isSignin);
  document.getElementById('form-register').classList.toggle('hidden', isSignin);

  clearAllMessages();

  if (!isSignin) {
    // Always start register fresh at step 1
    goToStep(1);
    updateStepDots(1);
  }
}

/* ════════════════════════════════════════
   MESSAGE HELPERS
════════════════════════════════════════ */
function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg-box ' + type + ' show';
}
function hideMsg(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'msg-box';
}
function clearAllMessages() {
  document.querySelectorAll('.msg-box').forEach(el => el.className = 'msg-box');
}

/* ════════════════════════════════════════
   PASSWORD VISIBILITY TOGGLE
════════════════════════════════════════ */
function togglePwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const nowVisible = inp.type === 'password';
  inp.type = nowVisible ? 'text' : 'password';
  btn.querySelector('.ic-eye-show').style.display = nowVisible ? 'none' : '';
  btn.querySelector('.ic-eye-hide').style.display = nowVisible ? '' : 'none';
}

/* ════════════════════════════════════════
   PASSWORD STRENGTH
════════════════════════════════════════ */
(function initStrength() {
  // Deferred until DOM ready
  window.addEventListener('DOMContentLoaded', function () {
    const passInput = document.getElementById('r-pass');
    if (!passInput) return;

    passInput.addEventListener('input', function () {
      const v = passInput.value;
      let score = 0;
      if (v.length >= 8)          score++;
      if (/[A-Z]/.test(v))        score++;
      if (/[0-9]/.test(v))        score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;

      const levels = [
        { w: '0',    bg: 'transparent', txt: '',           col: 'transparent' },
        { w: '25%',  bg: '#e53e3e',     txt: 'Weak',       col: '#e53e3e'     },
        { w: '50%',  bg: '#dd6b20',     txt: 'Fair',       col: '#dd6b20'     },
        { w: '75%',  bg: '#c8911f',     txt: 'Good',       col: '#c8911f'     },
        { w: '100%', bg: '#0b7b6b',     txt: 'Strong ✓',   col: '#0b7b6b'     },
      ];
      const lv = levels[score];
      const fill  = document.getElementById('strength-fill');
      const label = document.getElementById('strength-text');
      if (fill)  { fill.style.width = lv.w; fill.style.background = lv.bg; }
      if (label) { label.textContent = lv.txt; label.style.color = lv.col; }
    });
  });
})();

/* ════════════════════════════════════════
   OTP INPUT KEYBOARD NAV
════════════════════════════════════════ */
(function initOtpInputs() {
  window.addEventListener('DOMContentLoaded', function () {
    const ids   = ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6'];
    const boxes = ids.map(id => document.getElementById(id)).filter(Boolean);

    boxes.forEach(function (box, idx) {
      // Input: accept only digits, auto-advance
      box.addEventListener('input', function (e) {
        const digit = e.target.value.replace(/\D/g, '');
        e.target.value = digit ? digit[digit.length - 1] : '';
        box.classList.toggle('filled', !!e.target.value);
        if (digit && idx < boxes.length - 1) boxes[idx + 1].focus();
      });

      // Backspace: go to previous
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          boxes[idx - 1].value = '';
          boxes[idx - 1].classList.remove('filled');
          boxes[idx - 1].focus();
        }
      });

      // Paste: distribute across all boxes
      box.addEventListener('paste', function (e) {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData('text').replace(/\D/g, '');
        boxes.forEach(function (b, i) {
          b.value = pasted[i] || '';
          b.classList.toggle('filled', !!b.value);
        });
        const focusIdx = Math.min(pasted.length, boxes.length - 1);
        boxes[focusIdx].focus();
      });
    });
  });
})();

/* ════════════════════════════════════════
   REGISTER — STEP NAVIGATION
════════════════════════════════════════ */
function goToStep(stepNum) {
  // Hide all panels
  ['rp-1','rp-2','rp-3','rp-success'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Show the target panel
  const target = stepNum === 'success'
    ? document.getElementById('rp-success')
    : document.getElementById('rp-' + stepNum);

  if (target) {
    target.classList.remove('hidden');
    target.classList.add('fade-in');
    setTimeout(function () { target.classList.remove('fade-in'); }, 300);
  }

  // Update step bar
  if (typeof stepNum === 'number') updateStepDots(stepNum);

  // Hide the "already registered" link on success
  const switchNote = document.getElementById('reg-switch-note');
  if (switchNote) switchNote.style.display = stepNum === 'success' ? 'none' : '';
}

function updateStepDots(activeStep) {
  [1, 2, 3].forEach(function (i) {
    const node = document.getElementById('sn-' + i);
    if (!node) return;
    node.classList.remove('active', 'done');
    if (i < activeStep)  node.classList.add('done');
    if (i === activeStep) node.classList.add('active');
  });
  const line1 = document.getElementById('sl-1');
  const line2 = document.getElementById('sl-2');
  if (line1) line1.classList.toggle('done', activeStep > 1);
  if (line2) line2.classList.toggle('done', activeStep > 2);
}

/* ════════════════════════════════════════
   REGISTER — STEP 1: Organisation details
════════════════════════════════════════ */
function step1Next() {
  hideMsg('r1-msg');

  const org    = document.getElementById('r-org').value.trim();
  const regNo  = document.getElementById('r-regnum').value.trim();
  const email  = document.getElementById('r-email').value.trim();
  const phone  = document.getElementById('r-phone').value.trim();

  if (!org)   { return showMsg('r1-msg','err','Organisation name is required.'); }
  if (!regNo) { return showMsg('r1-msg','err','Registration / CIN number is required.'); }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showMsg('r1-msg','err','Please enter a valid email address.');
  }
  if (!phone || phone.replace(/\D/g,'').length < 7) {
    return showMsg('r1-msg','err','Please enter a valid contact number.');
  }

  // Save to state
  reg.org   = org;
  reg.regNo = regNo;
  reg.email = email;
  reg.phone = phone;

  // Generate and show OTP
  reg.otp = String(Math.floor(100000 + Math.random() * 900000));
  document.getElementById('otp-demo-code').textContent = reg.otp;
  document.getElementById('otp-subtitle').textContent  =
    'Step 2 of 3 — OTP sent to ' + email + ' (demo mode — shown above)';

  // Clear any previous OTP entries
  ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('filled'); }
  });
  hideMsg('r2-msg');

  goToStep(2);
  startResendTimer();
  setTimeout(function () {
    const first = document.getElementById('oi-1');
    if (first) first.focus();
  }, 120);
}

/* ════════════════════════════════════════
   REGISTER — OTP resend timer
════════════════════════════════════════ */
function startResendTimer() {
  let secs = 30;
  const timerEl  = document.getElementById('resend-timer');
  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) resendBtn.style.display = 'none';
  if (timerEl)   timerEl.textContent = 'Resend OTP in ' + secs + 's';

  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(function () {
    secs--;
    if (secs <= 0) {
      clearInterval(timerHandle);
      timerHandle = null;
      if (timerEl)   timerEl.textContent = '';
      if (resendBtn) resendBtn.style.display = '';
    } else {
      if (timerEl) timerEl.textContent = 'Resend OTP in ' + secs + 's';
    }
  }, 1000);
}

function resendOtp() {
  reg.otp = String(Math.floor(100000 + Math.random() * 900000));
  document.getElementById('otp-demo-code').textContent = reg.otp;
  ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('filled'); }
  });
  hideMsg('r2-msg');
  startResendTimer();
  const first = document.getElementById('oi-1');
  if (first) first.focus();
}

/* ════════════════════════════════════════
   REGISTER — STEP 2: Verify OTP
════════════════════════════════════════ */
function step2Next() {
  hideMsg('r2-msg');

  const entered = ['oi-1','oi-2','oi-3','oi-4','oi-5','oi-6']
    .map(function (id) { const el = document.getElementById(id); return el ? el.value : ''; })
    .join('');

  if (entered.length < 6) {
    return showMsg('r2-msg','err','Please enter all 6 digits of the OTP.');
  }
  if (entered !== reg.otp) {
    return showMsg('r2-msg','err','Incorrect OTP. Please try again or request a new one.');
  }

  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }

  goToStep(3);
  setTimeout(function () {
    const userField = document.getElementById('r-user');
    if (userField) userField.focus();
  }, 120);
}

/* ════════════════════════════════════════
   REGISTER — STEP 3: Create credentials
════════════════════════════════════════ */
function step3Complete() {
  hideMsg('r3-msg');

  const username = document.getElementById('r-user').value.trim();
  const pass     = document.getElementById('r-pass').value;
  const pass2    = document.getElementById('r-pass2').value;
  const terms    = document.getElementById('r-terms').checked;

  if (!username) {
    return showMsg('r3-msg','err','Please choose a username.');
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return showMsg('r3-msg','err','Username may only contain lowercase letters, numbers, and underscores.');
  }
  if (pass.length < 8) {
    return showMsg('r3-msg','err','Password must be at least 8 characters long.');
  }
  if (pass !== pass2) {
    return showMsg('r3-msg','err','Passwords do not match. Please re-enter.');
  }
  if (!terms) {
    return showMsg('r3-msg','err','You must agree to the Terms of Service to continue.');
  }

  const accounts = getAccounts();
  if (accounts[username]) {
    return showMsg('r3-msg','err','This username is already taken. Please choose a different one.');
  }

  // Save account (in a real app, password would be hashed server-side)
  accounts[username] = {
    org:    reg.org,
    regNo:  reg.regNo,
    email:  reg.email,
    phone:  reg.phone,
    password: pass,
    created: new Date().toISOString()
  };
  saveAccounts(accounts);
  reg.username = username;

  // Build credential summary
  const card = document.getElementById('cred-card');
  if (card) {
    card.innerHTML = [
      row('Organisation', reg.org),
      row('Reg. Number',  reg.regNo),
      row('Email',        reg.email),
      row('Username',     username),
    ].join('');
  }

  goToStep('success');

  // Mark all step dots done
  updateStepDots(4); // > 3 = all done
}

function row(label, value) {
  return '<div class="cred-row"><span class="cred-lbl">' + esc(label) +
         '</span><span class="cred-val">' + esc(value) + '</span></div>';
}

function proceedToSignIn() {
  const user = reg.username;
  const org  = reg.org;
  switchTab('signin');
  const uField = document.getElementById('si-user');
  const oField = document.getElementById('si-org');
  if (uField) uField.value = user;
  if (oField) oField.value = org;
  const passField = document.getElementById('si-pass');
  if (passField) passField.focus();
}

/* ════════════════════════════════════════
   SIGN IN
════════════════════════════════════════ */
function doSignIn() {
  hideMsg('signin-msg');

  const orgVal  = document.getElementById('si-org').value.trim();
  const userVal = document.getElementById('si-user').value.trim();
  const passVal = document.getElementById('si-pass').value;
  const remember = document.getElementById('si-remember').checked;

  if (!orgVal)  { return showMsg('signin-msg','err','Please enter your organisation name.'); }
  if (!userVal) { return showMsg('signin-msg','err','Please enter your username.'); }
  if (!passVal) { return showMsg('signin-msg','err','Please enter your password.'); }

  const accounts = getAccounts();

  if (!accounts[userVal]) {
    return showMsg('signin-msg','err','Username not found. Please register or check for typos.');
  }

  const account = accounts[userVal];

  if (account.org.toLowerCase() !== orgVal.toLowerCase()) {
    return showMsg('signin-msg','err','Organisation name does not match this username. Please check and try again.');
  }

  if (account.password !== passVal) {
    return showMsg('signin-msg','err','Incorrect password. Please try again.');
  }

  // Success
  if (remember) saveSession({ username: userVal, org: account.org });
  else clearSession();

  showMsg('signin-msg','ok','✓  Welcome back, ' + account.org + '! Redirecting to dashboard…');

  setTimeout(function () {
    alert(
      '✅ Sign in successful!\n\n' +
      'Organisation : ' + account.org + '\n' +
      'Username     : ' + userVal    + '\n\n' +
      '(In a real deployment you would be redirected to the dashboard.)'
    );
    hideMsg('signin-msg');
  }, 1800);
}

/* ════════════════════════════════════════
   FORGOT PASSWORD MODAL
════════════════════════════════════════ */
function openForgot() {
  document.getElementById('modal-forgot').classList.remove('hidden');
  const emailField = document.getElementById('forgot-email');
  if (emailField) setTimeout(function () { emailField.focus(); }, 80);
}

function closeForgot() {
  document.getElementById('modal-forgot').classList.add('hidden');
  hideMsg('forgot-msg');
  const emailField = document.getElementById('forgot-email');
  if (emailField) emailField.value = '';
}

function handleModalClick(e) {
  if (e.target === document.getElementById('modal-forgot')) closeForgot();
}

function doForgot() {
  hideMsg('forgot-msg');
  const email = document.getElementById('forgot-email').value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showMsg('forgot-msg','err','Please enter a valid email address.');
  }

  const accounts = getAccounts();
  const exists = Object.values(accounts).some(function (a) { return a.email === email; });

  if (exists) {
    showMsg('forgot-msg','ok','Reset link sent to ' + email + '. Please check your inbox. (Demo mode)');
  } else {
    showMsg('forgot-msg','ok','If that address is registered, a reset link has been sent.');
  }
}

/* ════════════════════════════════════════
   AI CHAT
════════════════════════════════════════ */
let chatIsOpen = false;

function toggleChat() {
  chatIsOpen = !chatIsOpen;
  const panel  = document.getElementById('chat-panel');
  const bubble = document.getElementById('chat-bubble');
  panel.classList.toggle('hidden', !chatIsOpen);
  bubble.setAttribute('aria-expanded', String(chatIsOpen));
  if (chatIsOpen) {
    const inp = document.getElementById('chat-inp');
    if (inp) setTimeout(function () { inp.focus(); }, 80);
  }
}

function quickReply(text) {
  const chips = document.getElementById('quick-chips');
  if (chips) chips.remove();
  addUserMsg(text);
  getBotResponse(text);
}

function sendChat() {
  const inp  = document.getElementById('chat-inp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  inp.value = '';

  const chips = document.getElementById('quick-chips');
  if (chips) chips.remove();

  addUserMsg(text);
  getBotResponse(text);
}

function addUserMsg(text) {
  const body = document.getElementById('chat-body');
  if (!body) return;
  const div = document.createElement('div');
  div.className = 'chat-msg user fade-in';
  div.innerHTML = '<p>' + esc(text) + '</p>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function addBotMsg(html, isTyping) {
  const body = document.getElementById('chat-body');
  if (!body) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg bot' + (isTyping ? ' typing' : '') + ' fade-in';
  div.innerHTML = '<p>' + html + '</p>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  return div;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getBotResponse(userText) {
  const typing = addBotMsg('Thinking…', true);

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: [
          'You are the NexaGrant AI support assistant — helpful, professional, and concise.',
          'You only assist with:',
          '• NGO registration on NexaGrant (steps, required fields, OTP, documents)',
          '• Login issues (username, password, organisation name mismatch)',
          '• Portal overview (dashboard, grant management, compliance tools)',
          '• Escalation: for complex issues say "Please contact our admin team at admin@nexagrant.in or call +91-11-4000-9000"',
          'Keep replies to 2–4 short sentences. Use plain, friendly language.',
          'Never discuss topics outside the NexaGrant portal.',
        ].join('\n'),
        messages: [{ role: 'user', content: userText }]
      })
    });

    const data  = await resp.json();
    const reply = (data.content || []).map(function (b) { return b.text || ''; }).join('') ||
                  'I could not get a response. Please try again.';

    if (typing) typing.remove();
    addBotMsg(esc(reply));

  } catch (_err) {
    if (typing) typing.remove();
    addBotMsg(
      'Sorry, I\'m having trouble connecting right now. ' +
      'For help, please email <strong>admin@nexagrant.in</strong> ' +
      'or call <strong>+91-11-4000-9000</strong>.'
    );
  }
}

/* ════════════════════════════════════════
   SESSION RESTORE
════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', function () {
  const session = getSession();
  if (!session) return;
  const uField = document.getElementById('si-user');
  const oField = document.getElementById('si-org');
  const rem    = document.getElementById('si-remember');
  if (uField && session.username) uField.value = session.username;
  if (oField && session.org)      oField.value = session.org;
  if (rem) rem.checked = true;
});

/* ════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════ */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;

  // Close modal
  const modal = document.getElementById('modal-forgot');
  if (modal && !modal.classList.contains('hidden')) {
    closeForgot();
    return;
  }
  // Close chat
  if (chatIsOpen) {
    toggleChat();
  }
});
