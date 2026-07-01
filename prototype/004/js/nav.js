(function () {
  var toggle = document.getElementById("nav-toggle");
  var drawer = document.getElementById("nav-drawer");
  var overlay = document.getElementById("nav-overlay");

  if (!toggle || !drawer || !overlay) return;

  function openNav() {
    drawer.classList.add("nav--open");
    overlay.classList.add("nav-overlay--visible");
    overlay.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeNav() {
    drawer.classList.remove("nav--open");
    overlay.classList.remove("nav-overlay--visible");
    overlay.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    if (drawer.classList.contains("nav--open")) {
      closeNav();
    } else {
      openNav();
    }
  });

  overlay.addEventListener("click", closeNav);

  drawer.querySelectorAll(".nav__link").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNav();
    }
  });
})();
