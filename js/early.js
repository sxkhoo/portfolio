// Runs before first paint: switch on camera mode so the desk can take over.
// If main.js never finishes booting (blocked, offline, an error), fall back
// to the plain document after 6 s.
(function () {
  var html = document.documentElement;
  html.classList.add('js');
  setTimeout(function () {
    if (!window.__vfBooted) html.classList.remove('js');
  }, 6000);
})();
