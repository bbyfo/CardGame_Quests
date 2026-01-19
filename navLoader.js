/**
 * Navigation Loader
 * Fetches and injects the shared navigation component
 */
(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }

  async function initNav() {
    const navContainer = document.getElementById('nav-container');
    if (!navContainer) {
      console.warn('nav-container not found');
      document.body.classList.remove('loading');
      return;
    }

    try {
      // Determine path to nav.html based on current location
      const currentPath = window.location.pathname;
      const isInHelpFolder = currentPath.includes('/help/');
      const navPath = isInHelpFolder ? '../nav.html' : 'nav.html';

      // Fetch and inject navigation HTML
      const response = await fetch(navPath);
      if (!response.ok) throw new Error('Failed to load navigation');
      
      const navHtml = await response.text();
      navContainer.innerHTML = navHtml;

      // Initialize navigation functionality
      initializeNavigation();
      
      // Remove loading class to prevent FOUC
      document.body.classList.remove('loading');
    } catch (error) {
      console.error('Error loading navigation:', error);
      document.body.classList.remove('loading');
    }
  }
})();

/**
 * Initialize navigation toggle and active state
 */
function initializeNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navOverlay = document.querySelector('.nav-overlay');
  const body = document.body;

  if (!navToggle || !navMenu || !navOverlay) return;

  // Toggle navigation menu
  const toggleNav = () => {
    const isOpen = body.classList.contains('nav-open');
    if (isOpen) {
      body.classList.remove('nav-open');
    } else {
      body.classList.add('nav-open');
    }
  };

  // Event listeners
  navToggle.addEventListener('click', toggleNav);
  navOverlay.addEventListener('click', toggleNav);

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) {
      toggleNav();
    }
  });

  // Close menu when clicking a link
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-open');
    });
  });

  // Set active state based on current page
  setActiveNavLink();
}

/**
 * Set active navigation link based on current page
 */
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const dataPage = link.getAttribute('data-page');
    
    // Check if current page matches
    let isActive = false;
    
    if (currentPath.endsWith(href) || currentPath.endsWith('/' + href)) {
      isActive = true;
    } else if (dataPage === 'help' && currentPath.includes('/help/')) {
      isActive = true;
    } else if (dataPage === 'index' && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
      isActive = true;
    }

    if (isActive) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
