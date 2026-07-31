/**
 * Market Data — mock hydration + SVG chart mount
 * No dependencies. Fallback data keeps the page usable if JSON fetch fails.
 * Separated: DATA / RENDER / SELECTORS
 */
(function () {
  "use strict";

  /* ========== SELECTORS ========== */
  var SEL = {
    ticker: '[data-ticker="PhA"]',
    userName: ".chrome__user-name",
    chart: "[data-chart]",
    subtitle: "[data-chart-subtitle]",
  };

  /* ========== DATA (fallback = market-data.json shape) ========== */
  var FALLBACK = {
    simDate: { iso: "2023-04-24", label: "24 Apr 2023" },
    user: { name: "User (Gen)" },
    tickers: [
      { code: "PhA", price: 82.0, delta: 2.27, changePct: 2.85, direction: "up" },
    ],
    charts: {
      physicalMarket: {
        subtitle: "Physical Products Prices ($/t)",
        yMin: 50,
        yMax: 125,
        yTicks: [50, 75, 100, 125],
        xLabels: ["Dec 25", "Feb 26", "Apr 28", "Jun 26"],
        series: [
          { id: "pha", color: "#1B297D", points: [72, 78, 85, 88, 92, 95, 98, 102, 108, 112, 118, 120] },
          { id: "phb", color: "#009EE0", points: [58, 62, 65, 68, 70, 72, 74, 78, 82, 86, 90, 94] },
        ],
      },
      financialMarket: {
        subtitle: "Settlement Prices ($/t)",
        yMin: 50,
        yMax: 125,
        yTicks: [50, 75, 100, 125],
        xLabels: ["Dec 25", "Feb 26", "Apr 28", "Jun 26"],
        series: [
          { id: "fab", color: "#24BAE4", points: [88, 95, 82, 110, 98, 105, 90, 118, 100, 108, 95, 112] },
        ],
      },
      termStructure: {
        subtitle: "Term Structure ($/t)",
        yMin: 50,
        yMax: 125,
        yTicks: [50, 75, 100, 125],
        xLabels: ["M1", "M3", "M6", "M12"],
        fill: "#10B981",
        fillOpacity: 0.18,
        series: [{ id: "curve", color: "#10B981", points: [62, 78, 95, 112] }],
      },
      priceDifferentials: {
        subtitle: "Price Differentials ($/t)",
        yMin: -20,
        yMax: 20,
        yTicks: [-20, -10, 0, 10, 20],
        xLabels: ["Jan", "Mar", "May", "Jul"],
        positive: { color: "#3B82F6", points: [8, 12, 6, 14, 10, 15, 9, 11] },
        negative: { color: "#F65158", points: [-5, -9, -4, -12, -7, -10, -6, -8] },
      },
      annualVolatility: {
        subtitle: "Settlement Prices Annual Vol (%)",
        yMin: 0,
        yMax: 125,
        yTicks: [0, 40, 80, 125],
        xLabels: ["Dec 25", "Feb 26", "Apr 28", "Jun 26"],
        fill: "#24BAE4",
        fillOpacity: 0.15,
        series: [
          { id: "vol", color: "#24BAE4", points: [40, 95, 70, 55, 48, 52, 45, 50, 42, 47, 44, 46] },
        ],
      },
      inventoryLevels: {
        subtitle: "Market Inventory Levels",
        yMin: 0,
        yMax: 40,
        yTicks: [0, 10, 20, 30, 40],
        xLabels: ["W1", "W4", "W8", "W12"],
        bars: {
          color: "#009EE0",
          values: [12, 18, 22, 28, 24, 30, 26, 32, 29, 34, 31, 35, 28, 33, 30, 36],
        },
      },
    },
  };

  var CHART_KEY = {
    "physical-market": "physicalMarket",
    "financial-market": "financialMarket",
    "term-structure": "termStructure",
    "price-differentials": "priceDifferentials",
    "annual-volatility": "annualVolatility",
    "inventory-levels": "inventoryLevels",
  };

  /* ========== RENDER helpers ========== */
  function pad(n) {
    return Number(n).toFixed(Math.abs(n) % 1 === 0 ? 1 : 2);
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
    var n = points.length;
    return points
      .map(function (v, i) {
        var x = mapX(i, n, left, width);
        var y = mapY(v, yMin, yMax, top, height);
        return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      })
      .join(" ");
  }

  function areaPath(points, yMin, yMax, left, top, width, height, baseline) {
    var n = points.length;
    var d = linePath(points, yMin, yMax, left, top, width, height);
    var yBase = mapY(baseline, yMin, yMax, top, height);
    var xLast = mapX(n - 1, n, left, width);
    var xFirst = mapX(0, n, left, width);
    return d + " L" + xLast.toFixed(1) + " " + yBase.toFixed(1) + " L" + xFirst.toFixed(1) + " " + yBase.toFixed(1) + " Z";
  }

  function axesSvg(cfg, left, top, width, height, vbW, vbH) {
    var parts = [];
    var i;
    var y;
    var x;
    var label;

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
          cfg.yTicks[i].toFixed(1) +
          "</text>"
      );
    }

    for (i = 0; i < cfg.xLabels.length; i++) {
      x = mapX(i, cfg.xLabels.length, left, width);
      label = cfg.xLabels[i];
      parts.push(
        '<text class="chart-svg__label chart-svg__label--x" x="' +
          x.toFixed(1) +
          '" y="' +
          (top + height + 16) +
          '">' +
          label +
          "</text>"
      );
    }

    parts.push(
      '<line class="chart-svg__axis" x1="' +
        left +
        '" y1="' +
        top +
        '" x2="' +
        left +
        '" y2="' +
        (top + height) +
        '" />'
    );
    parts.push(
      '<line class="chart-svg__axis" x1="' +
        left +
        '" y1="' +
        (top + height) +
        '" x2="' +
        (left + width) +
        '" y2="' +
        (top + height) +
        '" />'
    );

    return parts.join("");
  }

  function renderLineChart(cfg, opts) {
    opts = opts || {};
    var vbW = 326;
    var vbH = 220;
    var left = 36;
    var top = 8;
    var width = vbW - left - 8;
    var height = vbH - top - 28;
    var html = [];
    var s;
    var series;

    html.push('<svg class="chart-svg" viewBox="0 0 ' + vbW + " " + vbH + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">');
    html.push(axesSvg(cfg, left, top, width, height, vbW, vbH));

    if (opts.fill && cfg.series && cfg.series[0]) {
      html.push(
        '<path class="chart-svg__area" d="' +
          areaPath(cfg.series[0].points, cfg.yMin, cfg.yMax, left, top, width, height, cfg.yMin) +
          '" fill="' +
          (cfg.fill || cfg.series[0].color) +
          '" fill-opacity="' +
          (cfg.fillOpacity != null ? cfg.fillOpacity : 0.18) +
          '" />'
      );
    }

    if (cfg.series) {
      for (s = 0; s < cfg.series.length; s++) {
        series = cfg.series[s];
        html.push(
          '<path class="chart-svg__line" d="' +
            linePath(series.points, cfg.yMin, cfg.yMax, left, top, width, height) +
            '" stroke="' +
            series.color +
            '" fill="none" stroke-width="2" />'
        );
      }
    }

    html.push("</svg>");
    return html.join("");
  }

  function renderDifferential(cfg) {
    var vbW = 326;
    var vbH = 220;
    var left = 36;
    var top = 8;
    var width = vbW - left - 8;
    var height = vbH - top - 28;
    var zeroY = mapY(0, cfg.yMin, cfg.yMax, top, height);
    var html = [];

    html.push('<svg class="chart-svg" viewBox="0 0 ' + vbW + " " + vbH + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">');
    html.push(axesSvg(cfg, left, top, width, height, vbW, vbH));
    html.push(
      '<line class="chart-svg__zero" x1="' +
        left +
        '" y1="' +
        zeroY.toFixed(1) +
        '" x2="' +
        (left + width) +
        '" y2="' +
        zeroY.toFixed(1) +
        '" />'
    );
    html.push(
      '<path class="chart-svg__area" d="' +
        areaPath(cfg.positive.points, cfg.yMin, cfg.yMax, left, top, width, height, 0) +
        '" fill="' +
        cfg.positive.color +
        '" fill-opacity="0.55" />'
    );
    html.push(
      '<path class="chart-svg__area" d="' +
        areaPath(cfg.negative.points, cfg.yMin, cfg.yMax, left, top, width, height, 0) +
        '" fill="' +
        cfg.negative.color +
        '" fill-opacity="0.55" />'
    );
    html.push("</svg>");
    return html.join("");
  }

  function renderBars(cfg) {
    var vbW = 326;
    var vbH = 220;
    var left = 36;
    var top = 8;
    var width = vbW - left - 8;
    var height = vbH - top - 28;
    var values = cfg.bars.values;
    var n = values.length;
    var gap = 2;
    var barW = Math.max(2, (width - gap * (n - 1)) / n);
    var html = [];
    var i;
    var v;
    var x;
    var y;
    var h;
    var base = mapY(0, cfg.yMin, cfg.yMax, top, height);

    html.push('<svg class="chart-svg" viewBox="0 0 ' + vbW + " " + vbH + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">');
    html.push(axesSvg(cfg, left, top, width, height, vbW, vbH));

    for (i = 0; i < n; i++) {
      v = values[i];
      x = left + i * (barW + gap);
      y = mapY(v, cfg.yMin, cfg.yMax, top, height);
      h = base - y;
      html.push(
        '<rect class="chart-svg__bar" x="' +
          x.toFixed(1) +
          '" y="' +
          y.toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          Math.max(0, h).toFixed(1) +
          '" fill="' +
          cfg.bars.color +
          '" />'
      );
    }

    html.push("</svg>");
    return html.join("");
  }

  function renderChart(key, charts) {
    var cfg = charts[CHART_KEY[key]];
    if (!cfg) return "";
    if (key === "price-differentials") return renderDifferential(cfg);
    if (key === "inventory-levels") return renderBars(cfg);
    if (key === "term-structure" || key === "annual-volatility") {
      return renderLineChart(cfg, { fill: true });
    }
    return renderLineChart(cfg, { fill: false });
  }

  function applyTicker(data) {
    var t = data.tickers && data.tickers[0];
    if (!t) return;
    var root = document.querySelector(SEL.ticker);
    if (!root) return;
    var price = root.querySelector(".ticker__price");
    var delta = root.querySelector(".ticker__delta");
    var change = root.querySelector(".ticker__change");
    var code = root.querySelector(".ticker__code");
    if (code) code.textContent = t.code;
    if (price) price.textContent = pad(t.price);
    if (delta) delta.textContent = pad(t.delta);
    if (change) change.textContent = pad(t.changePct) + "%";
  }

  function applyMeta(data) {
    /* Sim Date is owned by sim-date.js + CommosState — do not reset from mock. */
    var userEl = document.querySelector(SEL.userName);
    if (userEl && data.user) userEl.textContent = data.user.name;
  }

  function applyCharts(data) {
    var nodes = document.querySelectorAll(SEL.chart);
    var i;
    var el;
    var key;
    var chartKey;
    var cfg;
    var sub;

    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      key = el.getAttribute("data-chart");
      el.innerHTML = renderChart(key, data.charts || {});
      chartKey = CHART_KEY[key];
      cfg = data.charts && data.charts[chartKey];
      sub = document.querySelector('[data-chart-subtitle="' + key + '"]');
      if (sub && cfg && cfg.subtitle) sub.textContent = cfg.subtitle;
    }
  }

  function hydrate(data) {
    applyMeta(data);
    applyTicker(data);
    applyCharts(data);
  }

  function boot() {
    hydrate(FALLBACK);
    fetch("data/mocks/market-data.json")
      .then(function (res) {
        if (!res.ok) throw new Error("mock fetch failed");
        return res.json();
      })
      .then(function (json) {
        hydrate({
          simDate: json.simDate || FALLBACK.simDate,
          user: json.user || FALLBACK.user,
          tickers: json.tickers || FALLBACK.tickers,
          charts: Object.assign({}, FALLBACK.charts, json.charts || {}),
        });
      })
      .catch(function () {
        /* Fallback already rendered */
      });
  }

  function mount() {
    /* Only hydrate when Market Data charts are present in the DOM */
    if (!document.querySelector(SEL.chart)) return;
    boot();
  }

  window.CommosMarketData = {
    mount: mount,
  };

  /* Boot only if Market Data markup is already in the document (standalone).
     SPA navigation calls CommosMarketData.mount() after inject. */
  function autoBoot() {
    if (document.querySelector(SEL.chart)) {
      mount();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoBoot);
  } else {
    autoBoot();
  }
})();
