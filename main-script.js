/* ================== HandyBox main-script.js (safe dark mode) ================== */
/* Sidebar */
const hamburger = document.querySelector('.hamburger-menu');
const sidebar = document.querySelector('.sidebar');
if (hamburger && sidebar) {
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    hamburger.classList.toggle('active'); // لتحريك زر الهامبرغر
    document.body.classList.toggle('menu-open', sidebar.classList.contains('open'));
  });
}

/* Dropdowns (sidebar + icon-cards) */
const dropdowns = document.querySelectorAll('.dropdown-item');
if (dropdowns.length) {
  dropdowns.forEach(item => {
    const link = item.querySelector('a');
    const content = item.querySelector('.dropdown-content');
    if (link && content) {
      link.addEventListener('click', (e) => {
        // تجاهل زر الدارك مود في المينيو
        if (link.classList.contains('dark-mode-toggle-menu')) { e.preventDefault(); return; }
        e.preventDefault();
        dropdowns.forEach(other => { if (other !== item) other.classList.remove('active'); });
        item.classList.toggle('active');
      });
    }
  });
}
const iconCards = document.querySelectorAll('.icon-card');
if (iconCards.length) {
  iconCards.forEach(card => {
    const link = card.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        const dd = card.querySelector('.icon-dropdown');
        if (dd) { e.preventDefault(); card.classList.toggle('active'); }
      });
    }
  });
}

/* ================== Dark Mode (robust + link sync) ================== */
function safeGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
function safeSet(key,val){ try{ localStorage.setItem(key,val); }catch(e){} }

function readTheme(){
  const ls = safeGet('darkMode');                     // "enabled"/"disabled"/null
  const qp = new URL(window.location.href).searchParams.get('theme'); // "dark"/"light"/null
  if (ls === 'enabled') return 'dark';
  if (ls === 'disabled') return 'light';
  if (qp === 'dark' || qp === 'light') return qp;
  return null;
}

function applyTheme(theme){
  const dark = (theme === 'dark');
  document.documentElement.classList.toggle('dark-mode', dark);
  document.body.classList.toggle('dark-mode', dark);

  const btn = document.getElementById('darkModeToggle');
  if (btn) btn.textContent = dark ? 'Light Mode' : 'Dark Mode';
  const btnMenu = document.getElementById('darkModeToggleInMenu');
  if (btnMenu){
    const span = btnMenu.querySelector('.dark-mode-text');
    if (span) span.textContent = dark ? 'Light Mode' : 'Dark Mode';
  }
}

function updateInternalLinks(theme){
  const dark = (theme === 'dark');
  document.querySelectorAll('a[href]').forEach(a=>{
    const href = a.getAttribute('href');
    // تجاهل الروابط الخارجية/المراسي/البريد/الهاتف
    if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
    const dest = new URL(href, window.location.href);
    dest.searchParams.set('theme', dark ? 'dark' : 'light');
    a.setAttribute('href', dest.pathname + dest.search + dest.hash);
  });
}

// عند التحميل: طبّق الثيم (إن وُجد) وحدث الروابط مباشرة
(function initThemeOnLoad(){
  const theme = readTheme();          // null | "dark" | "light"
  if (theme){
    applyTheme(theme);
    updateInternalLinks(theme);       // ← هذا هو الجديد المهم
  }
})();

// التبديل بالزر
function toggleTheme(){
  const isDark = !document.body.classList.contains('dark-mode');
  const theme = isDark ? 'dark' : 'light';

  applyTheme(theme);
  safeSet('darkMode', isDark ? 'enabled' : 'disabled');
  updateInternalLinks(theme);
}

const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) darkModeToggle.addEventListener('click', toggleTheme);

const darkModeToggleInMenu = document.getElementById('darkModeToggleInMenu');
if (darkModeToggleInMenu){
  darkModeToggleInMenu.addEventListener('click', (e)=>{ e.preventDefault(); toggleTheme(); });
}


  // تحديث نص الأزرار
  const btn = document.getElementById('darkModeToggle');
  if (btn) btn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  const btnMenu = document.getElementById('darkModeToggleInMenu');
  if (btnMenu) {
    const span = btnMenu.querySelector('.dark-mode-text');
    if (span) span.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }


/* إغلاق القوائم عند النقر خارجها */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sidebar') && !e.target.closest('.icon-card') && !e.target.closest('.hamburger-menu')) {
    if (dropdowns.length) dropdowns.forEach(i => i.classList.remove('active'));
    if (iconCards.length) iconCards.forEach(c => c.classList.remove('active'));
  }
});
