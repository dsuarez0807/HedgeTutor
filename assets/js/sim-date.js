/**
 * Sim Date — calendar picker (day / month / year)
 * Month & year from header controls; day from month grid.
 */
(function () {
  "use strict";

  var MONTHS_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  var WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  var root;
  var trigger;
  var picker;
  var body;
  var monthBtn;
  var yearBtn;
  var valueEl;

  var selected; /* Date at local noon */
  var view; /* Date for visible month/year */
  var mode; /* "days" | "months" | "years" */
  var yearPageStart;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function atNoon(y, m, d) {
    return new Date(y, m, d, 12, 0, 0, 0);
  }

  function cloneDay(d) {
    return atNoon(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function sameDay(a, b) {
    return (
      a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatLabel(d) {
    return (
      d.getDate() +
      " " +
      MONTHS_SHORT[d.getMonth()] +
      " " +
      d.getFullYear()
    );
  }

  function formatIso(d) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return (
      d.getFullYear() +
      "-" +
      (m < 10 ? "0" : "") +
      m +
      "-" +
      (day < 10 ? "0" : "") +
      day
    );
  }

  function parseFromValue() {
    if (!valueEl) return atNoon(2023, 3, 24);
    var iso = valueEl.getAttribute("datetime");
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      var parts = iso.split("-");
      return atNoon(+parts[0], +parts[1] - 1, +parts[2]);
    }
    return atNoon(2023, 3, 24);
  }

  function applySelected(options) {
    options = options || {};
    if (!valueEl || !selected) return;
    valueEl.setAttribute("datetime", formatIso(selected));
    valueEl.textContent = formatLabel(selected);
    if (window.CommosState && typeof window.CommosState.setSimDate === "function") {
      window.CommosState.setSimDate(formatIso(selected), {
        nudgeTickers: options.nudgeTickers !== false,
        force: !!options.force,
      });
    }
  }

  function setOpen(open) {
    if (!picker || !trigger) return;
    if (open) {
      picker.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      mode = "days";
      view = cloneDay(selected);
      render();
    } else {
      picker.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      mode = "days";
    }
  }

  function isOpen() {
    return picker && !picker.hidden;
  }

  function updateHeader() {
    if (!monthBtn || !yearBtn || !view) return;
    monthBtn.textContent = MONTHS_SHORT[view.getMonth()];
    yearBtn.textContent = String(view.getFullYear());
  }

  function renderDays() {
    var y = view.getFullYear();
    var m = view.getMonth();
    var first = atNoon(y, m, 1);
    var startPad = first.getDay();
    var daysInMonth = atNoon(y, m + 1, 0).getDate();
    var html = '<div class="simdate__weekdays">';
    var i;
    var day;
    var cellDate;
    var classes;

    for (i = 0; i < WEEKDAYS.length; i++) {
      html += '<span class="simdate__weekday">' + WEEKDAYS[i] + "</span>";
    }
    html += '</div><div class="simdate__days" role="grid">';

    for (i = 0; i < startPad; i++) {
      html += '<span class="simdate__day simdate__day--empty"></span>';
    }

    for (day = 1; day <= daysInMonth; day++) {
      cellDate = atNoon(y, m, day);
      classes = "simdate__day";
      if (sameDay(cellDate, selected)) classes += " simdate__day--selected";
      html +=
        '<button class="' +
        classes +
        '" type="button" data-simdate-day="' +
        day +
        '" role="gridcell">' +
        day +
        "</button>";
    }

    html += "</div>";
    body.innerHTML = html;
  }

  function renderMonths() {
    var html = '<div class="simdate__months">';
    var i;
    var classes;
    for (i = 0; i < 12; i++) {
      classes = "simdate__month-btn";
      if (i === view.getMonth() && view.getFullYear() === selected.getFullYear()) {
        classes += " simdate__month-btn--selected";
      } else if (i === view.getMonth()) {
        classes += " simdate__month-btn--current";
      }
      html +=
        '<button class="' +
        classes +
        '" type="button" data-simdate-month="' +
        i +
        '">' +
        MONTHS_SHORT[i] +
        "</button>";
    }
    html += "</div>";
    body.innerHTML = html;
  }

  function renderYears() {
    var start = yearPageStart;
    var html = '<div class="simdate__years">';
    var i;
    var y;
    var classes;
    for (i = 0; i < 12; i++) {
      y = start + i;
      classes = "simdate__year-btn";
      if (y === selected.getFullYear()) classes += " simdate__year-btn--selected";
      else if (y === view.getFullYear()) classes += " simdate__year-btn--current";
      html +=
        '<button class="' +
        classes +
        '" type="button" data-simdate-year="' +
        y +
        '">' +
        y +
        "</button>";
    }
    html += "</div>";
    body.innerHTML = html;
  }

  function render() {
    if (!body) return;
    updateHeader();
    if (mode === "months") renderMonths();
    else if (mode === "years") renderYears();
    else renderDays();
  }

  function stepSelected(delta) {
    selected = atNoon(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate() + delta
    );
    view = cloneDay(selected);
    applySelected();
    if (isOpen()) render();
  }

  function stepView(delta) {
    if (mode === "years") {
      yearPageStart += delta * 12;
      render();
      return;
    }
    if (mode === "months") {
      view = atNoon(view.getFullYear() + delta, view.getMonth(), 1);
      render();
      return;
    }
    view = atNoon(view.getFullYear(), view.getMonth() + delta, 1);
    render();
  }

  function onRootClick(event) {
    var t = event.target;
    var dayBtn = t.closest("[data-simdate-day]");
    var monthPick = t.closest("[data-simdate-month]");
    var yearPick = t.closest("[data-simdate-year]");
    var stepBtn = t.closest("[data-simdate-step]");
    var viewStep = t.closest("[data-simdate-view-step]");

    if (t.closest("[data-simdate-trigger]")) {
      event.preventDefault();
      setOpen(!isOpen());
      return;
    }

    if (stepBtn) {
      event.preventDefault();
      stepSelected(parseInt(stepBtn.getAttribute("data-simdate-step"), 10) || 0);
      return;
    }

    if (t.closest("[data-simdate-open-months]")) {
      event.preventDefault();
      mode = mode === "months" ? "days" : "months";
      render();
      return;
    }

    if (t.closest("[data-simdate-open-years]")) {
      event.preventDefault();
      if (mode === "years") {
        mode = "days";
      } else {
        mode = "years";
        yearPageStart = view.getFullYear() - 5;
      }
      render();
      return;
    }

    if (viewStep) {
      event.preventDefault();
      stepView(parseInt(viewStep.getAttribute("data-simdate-view-step"), 10) || 0);
      return;
    }

    if (dayBtn) {
      event.preventDefault();
      selected = atNoon(
        view.getFullYear(),
        view.getMonth(),
        parseInt(dayBtn.getAttribute("data-simdate-day"), 10)
      );
      applySelected();
      setOpen(false);
      return;
    }

    if (monthPick) {
      event.preventDefault();
      view = atNoon(
        view.getFullYear(),
        parseInt(monthPick.getAttribute("data-simdate-month"), 10),
        1
      );
      mode = "days";
      render();
      return;
    }

    if (yearPick) {
      event.preventDefault();
      view = atNoon(
        parseInt(yearPick.getAttribute("data-simdate-year"), 10),
        view.getMonth(),
        1
      );
      mode = "months";
      render();
      return;
    }
  }

  function onDocClick(event) {
    if (!isOpen()) return;
    if (root && root.contains(event.target)) return;
    setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  }

  function boot() {
    root = $("[data-simdate]");
    if (!root) return;

    trigger = $("[data-simdate-trigger]", root);
    picker = $("[data-simdate-picker]", root);
    body = $("[data-simdate-body]", root);
    monthBtn = $("[data-simdate-open-months]", root);
    yearBtn = $("[data-simdate-open-years]", root);
    valueEl = $("[data-simdate-value]", root);

    selected = parseFromValue();
    view = cloneDay(selected);
    mode = "days";
    yearPageStart = selected.getFullYear() - 5;
    applySelected();

    root.addEventListener("click", function (event) {
      /* Keep outside-click closer from seeing re-rendered targets */
      event.stopPropagation();
      onRootClick(event);
    });
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
