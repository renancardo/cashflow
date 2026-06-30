(function () {
  var overlay = document.getElementById("day-overlay");
  if (!overlay) return;

  var titleEl = document.getElementById("day-panel-title");
  var weekdayEl = document.getElementById("day-panel-weekday");
  var closeBtn = overlay.querySelector(".day-panel__close");
  var backdrop = overlay.querySelector(".day-overlay__backdrop");
  var quickAddToggle = document.getElementById("quick-add-toggle");
  var quickAddForm = document.getElementById("quick-add-form");
  var selectedCell = null;

  var weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  var monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function monthIndex(label) {
    return monthNames.indexOf(label.trim());
  }

  function dayNumberFromCell(cell) {
    if (cell.dataset.day) {
      return Number.parseInt(cell.dataset.day, 10);
    }

    var numEl = cell.querySelector(".day-cell__num");
    if (numEl) {
      return Number.parseInt(numEl.textContent.trim(), 10);
    }

    var dayText = cell.textContent.trim().replace(/\s+/g, " ").split(" ")[0];
    return Number.parseInt(dayText, 10);
  }

  function resolveDayContext(cell) {
    var monthGrid = cell.closest(".month-grid");
    if (monthGrid) {
      var gridMonth = Number.parseInt(monthGrid.dataset.month || "", 10);
      var gridYear = Number.parseInt(monthGrid.dataset.year || "", 10);
      var dayNumber = dayNumberFromCell(cell);

      if (Number.isNaN(gridMonth) || Number.isNaN(gridYear) || Number.isNaN(dayNumber)) {
        return null;
      }

      return {
        monthLabel: monthNames[gridMonth],
        dayNumber: dayNumber,
        year: gridYear,
      };
    }

    var row = cell.closest(".month-row");
    if (!row) return null;

    var label = row.querySelector(".month-row__label");
    if (!label) return null;

    var dayNumberFromRow = dayNumberFromCell(cell);
    if (Number.isNaN(dayNumberFromRow)) return null;

    return {
      monthLabel: label.textContent.trim(),
      dayNumber: dayNumberFromRow,
      year: Number.parseInt(row.dataset.year || "2026", 10),
    };
  }

  function openPanel(cell, monthLabel, dayNumber, year) {
    if (selectedCell) {
      selectedCell.classList.remove("day-cell--selected");
    }

    selectedCell = cell;
    cell.classList.add("day-cell--selected");

    var month = monthIndex(monthLabel);
    var date = new Date(year, month, dayNumber);
    var weekday = weekdays[date.getDay()];
    var monthName = monthNames[month];

    titleEl.textContent = dayNumber + " " + monthName + " " + year;
    weekdayEl.textContent = weekday;

    overlay.classList.add("day-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    overlay.classList.remove("day-overlay--open");
    overlay.setAttribute("aria-hidden", "true");

    if (selectedCell) {
      selectedCell.classList.remove("day-cell--selected");
      selectedCell = null;
    }

    if (quickAddForm && quickAddToggle) {
      quickAddForm.classList.remove("quick-add__form--open");
      quickAddToggle.hidden = false;
    }
  }

  function enhanceDayCell(cell) {
    var context = resolveDayContext(cell);
    if (!context) return;

    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute(
      "aria-label",
      context.monthLabel + " " + context.dayNumber + ", " + context.year
    );
  }

  function bindCalendarCells(root) {
    (root || document).querySelectorAll(".day-cell:not(.day-cell--empty)").forEach(enhanceDayCell);
  }

  function handleDayCellActivate(event) {
    var cell = event.target.closest(".day-cell:not(.day-cell--empty)");
    if (!cell) return;

    var context = resolveDayContext(cell);
    if (!context) return;

    openPanel(cell, context.monthLabel, context.dayNumber, context.year);
  }

  document.addEventListener("click", handleDayCellActivate);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;

    var cell = event.target.closest(".day-cell:not(.day-cell--empty)");
    if (!cell || cell !== event.target) return;

    event.preventDefault();
    handleDayCellActivate(event);
  });

  bindCalendarCells();

  document.addEventListener("calendar:rendered", function () {
    bindCalendarCells(document.getElementById("month-grid"));
  });

  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("day-overlay--open")) {
      closePanel();
    }
  });

  if (quickAddToggle && quickAddForm) {
    quickAddToggle.addEventListener("click", function () {
      quickAddForm.classList.add("quick-add__form--open");
      quickAddToggle.hidden = true;
      quickAddForm.querySelector(".quick-add__input")?.focus();
    });

    quickAddForm.querySelector(".quick-add__cancel")?.addEventListener("click", function () {
      quickAddForm.classList.remove("quick-add__form--open");
      quickAddToggle.hidden = false;
    });
  }

  document.querySelectorAll(".quick-add__type-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".quick-add__type-btn").forEach(function (peer) {
        peer.classList.remove("quick-add__type-btn--active");
      });
      btn.classList.add("quick-add__type-btn--active");
    });
  });

  var params = new URLSearchParams(window.location.search);
  var demoDay = params.get("day");

  function openDemoDay(year, monthIndex, dayNumber) {
    var monthLabel = monthNames[monthIndex];
    var monthGrid = document.querySelector(
      '.month-grid[data-year="' + year + '"][data-month="' + monthIndex + '"]'
    );

    if (monthGrid) {
      var gridCell = monthGrid.querySelector('.day-cell[data-day="' + dayNumber + '"]');
      if (gridCell) {
        openPanel(gridCell, monthLabel, dayNumber, year);
        return;
      }
    }

    document.querySelectorAll('.month-row[data-year="' + year + '"]').forEach(function (row) {
      var label = row.querySelector(".month-row__label");
      if (!label || monthIndex(label.textContent) !== monthIndex) return;

      row.querySelectorAll(".day-cell:not(.day-cell--empty)").forEach(function (cell) {
        if (dayNumberFromCell(cell) === dayNumber) {
          openPanel(cell, monthLabel, dayNumber, year);
        }
      });
    });
  }

  if (demoDay === "2026-08-15") {
    openDemoDay(2026, 7, 15);
  }

  var activeAmountEditor = null;

  function formatAmount(cents, kind) {
    var value = Math.abs(cents) / 100;
    var formatted = value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    var sign = kind === "income" ? "+ " : "− ";
    return sign + "R$ " + formatted;
  }

  function centsToInput(cents) {
    return (Math.abs(cents) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseAmountInput(text) {
    var cleaned = text.trim().replace(/[^\d,.-]/g, "");
    if (!cleaned) return null;

    var normalized = cleaned.replace(/\./g, "").replace(",", ".");
    var value = Number.parseFloat(normalized);
    if (!Number.isFinite(value) || value < 0) return null;

    return Math.round(value * 100);
  }

  function finishAmountEdit(amountEl, save) {
    var input = amountEl.querySelector(".day-item__amount-input");
    if (!input) return;

    var kind = amountEl.dataset.kind || "expense";
    var previousCents = Number.parseInt(amountEl.dataset.amountCents || "0", 10);

    amountEl.classList.remove("day-item__amount--editing", "day-item__amount--invalid");

    if (save) {
      var parsed = parseAmountInput(input.value);
      if (parsed === null) {
        amountEl.classList.add("day-item__amount--invalid");
        input.focus();
        input.select();
        return;
      }

      amountEl.dataset.amountCents = String(parsed);
      amountEl.textContent = formatAmount(parsed, kind);
    } else {
      amountEl.textContent = formatAmount(previousCents, kind);
    }

    if (activeAmountEditor === amountEl) {
      activeAmountEditor = null;
    }
  }

  function startAmountEdit(amountEl) {
    if (amountEl.classList.contains("day-item__amount--editing")) return;

    if (activeAmountEditor && activeAmountEditor !== amountEl) {
      finishAmountEdit(activeAmountEditor, true);
    }

    var kind = amountEl.dataset.kind || "expense";
    var cents = Number.parseInt(amountEl.dataset.amountCents || "0", 10);

    amountEl.classList.add("day-item__amount--editing");
    amountEl.classList.remove("day-item__amount--invalid");
    amountEl.textContent = "";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "day-item__amount-input";
    input.value = centsToInput(cents);
    input.setAttribute("inputmode", "decimal");
    input.setAttribute("aria-label", "Amount in reais");

    amountEl.appendChild(input);
    activeAmountEditor = amountEl;

    input.focus();
    input.select();

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        finishAmountEdit(amountEl, true);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        finishAmountEdit(amountEl, false);
      }
    });

    input.addEventListener("blur", function () {
      finishAmountEdit(amountEl, true);
    });
  }

  overlay.addEventListener("click", function (event) {
    var amountEl = event.target.closest(".day-item__amount--editable");
    if (!amountEl || event.target.closest(".day-item__amount-input")) return;

    event.stopPropagation();
    startAmountEdit(amountEl);
  });

  overlay.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;

    var amountEl = event.target.closest(".day-item__amount--editable");
    if (!amountEl || amountEl.classList.contains("day-item__amount--editing")) return;

    event.preventDefault();
    startAmountEdit(amountEl);
  });
})();
