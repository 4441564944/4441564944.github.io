// Main navigation header with theme switcher.
(function() {
    // Determine base path
    const path = window.location.pathname;
    const isRoot = path.endsWith('index.html') || path.endsWith('/');
    const basePath = isRoot && !path.includes('/4441564944.github.io/') ? './' : '../';
    
    // Navigation items
    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/about.html', label: 'About' }
    ];
    
    // Create navigation
    const nav = document.createElement('nav');
    nav.className = 'global-nav';
    
    const navList = document.createElement('ul');
    navList.className = 'nav-list';
    
    navItems.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        
        // Mark current page as active
        if ((item.href === '/' && (path.endsWith('/') || path.endsWith('index.html'))) ||
            (item.href !== '/' && path.includes(item.href))) {
            a.className = 'active';
        }
        
        li.appendChild(a);
        navList.appendChild(li);
    });
    
    // Add theme toggle to navigation
    const themeLi = document.createElement('li');
    themeLi.className = 'theme-toggle-nav';
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle-btn';
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    themeBtn.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';
    
    themeBtn.addEventListener('click', function() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        themeBtn.textContent = newTheme === 'dark' ? 'Light' : 'Dark';
        localStorage.setItem('theme', newTheme);
    });
    
    themeLi.appendChild(themeBtn);
    navList.appendChild(themeLi);
    
    nav.appendChild(navList);
    
    // Insert navigation at the start of body
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.insertBefore(nav, document.body.firstChild);
        });
    } else {
        document.body.insertBefore(nav, document.body.firstChild);
    }
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
