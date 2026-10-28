// 三語切換:網址 #zh-TW / #zh-CN / #en,沒有時用瀏覽器語言;沒有 JS 時三語全部顯示(見各頁 <noscript>)
(function () {
  var langs = ["zh-TW", "zh-CN", "en"];
  function pick() {
    var h = (location.hash || "").replace("#", "");
    if (langs.indexOf(h) >= 0) return h;
    var n = (navigator.language || "en").toLowerCase();
    if (n.indexOf("zh-cn") === 0 || n.indexOf("zh-hans") === 0) return "zh-CN";
    if (n.indexOf("zh") === 0) return "zh-TW";
    return "en";
  }
  function apply(l) {
    document.documentElement.lang = l;
    document.querySelectorAll("section[data-lang]").forEach(function (s) { s.classList.toggle("on", s.getAttribute("data-lang") === l); });
    document.querySelectorAll("nav.langs button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set") === l)); });
  }
  document.querySelectorAll("nav.langs button").forEach(function (b) {
    b.addEventListener("click", function () { var l = b.getAttribute("data-set"); history.replaceState(null, "", "#" + l); apply(l); });
  });
  window.addEventListener("hashchange", function () { apply(pick()); });
  apply(pick());
})();
