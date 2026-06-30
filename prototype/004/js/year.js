(function () {
  var HORIZON_MONTHS = 24;
  var GRID_COLUMNS = 37;

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
  var cornerYearLabel = document.getElementById("calendar-year-label");
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

  function createDayCell(dayNumber) {
    var cell = document.createElement("div");
    cell.className = "day-cell";
    cell.textContent = String(dayNumber).padStart(2, "0");
    return cell;
  }

  function lastMonthIndexForYear(year) {
    if (year < maxYear) return 11;
    return horizonEnd.getMonth();
  }

  function buildMonthRow(year, monthIndex) {
    var label = monthNames[monthIndex];
    var firstWeekday = new Date(year, monthIndex, 1).getDay();
    var totalDays = daysInMonth(year, monthIndex);
    var row = document.createElement("div");
    row.className = "month-row";
    row.dataset.year = String(year);

    var leftLabel = document.createElement("div");
    leftLabel.className = "month-row__label";
    leftLabel.textContent = label;

    var days = document.createElement("div");
    days.className = "month-row__days";

    var index;
    for (index = 0; index < firstWeekday; index += 1) {
      days.appendChild(createEmptyCell());
    }

    for (index = 1; index <= totalDays; index += 1) {
      days.appendChild(createDayCell(index));
    }

    while (days.children.length < GRID_COLUMNS) {
      days.appendChild(createEmptyCell());
    }

    var rightLabel = leftLabel.cloneNode(true);
    row.appendChild(leftLabel);
    row.appendChild(days);
    row.appendChild(rightLabel);
    return row;
  }

  function yearAlreadyInDom(year) {
    return calendar.querySelector('.month-row[data-year="' + year + '"]') !== null;
  }

  function ensureYearMonths(year) {
    if (yearAlreadyInDom(year)) return;

    var anchor = calendar.querySelector(".weekday-band--bottom");
    if (!anchor) return;

    var fragment = document.createDocumentFragment();
    var monthIndex;
    var lastMonth = lastMonthIndexForYear(year);

    for (monthIndex = 0; monthIndex <= lastMonth; monthIndex += 1) {
      fragment.appendChild(buildMonthRow(year, monthIndex));
    }

    calendar.insertBefore(fragment, anchor);
  }

  function ensureHorizonYears() {
    var year;
    for (year = minYear; year <= maxYear; year += 1) {
      ensureYearMonths(year);
    }
  }

  function monthRowsForYear(year) {
    return calendar.querySelectorAll('.month-row[data-year="' + year + '"]');
  }

  function updateYearLabels(year) {
    yearLabel.textContent = String(year);
    if (cornerYearLabel) {
      cornerYearLabel.textContent = String(year);
    }
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
    var targetRow = null;
    var index;

    for (index = 0; index < rows.length; index += 1) {
      var label = rows[index].querySelector(".month-row__label");
      if (label && monthIndex(label.textContent) === targetMonthIndex) {
        targetRow = rows[index];
        break;
      }
    }

    if (!targetRow) return;

    var targetCell = null;
    targetRow.querySelectorAll(".day-cell:not(.day-cell--empty)").forEach(function (cell) {
      var dayText = cell.textContent.trim().split(/\s+/)[0];
      var parsedDay = Number.parseInt(dayText, 10);
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

  function monthIndex(label) {
    return monthNames.indexOf(label.trim());
  }

  function showYear(year) {
    focusedYear = year;
    ensureYearMonths(year);

    calendar.querySelectorAll(".month-row").forEach(function (row) {
      var rowYear = Number.parseInt(row.dataset.year || "", 10);
      var lastMonth = lastMonthIndexForYear(rowYear);
      var label = row.querySelector(".month-row__label");
      var rowMonth = label ? monthIndex(label.textContent) : -1;
      var withinHorizon = rowYear >= minYear && rowYear <= maxYear && rowMonth <= lastMonth;

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

  ensureHorizonYears();
  showYear(focusedYear);
})();
