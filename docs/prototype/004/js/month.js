(function () {
  var HORIZON_MONTHS = 24;

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

  var monthNamesFull = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  var grid = document.getElementById("month-grid");
  var monthLabel = document.getElementById("month-toolbar-label");
  var prevBtn = document.getElementById("month-prev");
  var nextBtn = document.getElementById("month-next");
  var jumpTodayBtn = document.getElementById("month-jump-today");
  var totalsInflows = document.getElementById("month-total-inflows");
  var totalsOutflows = document.getElementById("month-total-outflows");
  var totalsNet = document.getElementById("month-total-net");
  var totalsEndBalance = document.getElementById("month-total-end-balance");
  var totalsNote = document.getElementById("month-totals-note");

  if (!grid || !monthLabel || !prevBtn || !nextBtn) return;

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var horizonStart = new Date(today.getFullYear(), today.getMonth(), 1);
  var horizonEnd = new Date(today);
  horizonEnd.setMonth(horizonEnd.getMonth() + HORIZON_MONTHS);

  var demoDays = {
    "2026-8": {
      5: {
        indicators: ["success"],
        balance: 1325000,
        entries: [{ kind: "income", amount: 850000, style: "projected-income" }],
      },
      15: {
        indicators: ["card", "warning"],
        balance: 185000,
        belowBuffer: true,
        entries: [
          { kind: "expense", amount: 185000, style: "projected-outflow" },
          { kind: "expense", amount: 45000, style: "projected-outflow" },
        ],
      },
      20: {
        indicators: ["success"],
        balance: 2340000,
        entries: [
          { kind: "income", amount: 520000, style: "projected-income" },
          { kind: "expense", amount: 45000, style: "projected-outflow" },
        ],
      },
      28: {
        indicators: ["danger"],
        balance: -12000,
        belowBuffer: true,
        entries: [{ kind: "expense", amount: 89000, style: "projected-outflow" }],
      },
    },
    "2026-6": {
      12: {
        indicators: ["success"],
        balance: 1180000,
        entries: [{ kind: "income", amount: 420000, style: "actual-income" }],
      },
      22: {
        indicators: ["warning"],
        balance: 1095000,
        entries: [{ kind: "expense", amount: 65000, style: "actual-outflow" }],
      },
      25: {
        indicators: ["danger"],
        balance: 1010000,
        entries: [{ kind: "expense", amount: 85000, style: "past-due" }],
      },
      30: {
        indicators: [],
        balance: 1245000,
        entries: [{ kind: "expense", amount: 12000, style: "actual-outflow" }],
      },
    },
    "2026-7": {
      8: {
        indicators: ["danger"],
        balance: 980000,
        belowBuffer: true,
        entries: [{ kind: "expense", amount: 210000, style: "past-due" }],
      },
      18: {
        indicators: ["success"],
        balance: 1420000,
        entries: [{ kind: "income", amount: 380000, style: "actual-income" }],
      },
    },
  };

  var focusedYear;
  var focusedMonth;

  function parseMonthParam(value) {
    if (!value) return null;

    var match = value.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;

    var year = Number.parseInt(match[1], 10);
    var month = Number.parseInt(match[2], 10) - 1;
    if (month < 0 || month > 11) return null;

    return { year: year, month: month };
  }

  function isWithinHorizon(year, monthIndex) {
    var date = new Date(year, monthIndex, 1);
    var end = new Date(horizonEnd.getFullYear(), horizonEnd.getMonth(), 1);
    return date >= horizonStart && date <= end;
  }

  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function formatMoney(cents, compact) {
    var value = cents / 100;
    var options = compact
      ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    return "R$ " + value.toLocaleString("pt-BR", options);
  }

  function dayDate(year, monthIndex, dayNumber) {
    var date = new Date(year, monthIndex, dayNumber);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function isPastDate(year, monthIndex, dayNumber) {
    return dayDate(year, monthIndex, dayNumber) < today;
  }

  function isFutureDate(year, monthIndex, dayNumber) {
    return dayDate(year, monthIndex, dayNumber) > today;
  }

  function formatFlow(cents, kind) {
    var value = Math.abs(cents) / 100;
    var formatted = value.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return kind === "in" ? "+ " + formatted : "− " + formatted;
  }

  function buildEntries(year, monthIndex, dayNumber, inflow, outflow, seed) {
    var entries = [];

    if (inflow > 0) {
      entries.push({
        kind: "income",
        amount: inflow,
        style: isFutureDate(year, monthIndex, dayNumber)
          ? "projected-income"
          : "actual-income",
      });
    }

    if (outflow > 0) {
      var style = "projected-outflow";

      if (isPastDate(year, monthIndex, dayNumber)) {
        style = seed % 19 === 0 ? "past-due" : "actual-outflow";
      } else if (!isFutureDate(year, monthIndex, dayNumber)) {
        style = seed % 9 === 0 ? "projected-outflow" : "actual-outflow";
      }

      entries.push({
        kind: "expense",
        amount: outflow,
        style: style,
      });
    }

    return entries;
  }

  function sumEntryAmounts(entries, kind) {
    return entries.reduce(function (total, entry) {
      if (entry.kind !== kind) return total;
      return total + entry.amount;
    }, 0);
  }

  function demoDayData(year, monthIndex, dayNumber) {
    var key = year + "-" + (monthIndex + 1);
    var monthData = demoDays[key];
    if (monthData && monthData[dayNumber]) {
      return monthData[dayNumber];
    }

    var seed = year * 10000 + (monthIndex + 1) * 100 + dayNumber;
    var inflow = seed % 17 === 0 ? 350000 + (seed % 5) * 10000 : 0;
    var outflow = seed % 11 === 0 ? 45000 + (seed % 7) * 5000 : seed % 5 === 0 ? 18000 : 0;
    var entries = buildEntries(year, monthIndex, dayNumber, inflow, outflow, seed);
    var balance = 1245000 - dayNumber * 4200 + sumEntryAmounts(entries, "income") - sumEntryAmounts(entries, "expense");
    var indicators = [];

    if (balance < 0) {
      indicators.push("danger");
    } else if (entries.some(function (entry) {
      return entry.style === "past-due";
    })) {
      indicators.push("danger");
    } else if (entries.some(function (entry) {
      return entry.kind === "income";
    })) {
      indicators.push("success");
    } else if (entries.some(function (entry) {
      return entry.kind === "expense" && entry.amount >= 50000;
    })) {
      indicators.push("warning");
    }

    return {
      indicators: indicators,
      entries: entries,
      balance: balance,
      belowBuffer: balance < 0,
    };
  }

  function createIndicator(type) {
    var span = document.createElement("span");
    span.className = "indicator indicator--" + type;
    return span;
  }

  function createEmptyCell() {
    var cell = document.createElement("div");
    cell.className = "day-cell day-cell--empty";
    cell.innerHTML = "&nbsp;";
    cell.setAttribute("aria-hidden", "true");
    return cell;
  }

  function createEntryElement(entry) {
    var el = document.createElement("span");
    el.className = "day-cell__entry day-cell__entry--" + entry.style;
    el.textContent = formatFlow(entry.amount, entry.kind === "income" ? "in" : "out");
    return el;
  }

  function createDayCell(year, monthIndex, dayNumber, data) {
    var cell = document.createElement("div");
    cell.className = "day-cell";
    cell.dataset.day = String(dayNumber);

    if (data.belowBuffer) {
      cell.classList.add("day-cell--below-buffer");
    }

    if (
      year === today.getFullYear() &&
      monthIndex === today.getMonth() &&
      dayNumber === today.getDate()
    ) {
      cell.classList.add("day-cell--today");
    }

    var num = document.createElement("span");
    num.className = "day-cell__num";
    num.textContent = String(dayNumber).padStart(2, "0");
    cell.appendChild(num);

    var balance = document.createElement("span");
    balance.className = "day-cell__balance";
    if (data.belowBuffer) {
      balance.classList.add("day-cell__balance--danger");
    }
    balance.textContent = formatMoney(data.balance, true);
    cell.appendChild(balance);

    if (data.entries && data.entries.length) {
      var entriesWrap = document.createElement("div");
      entriesWrap.className = "day-cell__entries";

      data.entries.slice(0, 2).forEach(function (entry) {
        entriesWrap.appendChild(createEntryElement(entry));
      });

      cell.appendChild(entriesWrap);
    }

    if (data.indicators && data.indicators.length) {
      var indicators = document.createElement("span");
      indicators.className = "day-cell__indicators";
      data.indicators.forEach(function (type) {
        indicators.appendChild(createIndicator(type));
      });
      cell.appendChild(indicators);
    }

    return cell;
  }

  function computeMonthTotals(year, monthIndex) {
    var totalDays = daysInMonth(year, monthIndex);
    var day;
    var inflows = 0;
    var outflows = 0;
    var endBalance = 0;

    for (day = 1; day <= totalDays; day += 1) {
      var data = demoDayData(year, monthIndex, day);
      inflows += sumEntryAmounts(data.entries || [], "income");
      outflows += sumEntryAmounts(data.entries || [], "expense");
      endBalance = data.balance;
    }

    return {
      inflows: inflows,
      outflows: outflows,
      net: inflows - outflows,
      endBalance: endBalance,
    };
  }

  function monthStatus(year, monthIndex) {
    var monthStart = new Date(year, monthIndex, 1);
    var monthEnd = new Date(year, monthIndex + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    if (monthStart > today) return "future";
    if (monthEnd < today) return "past";
    return "current";
  }

  function updateTotalsNote(year, monthIndex) {
    if (!totalsNote) return;

    var status = monthStatus(year, monthIndex);

    if (status === "future") {
      totalsNote.textContent =
        "All inflows, outflows, net, and end balance are projections for future dates in this month.";
    } else if (status === "current") {
      totalsNote.textContent =
        "Totals combine actuals so far with projected inflows, outflows, and end balance for the remaining days in this month.";
    } else {
      totalsNote.textContent =
        "Totals reflect projected inflows, outflows, and end balance for this month.";
    }
  }

  function updateTotals(year, monthIndex) {
    var totals = computeMonthTotals(year, monthIndex);

    if (totalsInflows) totalsInflows.textContent = formatMoney(totals.inflows, false);
    if (totalsOutflows) totalsOutflows.textContent = formatMoney(totals.outflows, false);
    if (totalsNet) {
      totalsNet.textContent = formatMoney(totals.net, false);
      totalsNet.classList.toggle("summary-strip__value--income", totals.net >= 0);
      totalsNet.classList.toggle("summary-strip__value--expense", totals.net < 0);
    }
    if (totalsEndBalance) {
      totalsEndBalance.textContent = formatMoney(totals.endBalance, false);
      totalsEndBalance.classList.toggle("summary-strip__value--danger", totals.endBalance < 0);
    }

    updateTotalsNote(year, monthIndex);
  }

  function updateNavButtons() {
    var prev = new Date(focusedYear, focusedMonth - 1, 1);
    var next = new Date(focusedYear, focusedMonth + 1, 1);

    prevBtn.disabled = !isWithinHorizon(prev.getFullYear(), prev.getMonth());
    nextBtn.disabled = !isWithinHorizon(next.getFullYear(), next.getMonth());
  }

  function updateUrl() {
    var month = String(focusedMonth + 1).padStart(2, "0");
    var nextUrl =
      window.location.pathname +
      "?month=" +
      focusedYear +
      "-" +
      month;
    window.history.replaceState(null, "", nextUrl);
  }

  function renderMonth(year, monthIndex) {
    focusedYear = year;
    focusedMonth = monthIndex;

    grid.dataset.year = String(year);
    grid.dataset.month = String(monthIndex);
    grid.replaceChildren();

    var firstWeekday = new Date(year, monthIndex, 1).getDay();
    var totalDays = daysInMonth(year, monthIndex);
    var index;

    for (index = 0; index < firstWeekday; index += 1) {
      grid.appendChild(createEmptyCell());
    }

    for (index = 1; index <= totalDays; index += 1) {
      grid.appendChild(createDayCell(year, monthIndex, index, demoDayData(year, monthIndex, index)));
    }

    while (grid.children.length % 7 !== 0) {
      grid.appendChild(createEmptyCell());
    }

    monthLabel.textContent = monthNamesFull[monthIndex] + " " + year;
    updateTotals(year, monthIndex);
    updateNavButtons();
    updateUrl();

    document.dispatchEvent(
      new CustomEvent("calendar:rendered", {
        detail: { year: year, monthIndex: monthIndex },
      })
    );
  }

  function changeMonth(delta) {
    var next = new Date(focusedYear, focusedMonth + delta, 1);
    if (!isWithinHorizon(next.getFullYear(), next.getMonth())) return;
    renderMonth(next.getFullYear(), next.getMonth());
  }

  prevBtn.addEventListener("click", function () {
    changeMonth(-1);
  });

  nextBtn.addEventListener("click", function () {
    changeMonth(1);
  });

  if (jumpTodayBtn) {
    jumpTodayBtn.addEventListener("click", function () {
      if (!isWithinHorizon(today.getFullYear(), today.getMonth())) return;
      renderMonth(today.getFullYear(), today.getMonth());
    });
  }

  var params = new URLSearchParams(window.location.search);
  var initial = parseMonthParam(params.get("month"));
  var demoDay = params.get("day");

  if (!initial && demoDay) {
    var dayMatch = demoDay.match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (dayMatch) {
      initial = {
        year: Number.parseInt(dayMatch[1], 10),
        month: Number.parseInt(dayMatch[2], 10) - 1,
      };
    }
  }

  if (initial && isWithinHorizon(initial.year, initial.month)) {
    renderMonth(initial.year, initial.month);
  } else if (isWithinHorizon(today.getFullYear(), today.getMonth())) {
    renderMonth(today.getFullYear(), today.getMonth());
  } else {
    renderMonth(horizonStart.getFullYear(), horizonStart.getMonth());
  }
})();
