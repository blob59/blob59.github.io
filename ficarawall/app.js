// ===============================
// CONFIG SUPABASE
// ===============================
const SUPABASE_URL = "https://cxwewkcbjsudkcrnlue.supabase.co";
const SUPABASE_ANON_KEY = "LA_TUA_CHIAVE_PUBBLICABILE";

window.FICARAWALL_SB = window.FICARAWALL_SB || window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// non usare "const supabase" (se il file gira 2 volte esplode)
const sb = window.FICARAWALL_SB;

// ===============================
// UTILITY
// ===============================
const $ = (id) => document.getElementById(id);

// ===============================
// ELEMENTI UI
// ===============================
const authBox = $("authBox");
const wallBox = $("wallBox");
const who = $("who");
const logoutBtn = $("logoutBtn");

const regEmail = $("regEmail");
const regPass  = $("regPass");
const regBtn   = $("regBtn");

const logEmail = $("logEmail");
const logPass  = $("logPass");
const logBtn   = $("logBtn");

const text = $("text");
const url = $("url");
const tags = $("tags");
const addBtn = $("addBtn");
const search = $("search");
const posts = $("posts");

// ===============================
// STATO
// ===============================
let currentUser = null;
let allPosts = [];

// ===============================
// AUTH
// ===============================
async function signUp() {
  const email = regEmail.value.trim();
  const password = regPass.value;

  if (!email || password.length < 6) {
    alert("Email e password (min 6).");
    return;
  }

  const { error } = await sb.auth.signUp({ email, password });
  if (error) return alert(error.message);

  alert("Account creato! Se la conferma email è attiva, controlla la posta.");
}

async function signIn() {
  const email = logEmail.value.trim();
  const password = logPass.value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
}

async function signOut() {
  await sb.auth.signOut();
}

// ===============================
// DATABASE (tabella: posts)
// ===============================
async function addPost() {
  if (!currentUser) return alert("Devi fare login.");
  const link = url.value.trim();
  if (!link) return alert("Inserisci un link.");

  const payload = {
    user_id: currentUser.id,
    text: text.value.trim() || null,
    url: link,
    tags: tags.value.trim() || null
  };

  const { error } = await sb.from("posts").insert(payload);
  if (error) return alert(error.message);

  text.value = "";
  url.value = "";
  tags.value = "";
  await refresh();
}

function renderPosts(list) {
  posts.innerHTML = "";
  if (!list.length) {
    posts.innerHTML = `<div class="muted">Nessun post ancora.</div>`;
    return;
  }
  for (const p of list) {
    const el = document.createElement("div");
    el.className = "post";
    el.innerHTML = `
      <div class="top">
        <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a>
      </div>
      ${p.text ? `<div class="note">${escapeHtml(p.text)}</div>` : ""}
      ${p.tags ? `<div class="tags">${escapeHtml(p.tags)}</div>` : ""}
      <div class="meta">${new Date(p.created_at).toLocaleString()}</div>
    `;
    posts.appendChild(el);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function refresh() {
  if (!currentUser) return;
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) return alert(error.message);

  allPosts = data || [];
  applySearch();
}

function applySearch() {
  const q = (search.value || "").trim().toLowerCase();
  if (!q) return renderPosts(allPosts);

  const filtered = allPosts.filter(p => {
    const blob = `${p.url || ""} ${p.text || ""} ${p.tags || ""}`.toLowerCase();
    return blob.includes(q);
  });

  renderPosts(filtered);
}

// ===============================
// UI
// ===============================
function renderAuthState() {
  if (currentUser) {
    authBox.style.display = "none";
    wallBox.style.display = "block";
    who.textContent = currentUser.email;
    refresh();
  } else {
    authBox.style.display = "block";
    wallBox.style.display = "none";
  }
}

// ===============================
// INIT + EVENTI
// ===============================
regBtn.onclick = signUp;
logBtn.onclick = signIn;
logoutBtn.onclick = signOut;
addBtn.onclick = addPost;
search.oninput = applySearch;

(async function init() {
  const { data } = await sb.auth.getSession();
  currentUser = data.session?.user ?? null;
  renderAuthState();

  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    renderAuthState();
  });
})();
