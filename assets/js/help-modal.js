/**
 * Informative / Help modal — per-screen contextual help + related links.
 * Content: assets/js/help-content.json (from HedgeTutor helpPageContent / helpPageLinks).
 * API: CommosHelp.open(routeId) | CommosHelp.openById(helpId)
 */
(function (global) {
  "use strict";

  var IMG_BASE = "assets/img/help/";
  var DATA_URL = "assets/js/help-content.json";

  var data = null;
  var dataReady = null;
  var backdrop = null;
  var titleEl = null;
  var bodyEl = null;
  var relatedWrap = null;
  var relatedList = null;
  var embedEl = null;
  var imageEl = null;
  var leaveBtn = null;
  var closeBtn = null;
  var lastFocus = null;
  var onCloseCb = null;
  var currentId = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function cache() {
    if (backdrop) return true;
    backdrop = $("#modal-help-backdrop");
    if (!backdrop) return false;
    titleEl = $("[data-help-title]", backdrop);
    bodyEl = $("[data-help-body]", backdrop);
    relatedWrap = $("[data-help-related-wrap]", backdrop);
    relatedList = $("[data-help-related]", backdrop);
    embedEl = $("[data-help-embed]", backdrop);
    imageEl = $("[data-help-image]", backdrop);
    leaveBtn = $("[data-help-leave]", backdrop);
    closeBtn = $("[data-help-close]", backdrop);
    return true;
  }

  function loadData() {
    if (dataReady) return dataReady;
    dataReady = fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        data = json;
        return data;
      })
      .catch(function (err) {
        console.error("[help-modal] failed to load help-content.json", err);
        data = { routes: {}, pages: {} };
        return data;
      });
    return dataReady;
  }

  function pageById(id) {
    if (!data || !data.pages) return null;
    var key = String(id);
    return data.pages[key] || null;
  }

  function setOpen(open) {
    if (!cache()) return;
    if (open) {
      backdrop.hidden = false;
      backdrop.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-modal-open");
      if (leaveBtn) leaveBtn.focus();
      else if (closeBtn) closeBtn.focus();
    } else {
      backdrop.hidden = true;
      backdrop.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-modal-open");
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (e) {
          /* ignore */
        }
      }
      lastFocus = null;
    }
  }

  function close() {
    var cb = onCloseCb;
    onCloseCb = null;
    currentId = null;
    setOpen(false);
    if (typeof cb === "function") cb();
  }

  function renderBody(text) {
    if (!bodyEl) return;
    bodyEl.innerHTML = "";
    var parts = String(text || "")
      .split(/\n\n+/)
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    if (!parts.length) {
      bodyEl.hidden = true;
      return;
    }
    bodyEl.hidden = false;
    parts.forEach(function (part) {
      var p = document.createElement("p");
      p.className = "modal-info__body-p";
      p.textContent = part;
      bodyEl.appendChild(p);
    });
  }

  function renderRelated(related) {
    if (!relatedWrap || !relatedList) return;
    relatedList.innerHTML = "";
    var items = Array.isArray(related) ? related : [];
    var usable = items.filter(function (item) {
      return item && item.id && pageById(item.id);
    });
    if (!usable.length) {
      relatedWrap.hidden = true;
      return;
    }
    relatedWrap.hidden = false;
    usable.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "modal-info__related-item";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "modal-info__related-link";
      btn.textContent = item.label || "Related";
      btn.setAttribute("data-help-related-id", String(item.id));
      li.appendChild(btn);
      relatedList.appendChild(li);
    });
  }

  function renderImages(images, title) {
    if (!embedEl || !imageEl) return;
    var list = Array.isArray(images) ? images.filter(Boolean) : [];
    /* Primary image slot; additional images appended after */
    var extras = embedEl.querySelectorAll("[data-help-image-extra]");
    extras.forEach(function (el) {
      el.remove();
    });

    if (!list.length) {
      embedEl.hidden = true;
      imageEl.removeAttribute("src");
      imageEl.alt = "";
      imageEl.hidden = true;
      return;
    }

    embedEl.hidden = false;
    imageEl.hidden = false;
    imageEl.src = IMG_BASE + list[0];
    imageEl.alt = (title || "Help") + " preview";
    imageEl.onerror = function () {
      imageEl.hidden = true;
      if (!embedEl.querySelector("img:not([hidden])")) {
        embedEl.hidden = true;
      }
    };

    for (var i = 1; i < list.length; i++) {
      var extra = document.createElement("img");
      extra.className = "modal-info__image";
      extra.setAttribute("data-help-image-extra", "");
      extra.alt = (title || "Help") + " preview " + (i + 1);
      extra.width = 750;
      extra.decoding = "async";
      extra.src = IMG_BASE + list[i];
      extra.onerror = function () {
        this.remove();
        if (!embedEl.querySelector("img:not([hidden])")) {
          embedEl.hidden = true;
        }
      };
      embedEl.appendChild(extra);
    }
  }

  function fill(page) {
    if (!page) return;
    currentId = page.id;
    if (titleEl) titleEl.textContent = page.title || "Help";
    renderBody(page.body || "");
    renderRelated(page.related || []);
    renderImages(page.images || [], page.title || "Help");
    if (backdrop) {
      var scroll = $(".modal-info__scroll", backdrop);
      if (scroll) scroll.scrollTop = 0;
    }
  }

  function openById(helpId, options) {
    options = options || {};
    return loadData().then(function () {
      if (!cache()) {
        console.error("[help-modal] #modal-help-backdrop not found");
        return;
      }
      var page = pageById(helpId);
      if (!page) {
        console.warn("[help-modal] unknown help id", helpId);
        return;
      }
      if (options.replaceFocus !== false) {
        lastFocus = document.activeElement;
      }
      if (typeof options.onClose === "function") {
        onCloseCb = options.onClose;
      }
      fill(page);
      setOpen(true);
    });
  }

  function open(routeId, options) {
    options = options || {};
    return loadData().then(function () {
      var routes = (data && data.routes) || {};
      var id = routes[routeId] || routes["market-data"] || 310;
      return openById(id, options);
    });
  }

  function onRelatedClick(event) {
    var btn = event.target.closest("[data-help-related-id]");
    if (!btn || !backdrop || backdrop.hidden) return;
    event.preventDefault();
    var id = Number(btn.getAttribute("data-help-related-id"));
    if (!id) return;
    openById(id, { replaceFocus: false, onClose: onCloseCb });
  }

  function onKeyDown(event) {
    if (!backdrop || backdrop.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function onBackdropClick(event) {
    if (event.target === backdrop) close();
  }

  function boot() {
    if (!cache()) return;
    loadData();
    /* Close / Leave dismisses help (live site uses Close). */
    if (leaveBtn) {
      leaveBtn.addEventListener("click", function () {
        close();
      });
      leaveBtn.textContent = "Close";
      leaveBtn.setAttribute("aria-label", "Close help");
    }
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (relatedList) relatedList.addEventListener("click", onRelatedClick);
    backdrop.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeyDown);
  }

  global.CommosHelp = {
    open: open,
    openById: openById,
    close: close,
    ready: loadData,
    get currentId() {
      return currentId;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
