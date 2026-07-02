(function () {
  var page = document.getElementById("snapshots-page");
  var emptyEl = document.getElementById("snap-empty");
  var overlay = document.getElementById("snapshot-overlay");
  if (!page || !overlay) return;

  var closeBtn = overlay.querySelector(".editor-panel__close");
  var cancelBtn = overlay.querySelector(".editor-panel__cancel");
  var backdrop = overlay.querySelector(".snapshot-overlay__backdrop");
  var summaryName = document.getElementById("summary-selected-name");
  var summaryAsOf = document.getElementById("summary-as-of");
  var summaryVariance = document.getElementById("summary-variance");
  var compareSubtitle = document.getElementById("compare-subtitle");
  var selectedRow = document.querySelector(".snap-row--selected");

  function openCreatePanel() {
    overlay.classList.add("snapshot-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeCreatePanel() {
    overlay.classList.remove("snapshot-overlay--open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function selectSnapshot(row) {
    if (selectedRow) selectedRow.classList.remove("snap-row--selected");
    selectedRow = row;
    row.classList.add("snap-row--selected");

    var name = row.dataset.name;
    var asOf = row.dataset.asOf;
    var variance = row.dataset.variance;

    if (summaryName) summaryName.textContent = name;
    if (summaryAsOf) summaryAsOf.textContent = asOf;
    if (summaryVariance) {
      summaryVariance.textContent = variance;
      summaryVariance.classList.toggle("summary-strip__value--danger", variance.indexOf("−") === 0);
      summaryVariance.classList.toggle("summary-strip__value--success", variance.indexOf("+") === 0);
    }
    if (compareSubtitle) {
      compareSubtitle.textContent = name + " · snapshot baseline vs current actuals";
    }
  }

  document.querySelectorAll(".snap-row").forEach(function (row) {
    row.addEventListener("click", function (event) {
      if (event.target.closest(".snap-row__actions")) return;
      selectSnapshot(row);
    });
  });

  document.querySelectorAll(".snap-row__delete").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  });

  ["create-snapshot-btn", "empty-create-btn"].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", openCreatePanel);
  });

  closeBtn.addEventListener("click", closeCreatePanel);
  if (cancelBtn) cancelBtn.addEventListener("click", closeCreatePanel);
  backdrop.addEventListener("click", closeCreatePanel);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("snapshot-overlay--open")) {
      closeCreatePanel();
    }
  });

  var params = new URLSearchParams(window.location.search);

  if (params.get("empty") === "1") {
    page.classList.add("page--empty");
    if (emptyEl) emptyEl.classList.add("snap-empty--visible");
  }

  if (params.get("create") === "1") {
    openCreatePanel();
  }

  if (params.get("compare") === "pre-vacation") {
    var preVacationRow = document.querySelector('.snap-row[data-id="pre-vacation"]');
    if (preVacationRow) selectSnapshot(preVacationRow);
  }
})();
