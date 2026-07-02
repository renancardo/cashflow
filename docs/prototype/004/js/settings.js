(function () {
  var params = new URLSearchParams(window.location.search);

  var importErrorBanner = document.getElementById("import-error-banner");
  var saveSuccessBanner = document.getElementById("save-success-banner");
  var saveBtn = document.getElementById("save-settings-btn");
  var exportBtns = [
    document.getElementById("export-backup-btn"),
    document.getElementById("export-backup-secondary"),
  ].filter(Boolean);
  var importInput = document.getElementById("import-file");
  var importBtn = document.getElementById("import-restore-btn");
  var langButtons = document.querySelectorAll(".lang-switch__btn");

  function showBanner(banner) {
    if (!banner) return;
    banner.classList.add("settings-banner--visible");
    banner.setAttribute("aria-hidden", "false");
  }

  function hideBanner(banner) {
    if (!banner) return;
    banner.classList.remove("settings-banner--visible");
    banner.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll(".settings-banner__dismiss").forEach(function (btn) {
    btn.addEventListener("click", function () {
      hideBanner(btn.closest(".settings-banner"));
    });
  });

  if (params.get("import-error") === "1") {
    showBanner(importErrorBanner);
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      langButtons.forEach(function (other) {
        other.classList.remove("lang-switch__btn--active");
        other.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("lang-switch__btn--active");
      btn.setAttribute("aria-pressed", "true");
    });
  });

  document.querySelectorAll(".working-default:not(.working-default--disabled) .working-default__toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("toggle--on");
      var on = toggle.classList.contains("toggle--on");
      toggle.setAttribute("aria-checked", on ? "true" : "false");
      toggle.setAttribute("aria-label", on ? "Working by default" : "Not working by default");
    });
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      hideBanner(importErrorBanner);
      showBanner(saveSuccessBanner);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  exportBtns.forEach(function (exportBtn) {
    var defaultLabel = exportBtn.textContent;
    exportBtn.addEventListener("click", function () {
      exportBtn.textContent = "Exporting…";
      window.setTimeout(function () {
        exportBtn.textContent = defaultLabel;
      }, 600);
    });
  });

  if (importBtn && importInput) {
    importBtn.addEventListener("click", function () {
      if (!importInput.files || !importInput.files.length) {
        importInput.click();
        return;
      }
      hideBanner(saveSuccessBanner);
      if (params.get("import-error") === "1") {
        showBanner(importErrorBanner);
      } else {
        showBanner(saveSuccessBanner);
        if (saveSuccessBanner) {
          saveSuccessBanner.querySelector(".settings-banner__title").textContent = "Backup restored";
          saveSuccessBanner.querySelector(".settings-banner__desc").textContent =
            "All entities were imported successfully. Projection has been recomputed.";
        }
      }
    });

    importInput.addEventListener("change", function () {
      if (importInput.files && importInput.files.length) {
        importBtn.textContent = "Restore from " + importInput.files[0].name;
      }
    });
  }
})();
