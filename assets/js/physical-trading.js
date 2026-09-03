/**
 * Physical Trading module — frame 1032:2970
 * SVG payoff chart + table hydration from mock JSON.
 */
(function () {
  "use strict";

  var MOCK_URL = "data/mocks/physical-trading.json";

  var FALLBACK = {
    marketQuote: 82.0,
    confirmSummary:
      "Buy 1,000.0 t. CF Amount = 81.97 $/t * 1,000.0 t = $ -82.0k",
    payoff: {
      xMin: 72,
      xMax: 92,
      yMin: -12,
      yMax: 12,
      line: [
        [72, -12],
        [92, 12],
      ],
    },
    inventoryInsOuts: {
      xMin: 72,
      xMax: 92,
      yMin: -12,
      yMax: 12,
      legend: "PhA_in, PhB_in, PhA_out, PhB_out",
      line: [
        [72, 6.0],
        [92, -7.0],
      ],
    },
    projInventoryLevels: {
      xMin: 82,
      xMax: 92,
      yMin: -12,
      yMax: 12,
      xStep: 2,
      yTicks: [12, 9, 6, -12],
      yScale: "ticks",
      showNegBand: false,
      showVerticalGrid: false,
      gridDash: "2 3",
      plotFill: "#E8EAF2",
      legendParts: [
        { text: "PhAFcst", tone: "cyan" },
        { text: "_", tone: "navy" },
        { text: "PhBFcst", tone: "navy" },
      ],
      series: [
        {
          className: "payoff-line payoff-line--cyan",
          color: "#009EE0",
          width: 2.5,
          points: [
            [82, 9],
            [92, 9],
          ],
        },
        {
          className: "payoff-line payoff-line--navy",
          color: "#1B297D",
          width: 2.5,
          points: [
            [82, 6],
            [92, 6],
          ],
        },
      ],
    },
    greeks: {
      rows: [
        {
          code: "FAB",
          actual: [73.6, 73.8, 82.0, 82.0],
          forecasted: [82.0, 82.0, 82.0, 82.0],
        },
        {
          code: "PhB",
          actual: [-0.8, -0.27, -0.44, -0.97],
          forecasted: [-2.0, -2.0, -2.0, -2.0],
        },
        {
          code: "Total",
          actual: [-0.8, -0.27, -0.44, -0.97],
          forecasted: [-2.0, -2.0, -2.0, -2.0],
        },
      ],
    },
    executedTrades: [
      {
        tradeSimDate: "14May26",
        tradeCode: "PhA(15May26)-1",
        qty: "73.8",
        deliverySimDate: "15May26",
        settleSimDate: "15May26",
        location: "EMA",
        price: "82.0",
        amount: "82.0",
        comments: "BUY 1,000.0 t @ 82.0 $/t",
      },
      {
        tradeSimDate: "10May26",
        tradeCode: "PhB(12May26)-1",
        qty: "40.0",
        deliverySimDate: "12May26",
        settleSimDate: "12May26",
        location: "Amer",
        price: "64.4",
        amount: "25.8",
        comments: "SELL 500.0 t @ 64.4 $/t",
      },
      {
        tradeSimDate: "18May26",
        tradeCode: "PhA(20May26)-2",
        qty: "100.0",
        deliverySimDate: "20May26",
        settleSimDate: "20May26",
        location: "Asia",
        price: "90.5",
        amount: "90.5",
        comments: "BUY 1,000.0 t @ 90.5 $/t",
      },
    ],
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function formatCell(n) {
    if (typeof n !== "number") return String(n);
    var rounded = Math.round(n * 100) / 100;
    if (Math.abs(rounded) > 0 && Math.abs(rounded) < 1) {
      return rounded.toFixed(2);
    }
    return (Math.round(rounded * 10) / 10).toFixed(1);
  }

  function mapX(x, xMin, xMax, left, width) {
    return left + ((x - xMin) / (xMax - xMin)) * width;
  }

  function mapY(y, yMin, yMax, top, height) {
    return top + ((yMax - y) / (yMax - yMin)) * height;
  }

  /** Even visual spacing across yTicks (non-linear value gaps, e.g. 12/9/6/-12). */
  function mapYByTicks(y, ticks, top, height) {
    if (!ticks || ticks.length < 2) {
      return top + height / 2;
    }
    var ordered = ticks.slice();
    if (ordered[0] < ordered[ordered.length - 1]) {
      ordered.reverse();
    }
    if (y >= ordered[0]) return top;
    if (y <= ordered[ordered.length - 1]) return top + height;
    for (var i = 0; i < ordered.length - 1; i++) {
      var y0 = ordered[i];
      var y1 = ordered[i + 1];
      if (y <= y0 && y >= y1) {
        var t = (y0 - y) / (y0 - y1);
        return top + ((i + t) / (ordered.length - 1)) * height;
      }
    }
    return top + height / 2;
  }

  function renderLevelChart(el, cfg) {
    if (!el || !cfg) return;

    var W = 520;
    var H = 220;
    var padL = 36;
    var padR = 12;
    var padT = 12;
    var padB = 28;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var xMin = cfg.xMin;
    var xMax = cfg.xMax;
    var yMin = cfg.yMin;
    var yMax = cfg.yMax;
    var showNeg = cfg.showNegBand !== false;
    var xStep = cfg.xStep || 2;
    var plotFill = cfg.plotFill || "";
    var xAxisTitle = cfg.xAxisTitle || "";
    var showVerticalGrid = cfg.showVerticalGrid !== false;
    var gridDash = cfg.gridDash || "";
    var gridDashAttr = gridDash
      ? ' stroke-dasharray="' + gridDash + '"'
      : "";
    var yTicks = cfg.yTicks || [-12, -6, 0, 6, 12];
    var useTickScale = cfg.yScale === "ticks";

    function yPix(yv) {
      return useTickScale
        ? mapYByTicks(yv, yTicks, padT, plotH)
        : mapY(yv, yMin, yMax, padT, plotH);
    }

    var yZero = yPix(0);
    var negTop = yZero;
    var negH = yPix(yMin) - yZero;

    if (xAxisTitle) {
      padB = 36;
      plotH = H - padT - padB;
      yZero = yPix(0);
      negTop = yZero;
      negH = yPix(yMin) - yZero;
    }

    var series = cfg.series;
    if (!series || !series.length) {
      series = [{ className: "payoff-line", points: cfg.line || [] }];
    }

    function toPts(points) {
      return (points || [])
        .map(function (p) {
          return (
            mapX(p[0], xMin, xMax, padL, plotW).toFixed(1) +
            "," +
            yPix(p[1]).toFixed(1)
          );
        })
        .join(" ");
    }

    var xTicks = [];
    for (var x = xMin; x <= xMax + 1e-9; x += xStep) {
      xTicks.push(Math.round(x * 100) / 100);
    }

    var grid = "";
    if (showVerticalGrid) {
      xTicks.forEach(function (xv) {
        var px = mapX(xv, xMin, xMax, padL, plotW);
        grid +=
          '<line class="payoff-grid" x1="' +
          px +
          '" y1="' +
          padT +
          '" x2="' +
          px +
          '" y2="' +
          (padT + plotH) +
          '"' +
          gridDashAttr +
          "/>";
      });
    }
    yTicks.forEach(function (yv) {
      var py = yPix(yv);
      grid +=
        '<line class="payoff-grid" x1="' +
        padL +
        '" y1="' +
        py +
        '" x2="' +
        (padL + plotW) +
        '" y2="' +
        py +
        '"' +
        gridDashAttr +
        "/>";
    });

    var xLabels = xTicks
      .map(function (xv) {
        var px = mapX(xv, xMin, xMax, padL, plotW);
        return (
          '<text class="payoff-label" x="' +
          px +
          '" y="' +
          (H - (xAxisTitle ? 18 : 8)) +
          '" text-anchor="middle">' +
          xv +
          "</text>"
        );
      })
      .join("");

    if (xAxisTitle) {
      xLabels +=
        '<text class="payoff-label payoff-label--axis" x="' +
        (padL + plotW / 2) +
        '" y="' +
        (H - 4) +
        '" text-anchor="middle">' +
        xAxisTitle +
        "</text>";
    }

    var yLabels = yTicks
      .map(function (yv) {
        var py = yPix(yv);
        var label = yv === 0 ? "0.0" : Number(yv).toFixed(1);
        return (
          '<text class="payoff-label" x="' +
          (padL - 6) +
          '" y="' +
          (py + 4) +
          '" text-anchor="end">' +
          label +
          "</text>"
        );
      })
      .join("");

    var bands = "";
    if (plotFill) {
      bands +=
        '<rect class="payoff-plot-fill" x="' +
        padL +
        '" y="' +
        padT +
        '" width="' +
        plotW +
        '" height="' +
        plotH +
        '" fill="' +
        plotFill +
        '" />';
    }
    if (cfg.fillBands && cfg.fillBands.length) {
      cfg.fillBands.forEach(function (band) {
        var top = yPix(band.yTo);
        var bottom = yPix(band.yFrom);
        bands +=
          '<rect class="payoff-fill-band" x="' +
          padL +
          '" y="' +
          top +
          '" width="' +
          plotW +
          '" height="' +
          Math.max(0, bottom - top) +
          '" fill="' +
          (band.color || "rgba(0,158,224,0.2)") +
          '" />';
      });
    }
    if (showNeg) {
      bands +=
        '<rect class="payoff-neg" x="' +
        padL +
        '" y="' +
        negTop +
        '" width="' +
        plotW +
        '" height="' +
        Math.max(0, negH) +
        '" />';
    }

    var polylines = series
      .map(function (s) {
        var cls = s.className || "payoff-line";
        var strokeAttr = s.color ? ' stroke="' + s.color + '"' : "";
        var widthAttr = s.width ? ' stroke-width="' + s.width + '"' : "";
        return (
          '<polyline class="' +
          cls +
          '" fill="none"' +
          strokeAttr +
          widthAttr +
          ' points="' +
          toPts(s.points) +
          '" />'
        );
      })
      .join("");

    el.innerHTML =
      '<svg class="chart-svg chart-svg--payoff" viewBox="0 0 ' +
      W +
      " " +
      H +
      '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      bands +
      grid +
      polylines +
      xLabels +
      yLabels +
      "</svg>";
  }

  var CHART_BY_TAB = {
    payoff: "payoff",
    "inventory-io": "inventoryInsOuts",
    "proj-inventory": "projInventoryLevels",
  };

  var CHART_LABEL_BY_TAB = {
    payoff: "Payoff chart",
    "inventory-io": "Inventory Ins and Outs chart",
    "proj-inventory": "Projected Inventory Levels chart",
  };

  function setChartTab(root, tabId) {
    var charts = root._ptCharts || {};
    var key = CHART_BY_TAB[tabId] || "payoff";
    var cfg = charts[key] || charts.payoff;
    var legendEl = $("[data-pt-chart-legend]", root);
    var chartEl = $('[data-chart="payoff"]', root);

    if (legendEl) {
      if (cfg && cfg.legendParts && cfg.legendParts.length) {
        legendEl.innerHTML = cfg.legendParts
          .map(function (part) {
            var tone = part.tone || "default";
            return (
              '<span class="pt-chart__legend-part pt-chart__legend-part--' +
              tone +
              '">' +
              part.text +
              "</span>"
            );
          })
          .join("");
        legendEl.removeAttribute("hidden");
      } else if (cfg && cfg.legend) {
        legendEl.textContent = cfg.legend;
        legendEl.removeAttribute("hidden");
      } else {
        legendEl.textContent = "";
        legendEl.innerHTML = "";
        legendEl.setAttribute("hidden", "");
      }
    }

    if (chartEl) {
      chartEl.setAttribute("aria-label", CHART_LABEL_BY_TAB[tabId] || "Chart");
      renderLevelChart(chartEl, cfg);
    }

    root.setAttribute("data-pt-chart-tab", tabId);
  }

  function renderGreeks(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (row, idx) {
        var zebra = idx % 2 === 1 ? " table__row--alt" : "";
        var cells = []
          .concat(row.actual || [])
          .concat(row.forecasted || [])
          .map(function (v) {
            return (
              '<td class="table__cell table__cell--num">' +
              formatCell(v) +
              "</td>"
            );
          })
          .join("");
        return (
          '<tr class="table__row' +
          zebra +
          '">' +
          '<th class="table__cell table__cell--code" scope="row">' +
          row.code +
          "</th>" +
          cells +
          "</tr>"
        );
      })
      .join("");
  }

  function renderTrades(tbody, trades) {
    if (!tbody) return;
    tbody.innerHTML = (trades || [])
      .map(function (t) {
        var annotated =
          window.CommosState && typeof window.CommosState.annotateTrade === "function"
            ? window.CommosState.annotateTrade(t)
            : t;
        return (
          '<tr class="table__row" data-filter-item' +
          ' data-underlying="' +
          (annotated.underlying || "") +
          '"' +
          ' data-contract="' +
          (annotated.contract || "spot") +
          '"' +
          ' data-trade-name="' +
          (annotated.tradeCode || "") +
          '">' +
          '<td class="table__cell">' +
          t.tradeSimDate +
          "</td>" +
          '<td class="table__cell">' +
          t.tradeCode +
          "</td>" +
          '<td class="table__cell">' +
          t.qty +
          "</td>" +
          '<td class="table__cell">' +
          t.deliverySimDate +
          "</td>" +
          '<td class="table__cell">' +
          t.settleSimDate +
          "</td>" +
          '<td class="table__cell">' +
          t.location +
          "</td>" +
          '<td class="table__cell">' +
          t.price +
          "</td>" +
          '<td class="table__cell">' +
          t.amount +
          "</td>" +
          '<td class="table__cell">' +
          t.comments +
          "</td>" +
          '<td class="table__cell table__cell--icon">' +
          '<button class="icon-btn" type="button" aria-label="Delete trade">' +
          '<img src="assets/icons/trash.svg" width="16" height="16" alt="">' +
          "</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function setPriceMode(root, mode) {
    var floating = $('[data-price-panel="floating"]', root);
    var fixed = $('[data-price-panel="fixed"]', root);
    if (!floating || !fixed) return;
    if (mode === "fixed") {
      floating.setAttribute("hidden", "");
      fixed.removeAttribute("hidden");
    } else {
      fixed.setAttribute("hidden", "");
      floating.removeAttribute("hidden");
    }
    root.setAttribute("data-price-mode", mode);
  }

  function bindInteractions(root) {
    if (root.getAttribute("data-pt-bound") === "1") return;
    root.setAttribute("data-pt-bound", "1");

    $$(".seg__btn", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".seg__btn", root).forEach(function (b) {
          b.classList.remove("seg__btn--active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("seg__btn--active");
        btn.setAttribute("aria-pressed", "true");
      });
    });

    $$('.card--pt-payoff [data-tab]', root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$('.card--pt-payoff [data-tab]', root).forEach(function (b) {
          b.classList.remove("tabs__btn--active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("tabs__btn--active");
        btn.setAttribute("aria-selected", "true");
        setChartTab(root, btn.getAttribute("data-tab") || "payoff");
      });
    });

    $$(".stepper__btn", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var wrap = btn.closest(".stepper");
        var input = wrap && $(".stepper__input", wrap);
        if (!input) return;
        var raw = String(input.value).replace(/,/g, "");
        var n = parseInt(raw, 10);
        if (isNaN(n)) n = 0;
        n += parseInt(btn.getAttribute("data-step"), 10) || 0;
        if (n < 0) n = 0;
        input.value = n.toLocaleString("en-US");
      });
    });

    $$('input[name="priceMode"]', root).forEach(function (radio) {
      radio.addEventListener("change", function () {
        if (!radio.checked) return;
        setPriceMode(root, radio.value);
      });
    });

    var checked = $('input[name="priceMode"]:checked', root);
    setPriceMode(root, checked ? checked.value : "floating");

    if (window.CommosConfirm && typeof window.CommosConfirm.bindTradeActions === "function") {
      window.CommosConfirm.bindTradeActions(root, {
        getConfirmMessage: function (btn) {
          if (btn && btn.hasAttribute("data-trade-side")) return null;
          var summary = $('[data-pt="confirmSummary"]', root);
          return summary && summary.textContent.trim()
            ? summary.textContent.trim()
            : null;
        },
        onDelete: function (row) {
          if (!row) return;
          var code = (row.cells[1] && row.cells[1].textContent || "").trim();
          var list =
            window.CommosState && typeof window.CommosState.ensurePhysical === "function"
              ? window.CommosState.ensurePhysical(FALLBACK.executedTrades)
              : [];
          var next = list.filter(function (t) {
            return t.tradeCode !== code;
          });
          if (window.CommosState && typeof window.CommosState.setPhysicalTrades === "function") {
            window.CommosState.setPhysicalTrades(next);
          }
          if (window.CommosState && typeof window.CommosState.addMessage === "function") {
            window.CommosState.addMessage({
              level: "warning",
              text: "Physical trade " + code + " was deleted.",
            });
          }
          renderTrades($("[data-pt-trades-body]", root), next);
          if (window.CommosState) {
            window.CommosState.populateTradeNameOptions(
              next.concat(
                window.CommosState.getFinancialTrades
                  ? window.CommosState.getFinancialTrades([])
                  : []
              )
            );
            window.CommosState.applyDomFilters(root);
          }
        },
        onConfirm: function (btn, sideArg) {
          var productSel = root.querySelector('#pt-product, [name="product"]');
          var product = productSel && productSel.value ? productSel.value : "PhA";
          var qtyInput = root.querySelector("#pt-qty, .pt-input__grid--3 .stepper__input");
          var qty = qtyInput ? String(qtyInput.value).replace(/,/g, "") : "1000";
          var side = sideArg || "BUY";
          if (!sideArg && btn && btn.getAttribute("data-trade-side")) {
            side = String(btn.getAttribute("data-trade-side")).toUpperCase();
          }
          var locBtn = root.querySelector(".seg__btn--active, .seg__btn[aria-pressed='true']");
          var location = locBtn ? locBtn.textContent.trim() : "EMEA";
          var price = "82.0";
          var priceEl = $('[data-pt="marketQuote"]', root);
          if (priceEl && /([\d.]+)/.test(priceEl.textContent)) {
            price = priceEl.textContent.match(/([\d.]+)/)[1];
          }
          var deliverySel = root.querySelector("#pt-delivery, [name=\"deliverySimTime\"]");
          var delivery = deliverySel && deliverySel.value ? deliverySel.value : "15May2026";
          var simLabel =
            (document.querySelector("[data-simdate-value]") || {}).textContent || "24 Apr 2023";

          function buildTrade(deliveryLabel) {
            var suffix = String(Date.now()).slice(-2);
            return {
              tradeSimDate: simLabel.replace(/\s/g, "").slice(0, 7),
              tradeCode: product + "(" + deliveryLabel + ")-" + suffix,
              qty: (parseFloat(qty) / 1000).toFixed(1),
              deliverySimDate: deliveryLabel,
              settleSimDate: deliveryLabel,
              location: location,
              price: price,
              amount: ((parseFloat(qty) * parseFloat(price)) / 1000).toFixed(1),
              comments:
                side +
                " " +
                Number(qty).toLocaleString("en-US") +
                ".0 t @ " +
                price +
                " $/t",
              underlying: product,
              contract: "spot",
            };
          }

          var list =
            window.CommosState && typeof window.CommosState.ensurePhysical === "function"
              ? window.CommosState.ensurePhysical(FALLBACK.executedTrades).slice()
              : (FALLBACK.executedTrades || []).slice();

          var trade = buildTrade(delivery);
          list.unshift(trade);

          if (window.CommosState && typeof window.CommosState.setPhysicalTrades === "function") {
            window.CommosState.setPhysicalTrades(list);
          }
          if (window.CommosState && typeof window.CommosState.addMessage === "function") {
            window.CommosState.addMessage({
              level: "success",
              text: "Physical trade " + trade.tradeCode + " confirmed successfully.",
            });
          }
          renderTrades($("[data-pt-trades-body]", root), list);
          if (window.CommosState) {
            window.CommosState.populateTradeNameOptions(
              list.concat(
                window.CommosState.getFinancialTrades
                  ? window.CommosState.getFinancialTrades([])
                  : []
              )
            );
            window.CommosState.applyDomFilters(root);
          }
        },
      });
    }
  }

  function hydrate(root, data) {
    var quote = $('[data-pt="marketQuote"]', root);
    if (quote) quote.textContent = formatCell(data.marketQuote);

    var summary = $('[data-pt="confirmSummary"]', root);
    if (summary && data.confirmSummary) summary.textContent = data.confirmSummary;

    root._ptCharts = {
      payoff: data.payoff || FALLBACK.payoff,
      inventoryInsOuts: data.inventoryInsOuts || FALLBACK.inventoryInsOuts,
      projInventoryLevels: data.projInventoryLevels || FALLBACK.projInventoryLevels,
    };

    bindInteractions(root);

    var activeTab = $(".tabs__btn--active", root);
    setChartTab(root, (activeTab && activeTab.getAttribute("data-tab")) || "payoff");

    renderGreeks($("[data-pt-greeks-body]", root), (data.greeks && data.greeks.rows) || []);
    renderTrades(
      $("[data-pt-trades-body]", root),
      window.CommosState && typeof window.CommosState.getPhysicalTrades === "function"
        ? window.CommosState.getPhysicalTrades(data.executedTrades || FALLBACK.executedTrades)
        : data.executedTrades || []
    );
    if (window.CommosState && typeof window.CommosState.populateTradeNameOptions === "function") {
      window.CommosState.populateTradeNameOptions(
        window.CommosState.getPhysicalTrades(data.executedTrades || []).concat(
          window.CommosState.getFinancialTrades([])
        )
      );
    }
  }

  function mount() {
    var root = $(".pt[data-module=\"physical-trading\"]");
    if (!root) root = $("#dashboard-content [data-module=\"physical-trading\"]");
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

  window.CommosPhysicalTrading = {
    mount: mount,
  };
})();
