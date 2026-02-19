// === CONFIG: incolla qui i tuoi dati Supabase ===
const SUPABASE_URL = "https://cxwewkcbjsudkcrnlue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zOvY78Myap9F84iDD6Vqeg_hAW1b74D";


const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);

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

logoutBtn.onclick = () => supabase.auth.signOut();
regBtn.onclick = signUp;
logBtn.onclick = signIn;
addBtn.onclick = addPost;
search.oninput = refresh;

let currentUser = null;

init();

async function init() {
  const { data } = await supabase.auth.getSession();
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

async function signUp() {
  const email = regEmail.value.trim();
  const password = regPass.value;

  if (!email || password.length < 6) return alert("Email e password (min 6).");
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);

  alert("Account creato! Se ti richiede conferma email, controlla la posta.");
}

async function signIn() {
  const email = logEmail.value.trim();
  const password = logPass.value;
  if (!email || !password) return alert("Inserisci email e password.");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
}

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
  } catch { return false; }
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

    const tagsHtml = (p.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("");

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

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
