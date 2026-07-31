/**
 * Financial Trading module — frame 1032:3306 / Combinations 1063:3525
 * Instrument tabs: Futures / Options / Swaps / Combinations
 */
(function () {
  "use strict";

  var MOCK_URL = "data/mocks/financial-trading.json";

  var FALLBACK = {
    instruments: {
      futures: {
        lotsLabel: "100 (t)",
        tradeCode: "FAB",
        confirmSummary: "CF Amount = 1 lots * 1,000.0 t/lot * 72.8 $",
        marketQuote: {
          rows: [
            [100, "72.8", "73.0", "62.0"],
            [200, "-0.80", "72.9", 100],
          ],
          askHighlightCells: [[0, 2]],
          bidHighlightCells: [[0, 1]],
        },
      },
      options: {
        lotsLabel: "100 (t)",
        tradeCode: "CAB",
        impliedVol: "40.0%",
        confirmSummary:
          "CF Amount: 1 lots * 100.0 t/lot * -4.83 $/t = $ -483.0",
        marketQuote: {
          headers: ["Bid", "Ask"],
          rows: [
            ["73.6", "73.8"],
            ["-0.80", "77.7"],
          ],
          askHighlightCells: [[0, 1]],
        },
      },
      swaps: {
        lotsLabel: "100 (t)",
        tradeCode: "CAB",
        confirmSummary:
          "CF Amount: 1 lots * 100.0 t/lot * -4.83 $/t = $ -483.0",
        marketQuote: {
          headers: ["Bid", "Ask"],
          rows: [
            ["73.6", "73.8"],
            ["-0.80", "77.7"],
          ],
          askHighlightCells: [[0, 1]],
        },
      },
      combination: {
        lotsLabel: "100 (t)",
        layout: "combination",
        combQuote: "- Call@1.35$/t + Put@1.40$/t = 0.050$/t",
        payoff: {
          xMin: 72,
          xMax: 92,
          yMin: -12,
          yMax: 12,
          yTicks: [-12, -9, -6, -3, 0, 3, 6, 9, 12],
          series: [
            {
              color: "#009EE0",
              width: 2.5,
              points: [
                [72, -12],
                [78, -4],
                [84, 8],
                [86, 10.5],
                [92, 10.5],
              ],
            },
            {
              color: "#E11D48",
              width: 2.5,
              points: [
                [72, -10],
                [82, 0],
                [92, 10],
              ],
            },
            {
              color: "#1B297D",
              width: 2.5,
              points: [
                [72, -5],
                [80, -5],
                [86, 1],
                [90, 3.5],
                [92, 3.5],
              ],
            },
          ],
        },
      },
    },
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
    sensitivity: {
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
      value: {
        xMin: 72,
        xMax: 92,
        yMin: -8,
        yMax: 16,
        yTicks: [-8, 0, 8, 16],
        line: [
          [72, -6],
          [82, 2],
          [92, 14],
        ],
      },
      delta: {
        xMin: 72,
        xMax: 92,
        yMin: -1,
        yMax: 1,
        yTicks: [-1, -0.5, 0, 0.5, 1],
        line: [
          [72, -0.9],
          [82, 0],
          [92, 0.95],
        ],
      },
      vol: {
        xMin: 72,
        xMax: 92,
        yMin: 20,
        yMax: 50,
        yTicks: [20, 30, 40, 50],
        line: [
          [72, 42],
          [82, 28],
          [92, 38],
        ],
      },
    },
    greeks: {
      rows: [
        [10.0, 73.6, 73.8, 82.0, 82.0],
        [10.0, 73.6, 73.8, 82.0, 82.0],
        [10.0, 73.6, 73.8, 82.0, 82.0],
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
        comments: "BUY 1,000.0 t @82.0 $/t",
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
    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return rounded.toFixed(1);
    return String(rounded);
  }

  function mapX(x, xMin, xMax, left, width) {
    return left + ((x - xMin) / (xMax - xMin)) * width;
  }

  function mapY(y, yMin, yMax, top, height) {
    return top + ((yMax - y) / (yMax - yMin)) * height;
  }

  function renderPayoff(el, payoff) {
    if (!el || !payoff) return;

    var W = 520;
    var H = 220;
    var padL = 36;
    var padR = 12;
    var padT = 12;
    var padB = 28;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var xMin = payoff.xMin;
    var xMax = payoff.xMax;
    var yMin = payoff.yMin;
    var yMax = payoff.yMax;

    var yZero = mapY(0, yMin, yMax, padT, plotH);
    var negH = mapY(yMin, yMin, yMax, padT, plotH) - yZero;

    var series = payoff.series;
    if (!series || !series.length) {
      series = [{ color: "#009EE0", width: 2.5, points: payoff.line || [] }];
    }

    function toPts(points) {
      return (points || [])
        .map(function (p) {
          return (
            mapX(p[0], xMin, xMax, padL, plotW).toFixed(1) +
            "," +
            mapY(p[1], yMin, yMax, padT, plotH).toFixed(1)
          );
        })
        .join(" ");
    }

    var xTicks = [];
    for (var x = xMin; x <= xMax; x += 2) xTicks.push(x);
    var yTicks = payoff.yTicks || [-12, -6, 0, 6, 12];

    var grid = "";
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
        '"/>';
    });
    yTicks.forEach(function (yv) {
      var py = mapY(yv, yMin, yMax, padT, plotH);
      grid +=
        '<line class="payoff-grid" x1="' +
        padL +
        '" y1="' +
        py +
        '" x2="' +
        (padL + plotW) +
        '" y2="' +
        py +
        '"/>';
    });

    var xLabels = xTicks
      .map(function (xv) {
        var px = mapX(xv, xMin, xMax, padL, plotW);
        return (
          '<text class="payoff-label" x="' +
          px +
          '" y="' +
          (H - 8) +
          '" text-anchor="middle">' +
          xv +
          "</text>"
        );
      })
      .join("");

    var yLabels = yTicks
      .map(function (yv) {
        var py = mapY(yv, yMin, yMax, padT, plotH);
        var label = yv === 0 ? "0.0" : yv.toFixed(1);
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

    var polylines = series
      .map(function (s) {
        var color = s.color || "#009EE0";
        return (
          '<polyline class="payoff-line" fill="none" stroke="' +
          color +
          '" style="stroke:' +
          color +
          '" stroke-width="' +
          (s.width || 2.5) +
          '" points="' +
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
      '<rect class="payoff-neg" x="' +
      padL +
      '" y="' +
      yZero +
      '" width="' +
      plotW +
      '" height="' +
      Math.max(0, negH) +
      '" />' +
      grid +
      polylines +
      xLabels +
      yLabels +
      "</svg>";
  }

  function isHighlight(cells, rowIdx, colIdx) {
    return (cells || []).some(function (c) {
      return c[0] === rowIdx && c[1] === colIdx;
    });
  }

  function renderQuote(root, quote) {
    var thead = $("[data-ft-quote-head]", root);
    var tbody = $("[data-ft-quote-body]", root);
    if (!tbody) return;

    var headers = (quote && quote.headers) || ["Lots", "Bid", "Ask", "Lots"];
    var askCells = (quote && quote.askHighlightCells) || [];
    var bidCells = (quote && quote.bidHighlightCells) || [];

    if (thead) {
      thead.innerHTML =
        '<tr class="table__row">' +
        headers
          .map(function (h) {
            return (
              '<th class="table__cell table__cell--head table__cell--head-shaded table__cell--num" scope="col">' +
              h +
              "</th>"
            );
          })
          .join("") +
        "</tr>";
    }

    tbody.innerHTML = ((quote && quote.rows) || [])
      .map(function (row, idx) {
        var zebra = idx % 2 === 1 ? " table__row--alt" : "";
        var cells = row
          .map(function (v, i) {
            var extra = "";
            if (isHighlight(askCells, idx, i)) extra = " table__cell--ask";
            else if (isHighlight(bidCells, idx, i)) extra = " table__cell--bid";
            return (
              '<td class="table__cell table__cell--num' +
              extra +
              '">' +
              formatCell(v) +
              "</td>"
            );
          })
          .join("");
        return '<tr class="table__row' + zebra + '">' + cells + "</tr>";
      })
      .join("");
  }

  function renderGreeks(tbody, rows) {
    if (!tbody) return;
    tbody.innerHTML = (rows || [])
      .map(function (row, idx) {
        var zebra = idx % 2 === 1 ? " table__row--alt" : "";
        var cells = row
          .map(function (v) {
            return '<td class="table__cell table__cell--num">' + formatCell(v) + "</td>";
          })
          .join("");
        return '<tr class="table__row' + zebra + '">' + cells + "</tr>";
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
          (annotated.contract || "fwd") +
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
          '<td class="table__cell table__cell--num">' +
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
          '<td class="table__cell table__cell--num">' +
          t.price +
          "</td>" +
          '<td class="table__cell table__cell--num">' +
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

  function applyInstrumentView(root, tabId, cfg) {
    if (!cfg) return;

    var isComb = cfg.layout === "combination" || tabId === "combination";

    $$("[data-ft-panel]", root).forEach(function (panel) {
      var id = panel.getAttribute("data-ft-panel");
      if (id === tabId) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });

    var standardMeta = $("[data-ft-standard-meta]", root);
    var standardQuote = $("[data-ft-standard-quote]", root);
    var standardSummary = $("[data-ft-standard-summary]", root);
    var combQuote = $("[data-ft-comb-quote]", root);

    if (isComb) {
      if (standardMeta) standardMeta.setAttribute("hidden", "");
      if (standardQuote) standardQuote.setAttribute("hidden", "");
      if (standardSummary) standardSummary.setAttribute("hidden", "");
      if (combQuote) {
        combQuote.removeAttribute("hidden");
        var formula = $('[data-ft="combQuote"]', root);
        if (formula && cfg.combQuote) formula.textContent = cfg.combQuote;
      }
    } else {
      if (standardMeta) standardMeta.removeAttribute("hidden");
      if (standardQuote) standardQuote.removeAttribute("hidden");
      if (standardSummary) standardSummary.removeAttribute("hidden");
      if (combQuote) combQuote.setAttribute("hidden", "");

      var ivRow = $("[data-ft-iv-row]", root);
      if (ivRow) {
        if (cfg.impliedVol) {
          ivRow.removeAttribute("hidden");
          var iv = $('[data-ft="impliedVol"]', root);
          if (iv) iv.textContent = cfg.impliedVol;
        } else {
          ivRow.setAttribute("hidden", "");
        }
      }

      var code = $('[data-ft="tradeCode"]', root);
      if (code && cfg.tradeCode) code.textContent = cfg.tradeCode;

      var summary = $('[data-ft="confirmSummary"]', root);
      if (summary) {
        if (cfg.confirmSummaryHtml) summary.innerHTML = cfg.confirmSummaryHtml;
        else if (cfg.confirmSummary) summary.textContent = cfg.confirmSummary;
      }

      renderQuote(root, cfg.marketQuote);
    }

    $$('[data-ft="lotsLabel"]', root).forEach(function (el) {
      if (cfg.lotsLabel) el.textContent = cfg.lotsLabel;
    });

    var chartEl = $('[data-chart="ft-payoff"]', root);
    if (cfg.layout === "combination" && cfg.payoff) {
      renderPayoff(chartEl, cfg.payoff);
    } else {
      var activeSens = $("[data-ft-sens].tabs__btn--active", root);
      setSensitivityTab(
        root,
        (activeSens && activeSens.getAttribute("data-ft-sens")) || "payoff"
      );
    }

    root.setAttribute("data-ft-instrument", tabId);
  }

  function setInstrumentTab(root, tabId) {
    var instruments = root._ftInstruments || {};
    var cfg = instruments[tabId] || instruments.futures;
    var group = $('[role="tablist"][aria-label="Instrument type"]', root) || $(".card--ft-input .tabs", root);

    if (group) {
      $$("[data-ft-tab]", group).forEach(function (b) {
        var on = b.getAttribute("data-ft-tab") === tabId;
        b.classList.toggle("tabs__btn--active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    applyInstrumentView(root, tabId, cfg);
  }

  function bindSensTabs(root) {
    $$("[data-ft-sens]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.parentNode;
        $$("[data-ft-sens]", group).forEach(function (b) {
          b.classList.remove("tabs__btn--active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("tabs__btn--active");
        btn.setAttribute("aria-selected", "true");
        setSensitivityTab(root, btn.getAttribute("data-ft-sens") || "payoff");
      });
    });
  }

  function setSensitivityTab(root, sensId) {
    var charts =
      (root._ftData && root._ftData.sensitivity) ||
      FALLBACK.sensitivity ||
      {};
    var chartEl = $('[data-chart="ft-payoff"]', root);
    var cfg =
      charts[sensId] ||
      charts.payoff ||
      (root._ftData && root._ftData.payoff) ||
      FALLBACK.payoff;
    renderPayoff(chartEl, cfg);
    if (chartEl) {
      chartEl.setAttribute(
        "aria-label",
        sensId === "delta"
          ? "Delta sensitivity chart"
          : sensId === "vol"
            ? "Volatility smile chart"
            : sensId === "value"
              ? "Value sensitivity chart"
              : "Payoff chart"
      );
    }
  }

  function bindInstrumentTabs(root) {
    $$("[data-ft-tab]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        setInstrumentTab(root, btn.getAttribute("data-ft-tab") || "futures");
      });
    });
  }

  function bindSteppers(root) {
    $$(".stepper__btn", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var wrap = btn.closest(".stepper");
        var input = wrap && $(".stepper__input", wrap);
        if (!input) return;
        var n = parseInt(String(input.value).replace(/,/g, ""), 10);
        if (isNaN(n)) n = 0;
        n += parseInt(btn.getAttribute("data-step"), 10) || 0;
        if (n < 0) n = 0;
        input.value = n.toLocaleString("en-US");
      });
    });
  }

  function normalizeData(raw) {
    var data = raw || FALLBACK;
    if (data.instruments) return data;

    // Legacy flat mock → wrap as futures
    return {
      instruments: {
        futures: {
          lotsLabel: data.lotsLabel || FALLBACK.instruments.futures.lotsLabel,
          tradeCode: data.tradeCode || FALLBACK.instruments.futures.tradeCode,
          confirmSummary:
            data.confirmSummary || FALLBACK.instruments.futures.confirmSummary,
          marketQuote: data.marketQuote || FALLBACK.instruments.futures.marketQuote,
        },
        options: FALLBACK.instruments.options,
        swaps: FALLBACK.instruments.swaps,
        combination: FALLBACK.instruments.combination,
      },
      payoff: data.payoff || FALLBACK.payoff,
      sensitivity: data.sensitivity || FALLBACK.sensitivity,
      greeks: data.greeks || FALLBACK.greeks,
      executedTrades: data.executedTrades || FALLBACK.executedTrades,
    };
  }

  function hydrate(root, raw) {
    var data = normalizeData(raw);
    root._ftInstruments = data.instruments;
    root._ftData = data;

    renderGreeks($("[data-ft-greeks-body]", root), (data.greeks && data.greeks.rows) || []);
    renderTrades(
      $("[data-ft-trades-body]", root),
      window.CommosState && typeof window.CommosState.getFinancialTrades === "function"
        ? window.CommosState.getFinancialTrades(data.executedTrades || FALLBACK.executedTrades)
        : data.executedTrades || []
    );
    if (window.CommosState && typeof window.CommosState.populateTradeNameOptions === "function") {
      window.CommosState.populateTradeNameOptions(
        window.CommosState.getPhysicalTrades([]).concat(
          window.CommosState.getFinancialTrades(data.executedTrades || [])
        )
      );
    }

    bindInstrumentTabs(root);
    bindSensTabs(root);
    bindSteppers(root);

    if (window.CommosConfirm && typeof window.CommosConfirm.bindTradeActions === "function") {
      window.CommosConfirm.bindTradeActions(root, {
        getConfirmMessage: function () {
          var summary = $('[data-ft="confirmSummary"]', root);
          return summary && summary.textContent.trim()
            ? summary.textContent.trim()
            : null;
        },
        onDelete: function (row) {
          if (!row) return;
          var code = ((row.cells[1] && row.cells[1].textContent) || "").trim();
          var list =
            window.CommosState && typeof window.CommosState.ensureFinancial === "function"
              ? window.CommosState.ensureFinancial(FALLBACK.executedTrades)
              : [];
          var next = list.filter(function (t) {
            return t.tradeCode !== code;
          });
          if (window.CommosState && typeof window.CommosState.setFinancialTrades === "function") {
            window.CommosState.setFinancialTrades(next);
          }
          if (window.CommosState && typeof window.CommosState.addMessage === "function") {
            window.CommosState.addMessage({
              level: "warning",
              text: "Financial trade " + code + " was deleted.",
            });
          }
          renderTrades($("[data-ft-trades-body]", root), next);
          if (window.CommosState) {
            window.CommosState.populateTradeNameOptions(
              (window.CommosState.getPhysicalTrades
                ? window.CommosState.getPhysicalTrades([])
                : []
              ).concat(next)
            );
            window.CommosState.applyDomFilters(root);
          }
        },
        onConfirm: function () {
          var activeTab = $("[data-ft-tab].tabs__btn--active", root);
          var instrument =
            (activeTab && activeTab.textContent.trim()) || "Futures";
          var qtyInput = $(".stepper__input", root);
          var qty = qtyInput ? String(qtyInput.value).replace(/,/g, "") : "1000";
          var sideBuy = root.querySelector('input[name="ft-side"][value="buy"], input[name="side"][value="buy"]');
          var sideSell = root.querySelector('input[name="ft-side"][value="sell"], input[name="side"][value="sell"]');
          var side = sideSell && sideSell.checked ? "SELL" : "BUY";
          if (sideBuy && sideBuy.checked) side = "BUY";
          var price = "82.0";
          var askCell = root.querySelector(".table__cell--ask, .table__cell--ask-hi");
          var bidCell = root.querySelector(".table__cell--bid, .table__cell--bid-hi");
          var quoteCell = side === "BUY" ? askCell || bidCell : bidCell || askCell;
          if (quoteCell && /([\d.]+)/.test(quoteCell.textContent)) {
            price = quoteCell.textContent.match(/([\d.]+)/)[1];
          }
          var simLabel =
            (document.querySelector("[data-simdate-value]") || {}).textContent ||
            "24 Apr 2023";
          var trade = {
            tradeSimDate: simLabel.replace(/\s/g, "").slice(0, 7),
            tradeCode:
              "PhA(" +
              simLabel.replace(/\s/g, "") +
              ")-F" +
              Date.now().toString().slice(-2),
            qty: (parseFloat(qty) / 1000).toFixed(1),
            deliverySimDate: simLabel.replace(/\s/g, "").slice(0, 7),
            settleSimDate: simLabel.replace(/\s/g, "").slice(0, 7),
            location: instrument,
            price: price,
            amount: ((parseFloat(qty) * parseFloat(price)) / 1000).toFixed(1),
            comments:
              side +
              " " +
              instrument +
              " " +
              Number(qty).toLocaleString("en-US") +
              " t @ " +
              price +
              " $/t",
            underlying: "PhA",
            contract: "fwd",
          };
          var list =
            window.CommosState && typeof window.CommosState.ensureFinancial === "function"
              ? window.CommosState.ensureFinancial(FALLBACK.executedTrades).slice()
              : (FALLBACK.executedTrades || []).slice();
          list.unshift(trade);
          if (window.CommosState && typeof window.CommosState.setFinancialTrades === "function") {
            window.CommosState.setFinancialTrades(list);
          }
          if (window.CommosState && typeof window.CommosState.addMessage === "function") {
            window.CommosState.addMessage({
              level: "success",
              text: "Financial trade " + trade.tradeCode + " confirmed successfully.",
            });
          }
          renderTrades($("[data-ft-trades-body]", root), list);
          if (window.CommosState) {
            window.CommosState.populateTradeNameOptions(
              (window.CommosState.getPhysicalTrades
                ? window.CommosState.getPhysicalTrades([])
                : []
              ).concat(list)
            );
            window.CommosState.applyDomFilters(root);
          }
        },
      });
    }

    var active = $("[data-ft-tab].tabs__btn--active", root);
    setInstrumentTab(root, (active && active.getAttribute("data-ft-tab")) || "futures");
  }

  function mount() {
    var root = $('.ft[data-module="financial-trading"]');
    if (!root) root = $('#dashboard-content [data-module="financial-trading"]');
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

  window.CommosFinancialTrading = { mount: mount };
})();
