// Apply the saved (or OS) theme before first paint to avoid a flash.
// Kept as an external file (not inline) so it runs under a strict
// `script-src 'self'` Content-Security-Policy when served by the API host.
(function () {
  try {
    var saved = localStorage.getItem('vb.theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
