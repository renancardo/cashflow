(function () {
  var overlay = document.getElementById("forecast-overlay");
  var page = document.getElementById("forecast-page");
  var emptyState = document.getElementById("forecast-empty");
  var addBtn = document.getElementById("add-forecast-btn");
  var emptyAddBtn = document.getElementById("empty-add-btn");
  var addInstallmentBtn = document.getElementById("add-installment-btn");
  var emptyInstallmentBtn = document.getElementById("empty-installment-btn");
  var filterBar = document.getElementById("forecast-filters");
  var recurrenceDialog = document.getElementById("recurrence-dialog");

  if (!overlay) return;

  var titleEl = document.getElementById("forecast-editor-title");
  var subtitleEl = document.getElementById("forecast-editor-subtitle");
  var descriptionInput = document.getElementById("fc-description");
  var amountInput = document.getElementById("fc-amount");
  var categoryGroup = document.getElementById("fc-category-group");
  var toGroup = document.getElementById("fc-to-group");
  var recurrenceSelect = document.getElementById("fc-recurrence");
  var intervalSuffix = document.getElementById("fc-interval-suffix");
  var dayOfMonthGroup = document.getElementById("fc-day-of-month-group");
  var weekdayGroup = document.getElementById("fc-weekday-group");
  var monthOfYearGroup = document.getElementById("fc-month-of-year-group");
  var previewSection = document.getElementById("fc-preview-section");
  var typeButtons = overlay.querySelectorAll(".forecast-editor__type-btn");
  var closeBtn = overlay.querySelector(".forecast-editor__close");
  var backdrop = overlay.querySelector(".forecast-overlay__backdrop");
  var saveBtn = overlay.querySelector(".forecast-editor__footer .btn--primary");
  var selectedRow = null;

  var params = new URLSearchParams(window.location.search);

  if (params.get("empty") === "1" && page && emptyState) {
    page.classList.add("page--empty");
    emptyState.classList.add("forecast-empty--visible");
  }

  function applyFilter(filter) {
    if (!filterBar) return;

    filterBar.querySelectorAll(".forecast-filters__chip").forEach(function (chip) {
      chip.classList.toggle("forecast-filters__chip--active", chip.dataset.filter === filter);
    });

    document.querySelectorAll(".forecast-row[data-kind='planned']").forEach(function (row) {
      var type = row.dataset.type;
      var isSubscription = row.dataset.subscription === "true";
      var visible = filter === "all"
        || (filter === "subscription" && isSubscription)
        || (filter === type);

      row.classList.toggle("forecast-row--hidden", !visible);
    });

    document.querySelectorAll(".forecast-group[data-group]").forEach(function (group) {
      var groupName = group.dataset.group;
      var plannedRows = group.querySelectorAll(".forecast-row[data-kind='planned']:not(.forecast-row--hidden)");
      var installmentPlans = group.querySelectorAll(".installment-plan");

      if (groupName === "installments") {
        group.classList.toggle("forecast-group--hidden", filter !== "all" && filter !== "expense");
        return;
      }

      if (groupName === "one-off" && filter === "subscription") {
        group.classList.toggle("forecast-group--hidden", true);
        return;
      }

      if (groupName === "recurring" || groupName === "one-off") {
        group.classList.toggle("forecast-group--hidden", plannedRows.length === 0);
      } else {
        group.classList.toggle("forecast-group--hidden", installmentPlans.length === 0);
      }
    });
  }

  if (filterBar) {
    filterBar.addEventListener("click", function (event) {
      var chip = event.target.closest(".forecast-filters__chip");
      if (!chip) return;
      applyFilter(chip.dataset.filter);
    });
  }

  document.querySelectorAll(".installment-plan__expand").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      var plan = btn.closest(".installment-plan");
      var schedule = plan.querySelector(".installment-schedule");
      if (!schedule) return;

      var isOpen = !schedule.hidden;
      schedule.hidden = isOpen;
      plan.classList.toggle("installment-plan--expanded", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  var intervalLabels = {
    once: "time",
    weekly: "week(s)",
    monthly: "month(s)",
    yearly: "year(s)"
  };

  function chipTypeFromRow(row) {
    var chip = row.querySelector(".chip--income, .chip--expense, .chip--transfer");
    if (!chip) return "expense";
    if (chip.classList.contains("chip--income")) return "income";
    if (chip.classList.contains("chip--transfer")) return "transfer";
    return "expense";
  }

  function setEditorType(type) {
    typeButtons.forEach(function (btn) {
      btn.classList.toggle("forecast-editor__type-btn--active", btn.dataset.type === type);
    });
    categoryGroup.hidden = type === "transfer";
    toGroup.hidden = type !== "transfer";
  }

  function setRecurrenceFields(recurrence) {
    intervalSuffix.textContent = intervalLabels[recurrence] || "month(s)";
    dayOfMonthGroup.hidden = recurrence === "once";
    weekdayGroup.hidden = recurrence !== "weekly";
    monthOfYearGroup.hidden = recurrence !== "yearly";
    previewSection.hidden = recurrence === "once";

    var dayInput = document.getElementById("fc-day-of-month");
    if (dayInput) {
      dayInput.parentElement.hidden = recurrence === "weekly" || recurrence === "once";
    }
  }

  function openPanel(row) {
    if (selectedRow) {
      selectedRow.classList.remove("forecast-row--selected");
    }

    selectedRow = row || null;

    if (row) {
      row.classList.add("forecast-row--selected");

      var name = row.querySelector(".forecast-row__name").textContent.trim();
      var account = row.querySelector(".forecast-row__account").textContent.trim();
      var recurrence = row.dataset.recurrence || "monthly";
      var amountEl = row.querySelector(".forecast-row__amount");
      var type = chipTypeFromRow(row);
      var isSubscription = !!row.querySelector(".chip--subscription");
      var isActive = !!row.querySelector(".toggle--on");

      titleEl.textContent = "Edit forecast item";
      subtitleEl.textContent = name + " · " + recurrence.charAt(0).toUpperCase() + recurrence.slice(1) + " · " + account;
      descriptionInput.value = name;
      amountInput.value = amountEl.textContent.replace(/^[+\−]\s*/, "").trim();
      recurrenceSelect.value = recurrence;
      setEditorType(type);
      setRecurrenceFields(recurrence);

      document.getElementById("fc-subscription-toggle").classList.toggle("toggle--on", isSubscription);
      document.getElementById("fc-active-toggle").classList.toggle("toggle--on", isActive);
    } else {
      titleEl.textContent = "Add forecast item";
      subtitleEl.textContent = "New planned item";
      descriptionInput.value = "";
      amountInput.value = "";
      recurrenceSelect.value = "monthly";
      setEditorType("expense");
      setRecurrenceFields("monthly");
      document.getElementById("fc-subscription-toggle").classList.remove("toggle--on");
      document.getElementById("fc-active-toggle").classList.add("toggle--on");
    }

    overlay.classList.add("forecast-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    overlay.classList.remove("forecast-overlay--open");
    overlay.setAttribute("aria-hidden", "true");

    if (selectedRow) {
      selectedRow.classList.remove("forecast-row--selected");
      selectedRow = null;
    }
  }

  function openRecurrenceDialog() {
    if (!recurrenceDialog) return;
    recurrenceDialog.classList.add("recurrence-dialog--open");
    recurrenceDialog.setAttribute("aria-hidden", "false");
  }

  function closeRecurrenceDialog() {
    if (!recurrenceDialog) return;
    recurrenceDialog.classList.remove("recurrence-dialog--open");
    recurrenceDialog.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll(".forecast-row__edit").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      openPanel(btn.closest(".forecast-row"));
    });
  });

  typeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setEditorType(btn.dataset.type);
    });
  });

  recurrenceSelect.addEventListener("change", function () {
    setRecurrenceFields(recurrenceSelect.value);
  });

  if (addBtn) addBtn.addEventListener("click", function () { openPanel(null); });
  if (emptyAddBtn) emptyAddBtn.addEventListener("click", function () { openPanel(null); });
  if (addInstallmentBtn) addInstallmentBtn.addEventListener("click", function () { /* installment editor stub */ });
  if (emptyInstallmentBtn) emptyInstallmentBtn.addEventListener("click", function () { /* installment editor stub */ });

  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      if (selectedRow && selectedRow.dataset.recurrence !== "once") {
        openRecurrenceDialog();
      } else {
        closePanel();
      }
    });
  }

  var dialogCancel = document.getElementById("recurrence-dialog-cancel");
  var dialogConfirm = document.getElementById("recurrence-dialog-confirm");
  var dialogBackdrop = recurrenceDialog && recurrenceDialog.querySelector(".recurrence-dialog__backdrop");

  if (dialogCancel) dialogCancel.addEventListener("click", closeRecurrenceDialog);
  if (dialogConfirm) {
    dialogConfirm.addEventListener("click", function () {
      closeRecurrenceDialog();
      closePanel();
    });
  }
  if (dialogBackdrop) dialogBackdrop.addEventListener("click", closeRecurrenceDialog);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    if (recurrenceDialog && recurrenceDialog.classList.contains("recurrence-dialog--open")) {
      closeRecurrenceDialog();
      return;
    }

    if (overlay.classList.contains("forecast-overlay--open")) {
      closePanel();
    }
  });

  if (params.get("edit") === "1") {
    var netflixRow = document.querySelector(".chip--subscription")?.closest(".forecast-row");
    if (netflixRow) openPanel(netflixRow);
  }

  if (params.get("add") === "1") {
    openPanel(null);
  }

  if (params.get("recurrence") === "1") {
    var monthlyRow = document.querySelector('[data-recurrence="monthly"]');
    if (monthlyRow) {
      openPanel(monthlyRow);
      openRecurrenceDialog();
    }
  }

  if (params.get("filter") === "subscription") {
    applyFilter("subscription");
  }

  if (params.get("installments") === "1") {
    var ipanema = document.querySelector(".installment-plan:not(.installment-plan--dormant)");
    if (ipanema) {
      var expandBtn = ipanema.querySelector(".installment-plan__expand");
      if (expandBtn) expandBtn.click();
      ipanema.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
})();
