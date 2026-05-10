// Kite Dashboard

var CONFIG = {
  API: { BITCOIN: 'https://api.coindesk.com/v1/bpi/currentprice.json', USERS: 'https://jsonplaceholder.typicode.com/users' },
  TIMEOUT: 1500,
  CHART_MAX_HEIGHT: 220
};

var Store = {
  bitcoin: null, users: [],
  notifications: [
    { id: 1, text: 'New user registration: Sarah Chen', time: '2 min ago', unread: true },
    { id: 2, text: 'Server CPU load at 87%', time: '15 min ago', unread: true },
    { id: 3, text: 'Monthly revenue report ready', time: '1 hour ago', unread: false },
    { id: 4, text: 'Security alert: New login from Berlin', time: '3 hours ago', unread: true }
  ],
  chartData: [], lineChartData: [],
  isSidebarOpen: false, isNotificationsOpen: false,
  deviceName: 'User', currentPage: 'dashboard',
  settings: { darkMode: true, compactMode: false, emailAlerts: true, pushNotifications: true, marketing: false, twoFA: false }
};

var DOM = {};

function cacheDOM() {
  DOM.sidebar = document.getElementById('sidebar');
  DOM.overlay = document.getElementById('overlay');
  DOM.menuToggle = document.getElementById('menuToggle');
  DOM.statsGrid = document.getElementById('statsGrid');
  DOM.mainChart = document.getElementById('mainChart');
  DOM.tableBody = document.getElementById('tableBody');
  DOM.searchInput = document.getElementById('searchInput');
  DOM.notificationBtn = document.getElementById('notificationBtn');
  DOM.notificationDropdown = document.getElementById('notificationDropdown');
  DOM.notificationBadge = document.getElementById('notificationBadge');
  DOM.notificationList = document.getElementById('notificationList');
  DOM.markAllRead = document.getElementById('markAllRead');
  DOM.clockTime = document.getElementById('clockTime');
  DOM.clockDate = document.getElementById('clockDate');
  DOM.dayProgress = document.getElementById('dayProgress');
  DOM.progressText = document.getElementById('progressText');
  DOM.viewAllBtn = document.getElementById('viewAllBtn');
  DOM.themeToggle = document.getElementById('themeToggle');
  DOM.sidebarAvatar = document.getElementById('sidebarAvatar');
  DOM.headerAvatar = document.getElementById('headerAvatar');
  DOM.sidebarUserName = document.getElementById('sidebarUserName');
  DOM.headerUserName = document.getElementById('headerUserName');
  DOM.welcomeSubtitle = document.getElementById('welcomeSubtitle');
  DOM.navList = document.getElementById('navList');
  DOM.usersGrid = document.getElementById('usersGrid');
  DOM.usersSearchInput = document.getElementById('usersSearchInput');
  DOM.addUserBtn = document.getElementById('addUserBtn');
  DOM.settingsAvatar = document.getElementById('settingsAvatar');
  DOM.settingsUserName = document.getElementById('settingsUserName');
  DOM.settingsUserEmail = document.getElementById('settingsUserEmail');
  DOM.settingsNameInput = document.getElementById('settingsNameInput');
  DOM.settingsEmailInput = document.getElementById('settingsEmailInput');
  DOM.saveProfileBtn = document.getElementById('saveProfileBtn');
  DOM.darkModeToggle = document.getElementById('darkModeToggle');
  DOM.compactModeToggle = document.getElementById('compactModeToggle');
  DOM.emailToggle = document.getElementById('emailToggle');
  DOM.pushToggle = document.getElementById('pushToggle');
  DOM.marketingToggle = document.getElementById('marketingToggle');
  DOM.twoFAToggle = document.getElementById('twoFAToggle');
  DOM.lineChartSvg = document.getElementById('lineChartSvg');
  DOM.linePath = document.getElementById('linePath');
  DOM.areaPath = document.getElementById('areaPath');
  DOM.linePoints = document.getElementById('linePoints');
  DOM.lineLabels = document.getElementById('lineLabels');
}

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheDOM();
  loadSettings();
  detectDeviceIdentity();
  applyUserIdentity();
  bindEvents();
  bindNavEvents();
  bindSettingsEvents();
  initClock();
  renderNotifications();
  loadDashboardData();
}

function showPage(page) {
  if (Store.currentPage === page) return;
  var sections = document.querySelectorAll('.page-section');
  sections.forEach(function(sec) { sec.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  Store.currentPage = page;

  // Update nav active state
  var navItems = DOM.navList.querySelectorAll('.nav-item');
  navItems.forEach(function(item) {
    item.classList.remove('active');
    item.removeAttribute('aria-current');
    if (item.dataset.page === page) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');
    }
  });

  if (page === 'analytics') renderAnalytics();
  if (page === 'users') renderUsersPage();
  if (page === 'settings') renderSettingsPage();

  if (window.innerWidth <= 1024) closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function detectDeviceIdentity() {
  var ua = navigator.userAgent;
  var name = 'User';
  if (ua.includes('Windows')) name = 'Windows User';
  else if (ua.includes('Mac') && !ua.includes('iPhone') && !ua.includes('iPad')) name = 'Mac User';
  else if (ua.includes('Linux') && !ua.includes('Android')) name = 'Linux User';
  else if (ua.includes('Android')) name = 'Android User';
  else if (ua.includes('iPhone')) name = 'iPhone User';
  else if (ua.includes('iPad')) name = 'iPad User';
  if (navigator.userAgentData && navigator.userAgentData.platform) {
    var p = navigator.userAgentData.platform;
    if (p.includes('Win')) name = 'Windows User';
    else if (p.includes('Mac')) name = 'Mac User';
    else if (p.includes('Linux')) name = 'Linux User';
    else if (p.includes('Android')) name = 'Android User';
    else name = p + ' User';
  }
  Store.deviceName = name;
}

function applyUserIdentity() {
  var name = Store.deviceName;
  var firstName = name.split(' ')[0];
  var avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random&color=fff&size=128';
  DOM.sidebarUserName.textContent = name;
  DOM.headerUserName.textContent = name;
  DOM.welcomeSubtitle.textContent = 'Welcome back, ' + firstName + " — here's what's happening today.";
  DOM.sidebarAvatar.src = avatarUrl;
  DOM.sidebarAvatar.alt = name;
  DOM.headerAvatar.src = avatarUrl;
  DOM.headerAvatar.alt = name;
  if (DOM.settingsAvatar) { DOM.settingsAvatar.src = avatarUrl; DOM.settingsAvatar.alt = name; }
  if (DOM.settingsUserName) DOM.settingsUserName.textContent = name;
  if (DOM.settingsNameInput) DOM.settingsNameInput.value = name;
}

function getCurrentTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('kite-theme', theme);
  Store.settings.darkMode = theme === 'dark';
  syncSettingsToggles();
}
function toggleTheme() { setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark'); }

function loadSettings() {
  var saved = localStorage.getItem('kite-settings');
  if (saved) {
    try { Store.settings = JSON.parse(saved); } catch(e) {}
  }
  var savedTheme = localStorage.getItem('kite-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    Store.settings.darkMode = savedTheme === 'dark';
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.setAttribute('data-theme', 'light');
    Store.settings.darkMode = false;
  }
}
function saveSettings() { localStorage.setItem('kite-settings', JSON.stringify(Store.settings)); }

function syncSettingsToggles() {
  if (DOM.darkModeToggle) DOM.darkModeToggle.classList.toggle('active', Store.settings.darkMode);
  if (DOM.compactModeToggle) DOM.compactModeToggle.classList.toggle('active', Store.settings.compactMode);
  if (DOM.emailToggle) DOM.emailToggle.classList.toggle('active', Store.settings.emailAlerts);
  if (DOM.pushToggle) DOM.pushToggle.classList.toggle('active', Store.settings.pushNotifications);
  if (DOM.marketingToggle) DOM.marketingToggle.classList.toggle('active', Store.settings.marketing);
  if (DOM.twoFAToggle) DOM.twoFAToggle.classList.toggle('active', Store.settings.twoFA);
}

function bindSettingsEvents() {
  if (!DOM.darkModeToggle) return;
  var toggles = [
    { el: DOM.darkModeToggle, key: 'darkMode', callback: function(v) { setTheme(v ? 'dark' : 'light'); } },
    { el: DOM.compactModeToggle, key: 'compactMode', callback: function(v) { document.body.classList.toggle('compact', v); } },
    { el: DOM.emailToggle, key: 'emailAlerts' },
    { el: DOM.pushToggle, key: 'pushNotifications' },
    { el: DOM.marketingToggle, key: 'marketing' },
    { el: DOM.twoFAToggle, key: 'twoFA' }
  ];
  toggles.forEach(function(t) {
    if (!t.el) return;
    t.el.addEventListener('click', function() {
      var isActive = t.el.classList.toggle('active');
      t.el.setAttribute('aria-pressed', isActive);
      Store.settings[t.key] = isActive;
      saveSettings();
      if (t.callback) t.callback(isActive);
      showToast(t.key.replace(/([A-Z])/g, ' $1').replace(/^./, function(s){return s.toUpperCase()}) + ' ' + (isActive ? 'enabled' : 'disabled'));
    });
  });

  if (DOM.saveProfileBtn) {
    DOM.saveProfileBtn.addEventListener('click', function() {
      var newName = DOM.settingsNameInput.value.trim();
      if (newName) {
        Store.deviceName = newName;
        applyUserIdentity();
        showToast('Profile saved successfully');
      }
    });
  }
  syncSettingsToggles();
}

function renderSettingsPage() {
  syncSettingsToggles();
}

function bindNavEvents() {
  if (!DOM.navList) return;
  var items = DOM.navList.querySelectorAll('.nav-item');
  items.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      showPage(this.dataset.page);
    });
  });
}

function bindEvents() {
  DOM.menuToggle.addEventListener('click', toggleSidebar);
  DOM.overlay.addEventListener('click', closeSidebar);
  DOM.searchInput.addEventListener('input', debounce(handleSearch, 150));
  DOM.notificationBtn.addEventListener('click', toggleNotifications);
  DOM.markAllRead.addEventListener('click', markAllNotificationsRead);
  DOM.viewAllBtn.addEventListener('click', function() { showToast('Full activity log coming soon'); });
  DOM.themeToggle.addEventListener('click', toggleTheme);
  if (DOM.addUserBtn) DOM.addUserBtn.addEventListener('click', function() { showToast('Add user feature coming soon'); });
  if (DOM.usersSearchInput) DOM.usersSearchInput.addEventListener('input', debounce(filterUsers, 150));
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', debounce(handleResize, 200));
}

async function fetchWithTimeout(url, ms) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, ms);
  try { var res = await fetch(url, { signal: controller.signal }); clearTimeout(timer); return res; }
  catch(e) { clearTimeout(timer); throw e; }
}

async function loadDashboardData() {
  var btcData = null, userData = [];
  try { var btcRes = await fetchWithTimeout(CONFIG.API.BITCOIN, CONFIG.TIMEOUT); btcData = await btcRes.json(); }
  catch { console.warn('Bitcoin API failed'); }
  try { var userRes = await fetchWithTimeout(CONFIG.API.USERS, CONFIG.TIMEOUT); userData = await userRes.json(); }
  catch { console.warn('Users API failed'); }
  Store.bitcoin = btcData || getFallbackBitcoin();
  Store.users = userData.length ? userData : getFallbackUsers();
  renderStats();
  renderChart();
  renderTable();
}

function getFallbackBitcoin() {
  return { bpi: { USD: { rate_float: 67432.50, rate: '67,432.50', code: 'USD', description: 'United States Dollar' } } };
}
function getFallbackUsers() {
  return [
    { id: 1, name: 'Leanne Graham', email: 'l.graham@kite.local', company: { name: 'Romaguera-Crona' } },
    { id: 2, name: 'Ervin Howell', email: 'ervin.howell@testmail.io', company: { name: 'Deckow-Crist' } },
    { id: 3, name: 'Clementine Bauch', email: 'clem.bauch@democorp.net', company: { name: 'Romaguera-Jacobson' } },
    { id: 4, name: 'Patricia Lebsack', email: 'patty.l@kite.local', company: { name: 'Robel-Corkery' } },
    { id: 5, name: 'Chelsey Dietrich', email: 'chels.dietrich@samplemail.dev', company: { name: 'Keebler LLC' } },
    { id: 6, name: 'Mrs. Dennis Schulist', email: 'd.schulist@testmail.io', company: { name: 'Considine-Lockman' } },
    { id: 7, name: 'Kurtis Weissnat', email: 'kurt.weissnat@democorp.net', company: { name: 'Johns Group' } },
    { id: 8, name: 'Nicholas Runolfsdottir', email: 'n.runolf@kite.local', company: { name: 'Abernathy Group' } },
    { id: 9, name: 'Glenna Reichert', email: 'g.reichert@samplemail.dev', company: { name: 'Yost and Sons' } },
    { id: 10, name: 'Clementina DuBuque', email: 'c.dubuque@testmail.io', company: { name: 'Hoeger LLC' } }
  ];
}

function renderStats() {
  var btcPrice = Store.bitcoin && Store.bitcoin.bpi && Store.bitcoin.bpi.USD ? Store.bitcoin.bpi.USD.rate_float : 67432.50;
  var stats = [
    { id: 'btc', label: 'Bitcoin Price', value: btcPrice, prefix: '$', decimals: 2, trend: 2.4, trendUp: true, icon: 'bitcoin' },
    { id: 'users', label: 'Total Users', value: 2847, prefix: '', decimals: 0, trend: 12.5, trendUp: true, icon: 'users' },
    { id: 'revenue', label: 'Revenue', value: 48295, prefix: '$', decimals: 0, trend: 8.2, trendUp: true, icon: 'dollar' },
    { id: 'conversion', label: 'Conversion Rate', value: 3.24, prefix: '', decimals: 2, suffix: '%', trend: -0.8, trendUp: false, icon: 'chart' }
  ];
  DOM.statsGrid.innerHTML = stats.map(function(stat, index) { return createStatCard(stat, index); }).join('');
  requestAnimationFrame(function() {
    stats.forEach(function(stat) {
      var el = document.getElementById('stat-value-' + stat.id);
      if (el) animateNumber(el, stat.value, { prefix: stat.prefix, suffix: stat.suffix || '', decimals: stat.decimals });
    });
  });
}

function createStatCard(stat, index) {
  var trendClass = stat.trendUp ? 'up' : 'down';
  var trendIcon = stat.trendUp
    ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>'
    : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  var icons = {
    bitcoin: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.5 9.5c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5-1 2-3 2-3 .5-3 2 1.5 1.5 3 1.5 2.5-.5 3-1.5"/><path d="M12 6v2"/><path d="M12 16v2"/></svg>',
    users: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    dollar: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
  };
  return '<article class="stat-card" style="animation-delay:' + (index * 0.1) + 's">' +
    '<div class="stat-header"><div class="stat-icon ' + stat.icon + '" aria-hidden="true">' + icons[stat.icon] + '</div>' +
    '<div class="trend ' + trendClass + '" aria-label="Trend ' + (stat.trendUp ? 'up' : 'down') + ' ' + Math.abs(stat.trend) + '%">' + trendIcon + '<span>' + Math.abs(stat.trend) + '%</span></div></div>' +
    '<div class="stat-value font-mono" id="stat-value-' + stat.id + '" aria-label="' + stat.label + '">0</div>' +
    '<div class="stat-label">' + stat.label + '</div></article>';
}

function animateNumber(element, target, options) {
  options = options || {};
  var duration = options.duration || 2000, prefix = options.prefix || '', suffix = options.suffix || '', decimals = options.decimals || 0;
  var startTime = performance.now();
  function format(value) {
    var fixed = value.toFixed(decimals);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return prefix + parts.join('.') + suffix;
  }
  function update(currentTime) {
    var elapsed = currentTime - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = format(target * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function renderChart() {
  var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var baseValues = [12400, 15800, 11300, 18900, 14200, 21500, 17600];
  Store.chartData = days.map(function(day, i) { return { day: day, value: baseValues[i] + Math.floor(Math.random() * 2000 - 1000) }; });
  var maxValue = Math.max.apply(null, Store.chartData.map(function(d) { return d.value; }));
  DOM.mainChart.innerHTML = Store.chartData.map(function(item, index) {
    var heightPx = Math.round((item.value / maxValue) * CONFIG.CHART_MAX_HEIGHT);
    return '<div class="bar-wrapper"><div class="bar" data-height="' + heightPx + '" data-value="$' + item.value.toLocaleString() + '" style="height:0px;" aria-label="' + item.day + ': $' + item.value.toLocaleString() + '"></div><span class="bar-label">' + item.day + '</span></div>';
  }).join('');
  requestAnimationFrame(function() {
    var bars = DOM.mainChart.querySelectorAll('.bar');
    bars.forEach(function(bar, index) {
      var target = parseInt(bar.dataset.height, 10);
      setTimeout(function() { bar.style.height = target + 'px'; }, 120 + index * 100);
    });
  });
}

function renderAnalytics() {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var visitors = [4200, 5100, 4800, 6200, 5800, 7100, 6900, 7400, 8100, 7800, 9200, 10500];
  var unique = [3100, 3800, 3500, 4600, 4200, 5200, 5000, 5400, 5900, 5600, 6700, 7600];
  Store.lineChartData = months.map(function(m, i) { return { month: m, visitors: visitors[i], unique: unique[i] }; });

  var width = 600, height = 220, padding = 10;
  var maxVal = Math.max.apply(null, visitors);
  var points = visitors.map(function(v, i) {
    var x = padding + (i / (visitors.length - 1)) * (width - padding * 2);
    var y = height - padding - (v / maxVal) * (height - padding * 2);
    return { x: x, y: y, v: v, m: months[i] };
  });

  // Build path
  var pathD = points.map(function(p, i) { return (i === 0 ? 'M' : 'L') + p.x + ',' + p.y; }).join(' ');
  var areaD = pathD + ' L' + points[points.length - 1].x + ',' + (height - padding) + ' L' + points[0].x + ',' + (height - padding) + ' Z';

  if (DOM.linePath) DOM.linePath.setAttribute('d', pathD);
  if (DOM.areaPath) DOM.areaPath.setAttribute('d', areaD);

  if (DOM.linePoints) {
    DOM.linePoints.innerHTML = points.map(function(p, i) {
      return '<circle class="line-point" cx="' + p.x + '" cy="' + p.y + '" style="animation-delay:' + (0.8 + i * 0.06) + 's"/>';
    }).join('');
  }

  if (DOM.lineLabels) {
    DOM.lineLabels.innerHTML = months.map(function(m) { return '<span class="line-label">' + m + '</span>'; }).join('');
  }
}

function renderUsersPage() {
  if (!DOM.usersGrid) return;
  var users = Store.users;
  DOM.usersGrid.innerHTML = users.map(function(user, index) {
    var company = user.company && user.company.name ? user.company.name : 'Kite';
    var avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=random&color=fff&size=128';
    return '<article class="user-card" style="animation-delay:' + (index * 0.05) + 's">' +
      '<img src="' + avatarUrl + '" alt="' + escapeHtml(user.name) + '" class="user-card-avatar" loading="lazy">' +
      '<div class="user-card-name">' + escapeHtml(user.name) + '</div>' +
      '<div class="user-card-email">' + escapeHtml(user.email) + '</div>' +
      '<div class="user-card-company">' + escapeHtml(company) + '</div>' +
      '<div class="user-card-actions">' +
        '<button class="icon-btn" aria-label="Message ' + escapeHtml(user.name) + '">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
        '</button>' +
        '<button class="icon-btn" aria-label="Edit ' + escapeHtml(user.name) + '">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
      '</div>' +
    '</article>';
  }).join('');
}

function filterUsers(e) {
  var query = e.target.value.toLowerCase().trim();
  var cards = DOM.usersGrid.querySelectorAll('.user-card');
  cards.forEach(function(card) {
    card.style.display = card.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

function renderTable() {
  var actions = ['Purchased Pro Plan', 'Updated Profile', 'Created New Project', 'Submitted Support Ticket', 'Logged In', 'Changed Settings', 'Downloaded Report', 'Invited Team Member'];
  var statuses = ['completed', 'pending', 'failed'];
  var rows = Store.users.slice(0, 8).map(function(user, index) {
    var action = actions[Math.floor(Math.random() * actions.length)];
    var status = statuses[Math.floor(Math.random() * statuses.length)];
    var minutesAgo = Math.floor(Math.random() * 10080) + 2;
    return '<tr style="animation-delay:' + (index * 0.05) + 's">' +
      '<td><div class="user-cell"><img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=random&color=fff&size=128" alt="" class="avatar" loading="lazy"><div><div class="user-name">' + escapeHtml(user.name) + '</div><div class="user-email">' + escapeHtml(user.email) + '</div></div></div></td>' +
      '<td>' + escapeHtml(action) + '</td>' +
      '<td><span class="status-badge ' + status + '">' + status + '</span></td>' +
      '<td class="time-cell">' + formatRelativeTime(minutesAgo) + '</td>' +
    '</tr>';
  }).join('');
  DOM.tableBody.innerHTML = rows;
}

function formatRelativeTime(minutes) {
  if (minutes < 60) return minutes + ' min ago';
  if (minutes < 1440) return Math.floor(minutes / 60) + ' hours ago';
  return Math.floor(minutes / 1440) + ' days ago';
}
function escapeHtml(text) { var div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function handleSearch(e) {
  var query = e.target.value.toLowerCase().trim();
  var rows = DOM.tableBody.querySelectorAll('tr');
  rows.forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}

function renderNotifications() {
  var unreadCount = Store.notifications.filter(function(n) { return n.unread; }).length;
  DOM.notificationBadge.textContent = unreadCount;
  DOM.notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
  var badgeText = document.querySelector('.notification-badge-text');
  if (badgeText) badgeText.textContent = unreadCount + ' new';
  DOM.notificationList.innerHTML = Store.notifications.map(function(n) {
    return '<div class="notification-item ' + (n.unread ? '' : 'read') + '" data-id="' + n.id + '"><span class="notification-dot" aria-hidden="true"></span><div class="notification-content"><p>' + escapeHtml(n.text) + '</p><time>' + escapeHtml(n.time) + '</time></div></div>';
  }).join('');
  DOM.notificationList.querySelectorAll('.notification-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = parseInt(item.dataset.id, 10);
      var notif = Store.notifications.find(function(n) { return n.id === id; });
      if (notif) { notif.unread = false; renderNotifications(); }
    });
  });
}
function toggleNotifications(e) {
  e.stopPropagation();
  Store.isNotificationsOpen = !Store.isNotificationsOpen;
  DOM.notificationDropdown.hidden = !Store.isNotificationsOpen;
  DOM.notificationDropdown.classList.toggle('open', Store.isNotificationsOpen);
  DOM.notificationBtn.setAttribute('aria-expanded', Store.isNotificationsOpen);
}
function markAllNotificationsRead() { Store.notifications.forEach(function(n) { n.unread = false; }); renderNotifications(); }

function toggleSidebar() {
  Store.isSidebarOpen = !Store.isSidebarOpen;
  DOM.sidebar.classList.toggle('open', Store.isSidebarOpen);
  DOM.overlay.classList.toggle('active', Store.isSidebarOpen);
  DOM.menuToggle.setAttribute('aria-expanded', Store.isSidebarOpen);
  DOM.menuToggle.setAttribute('aria-label', Store.isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu');
}
function closeSidebar() {
  Store.isSidebarOpen = false;
  DOM.sidebar.classList.remove('open');
  DOM.overlay.classList.remove('active');
  DOM.menuToggle.setAttribute('aria-expanded', 'false');
  DOM.menuToggle.setAttribute('aria-label', 'Open navigation menu');
}

function initClock() { updateClock(); setInterval(updateClock, 1000); }
function updateClock() {
  var now = new Date();
  DOM.clockTime.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  DOM.clockDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  var progress = (now - startOfDay) / (endOfDay - startOfDay);
  var radius = 42, circumference = 2 * Math.PI * radius;
  DOM.dayProgress.style.strokeDasharray = circumference + '';
  DOM.dayProgress.style.strokeDashoffset = (circumference - (progress * circumference)) + '';
  DOM.progressText.textContent = Math.round(progress * 100) + '%';
}

function showToast(message) {
  var toast = document.getElementById('kite-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'kite-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

function handleClickOutside(e) {
  if (Store.isNotificationsOpen && !DOM.notificationDropdown.contains(e.target) && !DOM.notificationBtn.contains(e.target)) {
    Store.isNotificationsOpen = false;
    DOM.notificationDropdown.classList.remove('open');
    DOM.notificationBtn.setAttribute('aria-expanded', 'false');
  }
}
function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeSidebar();
    if (Store.isNotificationsOpen) { Store.isNotificationsOpen = false; DOM.notificationDropdown.classList.remove('open'); DOM.notificationBtn.setAttribute('aria-expanded', 'false'); }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); DOM.searchInput.focus(); }
}
function handleResize() { if (window.innerWidth > 1024 && Store.isSidebarOpen) closeSidebar(); }
function debounce(fn, delay) { var timeout; return function() { var args = arguments; clearTimeout(timeout); timeout = setTimeout(function() { fn.apply(null, args); }, delay); }; }
