/**
 * Credit Line — frame 1032:2148
 * Three equal margin charts + SUMMARY OF CREDIT ACCOUNT MOVES.
 */
(function () {
  "use strict";

  var MOCK_URL = "data/mocks/credit-line.json";

  var FALLBACK = {
    charts: {
      initial: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Jun 26"],
        bandMax: 95,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        lineColor: "#009EE0",
        value: 95,
      },
      variation: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Jun 26"],
        bandMax: 95,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        lineColor: "#1B297D",
        value: 95,
      },
      margins: {
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Jun 26"],
        bandMax: 95,
        bandColor: "#FFBABA",
        bandOpacity: 0.35,
        lineColor: "#EF4444",
        value: 95,
      },
    },
    creditAccountMoves: {
      rows: [
        {
          type: "detail",
          tradeName: "PhA(15May26)_1",
          pnl: "28.2",
          cashFlow: "0",
          cashAccount: "1.8",
          collateral1: "1.8",
          collateral2: "1.8",
          comments: "MtM=$28.2k=(Pf:110.2 - Pi:82.0)$/t * 1.0k t",
        },
        {
          type: "total",
          tradeName: "13Jul26 Total",
          pnl: "28.2",
          cashFlow: "0",
          cashAccount: "1,418",
          collateral1: "0",
          collateral2: "0",
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
    var yLine = mapY(cfg.value, cfg.yMin, cfg.yMax, top, height);
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
        yLine.toFixed(1) +
        '" width="' +
        width +
        '" height="' +
        Math.max(0, yBandBot - yLine).toFixed(1) +
        '" fill="' +
        (cfg.bandColor || "#FFBABA") +
        '" fill-opacity="' +
        (cfg.bandOpacity != null ? cfg.bandOpacity : 0.35) +
        '" />'
    );
    html.push(
      '<line class="chart-svg__line" x1="' +
        left +
        '" y1="' +
        yLine.toFixed(1) +
        '" x2="' +
        (left + width) +
        '" y2="' +
        yLine.toFixed(1) +
        '" stroke="' +
        (cfg.lineColor || "#009EE0") +
        '" stroke-width="2.5" />'
    );
    html.push("</svg>");
    return html.join("");
  }

  function renderMoves(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (r) {
        var isTotal = r.type === "total";
        var rowClass = isTotal ? " table__row--cl-total" : "";
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
          (r.collateral1 || "") +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          (r.collateral2 || "") +
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
    $$("[data-cl-chart]", root).forEach(function (el) {
      var key = el.getAttribute("data-cl-chart");
      el.innerHTML = renderChart(charts[key]);
    });
    renderMoves(
      $("[data-cl-moves-body]", root),
      (data.creditAccountMoves && data.creditAccountMoves.rows) || []
    );
  }

  function mount() {
    var root = $('.cl[data-module="credit-line"]');
    if (!root) root = $('#dashboard-content [data-module="credit-line"]');
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

  window.CommosCreditLine = { mount: mount };
})();
