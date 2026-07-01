(function () {
  var overlay = document.getElementById("account-overlay");
  if (!overlay) return;

  var titleEl = document.getElementById("editor-panel-title");
  var subtitleEl = document.getElementById("editor-panel-subtitle");
  var nameInput = document.getElementById("name");
  var typeSelect = document.getElementById("type");
  var closeBtn = overlay.querySelector(".editor-panel__close");
  var backdrop = overlay.querySelector(".account-overlay__backdrop");
  var cardSections = overlay.querySelectorAll(".form-section--card");
  var anchorBalanceLabel = overlay.querySelector('label[for="anchor-balance"]');
  var selectedRow = null;

  function accountTypeFromChip(chip) {
    return chip.textContent.trim();
  }

  function setTypeSelect(type) {
    Array.from(typeSelect.options).forEach(function (option) {
      option.selected = option.textContent === type;
    });
  }

  function toggleCardSections(isCard) {
    cardSections.forEach(function (section) {
      section.hidden = !isCard;
    });
  }

  function openPanel(row) {
    if (selectedRow) {
      selectedRow.classList.remove("account-row--selected");
    }

    selectedRow = row;
    row.classList.add("account-row--selected");

    var name = row.querySelector(".account-row__name").textContent.trim();
    var chip = row.querySelector(".chip");
    var type = accountTypeFromChip(chip);
    var isCard = chip.classList.contains("chip--card");

    titleEl.textContent = "Edit account";
    subtitleEl.textContent = name + " · " + type;
    nameInput.value = name;
    setTypeSelect(type);
    toggleCardSections(isCard);
    if (anchorBalanceLabel) {
      anchorBalanceLabel.textContent = isCard ? "Amount owed" : "Balance";
    }

    overlay.classList.add("account-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    overlay.classList.remove("account-overlay--open");
    overlay.setAttribute("aria-hidden", "true");

    if (selectedRow) {
      selectedRow.classList.remove("account-row--selected");
      selectedRow = null;
    }
  }

  document.querySelectorAll(".account-row__edit").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      openPanel(btn.closest(".account-row"));
    });
  });

  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("account-overlay--open")) {
      closePanel();
    }
  });

  var params = new URLSearchParams(window.location.search);
  if (params.get("edit") === "1") {
    var cardRow = document.querySelector(".account-row .chip--card")?.closest(".account-row");
    if (cardRow) openPanel(cardRow);
  }
})();
