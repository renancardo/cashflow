(function () {
  var HORIZON_MONTHS = 24;
  var GRID_COLUMNS = 31;

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

  var calendar = document.getElementById("linear-calendar");
  var scrollEl = document.getElementById("calendar-scroll");
  var yearLabel = document.getElementById("year-toolbar-label");
  var prevBtn = document.getElementById("year-prev");
  var nextBtn = document.getElementById("year-next");
  var jumpTodayBtn = document.getElementById("year-jump-today");

  if (!calendar || !scrollEl || !yearLabel || !prevBtn || !nextBtn) return;

  var today = new Date();
  var horizonEnd = new Date(today);
  horizonEnd.setMonth(horizonEnd.getMonth() + HORIZON_MONTHS);

  var minYear = today.getFullYear();
  var maxYear = horizonEnd.getFullYear();
  var focusedYear = minYear;

  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function createEmptyCell() {
    var cell = document.createElement("div");
    cell.className = "day-cell day-cell--empty";
    cell.innerHTML = "&nbsp;";
    return cell;
  }

  function createDayCell(year, monthIndex, dayNumber) {
    var cell = document.createElement("div");
    cell.className = "day-cell";
    if (
      year === today.getFullYear() &&
      monthIndex === today.getMonth() &&
      dayNumber === today.getDate()
    ) {
      cell.classList.add("day-cell--today");
    }

    var num = document.createElement("span");
    num.className = "day-cell__num";
    num.textContent = String(dayNumber);
    cell.appendChild(num);
    return cell;
  }

  function lastMonthIndexForYear(year) {
    if (year < maxYear) return 11;
    return horizonEnd.getMonth();
  }

  function buildMonthRow(year, monthIndex) {
    var label = monthNames[monthIndex];
    var totalDays = daysInMonth(year, monthIndex);
    var row = document.createElement("div");
    row.className = "month-row";
    row.dataset.year = String(year);
    row.dataset.month = String(monthIndex);

    var leftLabel = document.createElement("div");
    leftLabel.className = "month-row__label month-row__label--sticky";
    leftLabel.dataset.year = String(year);

    var nameEl = document.createElement("span");
    nameEl.className = "month-row__name";
    nameEl.textContent = label;

    leftLabel.appendChild(nameEl);

    var days = document.createElement("div");
    days.className = "month-row__days";

    var index;
    for (index = 1; index <= GRID_COLUMNS; index += 1) {
      if (index <= totalDays) {
        days.appendChild(createDayCell(year, monthIndex, index));
      } else {
        days.appendChild(createEmptyCell());
      }
    }

    row.appendChild(leftLabel);
    row.appendChild(days);
    return row;
  }

  function yearAlreadyInDom(year) {
    return calendar.querySelector('.month-row[data-year="' + year + '"]') !== null;
  }

  function ensureYearMonths(year) {
    if (yearAlreadyInDom(year)) return;

    var anchor = document.getElementById("calendar-anchor");
    if (!anchor) return;

    var fragment = document.createDocumentFragment();
    var monthIndex;
    var lastMonth = lastMonthIndexForYear(year);

    for (monthIndex = 0; monthIndex <= lastMonth; monthIndex += 1) {
      fragment.appendChild(buildMonthRow(year, monthIndex));
    }

    calendar.insertBefore(fragment, anchor);
  }

  function monthRowsForYear(year) {
    return calendar.querySelectorAll('.month-row[data-year="' + year + '"]');
  }

  function updateYearLabels(year) {
    yearLabel.textContent = String(year);
  }

  function updateNavButtons() {
    prevBtn.disabled = focusedYear <= minYear;
    nextBtn.disabled = focusedYear >= maxYear;
  }

  function scrollCellIntoView(cell) {
    var scrollRect = scrollEl.getBoundingClientRect();
    var cellRect = cell.getBoundingClientRect();
    var delta =
      cellRect.left -
      scrollRect.left -
      scrollRect.width / 2 +
      cellRect.width / 2;

    scrollEl.scrollTo({
      left: Math.max(0, scrollEl.scrollLeft + delta),
      behavior: "smooth",
    });
  }

  function scrollToMonth(year, targetMonthIndex, dayNumber) {
    var rows = monthRowsForYear(year);
    var targetRow = rows[targetMonthIndex] || null;

    if (!targetRow) return;

    var targetCell = null;
    targetRow.querySelectorAll(".day-cell:not(.day-cell--empty)").forEach(function (cell) {
      var numEl = cell.querySelector(".day-cell__num");
      var parsedDay = numEl
        ? Number.parseInt(numEl.textContent.trim(), 10)
        : Number.parseInt(cell.textContent.trim().split(/\s+/)[0], 10);
      if (parsedDay === dayNumber) {
        targetCell = cell;
      }
    });

    if (!targetCell) {
      targetCell = targetRow.querySelector(".day-cell:not(.day-cell--empty)");
    }

    if (targetCell) {
      scrollCellIntoView(targetCell);
    }
  }

  function showYear(year) {
    focusedYear = year;
    ensureYearMonths(year);

    calendar.querySelectorAll(".month-row").forEach(function (row) {
      var rowYear = Number.parseInt(row.dataset.year || "", 10);
      var rowMonth = Number.parseInt(row.dataset.month || "", 10);
      var lastMonth = lastMonthIndexForYear(rowYear);
      var withinHorizon =
        rowYear >= minYear && rowYear <= maxYear && rowMonth <= lastMonth;

      row.hidden = rowYear !== year || !withinHorizon;
    });

    updateYearLabels(year);
    updateNavButtons();
    scrollEl.scrollTo({ left: 0, behavior: "smooth" });
  }

  function changeYear(delta) {
    var nextYear = focusedYear + delta;
    if (nextYear < minYear || nextYear > maxYear) return;
    showYear(nextYear);
  }

  prevBtn.addEventListener("click", function () {
    changeYear(-1);
  });

  nextBtn.addEventListener("click", function () {
    changeYear(1);
  });

  if (jumpTodayBtn) {
    jumpTodayBtn.addEventListener("click", function () {
      var todayYear = today.getFullYear();
      if (todayYear < minYear || todayYear > maxYear) return;

      showYear(todayYear);
      scrollToMonth(todayYear, today.getMonth(), today.getDate());
    });
  }

  showYear(focusedYear);

  var CALENDAR_STYLES = ["grid", "minimal", "tinted", "spacious"];
  var STYLE_STORAGE_KEY = "year-calendar-style";
  var styleSwitcher = document.getElementById("calendar-style-switcher");

  function applyCalendarStyle(style) {
    if (CALENDAR_STYLES.indexOf(style) === -1) {
      style = "grid";
    }

    CALENDAR_STYLES.forEach(function (name) {
      calendar.classList.remove("linear-calendar--" + name);
    });
    calendar.classList.add("linear-calendar--" + style);

    if (styleSwitcher) {
      styleSwitcher.querySelectorAll("[data-calendar-style]").forEach(function (btn) {
        var isActive = btn.dataset.calendarStyle === style;
        btn.classList.toggle("style-switcher__btn--active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    try {
      localStorage.setItem(STYLE_STORAGE_KEY, style);
    } catch (error) {
      /* ignore storage errors */
    }
  }

  function initCalendarStyle() {
    var savedStyle = "grid";

    try {
      savedStyle = localStorage.getItem(STYLE_STORAGE_KEY) || "grid";
    } catch (error) {
      savedStyle = "grid";
    }

    applyCalendarStyle(savedStyle);
  }

  if (styleSwitcher) {
    styleSwitcher.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-calendar-style]");
      if (!btn) return;
      applyCalendarStyle(btn.dataset.calendarStyle);
    });
  }

  initCalendarStyle();
})();
