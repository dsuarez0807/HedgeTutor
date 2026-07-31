/**
 * Greeks — frame 1032:2324
 * Three equal delta charts + SUMMARY table.
 */
(function () {
  "use strict";

  var MOCK_URL = "data/mocks/greeks.json";

  var FALLBACK = {
    charts: {
      physical: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Apr 26", "Jun 26"],
        bandMax: 65,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        series: [{ id: "physical", color: "#009EE0", points: [125, 118, 116, 117, 118, 119, 120, 122] }],
      },
      financial: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Apr 26", "Jun 26"],
        bandMax: 65,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        series: [{ id: "financial", color: "#1B297D", points: [72, 72, 72, 72, 72, 72, 72, 72] }],
      },
      total: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["May 26", "Sep 27", "Dec 27", "Apr 27"],
        bandMax: 65,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        series: [
          { id: "physical", color: "#EF4444", points: [125, 118, 116, 117, 118, 119, 120, 122] },
          { id: "financial", color: "#1B297D", points: [72, 72, 72, 72, 72, 72, 72, 72] },
        ],
      },
    },
    greeksSummary: {
      rows: [
        { simDate: "28May26", tradeName: "PhA(15May26)_1", cumDelta: "1.11", delta: "1.11", gama: "0", rho: "0", theta: "0", vega: "0" },
        { simDate: "27May26", tradeName: "PhA(15May26)_1", cumDelta: "1.12", delta: "1.12", gama: "0", rho: "0", theta: "0", vega: "0" },
        { simDate: "26May26", tradeName: "PhA(15May26)_1", cumDelta: "1.13", delta: "1.13", gama: "0", rho: "0", theta: "0", vega: "0" },
        { simDate: "16May26", tradeName: "PhA(15May26)_1", cumDelta: "1.23", delta: "1.23", gama: "0", rho: "0", theta: "0", vega: "0" },
      ],
    },
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function mapX(i, n, left, width) {
    if (n <= 1) return left + width / 2;
    return left + (i / (n - 1)) * width;
  }

  function mapY(v, yMin, yMax, top, height) {
    var t = (v - yMin) / (yMax - yMin);
    return top + (1 - t) * height;
  }

  function linePath(points, yMin, yMax, left, top, width, height) {
    return points
      .map(function (v, i) {
        var x = mapX(i, points.length, left, width);
        var y = mapY(v, yMin, yMax, top, height);
        return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      })
      .join(" ");
  }

  function axesSvg(cfg, left, top, width, height) {
    var parts = [];
    var i;
    var y;
    var x;

    for (i = 0; i < cfg.yTicks.length; i++) {
      y = mapY(cfg.yTicks[i], cfg.yMin, cfg.yMax, top, height);
      parts.push(
        '<line class="chart-svg__grid" x1="' +
          left +
          '" y1="' +
          y.toFixed(1) +
          '" x2="' +
          (left + width) +
          '" y2="' +
          y.toFixed(1) +
          '" />'
      );
      parts.push(
        '<text class="chart-svg__label chart-svg__label--y" x="' +
          (left - 6) +
          '" y="' +
          (y + 3).toFixed(1) +
          '">' +
          Number(cfg.yTicks[i]).toFixed(1) +
          "</text>"
      );
    }

    for (i = 0; i < cfg.xLabels.length; i++) {
      x = mapX(i, cfg.xLabels.length, left, width);
      parts.push(
        '<text class="chart-svg__label chart-svg__label--x" x="' +
          x.toFixed(1) +
          '" y="' +
          (top + height + 16) +
          '">' +
          cfg.xLabels[i] +
          "</text>"
      );
    }

    return parts.join("");
  }

  function renderChart(cfg) {
    if (!cfg) return "";
    var vbW = 326;
    var vbH = 220;
    var left = 40;
    var top = 8;
    var width = vbW - left - 8;
    var height = vbH - top - 28;
    var yBandTop = mapY(cfg.bandMax, cfg.yMin, cfg.yMax, top, height);
    var yBandBot = mapY(cfg.yMin, cfg.yMin, cfg.yMax, top, height);
    var html = [];
    var s;
    var series;

    html.push(
      '<svg class="chart-svg" viewBox="0 0 ' +
        vbW +
        " " +
        vbH +
        '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
    );
    html.push(axesSvg(cfg, left, top, width, height));
    html.push(
      '<rect class="chart-svg__area-rect" x="' +
        left +
        '" y="' +
        yBandTop.toFixed(1) +
        '" width="' +
        width +
        '" height="' +
        Math.max(0, yBandBot - yBandTop).toFixed(1) +
        '" fill="' +
        (cfg.bandColor || "#FFBABA") +
        '" fill-opacity="' +
        (cfg.bandOpacity != null ? cfg.bandOpacity : 0.35) +
        '" />'
    );

    for (s = 0; s < (cfg.series || []).length; s++) {
      series = cfg.series[s];
      html.push(
        '<path class="chart-svg__line" d="' +
          linePath(series.points, cfg.yMin, cfg.yMax, left, top, width, height) +
          '" stroke="' +
          series.color +
          '" fill="none" stroke-width="2.5" />'
      );
    }

    html.push("</svg>");
    return html.join("");
  }

  function renderSummary(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (r, idx) {
        var zebra = idx % 2 === 1 ? " table__row--alt" : "";
        return (
          '<tr class="table__row' +
          zebra +
          '">' +
          '<td class="table__cell">' +
          (r.simDate || "") +
          "</td>" +
          '<td class="table__cell">' +
          (r.tradeName || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.cumDelta || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.delta || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.gama || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.rho || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.theta || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.vega || "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function hydrate(root, data) {
    var charts = data.charts || {};
    $$("[data-gr-chart]", root).forEach(function (el) {
      var key = el.getAttribute("data-gr-chart");
      el.innerHTML = renderChart(charts[key]);
    });
    renderSummary(
      $("[data-gr-summary-body]", root),
      (data.greeksSummary && data.greeksSummary.rows) || []
    );
    bindInfoHelp(root);
  }

  function bindInfoHelp(root) {
    if (root.getAttribute("data-gr-help-bound") === "1") return;
    root.setAttribute("data-gr-help-bound", "1");
    root.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-help-id]");
      if (!btn || !root.contains(btn)) return;
      event.preventDefault();
      var id = Number(btn.getAttribute("data-help-id"));
      if (!id) return;
      if (window.CommosHelp && typeof window.CommosHelp.openById === "function") {
        window.CommosHelp.openById(id);
      }
    });
  }

  function mount() {
    var root = $('.gr[data-module="greeks"]');
    if (!root) root = $('#dashboard-content [data-module="greeks"]');
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

  window.CommosGreeks = { mount: mount };
})();
