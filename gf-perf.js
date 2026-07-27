(function () {
  function removeShell() {
    var root = document.getElementById('dc-root');
    var shell = document.getElementById('gf-static-shell');
    if (root && shell) {
      shell.remove();
      return true;
    }
    return false;
  }
  if (!removeShell()) {
    var mo = new MutationObserver(function () {
      if (removeShell()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      mo.disconnect();
      var shell = document.getElementById('gf-static-shell');
      if (shell) shell.remove();
    }, 12000);
  }
})();
