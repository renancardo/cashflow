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

  document.querySelectorAll(".month-row").forEach(function (row) {
    var label = row.querySelector(".month-row__label");
    if (!label) return;

    var monthLabel = label.textContent;
    var year = Number.parseInt(row.dataset.year || "2026", 10);

    row.querySelectorAll(".day-cell:not(.day-cell--empty)").forEach(function (cell) {
      var dayText = cell.textContent.trim().replace(/\s+/g, " ").split(" ")[0];
      var dayNumber = parseInt(dayText, 10);
      if (Number.isNaN(dayNumber)) return;

      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-label", monthLabel + " " + dayNumber + ", " + year);

      cell.addEventListener("click", function () {
        openPanel(cell, monthLabel, dayNumber, year);
      });

      cell.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPanel(cell, monthLabel, dayNumber, year);
        }
      });
    });
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

  if (demoDay === "2026-08-15") {
    document.querySelectorAll('.month-row[data-year="2026"]').forEach(function (row) {
      var label = row.querySelector(".month-row__label");
      if (!label || label.textContent.trim() !== "Aug") return;

      row.querySelectorAll(".day-cell:not(.day-cell--empty)").forEach(function (cell) {
        if (cell.textContent.trim().startsWith("15")) {
          openPanel(cell, "Aug", 15, 2026);
        }
      });
    });
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
