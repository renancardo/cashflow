(function () {
  var overlay = document.getElementById("txn-overlay");
  var page = document.getElementById("txn-page");
  var emptyState = document.getElementById("txn-empty");
  var addTxnBtn = document.getElementById("add-txn-btn");
  var emptyAddBtn = document.getElementById("empty-add-btn");

  if (!overlay) return;

  var titleEl = document.getElementById("txn-editor-title");
  var subtitleEl = document.getElementById("txn-editor-subtitle");
  var dateInput = document.getElementById("txn-date");
  var amountInput = document.getElementById("txn-amount");
  var descriptionInput = document.getElementById("txn-description");
  var categoryGroup = document.getElementById("txn-category-group");
  var toGroup = document.getElementById("txn-to-group");
  var settlementBlock = document.getElementById("txn-settlement");
  var settlementText = document.getElementById("txn-settlement-text");
  var typeButtons = overlay.querySelectorAll(".txn-editor__type-btn");
  var closeBtn = overlay.querySelector(".txn-editor__close");
  var backdrop = overlay.querySelector(".txn-overlay__backdrop");
  var selectedRow = null;

  var params = new URLSearchParams(window.location.search);

  if (params.get("empty") === "1" && page && emptyState) {
    page.classList.add("page--empty");
    emptyState.classList.add("txn-empty--visible");
  }

  function chipTypeFromRow(row) {
    var chip = row.querySelector(".chip");
    if (!chip) return "expense";
    if (chip.classList.contains("chip--income")) return "income";
    if (chip.classList.contains("chip--transfer")) return "transfer";
    return "expense";
  }

  function setEditorType(type) {
    typeButtons.forEach(function (btn) {
      btn.classList.toggle("txn-editor__type-btn--active", btn.dataset.type === type);
    });
    categoryGroup.hidden = type === "transfer";
    toGroup.hidden = type !== "transfer";
  }

  function openPanel(row) {
    if (selectedRow) {
      selectedRow.classList.remove("txn-row--selected");
    }

    selectedRow = row || null;
    if (row) {
      row.classList.add("txn-row--selected");

      var description = row.querySelector(".txn-row__description").textContent.trim();
      var date = row.querySelector(".txn-row__date").textContent.trim();
      var amountEl = row.querySelector(".txn-row__amount");
      var type = chipTypeFromRow(row);
      var settleChip = row.querySelector(".chip--settle");

      titleEl.textContent = "Edit transaction";
      subtitleEl.textContent = description + " · " + date;
      dateInput.value = date + "/2026";
      amountInput.value = amountEl.textContent.replace(/^[+\−]\s*/, "").trim();
      descriptionInput.value = description;
      setEditorType(type);

      if (settleChip) {
        settlementBlock.hidden = false;
        settlementText.textContent = "Settles: " + settleChip.textContent.trim() + " — " + description;
      } else {
        settlementBlock.hidden = true;
      }
    } else {
      titleEl.textContent = "Add transaction";
      subtitleEl.textContent = "New entry";
      dateInput.value = "30/06/2026";
      amountInput.value = "";
      descriptionInput.value = "";
      setEditorType("expense");
      settlementBlock.hidden = true;
    }

    overlay.classList.add("txn-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    overlay.classList.remove("txn-overlay--open");
    overlay.setAttribute("aria-hidden", "true");

    if (selectedRow) {
      selectedRow.classList.remove("txn-row--selected");
      selectedRow = null;
    }
  }

  document.querySelectorAll(".txn-row__edit").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      openPanel(btn.closest(".txn-row"));
    });
  });

  typeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setEditorType(btn.dataset.type);
    });
  });

  if (addTxnBtn) addTxnBtn.addEventListener("click", function () { openPanel(null); });
  if (emptyAddBtn) emptyAddBtn.addEventListener("click", function () { openPanel(null); });

  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("txn-overlay--open")) {
      closePanel();
    }
  });

  if (params.get("edit") === "1") {
    var firstRow = document.querySelector(".txn-row");
    if (firstRow) openPanel(firstRow);
  }

  if (params.get("add") === "1") {
    openPanel(null);
  }
})();
