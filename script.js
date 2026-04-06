// TAB SWITCH
function switchTab(tab) {
  document.getElementById("form-login").classList.toggle("hidden", tab !== "login");
  document.getElementById("form-register").classList.toggle("hidden", tab !== "register");

  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("tab-register").classList.toggle("active", tab === "register");
}

// PASSWORD TOGGLE
function togglePwd(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

// LOGIN
function doLogin() {
  const user = document.getElementById("l-user").value;
  const pass = document.getElementById("l-pass").value;

  if (!user || !pass) {
    alert("Please fill all fields");
    return;
  }

  alert("Login successful (demo)");
}

// REGISTER STEP FLOW
let currentStep = 1;
let generatedOTP = "";

function regStep1Next() {
  const email = document.getElementById("r-email").value;

  if (!email) {
    alert("Enter email");
    return;
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000);
  document.getElementById("otp-demo-value").innerText = generatedOTP;

  goStep(2);
}

// OTP VERIFY
function regStep2Next() {
  let entered = "";
  for (let i = 1; i <= 6; i++) {
    entered += document.getElementById("o" + i).value;
  }

  if (entered == generatedOTP) {
    goStep(3);
  } else {
    alert("Invalid OTP");
  }
}

// COMPLETE REG
function regComplete() {
  const pass = document.getElementById("r-pass").value;
  const pass2 = document.getElementById("r-pass2").value;

  if (pass !== pass2) {
    alert("Passwords do not match");
    return;
  }

  goStep("success");
}

// STEP NAV
function goStep(step) {
  document.querySelectorAll(".reg-step").forEach(s => s.classList.add("hidden"));

  if (step === "success") {
    document.getElementById("reg-success").classList.remove("hidden");
  } else {
    document.getElementById("reg-step-" + step).classList.remove("hidden");
  }
}

// BACK
function regGoBack(step) {
  goStep(step);
}

// FORGOT PASSWORD
function openForgot() {
  document.getElementById("forgot-modal").classList.remove("hidden");
}

function closeForgot(e) {
  if (!e || e.target.id === "forgot-modal") {
    document.getElementById("forgot-modal").classList.add("hidden");
  }
}

function doForgot() {
  alert("Reset link sent (demo)");
}

// CHAT
function toggleChat() {
  document.getElementById("ai-chat-panel").classList.toggle("hidden");
}

function sendChat() {
  const input = document.getElementById("chat-input");
  const msg = input.value;

  if (!msg) return;

  const chat = document.getElementById("chat-messages");

  chat.innerHTML += `<div class="chat-msg user">${msg}</div>`;
  chat.innerHTML += `<div class="chat-msg bot">We will assist you shortly.</div>`;

  input.value = "";
}
