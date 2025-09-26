// Sidebar logic
const hamburger = document.querySelector('.hamburger-menu');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('main');
const footer = document.querySelector('footer');

if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Dropdown logic for both sidebar and main icons
const dropdowns = document.querySelectorAll('.dropdown-item');
if (dropdowns.length > 0) {
    dropdowns.forEach(item => {
        const link = item.querySelector('a');
        const content = item.querySelector('.dropdown-content');
        
        if (link && content) {
            link.addEventListener('click', function(e) {
                // تحقق إذا كان هذا هو زر الوضع الداكن
                if (link.classList.contains('dark-mode-toggle-menu')) {
                    e.preventDefault();
                    return; // لا تفعل شيئًا، سيتم معالجته لاحقًا
                }
                
                e.preventDefault(); // منع الانتقال للقائمة
                
                // إغلاق القوائم الأخرى
                dropdowns.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // فتح القائمة الحالية
                item.classList.toggle('active');
            });
        }
    });
}

const iconCards = document.querySelectorAll('.icon-card');
if (iconCards.length > 0) {
    iconCards.forEach(card => {
        const link = card.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                const dropdown = card.querySelector('.icon-dropdown');
                if (dropdown) {
                    e.preventDefault();
                    // Close other open icon dropdowns
                    iconCards.forEach(otherCard => {
                        if (otherCard !== card && otherCard.classList.contains('active')) {
                            otherCard.classList.remove('active');
                        }
                    });
                    // Toggle current icon dropdown
                    card.classList.toggle('active');
                }
            });
        }
    });
}

// Dark Mode Toggle Logic
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.textContent = 'Light Mode';
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.textContent = 'Dark Mode';
        }
    });
}

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    if (darkModeToggle) {
        darkModeToggle.textContent = 'Light Mode';
    }
} else {
    if (darkModeToggle) {
        darkModeToggle.textContent = 'Dark Mode';
    }
}

// Dark Mode Toggle في قائمة الهامبرغر
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggleInMenu = document.getElementById('darkModeToggleInMenu');
    
    if (darkModeToggleInMenu) {
        darkModeToggleInMenu.addEventListener('click', function(e) {
            e.preventDefault();
            
            const body = document.body;
            const darkModeToggle = document.getElementById('darkModeToggle');
            
            body.classList.toggle('dark-mode');
            
            const modeText = body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
            darkModeToggleInMenu.querySelector('.dark-mode-text').textContent = modeText;
            
            if (darkModeToggle) {
                darkModeToggle.textContent = modeText;
            }
            
            localStorage.setItem('darkMode', body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
        });
    }
    
    // تحميل الوضع المحفوظ
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeToggleInMenu) {
            darkModeToggleInMenu.querySelector('.dark-mode-text').textContent = 'Light Mode';
        }
    }
});

// Optional: Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('.icon-card') && !e.target.closest('.hamburger-menu')) {
        if (dropdowns.length > 0) {
            dropdowns.forEach(item => item.classList.remove('active'));
        }
        if (iconCards.length > 0) {
            iconCards.forEach(card => card.classList.remove('active'));
        }
    }
});