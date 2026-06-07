// Dark-mode toggle. The inline no-flash snippet in <head> already applied the
// saved (or OS-preferred) theme before first paint; this only wires the toggle
// button(s) to flip `data-theme` on <html> and persist the choice.
(function () {
  function toggle() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (dark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  }

  var buttons = document.querySelectorAll(".theme-toggle");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", toggle);
  }
})();
