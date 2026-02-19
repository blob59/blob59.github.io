// ✅ TEST: se vedi questo, app.js sta girando davvero
alert("app.js caricato ✅");

// === CONFIG: incolla qui i tuoi dati Supabase ===
// 1) Project URL: https://xxxx.supabase.co
// 2) Chiave pubblicabile: sb_publishable_....
const SUPABASE_URL = "https://cxwewkcbjsudkcrnlue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zOvY78Myap9F84iDD6Vqeg_hAW1b74D";

// Debug: verifica che la libreria Supabase sia stata caricata
console.log("window.supabase =", window.supabase);

if (!window.supabase) {
  alert("ERRORE: Supabase non caricato. Controlla la riga <script supabase-js> in index.html o AdBlock.");
  throw new Error("Supabase library not loaded (window.supabase undefined)");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("client ok ✅", supabase);

const $ = (id) => document.getElementById(id);

// --- Elementi UI ---
const authBox = $("authBox");
const wallBox = $("wallBox");
const who = $("who");
const logoutBtn = $("logoutBtn");

const regEmail = $("regEmail");
const regPass = $("regPass");
const regBtn = $("regBtn");

const logEmail = $("logEmail");
const logPass = $("logPass");
const logBtn = $("logBtn");

const text = $("text");
const url = $("url");
const tags = $("tags");
const addBtn = $("addBtn");

const search = $("search");
const posts = $("posts");

// Controllo elementi (se qualcosa è null, la pagina non corrisponde)
const required = [
  ["authBox", authBox], ["wallBox", wallBox], ["who", who], ["logoutBtn", logoutBtn],
  ["regEmail", regEmail], ["regPass", regPass], ["regBtn", regBtn],
  ["logEmail", logEmail], ["logPass", logPass], ["logBtn", logBtn],
  ["text", text], ["url", url], ["tags", tags], ["addBtn", addBtn],
  ["search", search], ["posts", posts]
];

for (const [name, el] of required) {
  if (!el) {
    alert(`ERRORE: elemento mancante #${name} in index.html. Hai incollato la versione giusta di index?`);
    throw new Error(`Missing element #${name}`);
  }
}

// --- Eventi ---
logoutBtn.onclick = () => supabase.auth.signOut();

regBtn.onclick = () => {
  console.log("CLICK signup");
  signUp();
};

logBtn.onclick = () => {
  console.log("CLICK login");
  signIn();
};

addBtn.onclick = () => addPost();
search.oninput = () => refresh();

let currentUser = null;

init();

// --- Init ---
async function init() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.log("getSession error:", error);

  currentUser = data.session?.user ?? null;
  renderAuthState();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    renderAuthState();
  });
}

function renderAuthState() {
  if (!currentUser) {
    authBox.style.display = "";
    wallBox.style.display = "none";
    logoutBtn.style.display = "none";
    who.textContent = "";
    return;
  }

  authBox.style.display = "none";
  wallBox.style.display = "";
  logoutBtn.style.display = "";
  who.textContent = `Sei dentro come: ${currentUser.email}`;
  refresh();
}

// --- Auth ---
async function signUp() {
  const email = regEmail.value.trim();
  const password = regPass.value;

  console.log("SIGNUP input", { email, len: password.length });

  if (!email || password.length < 6) {
    alert("Email e password (min 6).");
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  console.log("SIGNUP result", { data, error });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account creato! Se la conferma email è attiva, controlla la posta.");
}

async function signIn() {
  const email = logEmail.value.trim();
  const password = logPass.value;

  console.log("LOGIN input", { email, len: password.length });

  if (!email || !password) {
    alert("Inserisci email e password.");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log("LOGIN result", { data, error });

  if (error) {
    alert(error.message);
    return;
  }
}

// --- Posts ---
function normalizeTags(s) {
  return s
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function isValidUrl(u) {
  if (!u) return true;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

async function addPost() {
  if (!currentUser) return;

  const t = text.value.trim();
  const u = url.value.trim();
  const tg = normalizeTags(tags.value);

  if (!t && !u) return alert("Scrivi una nota o incolla un link.");
  if (!isValidUrl(u)) return alert("Link non valido (solo http/https).");

  const { error } = await supabase.from("posts").insert({
    user_id: currentUser.id,
    text: t,
    url: u,
    tags: tg
  });

  if (error) return alert(error.message);

  text.value = "";
  url.value = "";
  tags.value = "";
  refresh();
}

async function refresh() {
  if (!currentUser) return;

  const q = search.value.trim().toLowerCase();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return alert(error.message);

  const filtered = !q ? data : data.filter(p =>
    (p.text || "").toLowerCase().includes(q) ||
    (p.url || "").toLowerCase().includes(q) ||
    (p.tags || []).some(t => t.includes(q))
  );

  posts.innerHTML = "";
  for (const p of filtered) {
    const el = document.createElement("div");
    el.className = "post";

    const linkHtml = p.url
      ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a>`
      : "";

    const tagsHtml = (p.tags || [])
      .map(t => `<span class="tag">#${escapeHtml(t)}</span>`)
      .join("");

    el.innerHTML = `
      <div class="top">
        <div class="date">${new Date(p.created_at).toLocaleString()}</div>
        <button class="x" title="Elimina">✕</button>
      </div>
      <div class="link">${linkHtml}</div>
      <div class="text">${escapeHtml(p.text || "")}</div>
      <div class="tags">${tagsHtml}</div>
    `;

    el.querySelector(".x").onclick = async () => {
      const { error } = await supabase.from("posts").delete().eq("id", p.id);
      if (error) return alert(error.message);
      el.remove();
    };

    posts.appendChild(el);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
