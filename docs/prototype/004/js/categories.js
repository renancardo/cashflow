(function () {
  var page = document.getElementById("categories-page");
  var emptyEl = document.getElementById("cat-empty");
  var overlay = document.getElementById("category-overlay");
  if (!page || !overlay) return;

  var titleEl = document.getElementById("editor-panel-title");
  var subtitleEl = document.getElementById("editor-panel-subtitle");
  var nameInput = document.getElementById("cat-name");
  var kindSelect = document.getElementById("cat-kind");
  var parentGroup = document.getElementById("cat-parent-group");
  var parentSelect = document.getElementById("cat-parent");
  var budgetSection = document.getElementById("cat-budget-section");
  var budgetAmountInput = document.getElementById("cat-budget-amount");
  var snapshotSelect = document.getElementById("filter-snapshot");
  var snapshotBanner = document.getElementById("snapshot-banner");
  var snapshotBannerName = snapshotBanner ? snapshotBanner.querySelector(".snapshot-banner__name") : null;
  var closeBtn = overlay.querySelector(".editor-panel__close");
  var backdrop = overlay.querySelector(".category-overlay__backdrop");
  var selectedRow = null;

  function setKindFilter(kind) {
    page.classList.remove("page--filter-expense", "page--filter-income");
    if (kind === "expense") page.classList.add("page--filter-expense");
    if (kind === "income") page.classList.add("page--filter-income");
  }

  function toggleSnapshotMode(enabled, label) {
    page.classList.toggle("page--snapshot", enabled);
    document.querySelectorAll(".cat-list--budget").forEach(function (list) {
      list.classList.toggle("page--snapshot", enabled);
    });
    if (snapshotBannerName && label) snapshotBannerName.textContent = label;
  }

  function toggleBudgetFields(isExpense) {
    if (budgetSection) budgetSection.hidden = !isExpense;
    if (parentGroup) parentGroup.hidden = !isExpense;
  }

  function openPanel(row, isNew) {
    if (selectedRow) selectedRow.classList.remove("cat-row--selected");
    selectedRow = row || null;
    if (selectedRow) selectedRow.classList.add("cat-row--selected");

    if (isNew) {
      titleEl.textContent = "Add category";
      subtitleEl.textContent = "New category";
      nameInput.value = "";
      kindSelect.value = "expense";
      if (parentSelect) parentSelect.value = "";
      if (budgetAmountInput) budgetAmountInput.value = "";
      toggleBudgetFields(true);
    } else {
      var name = row.querySelector(".cat-row__name").textContent.trim();
      var kind = row.dataset.kind || "expense";
      var parent = row.dataset.parent || "";
      var isExpense = kind === "expense";

      titleEl.textContent = "Edit category";
      subtitleEl.textContent = name + " · " + (isExpense ? "Expense" : "Income") + (parent ? " · child of " + parent : " · root");
      nameInput.value = name;
      kindSelect.value = kind;
      toggleBudgetFields(isExpense);

      if (parentSelect) {
        parentSelect.value = parent ? parent.toLowerCase() : "";
        parentSelect.disabled = row.classList.contains("cat-row--parent");
      }

      if (budgetAmountInput && isExpense) {
        var budgetCell = row.querySelector(".cat-row__budget");
        var budgetText = budgetCell && !budgetCell.classList.contains("cat-row__budget--empty")
          ? budgetCell.textContent.trim()
          : "";
        budgetAmountInput.value = budgetText;
      }
    }

    overlay.classList.add("category-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    overlay.classList.remove("category-overlay--open");
    overlay.setAttribute("aria-hidden", "true");
    if (selectedRow) {
      selectedRow.classList.remove("cat-row--selected");
      selectedRow = null;
    }
  }

  document.querySelectorAll(".cat-row__edit").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      openPanel(btn.closest(".cat-row"), false);
    });
  });

  ["add-category-btn", "empty-add-btn"].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", function () { openPanel(null, true); });
  });

  if (kindSelect) {
    kindSelect.addEventListener("change", function () {
      toggleBudgetFields(kindSelect.value === "expense");
    });
  }

  document.querySelectorAll(".cat-toolbar__chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".cat-toolbar__chip").forEach(function (c) {
        c.classList.remove("cat-toolbar__chip--active");
      });
      chip.classList.add("cat-toolbar__chip--active");
      setKindFilter(chip.dataset.kind);
    });
  });

  if (snapshotSelect) {
    snapshotSelect.addEventListener("change", function () {
      var option = snapshotSelect.options[snapshotSelect.selectedIndex];
      toggleSnapshotMode(Boolean(snapshotSelect.value), option ? option.textContent : "");
    });
  }

  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("category-overlay--open")) {
      closePanel();
    }
  });

  var params = new URLSearchParams(window.location.search);

  if (params.get("empty") === "1") {
    page.classList.add("page--empty");
    if (emptyEl) emptyEl.classList.add("cat-empty--visible");
  }

  if (params.get("filter") === "expense") {
    setKindFilter("expense");
    document.querySelectorAll(".cat-toolbar__chip").forEach(function (chip) {
      chip.classList.toggle("cat-toolbar__chip--active", chip.dataset.kind === "expense");
    });
  }

  if (params.get("filter") === "income") {
    setKindFilter("income");
    document.querySelectorAll(".cat-toolbar__chip").forEach(function (chip) {
      chip.classList.toggle("cat-toolbar__chip--active", chip.dataset.kind === "income");
    });
  }

  if (params.get("snapshot") === "1" && snapshotSelect) {
    snapshotSelect.value = "baseline-jun";
    toggleSnapshotMode(true, "Baseline — Jun 2026");
  }

  if (params.get("edit") === "1") {
    var foodRow = document.querySelector('.cat-row[data-name="Food"]');
    if (foodRow) openPanel(foodRow, false);
  }
})();
