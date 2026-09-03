/**
 * Sidebar SPA navigation — native JS only.
 * Keeps chrome / sidebar / Dashboard Header fixed; swaps #dashboard-content.
 * Separated from market-data.js (charts/hydration).
 */
(function () {
  "use strict";

  var DEFAULT_ROUTE = "market-data";

  var ROUTES = {
    "market-data": {
      path: "/market-data",
      file: "pages/market-data.html",
      title: "Market Data — Commos Consulting",
      label: "Market Data",
    },
    "physical-trading": {
      path: "/physical-trading",
      file: "pages/physical-trading.html",
      title: "Physical Trading — Commos Consulting",
      label: "Physical Trading",
    },
    "financial-trading": {
      path: "/financial-trading",
      file: "pages/financial-trading.html",
      title: "Financial Trading — Commos Consulting",
      label: "Financial Trading",
    },
    "payoff-exposure": {
      path: "/payoff-exposure",
      file: "pages/payoff-exposure.html",
      title: "Payoff and Exposure — Commos Consulting",
      label: "Payoff and Exposure",
    },
    "pnl-cash-flow": {
      path: "/pnl-cash-flow",
      file: "pages/pnl-cashflow.html",
      title: "PnL and Cash Flow — Commos Consulting",
      label: "PnL and Cash Flow",
    },
    "credit-line": {
      path: "/credit-line",
      file: "pages/credit-line.html",
      title: "Credit Line — Commos Consulting",
      label: "Credit Line",
    },
    greeks: {
      path: "/greeks",
      file: "pages/greeks.html",
      title: "Greeks — Commos Consulting",
      label: "Greeks",
    },
    statements: {
      path: "/statements",
      file: "pages/statements.html",
      title: "Statements — Commos Consulting",
      label: "Statements",
    },
  };

  var contentEl = null;
  var toolbarEl = null;
  var linkNodes = null;
  var currentRoute = null;
  var cache = {};
  var loading = false;
  /** Project site base, e.g. `/repo/` on GitHub Pages; `/` locally. */
  var BASE_PATH = "/";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function normalizeRoute(raw) {
    if (!raw) return DEFAULT_ROUTE;
    var key = String(raw)
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .toLowerCase();

    if (!key || key === "index.html" || key === "index") return DEFAULT_ROUTE;
    if (ROUTES[key]) return key;

    /* Legacy / alternate aliases */
    if (key === "pnl-cashflow") return "pnl-cash-flow";
    if (key === "payoff-and-exposure") return "payoff-exposure";

    return null;
  }

  function computeBasePath() {
    var path = window.location.pathname || "/";
    path = path.replace(/\/index\.html$/i, "/");
    var segments = path.split("/").filter(Boolean);
    if (!segments.length) return "/";

    var last = segments[segments.length - 1].toLowerCase();
    if (normalizeRoute(last) && ROUTES[normalizeRoute(last)]) {
      segments.pop();
    }
    if (!segments.length) return "/";
    return "/" + segments.join("/") + "/";
  }

  function routeUrl(routeId) {
    var meta = ROUTES[routeId];
    if (!meta) return BASE_PATH;
    var slug = String(meta.path || "").replace(/^\//, "");
    if (BASE_PATH === "/") return "/" + slug;
    return BASE_PATH + slug;
  }

  function pageUrl(file) {
    if (BASE_PATH === "/") return file;
    return BASE_PATH + file;
  }

  function stripBasePath(pathname) {
    var path = pathname || "/";
    if (BASE_PATH === "/") return path;
    var prefix = BASE_PATH.replace(/\/$/, "");
    if (path === prefix || path === prefix + "/") return "/";
    if (path.indexOf(prefix + "/") === 0) {
      return path.slice(prefix.length) || "/";
    }
    return path;
  }

  function consumeSpaRedirect() {
    var stored = null;
    try {
      stored = sessionStorage.getItem("commos-spa-redirect");
      if (stored) sessionStorage.removeItem("commos-spa-redirect");
    } catch (e) {
      stored = null;
    }
    if (!stored) return;
    try {
      var u = new URL(stored, window.location.origin);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e2) {
      /* ignore bad redirect */
    }
  }

  function routeFromLocation() {
    var path = stripBasePath(window.location.pathname || "/");
    var fromPath = normalizeRoute(path);
    if (fromPath && ROUTES[fromPath]) return fromPath;

    var hash = (window.location.hash || "").replace(/^#\/?/, "");
    var fromHash = normalizeRoute(hash);
    if (fromHash && ROUTES[fromHash]) return fromHash;

    return DEFAULT_ROUTE;
  }

  function syncSidebarHrefs() {
    if (!linkNodes) return;
    linkNodes.forEach(function (link) {
      var routeId = normalizeRoute(link.getAttribute("data-route"));
      if (routeId && ROUTES[routeId]) {
        link.setAttribute("href", routeUrl(routeId));
      }
    });
  }

  function setActiveLink(routeId) {
    linkNodes.forEach(function (link) {
      var item = link.closest(".sidebar__item");
      var isActive = link.getAttribute("data-route") === routeId;
      if (item) {
        if (isActive) item.classList.add("sidebar__item--active");
        else item.classList.remove("sidebar__item--active");
      }
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function updateShellContext(routeId) {
    var meta = ROUTES[routeId];
    if (!meta) return;
    document.title = meta.title;
    if (toolbarEl) toolbarEl.setAttribute("data-module", routeId);
    var dash = $(".dashboard");
    if (dash) {
      dash.setAttribute("data-frame", routeId);
      var figmaNode = "1032:1449";
      if (routeId === "physical-trading") figmaNode = "1032:2970";
      if (routeId === "financial-trading") figmaNode = "1032:3306";
      if (routeId === "payoff-exposure") figmaNode = "1032:1705";
      if (routeId === "pnl-cash-flow") figmaNode = "1032:1902";
      if (routeId === "credit-line") figmaNode = "1032:2148";
      if (routeId === "greeks") figmaNode = "1032:2324";
      if (routeId === "statements") figmaNode = "1032:2611";
      dash.setAttribute("data-figma-node", figmaNode);
    }

    /* Trade filters on modules that show them in Figma */
    var filters = $("[data-toolbar-filters]");
    if (filters) {
      var showFilters =
        routeId === "physical-trading" ||
        routeId === "financial-trading" ||
        routeId === "payoff-exposure" ||
        routeId === "pnl-cash-flow" ||
        routeId === "credit-line" ||
        routeId === "greeks";
      if (showFilters) filters.removeAttribute("hidden");
      else filters.setAttribute("hidden", "");

      /* Financial Trading: Underlying + Contract only (no Trade Name) — Figma 1032:3308 */
      var tradeNameFilter = filters.querySelector('[data-toolbar-filter="tradeName"]');
      if (tradeNameFilter) {
        if (routeId === "financial-trading") tradeNameFilter.setAttribute("hidden", "");
        else tradeNameFilter.removeAttribute("hidden");
      }
    }
  }

  function showError(message, routeId) {
    contentEl.innerHTML =
      '<article class="card card--module card--error">' +
      '<header class="card__header">' +
      '<h2 class="card__title">Unable to load module</h2>' +
      '<p class="card__subtitle">' +
      (routeId || "unknown") +
      "</p>" +
      "</header>" +
      '<div class="card__body">' +
      '<p class="module-placeholder module-placeholder--error">' +
      message +
      "</p>" +
      "</div>" +
      "</article>";
  }

  function afterRender(routeId) {
    if (window.CommosSelect && typeof window.CommosSelect.enhanceAll === "function") {
      window.CommosSelect.enhanceAll(contentEl);
    }
    if (window.CommosDateField && typeof window.CommosDateField.enhanceAll === "function") {
      window.CommosDateField.enhanceAll(contentEl);
    }
    if (routeId === "market-data" && window.CommosMarketData && typeof window.CommosMarketData.mount === "function") {
      window.CommosMarketData.mount();
    }
    if (
      routeId === "physical-trading" &&
      window.CommosPhysicalTrading &&
      typeof window.CommosPhysicalTrading.mount === "function"
    ) {
      window.CommosPhysicalTrading.mount();
    }
    if (
      routeId === "financial-trading" &&
      window.CommosFinancialTrading &&
      typeof window.CommosFinancialTrading.mount === "function"
    ) {
      window.CommosFinancialTrading.mount();
    }
    if (
      routeId === "payoff-exposure" &&
      window.CommosPayoffExposure &&
      typeof window.CommosPayoffExposure.mount === "function"
    ) {
      window.CommosPayoffExposure.mount();
    }
    if (
      routeId === "pnl-cash-flow" &&
      window.CommosPnlCashFlow &&
      typeof window.CommosPnlCashFlow.mount === "function"
    ) {
      window.CommosPnlCashFlow.mount();
    }
    if (
      routeId === "credit-line" &&
      window.CommosCreditLine &&
      typeof window.CommosCreditLine.mount === "function"
    ) {
      window.CommosCreditLine.mount();
    }
    if (routeId === "greeks" && window.CommosGreeks && typeof window.CommosGreeks.mount === "function") {
      window.CommosGreeks.mount();
    }
    if (
      routeId === "statements" &&
      window.CommosStatements &&
      typeof window.CommosStatements.mount === "function"
    ) {
      window.CommosStatements.mount();
    }

    syncShellState();
    if (window.CommosState && typeof window.CommosState.applyDomFilters === "function") {
      window.CommosState.applyDomFilters(contentEl);
    }
  }

  function fetchFragment(routeId) {
    var meta = ROUTES[routeId];
    if (cache[routeId]) {
      return Promise.resolve(cache[routeId]);
    }
    return fetch(pageUrl(meta.file), { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status + " loading " + meta.file);
      }
      return res.text().then(function (html) {
        cache[routeId] = html;
        return html;
      });
    });
  }

  function renderRoute(routeId, options) {
    options = options || {};
    var resolved = ROUTES[routeId] ? routeId : DEFAULT_ROUTE;
    var wasUnknown = !ROUTES[routeId];
    if (wasUnknown && routeId !== DEFAULT_ROUTE) {
      console.warn("[navigation] Unknown route \"%s\" — falling back to market-data", routeId);
      resolved = DEFAULT_ROUTE;
    }

    if (loading && currentRoute === resolved && !options.force) {
      return Promise.resolve();
    }

    loading = true;
    setLoading(true);
    setActiveLink(resolved);
    updateShellContext(resolved);

    if (options.push) {
      var nextUrl = routeUrl(resolved);
      if (window.location.pathname !== nextUrl) {
        history.pushState({ route: resolved }, ROUTES[resolved].title, nextUrl);
      }
    } else if (options.replace || wasUnknown) {
      history.replaceState({ route: resolved }, ROUTES[resolved].title, routeUrl(resolved));
    }

    return fetchFragment(resolved)
      .then(function (html) {
        contentEl.innerHTML = html;
        currentRoute = resolved;
        afterRender(resolved);
      })
      .catch(function (err) {
        console.error("[navigation] Failed to load route:", resolved, err);
        showError(
          "No se pudo cargar el módulo. Reintentá o volvé a Market Data.",
          resolved
        );
        currentRoute = resolved;
      })
      .then(function () {
        loading = false;
        setLoading(false);
      });
  }

  function onSidebarClick(event) {
    var link = event.target.closest("a.sidebar__link[data-route]");
    if (!link) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var routeId = normalizeRoute(link.getAttribute("data-route"));
    if (!routeId || !ROUTES[routeId]) {
      event.preventDefault();
      renderRoute(DEFAULT_ROUTE, { push: true });
      return;
    }

    event.preventDefault();
    if (routeId === currentRoute) return;
    renderRoute(routeId, { push: true });
  }

  function onPopState(event) {
    var fromState = event.state && event.state.route;
    var routeId = normalizeRoute(fromState) || routeFromLocation();
    renderRoute(routeId || DEFAULT_ROUTE, { push: false });
  }

  function setSidebarCollapsed(collapsed) {
    var dashboard = $(".dashboard");
    var toggle = $("#sidebar-toggle");
    if (!dashboard || !toggle) return;

    if (collapsed) {
      dashboard.classList.add("dashboard--sidebar-collapsed");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Expand sidebar");
      toggle.setAttribute("title", "Expand sidebar");
    } else {
      dashboard.classList.remove("dashboard--sidebar-collapsed");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Collapse sidebar");
      toggle.setAttribute("title", "Collapse sidebar");
    }

    try {
      window.localStorage.setItem("commos.sidebarCollapsed", collapsed ? "1" : "0");
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function onSidebarToggleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    var dashboard = $(".dashboard");
    if (!dashboard) return;
    var next = !dashboard.classList.contains("dashboard--sidebar-collapsed");
    setSidebarCollapsed(next);
  }

  function bootSidebarToggle() {
    var toggle = $("#sidebar-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", onSidebarToggleClick);

    var stored = null;
    try {
      stored = window.localStorage.getItem("commos.sidebarCollapsed");
    } catch (e) {
      stored = null;
    }
    if (stored === "1") setSidebarCollapsed(true);
  }

  function clearToolbarSelected() {
    var actionsRoot = $(".toolbar__actions");
    if (!actionsRoot) return;
    var siblings = actionsRoot.querySelectorAll(".toolbar__action[data-toolbar-action]");
    for (var i = 0; i < siblings.length; i++) {
      siblings[i].setAttribute("aria-pressed", "false");
    }
  }

  function setLoading(on) {
    var el = $("#loading-overlay");
    if (!el) return;
    if (on) {
      el.hidden = false;
      el.setAttribute("aria-hidden", "false");
    } else {
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
    }
  }

  function remountCurrent() {
    if (!currentRoute) return;
    afterRender(currentRoute);
  }

  function openResetConfirm() {
    if (!window.CommosConfirm || typeof window.CommosConfirm.open !== "function") {
      console.warn("[navigation] CommosConfirm not available");
      return;
    }
    window.CommosConfirm.open({
      title: "Confirmation",
      message: "Are you sure that you want reset the simulation data?",
      onAccept: function () {
        if (window.CommosState && typeof window.CommosState.resetSimulation === "function") {
          window.CommosState.resetSimulation();
        }
        remountCurrent();
        clearToolbarSelected();
      },
      onCancel: function () {
        clearToolbarSelected();
      },
    });
  }

  function openHelpForRoute() {
    if (!window.CommosHelp || typeof window.CommosHelp.open !== "function") {
      console.warn("[navigation] CommosHelp not available");
      return;
    }
    window.CommosHelp.open(currentRoute || DEFAULT_ROUTE, {
      onClose: clearToolbarSelected,
    });
  }

  function openMessageCentre() {
    if (!window.CommosMessages || typeof window.CommosMessages.open !== "function") {
      console.warn("[navigation] CommosMessages not available");
      return;
    }
    window.CommosMessages.open({
      onClose: clearToolbarSelected,
    });
  }

  function onToolbarActionClick(event) {
    var btn = event.target.closest(".toolbar__action[data-toolbar-action]");
    if (!btn || btn.disabled || btn.getAttribute("aria-disabled") === "true") return;

    var actionsRoot = btn.closest(".toolbar__actions");
    if (!actionsRoot) return;

    var action = btn.getAttribute("data-toolbar-action");
    var wasPressed = btn.getAttribute("aria-pressed") === "true";
    var siblings = actionsRoot.querySelectorAll(".toolbar__action[data-toolbar-action]");

    /* Exclusive Selected: at most one navy at a time */
    for (var i = 0; i < siblings.length; i++) {
      siblings[i].setAttribute("aria-pressed", "false");
    }
    if (!wasPressed) {
      btn.setAttribute("aria-pressed", "true");
    }

    if (action === "reset" && !wasPressed) {
      openResetConfirm();
    }
    if (action === "help" && !wasPressed) {
      openHelpForRoute();
    }
    if (action === "msg" && !wasPressed) {
      openMessageCentre();
    }
  }

  function bootToolbarFilters() {
    var root = $("[data-toolbar-filters]");
    if (!root || root.getAttribute("data-filters-bound") === "1") return;
    root.setAttribute("data-filters-bound", "1");

    root.addEventListener("change", function (event) {
      var sel = event.target.closest("select[name]");
      if (!sel || !root.contains(sel)) return;
      var patch = {};
      patch[sel.name] = sel.value;
      if (window.CommosState && typeof window.CommosState.setFilters === "function") {
        window.CommosState.setFilters(patch);
      }
      if (window.CommosState && typeof window.CommosState.applyDomFilters === "function") {
        window.CommosState.applyDomFilters(contentEl);
      }
    });
  }

  function syncShellState() {
    if (!window.CommosState) return;
    if (typeof window.CommosState.applyTickerDom === "function") {
      window.CommosState.applyTickerDom();
    }
    if (typeof window.CommosState.syncFilterControls === "function") {
      window.CommosState.syncFilterControls();
    }
    if (window.CommosSelect && typeof window.CommosSelect.enhanceAll === "function") {
      window.CommosSelect.enhanceAll($("[data-toolbar-filters]") || document);
    }
    if (window.CommosMessages && typeof window.CommosMessages.refreshBadge === "function") {
      window.CommosMessages.refreshBadge();
    }
  }

  function bootToolbarActions() {
    var actions = $(".toolbar__actions");
    if (!actions) return;
    actions.addEventListener("click", onToolbarActionClick);
  }

  function boot() {
    consumeSpaRedirect();
    BASE_PATH = computeBasePath();

    contentEl = $("#dashboard-content");
    toolbarEl = $(".dashboard__toolbar");
    linkNodes = $$(".sidebar__link[data-route]");

    if (!contentEl) {
      console.error("[navigation] #dashboard-content not found");
      return;
    }

    /* Collapsed rail: show module name on hover */
    linkNodes.forEach(function (link) {
      if (!link.getAttribute("title")) {
        var label = link.querySelector(".sidebar__label");
        if (label && label.textContent) {
          link.setAttribute("title", label.textContent.trim());
        }
      }
    });
    syncSidebarHrefs();

    bootSidebarToggle();
    bootToolbarActions();
    bootToolbarFilters();
    syncShellState();

    if (window.CommosState && typeof window.CommosState.on === "function") {
      window.CommosState.on("refresh", function (detail) {
        if (detail && detail.reason === "filters") {
          if (typeof window.CommosState.applyDomFilters === "function") {
            window.CommosState.applyDomFilters(contentEl);
          }
          return;
        }
        remountCurrent();
      });
      window.CommosState.on("simdate", function (detail) {
        if (detail && detail.iso && window.CommosState.addMessage) {
          /* message added optionally — keep quiet to avoid spam on every day step */
        }
      });
    }

    document.addEventListener("click", onSidebarClick);
    window.addEventListener("popstate", onPopState);

    bootContentWheelScroll();

    var initial = routeFromLocation();
    if (!ROUTES[initial]) initial = DEFAULT_ROUTE;

    renderRoute(initial, { replace: true });
  }

  /**
   * Wheel over toolbar / main padding should still scroll module content,
   * so Market Data tables are reachable like Figma.
   * Nested scrollables (dropdown menus, date pickers) keep native wheel scroll.
   */
  function bootContentWheelScroll() {
    var main = $(".dashboard__main");
    if (!main || main.getAttribute("data-wheel-scroll") === "1") return;
    main.setAttribute("data-wheel-scroll", "1");

    function isNestedScrollable(target) {
      var el = target;
      while (el && el !== main && el !== contentEl) {
        if (el.nodeType === 1) {
          var style = window.getComputedStyle(el);
          var oy = style.overflowY;
          if (
            (oy === "auto" || oy === "scroll" || oy === "overlay") &&
            el.scrollHeight > el.clientHeight + 1
          ) {
            return true;
          }
        }
        el = el.parentElement;
      }
      return false;
    }

    main.addEventListener(
      "wheel",
      function (event) {
        if (!contentEl) return;
        if (event.target.closest(".modal-backdrop:not([hidden])")) return;
        if (isNestedScrollable(event.target)) return;

        var max = contentEl.scrollHeight - contentEl.clientHeight;
        if (max <= 0) return;

        var next = contentEl.scrollTop + event.deltaY;
        if (next < 0) next = 0;
        if (next > max) next = max;
        if (next === contentEl.scrollTop) return;

        contentEl.scrollTop = next;
        event.preventDefault();
      },
      { passive: false }
    );
  }

  window.CommosNav = {
    remountCurrent: remountCurrent,
    getCurrentRoute: function () {
      return currentRoute;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
