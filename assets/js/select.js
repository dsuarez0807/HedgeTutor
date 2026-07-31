/**
 * CommosSelect — custom dropdown matching Figma UI Kit states:
 * Default / Hover / Focus (open) / Hover on Focus (option).
 * Enhances native <select> in place and keeps change events in sync.
 */
(function (global) {
  "use strict";

  var OPEN_CLASS = "is-open";
  var CHEVRON =
    '<svg class="dropdown__chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
    '<path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  var openDropdown = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function selectedOption(select) {
    if (select.selectedIndex < 0) return null;
    return select.options[select.selectedIndex] || null;
  }

  function labelFor(select) {
    var opt = selectedOption(select);
    return opt ? opt.textContent.trim() : "";
  }

  function variantClass(select) {
    if (select.classList.contains("toolbar-filter__select")) return "dropdown--toolbar";
    if (select.classList.contains("field__control--pt") || select.classList.contains("field__control")) {
      return "dropdown--field dropdown--fill";
    }
    return "";
  }

  function closeDropdown(dd) {
    if (!dd) return;
    dd.classList.remove(OPEN_CLASS);
    var menu = $(".dropdown__menu", dd);
    var trigger = $(".dropdown__trigger", dd);
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (openDropdown === dd) openDropdown = null;
  }

  function closeAll(except) {
    $$(".dropdown." + OPEN_CLASS).forEach(function (dd) {
      if (dd !== except) closeDropdown(dd);
    });
  }

  function openMenu(dd) {
    closeAll(dd);
    var menu = $(".dropdown__menu", dd);
    var trigger = $(".dropdown__trigger", dd);
    if (!menu || !trigger) return;
    dd.classList.add(OPEN_CLASS);
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    openDropdown = dd;
    var selected = $(".dropdown__option.is-selected", menu);
    if (selected && typeof selected.scrollIntoView === "function") {
      selected.scrollIntoView({ block: "nearest" });
    }
  }

  function toggleMenu(dd) {
    if (dd.classList.contains(OPEN_CLASS)) closeDropdown(dd);
    else openMenu(dd);
  }

  function rebuildOptions(dd, select) {
    var menu = $(".dropdown__menu", dd);
    if (!menu) return;
    menu.innerHTML = "";
    Array.prototype.forEach.call(select.options, function (opt, index) {
      if (opt.hidden) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropdown__option";
      btn.setAttribute("role", "option");
      btn.setAttribute("data-index", String(index));
      btn.setAttribute("data-value", opt.value);
      btn.textContent = opt.textContent.trim();
      if (opt.disabled) btn.disabled = true;
      if (opt.selected) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-selected", "true");
      } else {
        btn.setAttribute("aria-selected", "false");
      }
      menu.appendChild(btn);
    });
  }

  function syncLabel(dd, select) {
    var valueEl = $(".dropdown__value", dd);
    if (valueEl) valueEl.textContent = labelFor(select);
    $$(".dropdown__option", dd).forEach(function (btn) {
      var selected = btn.getAttribute("data-value") === select.value;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function choose(dd, select, value) {
    if (select.value === value) {
      closeDropdown(dd);
      return;
    }
    select.value = value;
    syncLabel(dd, select);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    closeDropdown(dd);
  }

  function enhance(select) {
    if (!select || select.tagName !== "SELECT") return null;
    if (select.getAttribute("data-dropdown-enhanced") === "1") {
      return select.closest(".dropdown");
    }

    var parent = select.parentNode;
    if (!parent) return null;

    var dd = document.createElement("div");
    dd.className = ("dropdown " + variantClass(select)).trim();

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "dropdown__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    if (select.id) trigger.setAttribute("aria-controls", select.id + "-listbox");
    if (select.disabled) trigger.disabled = true;

    var valueEl = document.createElement("span");
    valueEl.className = "dropdown__value";
    valueEl.textContent = labelFor(select);
    trigger.appendChild(valueEl);
    trigger.insertAdjacentHTML("beforeend", CHEVRON);

    var menu = document.createElement("div");
    menu.className = "dropdown__menu";
    menu.setAttribute("role", "listbox");
    if (select.id) menu.id = select.id + "-listbox";
    menu.hidden = true;

    select.classList.add("dropdown__native");
    select.setAttribute("data-dropdown-enhanced", "1");
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");

    parent.insertBefore(dd, select);
    dd.appendChild(select);
    dd.appendChild(trigger);
    dd.appendChild(menu);

    rebuildOptions(dd, select);

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      if (trigger.disabled) return;
      toggleMenu(dd);
    });

    menu.addEventListener("click", function (event) {
      var opt = event.target.closest(".dropdown__option");
      if (!opt || opt.disabled) return;
      choose(dd, select, opt.getAttribute("data-value"));
    });

    menu.addEventListener("mouseover", function (event) {
      var opt = event.target.closest(".dropdown__option");
      if (!opt) return;
      $$(".dropdown__option.is-active", menu).forEach(function (el) {
        el.classList.remove("is-active");
      });
      opt.classList.add("is-active");
    });

    select.addEventListener("change", function () {
      syncLabel(dd, select);
    });

    return dd;
  }

  function enhanceAll(root) {
    var scope = root || document;
    var nodes = $$("select.select, select.toolbar-filter__select, select.field__control", scope);
    nodes.forEach(enhance);
  }

  document.addEventListener("click", function (event) {
    if (!openDropdown) return;
    if (openDropdown.contains(event.target)) return;
    closeDropdown(openDropdown);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && openDropdown) {
      var trigger = $(".dropdown__trigger", openDropdown);
      closeDropdown(openDropdown);
      if (trigger) trigger.focus();
    }
  });

  global.CommosSelect = {
    enhance: enhance,
    enhanceAll: enhanceAll,
    closeAll: closeAll
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      enhanceAll(document);
    });
  } else {
    enhanceAll(document);
  }
})(window);
