// layout.js — Shared Header & Footer Loader
// SERVIS | Manila City Hall EDP
//
// Usage in any page:
//   1. <link rel="stylesheet" href="layout.css" />  — in <head>
//   2. <div id="header-container"></div>             — before page content
//   3. <div id="footer-container"></div>             — after page content
//   4. <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
//   5. <script src="layout.js"></script>             — before </body>

document.addEventListener('DOMContentLoaded', function () {
    fetch('layout.html')
        .then(function (response) {
            if (!response.ok) throw new Error('Failed to load layout.html');
            return response.text();
        })
        .then(function (html) {
            var temp = document.createElement('div');
            temp.innerHTML = html;

            var headerEl = temp.querySelector('header');
            var footerEl = temp.querySelector('footer');

            var headerContainer = document.getElementById('header-container');
            var footerContainer = document.getElementById('footer-container');

            if (headerContainer && headerEl) headerContainer.appendChild(headerEl);
            if (footerContainer && footerEl) footerContainer.appendChild(footerEl);

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            setFooterYear();
            setActiveNavLink();
            initMobileMenu();
        })
        .catch(function (error) {
            console.error('Layout load error:', error);
        });
});


// Set current year in the footer copyright
function setFooterYear() {
    var yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}


// Highlight the active nav link based on current page filename
function setActiveNavLink() {
    var path = window.location.pathname;
    var currentPage = path.split('/').pop().replace('.html', '') || 'index';

    document.querySelectorAll('[data-page]').forEach(function (link) {
        if (link.dataset.page === currentPage) {
            link.classList.add('active');
        }
    });
}


// Mobile hamburger — open/close the mobile nav drawer
function initMobileMenu() {
    var hamburgerBtn = document.getElementById('hamburger-btn');
    var mobileNav = document.getElementById('mobile-nav');

    if (!hamburgerBtn || !mobileNav) return;

    hamburgerBtn.addEventListener('click', function () {
        var isOpen = mobileNav.classList.toggle('open');
        hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
        mobileNav.setAttribute('aria-hidden', String(!isOpen));
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            mobileNav.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            mobileNav.setAttribute('aria-hidden', 'true');
        });
    });

    document.addEventListener('click', function (e) {
        var header = document.getElementById('site-header');
        if (header && !header.contains(e.target)) {
            mobileNav.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            mobileNav.setAttribute('aria-hidden', 'true');
        }
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            mobileNav.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            mobileNav.setAttribute('aria-hidden', 'true');
        }
    });
}
