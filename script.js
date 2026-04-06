// TAB SWITCH
function switchTab(tab) {
  document.getElementById("tab-login").classList.remove("active");
  document.getElementById("tab-register").classList.remove("active");

  document.getElementById("form-login").classList.add("hidden");
  document.getElementById("form-register").classList.add("hidden");

  if (tab === "login") {
    document.getElementById("tab-login").classList.add("active");
    document.getElementById("form-login").classList.remove("hidden");
  } else {
    document.getElementById("tab-register").classList.add("active");
    document.getElementById("form-register").classList.remove("hidden");
  }
}

// LOGIN
function doLogin() {
  let user = document.getElementById("l-user").value;
  let pass = document.getElementById("l-pass").value;

  if (!user || !pass) {
    alert("Please fill all fields");
    return;
  }

  alert("Login Successful (Demo)");
}

// REGISTER FLOW
let generatedOTP = "";

// STEP 1
function regStep1Next() {
  let email = document.getElementById("r-email").value;

  if (!email) {
    alert("Enter email");
    return;
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById("otp-demo-value").innerText = generatedOTP;

  showStep(2);
}

// STEP 2
function regStep2Next() {
  let entered =
    o1.value + o2.value + o3.value + o4.value + o5.value + o6.value;

  if (entered === generatedOTP) {
    showStep(3);
  } else {
    alert("Invalid OTP");
  }
}

// STEP 3
function regComplete() {
  let p1 = document.getElementById("r-pass").value;
  let p2 = document.getElementById("r-pass2").value;

  if (p1 !== p2 || !p1) {
    alert("Passwords do not match");
    return;
  }

  showStep("success");
}

// STEP SWITCH
function showStep(step) {
  document.querySelectorAll(".reg-step").forEach(s => s.classList.add("hidden"));

  if (step === "success") {
    document.getElementById("reg-success").classList.remove("hidden");
  } else {
    document.getElementById(`reg-step-${step}`).classList.remove("hidden");
  }
}

// BACK
function regGoBack(step) {
  showStep(step);
}

// FORGOT PASSWORD
function openForgot() {
  document.getElementById("forgot-modal").classList.remove("hidden");
}

function closeForgot(e) {
  if (e.target.id === "forgot-modal") {
    document.getElementById("forgot-modal").classList.add("hidden");
  }
}

function doForgot() {
  alert("Reset link sent (Demo)");
}

// AI CHAT
function toggleChat() {
  document.getElementById("ai-chat-panel").classList.toggle("hidden");
}

function sendChat() {
  let input = document.getElementById("chat-input");
  let msg = input.value;

  if (!msg) return;

  let box = document.getElementById("chat-messages");

  box.innerHTML += `<p><b>You:</b> ${msg}</p>`;
  box.innerHTML += `<p><b>Bot:</b> This is a demo AI reply 🤖</p>`;

  input.value = "";
  box.scrollTop = box.scrollHeight;
}
