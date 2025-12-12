/* ================== HandyBox main-script.js (clean & mobile-safe) ================== */

/* ---------- Sidebar (hamburger) ---------- */
const hamburger = document.querySelector('.hamburger-menu');
const sidebar = document.querySelector('.sidebar');

if (hamburger && sidebar) {
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');           // إظهار/إخفاء القائمة
    hamburger.classList.toggle('active');       // أنيميشن زر الهامبرغر
    document.body.classList.toggle('menu-open', sidebar.classList.contains('open')); // منع تمرير الخلفية
  });
}

/* أغلق القائمة عند الضغط خارجها (مهم للموبايل) */
document.addEventListener('click', (e) => {
  if (
    sidebar &&
    hamburger &&
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    sidebar.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.classList.remove('menu-open');
  }
});

/* ---------- Dropdowns داخل الشريط الجانبي ---------- */
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
        // أغلق أي قائمة أخرى مفتوحة
        dropdowns.forEach(other => { if (other !== item) other.classList.remove('active'); });
        // بدّل الحالية
        item.classList.toggle('active');
      });
    }
  });
}

/* ---------- Dropdowns لبطاقات الأيقونات في الهوم ---------- */
const iconCards = document.querySelectorAll('.icon-card');
if (iconCards.length) {
  iconCards.forEach(card => {
    const link = card.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        const dd = card.querySelector('.icon-dropdown');
        if (dd) {
          e.preventDefault();
          // أغلق غيرها
          iconCards.forEach(other => { if (other !== card) other.classList.remove('active'); });
          // افتح/اقفل الحالية
          card.classList.toggle('active');
        }
      });
    }
  });
}

/* ================== Dark Mode (robust + optional link sync) ================== */
function safeGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
function safeSet(key,val){ try{ localStorage.setItem(key,val); }catch(e){} }

/* يقرأ الثيم من localStorage أو باراميتر ?theme=dark|light (للدعم عند عدم توفر localStorage) */
function readTheme(){
  const ls = safeGet('darkMode');  // "enabled" | "disabled" | null
  const qp = new URL(window.location.href).searchParams.get('theme'); // "dark"/"light"/null
  if (ls === 'enabled')  return 'dark';
  if (ls === 'disabled') return 'light';
  if (qp === 'dark' || qp === 'light') return qp;
  return null; // استخدم الافتراضي من CSS
}

function applyTheme(theme){
  const dark = (theme === 'dark');
  document.documentElement.classList.toggle('dark-mode', dark);
  document.body.classList.toggle('dark-mode', dark);

  // تحديث نص الأزرار (إن وُجدت)
  const btn = document.getElementById('darkModeToggle');
  if (btn) btn.textContent = dark ? 'Light Mode' : 'Dark Mode';
  const btnMenu = document.getElementById('darkModeToggleInMenu');
  if (btnMenu){
    const span = btnMenu.querySelector('.dark-mode-text');
    if (span) span.textContent = dark ? 'Light Mode' : 'Dark Mode';
  }
}

/* (اختياري) يضيف ?theme=… للروابط الداخلية حتى لو localStorage غير متاح */
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

/* طبّق الثيم عند التحميل وحدث الروابط */
(function initThemeOnLoad(){
  const theme = readTheme(); // null | "dark" | "light"
  if (theme){
    applyTheme(theme);
    updateInternalLinks(theme);
  } else {
    // لو ما فيه إعداد محفوظ، ثبّتي نص الأزرار حسب الحالة الحالية
    const darkNow = document.body.classList.contains('dark-mode');
    const btn = document.getElementById('darkModeToggle');
    if (btn) btn.textContent = darkNow ? 'Light Mode' : 'Dark Mode';
    const btnMenu = document.getElementById('darkModeToggleInMenu');
    if (btnMenu){
      const span = btnMenu.querySelector('.dark-mode-text');
      if (span) span.textContent = darkNow ? 'Light Mode' : 'Dark Mode';
    }
  }
})();

/* التبديل عبر الأزرار */
function toggleTheme(){
  const nextDark = !document.body.classList.contains('dark-mode');
  const theme = nextDark ? 'dark' : 'light';
  applyTheme(theme);
  safeSet('darkMode', nextDark ? 'enabled' : 'disabled');
  updateInternalLinks(theme);
}

const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) darkModeToggle.addEventListener('click', toggleTheme);

const darkModeToggleInMenu = document.getElementById('darkModeToggleInMenu');
if (darkModeToggleInMenu){
  darkModeToggleInMenu.addEventListener('click', (e)=>{ e.preventDefault(); toggleTheme(); });
}

/* ---------- إغلاق أي قوائم مفتوحة عند النقر خارجها ---------- */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sidebar') && !e.target.closest('.icon-card') && !e.target.closest('.hamburger-menu')) {
    if (dropdowns.length) dropdowns.forEach(i => i.classList.remove('active'));
    if (iconCards.length) iconCards.forEach(c => c.classList.remove('active'));
  }
});

// ======================
// Feedback form (Home)
// ======================
(function () {
  const form    = document.getElementById('feedbackForm');
  if (!form) return;

  const messageEl = document.getElementById('feedbackMessage');
  const emailEl   = document.getElementById('feedbackEmail');
  const statusEl  = document.getElementById('feedbackStatus');
  const btn       = document.getElementById('feedbackSubmitBtn');

  function showStatus(text, type) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove('success', 'error', 'show');
    if (type === 'success') statusEl.classList.add('success');
    if (type === 'error')   statusEl.classList.add('error');
    requestAnimationFrame(() => {
      statusEl.classList.add('show');
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!messageEl.value.trim()) {
      showStatus('Please write a message before submitting.', 'error');
      return;
    }

    btn.disabled = true;
    showStatus('Sending your feedback...', '');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageEl.value.trim(),
          email: emailEl.value.trim() || null,
          page: window.location.href
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        showStatus('Thank you! Your feedback has been sent.', 'success');
        messageEl.value = '';
        // نخلي الإيميل زي ما هو
      } else {
        showStatus(
          data.error || 'Something went wrong. Please try again later.',
          'error'
        );
      }
    } catch (err) {
      console.error(err);
      showStatus('Network error. Please try again.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
})();
