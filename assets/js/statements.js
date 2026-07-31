/**
 * Statements — frame 1032:2611
 * Operations + Financial statement tables with shared 6-column grid.
 */
(function () {
  "use strict";

  var MOCK_URL = "data/mocks/statements.json";

  var FALLBACK = {
    opsPhysical: {
      rows: [
        { label: "Revenue", initial: "0", may26: "", total: "0", budgeted: "0", emphasis: false },
        { label: "Costs", initial: "0", may26: "-82.0", total: "-82.0", budgeted: "0", emphasis: false },
        { label: "Inventory Costs", initial: "0", may26: "0", total: "0", budgeted: "0", emphasis: false },
        { label: "Fixed costs", initial: "0", may26: "0", total: "0", budgeted: "0", emphasis: false },
        { label: "Other Variable Costs", initial: "0", may26: "0", total: "0", budgeted: "0", emphasis: false },
        { label: "Operational Income", initial: "0", may26: "-82.0", total: "-82.0", budgeted: "0", emphasis: true },
      ],
    },
    opsFlow: {
      rows: [
        { label: "Cash Flow Futures", initial: "0", may26: "0", total: "0", budgeted: "0", change: "0%", emphasis: false },
        { label: "Cash Flow Swaps", initial: "0", may26: "0", total: "0", budgeted: "0", change: "0%", emphasis: false },
        { label: "Cash Flow Options", initial: "0", may26: "0", total: "0", budgeted: "0", change: "0%", emphasis: false },
        { label: "Transaction Costs", initial: "0", may26: "0", total: "0", budgeted: "0", change: "0%", emphasis: false },
        { label: "Credit Transfers", initial: "0", may26: "0", total: "0", budgeted: "0", change: "0%", emphasis: false },
        { label: "Financial Income", initial: "0", may26: "-82.0", total: "-82.0", budgeted: "-82.0", change: "0%", emphasis: true },
      ],
    },
    opsNet: { label: "Net Income", values: ["0", "-82.0", "-82.0", "-82.0", "Inf%"] },
    finAssets: {
      rows: [
        { label: "Cash", initial: "1,500.0", may26: "1,418.0", final: "1,418.0", change: "-5.48%", emphasis: false },
        { label: "Net Payables/Receivables", initial: "0", may26: "0", final: "0", change: "0%", emphasis: false },
        { label: "Inventories", initial: "0", may26: "149.9", final: "0", change: "149.9", emphasis: false },
        { label: "Derivatives", initial: "0", may26: "0", final: "0", change: "0%", emphasis: false },
      ],
    },
    finNet: { label: "Net Income", values: ["0", "-82.0", "-82.0", "Inf%"] },
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function cell(v, num) {
    return (
      '<td class="table__cell' +
      (num ? " table__cell--num" : "") +
      '">' +
      (v == null || v === "" ? "" : v) +
      "</td>"
    );
  }

  function renderOpsPhysical(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (r) {
        var em = r.emphasis ? " table__row--st-emphasis" : "";
        return (
          '<tr class="table__row' +
          em +
          '">' +
          cell(r.label, false) +
          cell(r.initial, true) +
          cell(r.may26, true) +
          cell(r.total, true) +
          cell(r.budgeted, true) +
          cell(r.change != null ? r.change : "", true) +
          "</tr>"
        );
      })
      .join("");
  }

  function renderOpsFlow(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (r) {
        var em = r.emphasis ? " table__row--st-emphasis" : "";
        return (
          '<tr class="table__row' +
          em +
          '">' +
          cell(r.label, false) +
          cell(r.initial, true) +
          cell(r.may26, true) +
          cell(r.total, true) +
          cell(r.budgeted, true) +
          cell(r.change, true) +
          "</tr>"
        );
      })
      .join("");
  }

  function renderFinAssets(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (r) {
        return (
          '<tr class="table__row">' +
          cell(r.label, false) +
          cell(r.initial, true) +
          cell(r.may26, true) +
          cell(r.final, true) +
          cell("", true) +
          cell(r.change, true) +
          "</tr>"
        );
      })
      .join("");
  }

  function renderNet(el, net, slots) {
    if (!el || !net) return;
    var n = slots || 5;
    var values = (net.values || []).slice();
    while (values.length < n) values.push("");
    if (values.length > n) values = values.slice(0, n);

    /* Financial net: Initial | May26 | Final | (spacer) | Change */
    if (n === 5 && values.length === 4) {
      values = [values[0], values[1], values[2], "", values[3]];
    }

    var vals = values
      .map(function (v) {
        return '<span class="st-net__val">' + (v == null ? "" : v) + "</span>";
      })
      .join("");
    el.innerHTML =
      '<div class="st-net__inner">' +
      '<span class="st-net__label">' +
      (net.label || "Net Income") +
      "</span>" +
      '<div class="st-net__values">' +
      vals +
      "</div>" +
      "</div>";
  }

  function hydrate(root, data) {
    var d = data || FALLBACK;
    root._stData = d;
    renderOpsPhysical($("[data-st-ops-physical]", root), (d.opsPhysical && d.opsPhysical.rows) || []);
    renderOpsFlow($("[data-st-ops-flow]", root), (d.opsFlow && d.opsFlow.rows) || []);
    renderFinAssets($("[data-st-fin-assets]", root), (d.finAssets && d.finAssets.rows) || []);
    renderNet($("[data-st-ops-net]", root), d.opsNet, 5);
    renderNet($("[data-st-fin-net]", root), d.finNet, 5);
  }

  function mount() {
    var root = $('.st[data-module="statements"]');
    if (!root) root = $('#dashboard-content [data-module="statements"]');
    if (!root) return Promise.resolve();

    return fetch(MOCK_URL, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .catch(function () {
        return FALLBACK;
      })
      .then(function (data) {
        hydrate(root, data || FALLBACK);
      });
  }

  window.CommosStatements = { mount: mount };
})();
