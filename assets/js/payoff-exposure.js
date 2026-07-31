/**
 * Payoff and Exposure — frame 1032:1705
 * SVG-only level charts (flat lines ± pink fill) + Exposure Profile table.
 */
(function () {
  "use strict";

  var MOCK_URL = "data/mocks/payoff-exposure.json";

  var CHART_KEY = {
    "physical-market": "physicalMarket",
    "financial-market": "financialMarket",
    "termo-structure": "termoStructure",
    "price-differentials": "priceDifferentials",
    "annual-volatility": "annualVolatility",
    "annual-volatility-total": "annualVolatilityTotal",
  };

  var FALLBACK = {
    charts: {
      physicalMarket: {
        subtitle: "Physical Products Prices ($/t)",
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Apr 26", "Jun 26"],
        fillBelow: true,
        fillColor: "#FFBABA",
        fillOpacity: 0.35,
        series: [{ id: "level", color: "#009EE0", value: 95 }],
      },
      financialMarket: {
        subtitle: "Settlement Prices ($/t)",
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["Dec 25", "Feb 26", "Apr 26", "Jun 26"],
        fillBelow: true,
        fillColor: "#FFBABA",
        fillOpacity: 0.35,
        series: [{ id: "level", color: "#1B297D", value: 95 }],
      },
      termoStructure: {
        subtitle: "Physical_Financial_Total",
        yMin: 50,
        yMax: 125,
        yTicks: [50, 65, 80, 95, 110, 125],
        xLabels: ["May 26", "Sep 27", "Dec 27", "Apr 27"],
        fillBelow: true,
        fillColor: "#FFBABA",
        fillOpacity: 0.35,
        series: [{ id: "level", color: "#00A63E", value: 90 }],
      },
      priceDifferentials: {
        subtitle: "",
        yMin: -20,
        yMax: 10,
        yTicks: [10, 0, -20],
        yTickLabels: ["10.0", "00", "-20.0"],
        xLabels: ["13Jun", "12Jun", "14Jun", "15Jun"],
        fillBelow: false,
        series: [{ id: "level", color: "#EF4444", value: 0 }],
      },
      annualVolatility: {
        subtitle: "",
        yMin: -20,
        yMax: 10,
        yTicks: [10, 0, -20],
        yTickLabels: ["10.0", "00", "-20.0"],
        xLabels: ["13Jun", "12Jun", "14Jun", "15Jun"],
        fillBelow: false,
        series: [{ id: "level", color: "#009EE0", value: 0 }],
      },
      annualVolatilityTotal: {
        subtitle: "Physical_Financial_Total",
        yMin: -20,
        yMax: 10,
        yTicks: [10, 0, -20],
        yTickLabels: ["10.0", "00", "-20.0"],
        xLabels: ["13Jun", "12Jun", "14Jun", "15Jun"],
        fillBelow: false,
        series: [{ id: "level", color: "#009EE0", value: 0 }],
      },
    },
    exposureProfile: {
      rows: [
        { name: "Total Exposure", jul26: "2.5", max: "1.8" },
        { name: "Physical Exposure", jul26: "2.5", max: "2.5" },
        { name: "Financial Exposure", jul26: "2.3", max: "2.1" },
        { name: "PhA(15May26)_1", jul26: "2.1", max: "2.1" },
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

  function formatY(cfg, tick, idx) {
    if (cfg.yTickLabels && cfg.yTickLabels[idx] != null) return cfg.yTickLabels[idx];
    return Number(tick).toFixed(1);
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
          formatY(cfg, cfg.yTicks[i], i) +
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

  function renderLevelChart(cfg) {
    var vbW = 326;
    var vbH = 220;
    var left = 40;
    var top = 8;
    var width = vbW - left - 8;
    var height = vbH - top - 28;
    var series = (cfg.series && cfg.series[0]) || { color: "#009EE0", value: 0 };
    var yLine = mapY(series.value, cfg.yMin, cfg.yMax, top, height);
    var yBase = mapY(cfg.yMin, cfg.yMin, cfg.yMax, top, height);
    var html = [];

    html.push(
      '<svg class="chart-svg" viewBox="0 0 ' +
        vbW +
        " " +
        vbH +
        '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
    );
    html.push(axesSvg(cfg, left, top, width, height));

    if (cfg.fillBelow) {
      html.push(
        '<rect class="chart-svg__area-rect" x="' +
          left +
          '" y="' +
          yLine.toFixed(1) +
          '" width="' +
          width +
          '" height="' +
          Math.max(0, yBase - yLine).toFixed(1) +
          '" fill="' +
          (cfg.fillColor || "#FFBABA") +
          '" fill-opacity="' +
          (cfg.fillOpacity != null ? cfg.fillOpacity : 0.35) +
          '" />'
      );
    }

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
        series.color +
        '" stroke-width="2.5" />'
    );

    html.push("</svg>");
    return html.join("");
  }

  function renderExposure(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (r, idx) {
        var zebra = idx % 2 === 1 ? " table__row--alt" : "";
        return (
          '<tr class="table__row' +
          zebra +
          '">' +
          '<td class="table__cell">' +
          r.name +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          r.jul26 +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
          r.max +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function hydrate(root, data) {
    var charts = data.charts || {};
    $$("[data-pe-chart]", root).forEach(function (el) {
      var key = el.getAttribute("data-pe-chart");
      var cfg = charts[CHART_KEY[key]];
      if (!cfg) {
        el.innerHTML = "";
        return;
      }
      el.innerHTML = renderLevelChart(cfg);
      var sub = $('[data-pe-subtitle="' + key + '"]', root);
      if (sub) {
        if (cfg.subtitle) {
          sub.textContent = cfg.subtitle;
          sub.removeAttribute("hidden");
        } else {
          sub.textContent = "";
          sub.setAttribute("hidden", "");
        }
      }
    });

    renderExposure(
      $("[data-pe-exposure-body]", root),
      (data.exposureProfile && data.exposureProfile.rows) || []
    );
  }

  function mount() {
    var root = $('.pe[data-module="payoff-exposure"]');
    if (!root) root = $('#dashboard-content [data-module="payoff-exposure"]');
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

  window.CommosPayoffExposure = { mount: mount };
})();
