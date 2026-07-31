/**
 * Shared simulation state for toolbar + trade mocks.
 * Events: filters | simdate | tickers | messages | trades | reset | refresh
 */
(function (global) {
  "use strict";

  var listeners = {};

  var TICKER_ORDER = ["PhA", "PhB", "FAB"];

  var state = {
    simDateIso: "2023-04-24",
    activeTicker: "PhA",
    filters: {
      underlying: "all",
      contract: "all",
      tradeName: "all",
    },
    tickers: {
      PhA: { price: "82.0", delta: "2.27", change: "2.85%", direction: "up" },
      PhB: { price: "64.4", delta: "1.45", change: "2.30%", direction: "up" },
      FAB: { price: "72.0", delta: "2.27", change: "3.26%", direction: "up" },
    },
    messages: [
      {
        id: "m1",
        day: "Today",
        level: "info",
        text: "Welcome to HedgeTutor simulation User GEN 1842.",
        unread: true,
      },
      {
        id: "m2",
        day: "Today",
        level: "warning",
        text: "Margin utilisation on FAB positions is approaching maintenance level.",
        unread: true,
      },
      {
        id: "m3",
        day: "Yesterday",
        level: "success",
        text: "Physical trade PhA(15May26)-1 confirmed successfully.",
        unread: false,
      },
    ],
    physicalTrades: null,
    financialTrades: null,
  };

  function emit(type, detail) {
    var list = listeners[type] || [];
    for (var i = 0; i < list.length; i++) {
      try {
        list[i](detail);
      } catch (e) {
        console.error("[sim-state]", type, e);
      }
    }
    document.dispatchEvent(
      new CustomEvent("commos:" + type, { detail: detail || null })
    );
  }

  function on(type, fn) {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(fn);
    return function off() {
      listeners[type] = (listeners[type] || []).filter(function (f) {
        return f !== fn;
      });
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function underlyingFromCode(code) {
    var m = String(code || "").match(/^(PhA|PhB|FAB)/i);
    return m ? m[1] : "";
  }

  function contractFromTrade(t) {
    var c = (t && t.contract) || "";
    if (c) return String(c).toLowerCase();
    var blob = ((t && t.comments) || "") + " " + ((t && t.tradeCode) || "");
    if (/fwd|forward|future/i.test(blob)) return "fwd";
    return "spot";
  }

  function annotateTrade(t) {
    var copy = Object.assign({}, t);
    copy.underlying = copy.underlying || underlyingFromCode(copy.tradeCode);
    copy.contract = contractFromTrade(copy);
    copy.tradeName = copy.tradeName || copy.tradeCode || "";
    return copy;
  }

  function resolveActiveTicker() {
    var u = state.filters.underlying;
    if (u && u !== "all" && state.tickers[u]) return u;
    if (state.tickers[state.activeTicker]) return state.activeTicker;
    return "PhA";
  }

  function setActiveTicker(code, options) {
    options = options || {};
    if (!state.tickers[code]) return;
    state.activeTicker = code;
    if (!options.silent) applyTickerDom();
    emit("tickers", { active: code, tickers: clone(state.tickers) });
  }

  function cycleActiveTicker() {
    var idx = TICKER_ORDER.indexOf(resolveActiveTicker());
    var next = TICKER_ORDER[(idx + 1) % TICKER_ORDER.length];
    /* Manual cycle clears underlying filter lock so click can rotate freely */
    if (state.filters.underlying !== "all" && state.filters.underlying !== next) {
      state.filters.underlying = "all";
      syncFilterControls();
      emit("filters", clone(state.filters));
    }
    setActiveTicker(next);
  }

  function applyTickerDom() {
    var el = document.querySelector("[data-toolbar-ticker]");
    if (!el) return;
    var code = resolveActiveTicker();
    var t = state.tickers[code] || state.tickers.PhA;
    var down = t.direction === "down";

    el.setAttribute("data-ticker", code);
    el.setAttribute("data-direction", t.direction || "up");
    el.classList.toggle("ticker--down", down);
    el.classList.toggle("ticker--up", !down);
    el.setAttribute(
      "aria-label",
      "Market ticker " + code + ". Click to switch product."
    );

    var codeEl = el.querySelector("[data-ticker-code]") || el.querySelector(".ticker__code");
    var price = el.querySelector("[data-ticker-price]") || el.querySelector(".ticker__price");
    var delta = el.querySelector("[data-ticker-delta]") || el.querySelector(".ticker__delta");
    var change = el.querySelector("[data-ticker-change]") || el.querySelector(".ticker__change");
    var arrow = el.querySelector("[data-ticker-arrow]") || el.querySelector(".ticker__arrow");

    if (codeEl) codeEl.textContent = code;
    if (price) price.textContent = t.price;
    if (delta) delta.textContent = t.delta;
    if (change) change.textContent = t.change;
    if (arrow) {
      arrow.src = down
        ? "assets/icons/arrow-down.svg"
        : "assets/icons/arrow-up.svg";
    }
  }

  function bootTickerControl() {
    var el = document.querySelector("[data-toolbar-ticker]");
    if (el && el.getAttribute("data-ticker-bound") !== "1") {
      el.setAttribute("data-ticker-bound", "1");
      el.addEventListener("click", function () {
        cycleActiveTicker();
      });
      el.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          cycleActiveTicker();
        }
      });
    }
    applyTickerDom();
  }

  function nudgeTickersForDate(iso) {
    var seed = 0;
    for (var i = 0; i < String(iso).length; i++) seed += iso.charCodeAt(i);
    Object.keys(state.tickers).forEach(function (code, idx) {
      var base = state.tickers[code];
      var price = parseFloat(base.price);
      if (isNaN(price)) return;
      var wobble = ((seed + idx * 17) % 21) / 10 - 1;
      var next = Math.round((price + wobble) * 10) / 10;
      var d = Math.round((next - price) * 100) / 100;
      var pct = price ? Math.round((d / price) * 10000) / 100 : 0;
      state.tickers[code] = {
        price: next.toFixed(1),
        delta: (d >= 0 ? "" : "") + d.toFixed(2),
        change: (pct >= 0 ? "" : "") + pct.toFixed(2) + "%",
        direction: d >= 0 ? "up" : "down",
      };
    });
    applyTickerDom();
    emit("tickers", clone(state.tickers));
  }

  function unreadCount() {
    return state.messages.filter(function (m) {
      return m.unread;
    }).length;
  }

  function setFilters(partial) {
    Object.keys(partial || {}).forEach(function (k) {
      if (k in state.filters) state.filters[k] = partial[k];
    });
    if (
      partial &&
      partial.underlying &&
      partial.underlying !== "all" &&
      state.tickers[partial.underlying]
    ) {
      state.activeTicker = partial.underlying;
    }
    applyTickerDom();
    emit("filters", clone(state.filters));
    emit("refresh", { reason: "filters" });
  }

  function setSimDate(iso, options) {
    options = options || {};
    if (!iso || iso === state.simDateIso) {
      if (!options.force) return;
    }
    state.simDateIso = iso;
    if (options.nudgeTickers !== false) nudgeTickersForDate(iso);
    emit("simdate", { iso: iso });
    emit("refresh", { reason: "simdate", iso: iso });
  }

  function addMessage(msg) {
    state.messages.unshift(
      Object.assign(
        {
          id: "m" + Date.now(),
          day: "Today",
          level: "info",
          unread: true,
        },
        msg
      )
    );
    emit("messages", { messages: clone(state.messages), unread: unreadCount() });
  }

  function markAllRead() {
    state.messages.forEach(function (m) {
      m.unread = false;
    });
    emit("messages", { messages: clone(state.messages), unread: 0 });
  }

  function getPhysicalTrades(fallback) {
    if (state.physicalTrades) return state.physicalTrades.map(annotateTrade);
    return (fallback || []).map(annotateTrade);
  }

  function getFinancialTrades(fallback) {
    if (state.financialTrades) return state.financialTrades.map(annotateTrade);
    return (fallback || []).map(annotateTrade);
  }

  function setPhysicalTrades(trades) {
    state.physicalTrades = (trades || []).map(annotateTrade);
    emit("trades", { kind: "physical" });
  }

  function setFinancialTrades(trades) {
    state.financialTrades = (trades || []).map(annotateTrade);
    emit("trades", { kind: "financial" });
  }

  function ensurePhysical(fallback) {
    if (!state.physicalTrades) {
      state.physicalTrades = (fallback || []).map(annotateTrade);
    }
    return state.physicalTrades;
  }

  function ensureFinancial(fallback) {
    if (!state.financialTrades) {
      state.financialTrades = (fallback || []).map(annotateTrade);
    }
    return state.financialTrades;
  }

  function resetSimulation() {
    state.physicalTrades = [];
    state.financialTrades = [];
    state.filters = { underlying: "all", contract: "all", tradeName: "all" };
    state.activeTicker = "PhA";
    state.tickers = {
      PhA: { price: "82.0", delta: "2.27", change: "2.85%", direction: "up" },
      PhB: { price: "64.4", delta: "1.45", change: "2.30%", direction: "up" },
      FAB: { price: "72.0", delta: "2.27", change: "3.26%", direction: "up" },
    };
    applyTickerDom();
    addMessage({
      level: "warning",
      text: "Simulation data was reset.",
      unread: true,
    });
    emit("reset", null);
    emit("filters", clone(state.filters));
    emit("refresh", { reason: "reset" });
  }

  function matchesFilters(item) {
    var f = state.filters;
    if (f.underlying && f.underlying !== "all") {
      if (String(item.underlying || "").toLowerCase() !== f.underlying.toLowerCase()) {
        return false;
      }
    }
    if (f.contract && f.contract !== "all") {
      if (String(item.contract || "").toLowerCase() !== f.contract.toLowerCase()) {
        return false;
      }
    }
    if (f.tradeName && f.tradeName !== "all") {
      if (String(item.tradeName || item.tradeCode || "") !== f.tradeName) {
        return false;
      }
    }
    return true;
  }

  function applyDomFilters(root) {
    root = root || document;
    var rows = root.querySelectorAll("[data-filter-item]");
    rows.forEach(function (row) {
      var item = {
        underlying: row.getAttribute("data-underlying") || "",
        contract: row.getAttribute("data-contract") || "",
        tradeName: row.getAttribute("data-trade-name") || "",
      };
      var ok = matchesFilters(item);
      row.hidden = !ok;
      row.classList.toggle("is-filter-hidden", !ok);
    });

    var cards = root.querySelectorAll("[data-filter-underlying]");
    cards.forEach(function (card) {
      var u = card.getAttribute("data-filter-underlying") || "all";
      var f = state.filters.underlying;
      var ok = !f || f === "all" || u === "all" || u.toLowerCase() === f.toLowerCase();
      card.classList.toggle("is-filter-dimmed", !ok);
    });
  }

  function syncFilterControls() {
    var root = document.querySelector("[data-toolbar-filters]");
    if (!root) return;
    ["underlying", "contract", "tradeName"].forEach(function (name) {
      var sel = root.querySelector('select[name="' + name + '"]');
      if (sel && state.filters[name] != null) sel.value = state.filters[name];
    });
  }

  function populateTradeNameOptions(trades) {
    var sel = document.querySelector('[data-toolbar-filters] select[name="tradeName"]');
    if (!sel) return;
    var current = state.filters.tradeName || "all";
    var names = [];
    (trades || []).forEach(function (t) {
      var n = t.tradeCode || t.tradeName;
      if (n && names.indexOf(n) === -1) names.push(n);
    });
    sel.innerHTML =
      '<option value="all">All Trades</option>' +
      names
        .map(function (n) {
          return '<option value="' + n + '">' + n + "</option>";
        })
        .join("");
    if (current !== "all" && names.indexOf(current) === -1) {
      state.filters.tradeName = "all";
      current = "all";
    }
    sel.value = current;
  }

  global.CommosState = {
    on: on,
    emit: emit,
    getFilters: function () {
      return clone(state.filters);
    },
    setFilters: setFilters,
    getSimDate: function () {
      return state.simDateIso;
    },
    setSimDate: setSimDate,
    getTickers: function () {
      return clone(state.tickers);
    },
    getActiveTicker: resolveActiveTicker,
    setActiveTicker: setActiveTicker,
    cycleActiveTicker: cycleActiveTicker,
    applyTickerDom: applyTickerDom,
    getMessages: function () {
      return clone(state.messages);
    },
    addMessage: addMessage,
    markAllRead: markAllRead,
    unreadCount: unreadCount,
    getPhysicalTrades: getPhysicalTrades,
    getFinancialTrades: getFinancialTrades,
    setPhysicalTrades: setPhysicalTrades,
    setFinancialTrades: setFinancialTrades,
    ensurePhysical: ensurePhysical,
    ensureFinancial: ensureFinancial,
    resetSimulation: resetSimulation,
    matchesFilters: matchesFilters,
    applyDomFilters: applyDomFilters,
    syncFilterControls: syncFilterControls,
    populateTradeNameOptions: populateTradeNameOptions,
    annotateTrade: annotateTrade,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootTickerControl);
  } else {
    bootTickerControl();
  }
})(window);
