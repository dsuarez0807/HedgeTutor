/**
 * CommosDateField — calendar picker for form fields (e.g. Delivery SimTime).
 * Enhances [data-date-field] roots. Value format: 15May2026 (dMonYYYY).
 * Does not touch the global toolbar Sim Date.
 */
(function (global) {
  "use strict";

  var MONTHS_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  var WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  var activeField = null;

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

  function formatCompact(d) {
    return d.getDate() + MONTHS_SHORT[d.getMonth()] + d.getFullYear();
  }

  function parseCompact(str) {
    var m = String(str || "").match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
    if (!m) return null;
    var day = parseInt(m[1], 10);
    var monName = m[2];
    var year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    var mi = -1;
    var i;
    for (i = 0; i < MONTHS_SHORT.length; i++) {
      if (MONTHS_SHORT[i].toLowerCase() === monName.toLowerCase()) {
        mi = i;
        break;
      }
    }
    if (mi < 0 || day < 1 || day > 31) return null;
    var d = atNoon(year, mi, day);
    if (d.getMonth() !== mi || d.getDate() !== day) return null;
    return d;
  }

  function pickerMarkup(id) {
    return (
      '<div class="date-field__picker simdate__picker" id="' +
      id +
      '" data-date-field-picker role="dialog" aria-label="Select date" hidden>' +
      '<div class="simdate__picker-header">' +
      '<button class="simdate__picker-nav" type="button" data-date-view-step="-1" aria-label="Previous">' +
      '<img src="assets/icons/chevron-left.svg" width="12" height="12" alt="" aria-hidden="true">' +
      "</button>" +
      '<div class="simdate__picker-title">' +
      '<button class="simdate__picker-month" type="button" data-date-open-months aria-label="Select month"></button>' +
      '<button class="simdate__picker-year" type="button" data-date-open-years aria-label="Select year"></button>' +
      "</div>" +
      '<button class="simdate__picker-nav" type="button" data-date-view-step="1" aria-label="Next">' +
      '<img src="assets/icons/chevron-right.svg" width="12" height="12" alt="" aria-hidden="true">' +
      "</button>" +
      "</div>" +
      '<div class="simdate__picker-body" data-date-field-body></div>' +
      "</div>"
    );
  }

  function closeField(field) {
    if (!field) return;
    var picker = $("[data-date-field-picker]", field);
    var trigger = $("[data-date-field-trigger]", field);
    if (picker) picker.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    field.classList.remove("is-open");
    field._dateMode = "days";
    if (activeField === field) activeField = null;
  }

  function closeAll(except) {
    $$(".date-field.is-open").forEach(function (f) {
      if (f !== except) closeField(f);
    });
  }

  function syncDisplay(field) {
    var input = $("[data-date-field-input]", field);
    var label = $("[data-date-field-label]", field);
    if (!input || !field._selected) return;
    var compact = formatCompact(field._selected);
    input.value = compact;
    if (label) label.textContent = compact;
  }

  function updateHeader(field) {
    var monthBtn = $("[data-date-open-months]", field);
    var yearBtn = $("[data-date-open-years]", field);
    if (!monthBtn || !yearBtn || !field._view) return;
    monthBtn.textContent = MONTHS_SHORT[field._view.getMonth()];
    yearBtn.textContent = String(field._view.getFullYear());
  }

  function renderDays(field) {
    var body = $("[data-date-field-body]", field);
    if (!body || !field._view) return;
    var y = field._view.getFullYear();
    var m = field._view.getMonth();
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
      if (sameDay(cellDate, field._selected)) classes += " simdate__day--selected";
      html +=
        '<button class="' +
        classes +
        '" type="button" data-date-day="' +
        day +
        '" role="gridcell">' +
        day +
        "</button>";
    }

    html += "</div>";
    body.innerHTML = html;
  }

  function renderMonths(field) {
    var body = $("[data-date-field-body]", field);
    if (!body || !field._view) return;
    var html = '<div class="simdate__months">';
    var i;
    var classes;
    for (i = 0; i < 12; i++) {
      classes = "simdate__month-btn";
      if (
        i === field._view.getMonth() &&
        field._view.getFullYear() === field._selected.getFullYear()
      ) {
        classes += " simdate__month-btn--selected";
      } else if (i === field._view.getMonth()) {
        classes += " simdate__month-btn--current";
      }
      html +=
        '<button class="' +
        classes +
        '" type="button" data-date-month="' +
        i +
        '">' +
        MONTHS_SHORT[i] +
        "</button>";
    }
    html += "</div>";
    body.innerHTML = html;
  }

  function renderYears(field) {
    var body = $("[data-date-field-body]", field);
    if (!body) return;
    var start = field._yearPageStart;
    var html = '<div class="simdate__years">';
    var i;
    var y;
    var classes;
    for (i = 0; i < 12; i++) {
      y = start + i;
      classes = "simdate__year-btn";
      if (y === field._selected.getFullYear()) classes += " simdate__year-btn--selected";
      else if (y === field._view.getFullYear()) classes += " simdate__year-btn--current";
      html +=
        '<button class="' +
        classes +
        '" type="button" data-date-year="' +
        y +
        '">' +
        y +
        "</button>";
    }
    html += "</div>";
    body.innerHTML = html;
  }

  function render(field) {
    updateHeader(field);
    if (field._dateMode === "months") renderMonths(field);
    else if (field._dateMode === "years") renderYears(field);
    else renderDays(field);
  }

  function placePicker(field) {
    var picker = $("[data-date-field-picker]", field);
    var trigger = $("[data-date-field-trigger]", field);
    if (!picker || !trigger) return;
    var rect = trigger.getBoundingClientRect();
    var width = 280;
    var left = rect.left;
    var top = rect.bottom + 6;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    if (top + 320 > window.innerHeight && rect.top > 320) {
      top = rect.top - 6;
      picker.style.transform = "translateY(-100%)";
    } else {
      picker.style.transform = "";
    }
    picker.style.position = "fixed";
    picker.style.left = Math.round(left) + "px";
    picker.style.top = Math.round(top) + "px";
    picker.style.width = width + "px";
    picker.style.zIndex = "80";
  }

  function openDateField(field) {
    closeAll(field);
    if (window.CommosSelect && typeof window.CommosSelect.closeAll === "function") {
      window.CommosSelect.closeAll();
    }
    var picker = $("[data-date-field-picker]", field);
    var trigger = $("[data-date-field-trigger]", field);
    if (!picker || !trigger) return;
    field._dateMode = "days";
    field._view = cloneDay(field._selected);
    field._yearPageStart = field._selected.getFullYear() - 5;
    picker.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    field.classList.add("is-open");
    activeField = field;
    render(field);
    placePicker(field);
  }

  function toggleField(field) {
    if (field.classList.contains("is-open")) closeField(field);
    else openDateField(field);
  }

  function commitDay(field, day) {
    field._selected = atNoon(
      field._view.getFullYear(),
      field._view.getMonth(),
      day
    );
    syncDisplay(field);
    var input = $("[data-date-field-input]", field);
    if (input) {
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    closeField(field);
  }

  function onFieldClick(event) {
    var field = event.currentTarget;
    var t = event.target;
    var dayBtn = t.closest("[data-date-day]");
    var monthPick = t.closest("[data-date-month]");
    var yearPick = t.closest("[data-date-year]");
    var viewStep = t.closest("[data-date-view-step]");

    if (t.closest("[data-date-field-trigger]")) {
      event.preventDefault();
      toggleField(field);
      return;
    }

    if (!field.classList.contains("is-open")) return;

    if (t.closest("[data-date-open-months]")) {
      event.preventDefault();
      field._dateMode = field._dateMode === "months" ? "days" : "months";
      render(field);
      return;
    }

    if (t.closest("[data-date-open-years]")) {
      event.preventDefault();
      if (field._dateMode === "years") {
        field._dateMode = "days";
      } else {
        field._dateMode = "years";
        field._yearPageStart = field._view.getFullYear() - 5;
      }
      render(field);
      return;
    }

    if (viewStep) {
      event.preventDefault();
      var delta = parseInt(viewStep.getAttribute("data-date-view-step"), 10) || 0;
      if (field._dateMode === "years") {
        field._yearPageStart += delta * 12;
      } else if (field._dateMode === "months") {
        field._view = atNoon(field._view.getFullYear() + delta, field._view.getMonth(), 1);
      } else {
        field._view = atNoon(field._view.getFullYear(), field._view.getMonth() + delta, 1);
      }
      render(field);
      return;
    }

    if (dayBtn) {
      event.preventDefault();
      commitDay(field, parseInt(dayBtn.getAttribute("data-date-day"), 10));
      return;
    }

    if (monthPick) {
      event.preventDefault();
      field._view = atNoon(
        field._view.getFullYear(),
        parseInt(monthPick.getAttribute("data-date-month"), 10),
        1
      );
      field._dateMode = "days";
      render(field);
      return;
    }

    if (yearPick) {
      event.preventDefault();
      field._view = atNoon(
        parseInt(yearPick.getAttribute("data-date-year"), 10),
        field._view.getMonth(),
        1
      );
      field._dateMode = "months";
      render(field);
    }
  }

  function enhance(root) {
    if (!root || root.getAttribute("data-date-field-enhanced") === "1") {
      return root;
    }

    var input = $("[data-date-field-input]", root) || $("input, select", root);
    if (!input) return null;

    if (input.tagName === "SELECT") {
      var initial =
        input.value ||
        (input.options[input.selectedIndex] && input.options[input.selectedIndex].value) ||
        "15May2026";
      var hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.id = input.id;
      hidden.name = input.name;
      hidden.value = initial;
      hidden.setAttribute("data-date-field-input", "");
      input.parentNode.replaceChild(hidden, input);
      input = hidden;
    }

    if (!input.hasAttribute("data-date-field-input")) {
      input.setAttribute("data-date-field-input", "");
    }

    var trigger = $("[data-date-field-trigger]", root);
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "date-field__trigger field__control field__control--pt";
      trigger.setAttribute("data-date-field-trigger", "");
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      if (input.id) {
        trigger.id = input.id + "-trigger";
        trigger.setAttribute("aria-controls", input.id + "-picker");
      }
      var label = document.createElement("span");
      label.className = "date-field__label";
      label.setAttribute("data-date-field-label", "");
      label.textContent = input.value || "15May2026";
      trigger.appendChild(label);
      trigger.insertAdjacentHTML(
        "beforeend",
        '<svg class="date-field__chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
          '<path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          "</svg>"
      );
      root.appendChild(trigger);
    }

    var pickerId = (input.id || "date-field") + "-picker";
    if (!$("[data-date-field-picker]", root)) {
      root.insertAdjacentHTML("beforeend", pickerMarkup(pickerId));
    }

    var parsed = parseCompact(input.value) || atNoon(2026, 4, 15);
    root._selected = parsed;
    root._view = cloneDay(parsed);
    root._dateMode = "days";
    root._yearPageStart = parsed.getFullYear() - 5;
    syncDisplay(root);

    root.setAttribute("data-date-field-enhanced", "1");
    root.classList.add("date-field");
    root.addEventListener("click", onFieldClick);

    return root;
  }

  function enhanceAll(scope) {
    $$("[data-date-field]", scope || document).forEach(enhance);
  }

  document.addEventListener("click", function (event) {
    if (!activeField) return;
    if (activeField.contains(event.target)) return;
    closeField(activeField);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && activeField) {
      var trigger = $("[data-date-field-trigger]", activeField);
      closeField(activeField);
      if (trigger) trigger.focus();
    }
  });

  window.addEventListener(
    "scroll",
    function () {
      if (activeField) placePicker(activeField);
    },
    true
  );

  window.addEventListener("resize", function () {
    if (activeField) placePicker(activeField);
  });

  global.CommosDateField = {
    enhance: enhance,
    enhanceAll: enhanceAll,
    closeAll: closeAll,
    formatCompact: formatCompact,
    parseCompact: parseCompact,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      enhanceAll(document);
    });
  } else {
    enhanceAll(document);
  }
})(window);
