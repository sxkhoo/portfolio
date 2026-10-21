// Runs before first paint: switch on camera mode so the desk can take over.
// If main.js never finishes booting (blocked, offline, an error), fall back
// to the plain document after 6 s.
(function () {
  var html = document.documentElement;
  html.classList.add('js');
  setTimeout(function () {
    if (!window.__vfBooted) html.classList.remove('js');
  }, 6000);

  // web fonts load without blocking the first paint (fonts swap in when ready;
  // without JS the page simply uses system fonts)
  var fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Inter+Tight:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
  document.head.appendChild(fonts);
})();
