/**
 * PnL and Cash Flow — frame 1032:1902
 * Three equal chart cards + SUMMARY OF CASH FLOW ACCOUNT MOVES table.
 */
(function () {
  "use strict";

  var MOCK_URL = "data/mocks/pnl-cashflow.json";

  var FALLBACK = {
    charts: {
      physical: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Jun 26"],
        bandMax: 95,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        lineColor: "#009EE0",
        points: [95, 102, 118, 110, 115, 112, 114],
        marker: { color: "#1B297D", width: 10 },
      },
      financial: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Jun 26"],
        bandMax: 95,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        lineColor: "#009EE0",
        points: [95, 95, 95, 95, 95, 95, 95],
        marker: null,
      },
      total: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Jun 26"],
        bandMax: 95,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        lineColor: "#009EE0",
        points: [95, 100, 116, 108, 114, 110, 113],
        marker: { color: "#EF4444", width: 10 },
      },
    },
    cashFlowMoves: {
      rows: [
        {
          type: "detail",
          tradeName: "PhA(15May26)_1",
          pnl: "28.2",
          cashFlow: "0",
          cashAccount: "1.8",
          collateral: "",
          comments: "MtM=$28.2k=(Pf:110.2 - Pi:82.0)$/t * 1.0k t",
        },
        {
          type: "total",
          tradeName: "13Jul26 Total",
          pnl: "28.2",
          cashFlow: "0",
          cashAccount: "1,418",
          collateral: "0",
          comments: "",
        },
        {
          type: "detail",
          tradeName: "PhA(15May26)_1",
          pnl: "28.2",
          cashFlow: "0",
          cashAccount: "1.8",
          collateral: "",
          comments: "MtM=$28.2k=(Pf:110.2 - Pi:82.0)$/t * 1.0k t",
        },
        {
          type: "total",
          tradeName: "13Jul26 Total",
          pnl: "28.2",
          cashFlow: "0",
          cashAccount: "1,418",
          collateral: "0",
          comments: "",
        },
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
        '<line class="chart-svg__grid chart-svg__grid--dash" x1="' +
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

    if (cfg.marker) {
      var barW = cfg.marker.width || 10;
      html.push(
        '<rect class="chart-svg__bar" x="' +
          left +
          '" y="' +
          top +
          '" width="' +
          barW +
          '" height="' +
          height +
          '" fill="' +
          cfg.marker.color +
          '" />'
      );
    }

    if (cfg.points && cfg.points.length) {
      html.push(
        '<path class="chart-svg__line" d="' +
          linePath(cfg.points, cfg.yMin, cfg.yMax, left, top, width, height) +
          '" stroke="' +
          (cfg.lineColor || "#009EE0") +
          '" fill="none" stroke-width="2.5" />'
      );
    }

    html.push("</svg>");
    return html.join("");
  }

  function renderMoves(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (r) {
        var isTotal = r.type === "total";
        var rowClass = isTotal ? " table__row--pnl-total" : "";
        return (
          '<tr class="table__row' +
          rowClass +
          '">' +
          '<td class="table__cell">' +
          (r.tradeName || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.pnl || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.cashFlow || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.cashAccount || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.collateral || "") +
          "</td>" +
          '<td class="table__cell table__cell--comment">' +
          (r.comments || "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function hydrate(root, data) {
    var charts = data.charts || {};
    $$("[data-pnl-chart]", root).forEach(function (el) {
      var key = el.getAttribute("data-pnl-chart");
      el.innerHTML = renderChart(charts[key]);
    });
    renderMoves(
      $("[data-pnl-moves-body]", root),
      (data.cashFlowMoves && data.cashFlowMoves.rows) || []
    );
  }

  function mount() {
    var root = $('.pnl[data-module="pnl-cash-flow"]');
    if (!root) root = $('#dashboard-content [data-module="pnl-cash-flow"]');
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

  window.CommosPnlCashFlow = { mount: mount };
})();
