/**
 * Table column sort — click .table__cell--sort to toggle asc/desc.
 * Works with SPA-injected tables via document delegation.
 */
(function () {
  "use strict";

  var MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  function cellSortValue(cell) {
    if (!cell) return { type: "empty", raw: "", num: NaN };
    var clone = cell.cloneNode(true);
    var badges = clone.querySelectorAll(".badge");
    var i;
    for (i = 0; i < badges.length; i++) badges[i].parentNode.removeChild(badges[i]);
    var text = (clone.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return { type: "empty", raw: "", num: NaN };

    /* 14May26 / 15May2026 */
    var dm = text.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
    if (dm) {
      var mon = MONTHS[dm[2].toLowerCase()];
      if (mon != null) {
        var yr = parseInt(dm[3], 10);
        if (yr < 100) yr += 2000;
        return {
          type: "date",
          raw: text.toLowerCase(),
          num: Date.UTC(yr, mon, parseInt(dm[1], 10)),
        };
      }
    }

    var cleaned = text.replace(/,/g, "").replace(/[^\d.\-eE+]/g, " ").trim();
    var firstNum = cleaned.match(/-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?/);
    if (firstNum) {
      return { type: "num", raw: text.toLowerCase(), num: parseFloat(firstNum[0]) };
    }

    return { type: "str", raw: text.toLowerCase(), num: NaN };
  }

  function compareValues(a, b, dir) {
    var mul = dir === "desc" ? -1 : 1;
    if (a.type === "empty" && b.type === "empty") return 0;
    if (a.type === "empty") return 1;
    if (b.type === "empty") return -1;

    if ((a.type === "num" || a.type === "date") && (b.type === "num" || b.type === "date")) {
      if (a.num < b.num) return -1 * mul;
      if (a.num > b.num) return 1 * mul;
      return 0;
    }

    if (a.raw < b.raw) return -1 * mul;
    if (a.raw > b.raw) return 1 * mul;
    return 0;
  }

  function isPinnedTotal(row) {
    var first = row.cells && row.cells[0];
    if (!first) return false;
    return (first.textContent || "").trim().toLowerCase() === "total";
  }

  function clearSortState(table) {
    var heads = table.querySelectorAll(".table__cell--sort");
    var i;
    for (i = 0; i < heads.length; i++) {
      heads[i].classList.remove("table__cell--sort-asc", "table__cell--sort-desc");
      heads[i].removeAttribute("aria-sort");
    }
  }

  function sortTable(th) {
    var table = th.closest("table");
    if (!table) return;
    var tbody = table.tBodies && table.tBodies[0];
    if (!tbody) return;

    var colIndex = th.cellIndex;
    var prev = th.getAttribute("aria-sort");
    var dir = prev === "ascending" ? "desc" : "asc";

    clearSortState(table);
    th.classList.add(dir === "asc" ? "table__cell--sort-asc" : "table__cell--sort-desc");
    th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");

    var rows = Array.prototype.slice.call(tbody.rows);
    var pinned = [];
    var sortable = [];
    var i;
    for (i = 0; i < rows.length; i++) {
      if (isPinnedTotal(rows[i])) pinned.push(rows[i]);
      else sortable.push(rows[i]);
    }

    sortable.sort(function (ra, rb) {
      var ca = ra.cells[colIndex];
      var cb = rb.cells[colIndex];
      return compareValues(cellSortValue(ca), cellSortValue(cb), dir);
    });

    for (i = 0; i < sortable.length; i++) tbody.appendChild(sortable[i]);
    for (i = 0; i < pinned.length; i++) tbody.appendChild(pinned[i]);
  }

  function onClick(event) {
    var th = event.target.closest("th.table__cell--sort");
    if (!th) return;
    event.preventDefault();
    sortTable(th);
  }

  function boot() {
    document.addEventListener("click", onClick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
