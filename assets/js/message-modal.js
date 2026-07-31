/**
 * HedgeTutor Message Centre — toolbar Msg
 * API: CommosMessages.open() | close() | refreshBadge()
 */
(function (global) {
  "use strict";

  var backdrop = null;
  var listEl = null;
  var emptyEl = null;
  var badgeEl = null;
  var closeBtn = null;
  var footerClose = null;
  var lastFocus = null;
  var onCloseCb = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function cache() {
    if (backdrop) return true;
    backdrop = $("#modal-msg-backdrop");
    if (!backdrop) return false;
    listEl = $("[data-msg-list]", backdrop);
    emptyEl = $("[data-msg-empty]", backdrop);
    closeBtn = $("[data-msg-close]", backdrop);
    footerClose = $("[data-msg-footer-close]", backdrop);
    badgeEl = document.querySelector("[data-msg-badge]");
    return true;
  }

  function setOpen(open) {
    if (!cache()) return;
    if (open) {
      backdrop.hidden = false;
      backdrop.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-modal-open");
      if (footerClose) footerClose.focus();
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

  function refreshBadge() {
    if (!cache()) return;
    var n =
      window.CommosState && typeof window.CommosState.unreadCount === "function"
        ? window.CommosState.unreadCount()
        : 0;
    if (!badgeEl) return;
    if (n > 0) {
      badgeEl.hidden = false;
      badgeEl.textContent = String(n > 99 ? "99+" : n);
    } else {
      badgeEl.hidden = true;
      badgeEl.textContent = "";
    }
  }

  function render() {
    if (!cache()) return;
    var messages =
      window.CommosState && typeof window.CommosState.getMessages === "function"
        ? window.CommosState.getMessages()
        : [];

    if (!messages.length) {
      if (listEl) listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      refreshBadge();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    var byDay = {};
    messages.forEach(function (m) {
      var day = m.day || "Today";
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(m);
    });

    var html = "";
    Object.keys(byDay).forEach(function (day) {
      html += '<section class="modal-msg__day">';
      html += '<h3 class="modal-msg__day-title">' + day + "</h3>";
      html += '<ul class="modal-msg__items">';
      byDay[day].forEach(function (m) {
        html +=
          '<li class="modal-msg__item modal-msg__item--' +
          (m.level || "info") +
          (m.unread ? " is-unread" : "") +
          '">' +
          '<p class="modal-msg__text">' +
          (m.text || "") +
          "</p>" +
          "</li>";
      });
      html += "</ul></section>";
    });
    if (listEl) listEl.innerHTML = html;
    refreshBadge();
  }

  function close() {
    var cb = onCloseCb;
    onCloseCb = null;
    setOpen(false);
    if (typeof cb === "function") cb();
  }

  function open(options) {
    options = options || {};
    if (!cache()) {
      console.error("[message-modal] #modal-msg-backdrop not found");
      return;
    }
    lastFocus = document.activeElement;
    onCloseCb = typeof options.onClose === "function" ? options.onClose : null;
    render();
    setOpen(true);
    if (window.CommosState && typeof window.CommosState.markAllRead === "function") {
      window.CommosState.markAllRead();
      refreshBadge();
      render();
    }
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
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (footerClose) footerClose.addEventListener("click", close);
    backdrop.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeyDown);
    if (window.CommosState && typeof window.CommosState.on === "function") {
      window.CommosState.on("messages", function () {
        refreshBadge();
        if (backdrop && !backdrop.hidden) render();
      });
    }
    refreshBadge();
  }

  global.CommosMessages = {
    open: open,
    close: close,
    refreshBadge: refreshBadge,
    render: render,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
