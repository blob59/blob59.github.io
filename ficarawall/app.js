// ===============================
// CONFIG SUPABASE
// ===============================

const SUPABASE_URL = "https://cxwewkcbjsudkcrnlue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zOvY78Myap9F84iDD6Vqeg_hAW1b74D";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===============================
// UTILITY
// ===============================

const $ = (id) => document.getElementById(id);

// ===============================
// ELEMENTI UI
// ===============================

const regEmail = $("regEmail");
const regPass = $("regPass");
const regBtn = $("regBtn");

const logEmail = $("logEmail");
const logPass = $("logPass");
const logBtn = $("logBtn");

const logoutBtn = $("logoutBtn");

const authBox = $("authBox");
const wallBox = $("wallBox");
const who = $("who");

// ===============================
// STATO
// ===============================

let currentUser = null;

// ===============================
// REGISTRAZIONE
// ===============================

async function signUp() {
  const email = regEmail.value.trim();
  const password = regPass.value;

  if (!email || password.length < 6) {
    alert("Email e password minimo 6 caratteri.");
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account creato! Controlla la mail.");
}

// ===============================
// LOGIN
// ===============================

async function signIn() {
  const email = logEmail.value.trim();
  const password = logPass.value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
  }
}

// ===============================
// LOGOUT
// ===============================

async function signOut() {
  await supabase.auth.signOut();
}

// ===============================
// RENDER UI
// ===============================

function render() {
  if (currentUser) {
    authBox.style.display = "none";
    wallBox.style.display = "block";
    who.textContent = currentUser.email;
  } else {
    authBox.style.display = "block";
    wallBox.style.display = "none";
  }
}

// ===============================
// INIT
// ===============================

async function init() {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user ?? null;
  render();

  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user ?? null;
    render();
  });
}

// ===============================
// EVENTI
// ===============================

regBtn.onclick = signUp;
logBtn.onclick = signIn;
logoutBtn.onclick = signOut;

init();
