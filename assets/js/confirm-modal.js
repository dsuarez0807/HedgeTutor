/**
 * Confirmation modal — Figma "Confirmation modal" (Assets / 1076:10253)
 * API: CommosConfirm.open({ title, message, onAccept, onCancel })
 */
(function (global) {
  "use strict";

  var backdrop = null;
  var titleEl = null;
  var messageEl = null;
  var acceptBtn = null;
  var cancelBtn = null;
  var closeBtn = null;
  var lastFocus = null;
  var onAcceptCb = null;
  var onCancelCb = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function cache() {
    if (backdrop) return true;
    backdrop = $("#modal-confirm-backdrop");
    if (!backdrop) return false;
    titleEl = $("[data-confirm-title]", backdrop);
    messageEl = $("[data-confirm-message]", backdrop);
    acceptBtn = $("[data-confirm-accept]", backdrop);
    cancelBtn = $("[data-confirm-cancel]", backdrop);
    closeBtn = $("[data-confirm-close]", backdrop);
    return true;
  }

  function setOpen(open) {
    if (!cache()) return;
    if (open) {
      backdrop.hidden = false;
      backdrop.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-modal-open");
      if (acceptBtn) acceptBtn.focus();
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

  function close(result) {
    var accept = onAcceptCb;
    var cancel = onCancelCb;
    onAcceptCb = null;
    onCancelCb = null;
    setOpen(false);
    if (result === "accept" && typeof accept === "function") accept();
    if (result === "cancel" && typeof cancel === "function") cancel();
  }

  function onKeyDown(event) {
    if (!backdrop || backdrop.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close("cancel");
    }
  }

  function onBackdropClick(event) {
    if (event.target === backdrop) close("cancel");
  }

  function open(options) {
    options = options || {};
    if (!cache()) {
      console.error("[confirm-modal] #modal-confirm-backdrop not found");
      return;
    }

    lastFocus = document.activeElement;
    onAcceptCb = options.onAccept || null;
    onCancelCb = options.onCancel || null;

    if (titleEl) titleEl.textContent = options.title || "Confirmation";
    if (messageEl) {
      messageEl.textContent =
        options.message || "Are you sure that you want reset the simulation data?";
    }

    setOpen(true);
  }

  function boot() {
    if (!cache()) return;

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        close("accept");
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        close("cancel");
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        close("cancel");
      });
    }
    backdrop.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeyDown);
  }

  global.CommosConfirm = {
    open: open,
    close: function () {
      close("cancel");
    },
    /**
     * Delegate Delete (trash) + Confirm trade buttons inside a module root.
     * handlers: { onDelete(rowEl, btn), onConfirm(btn) }
     */
    bindTradeActions: function (root, handlers) {
      if (!root || root.getAttribute("data-confirm-bound") === "1") return;
      root.setAttribute("data-confirm-bound", "1");
      handlers = handlers || {};

      root.addEventListener("click", function (event) {
        var delBtn = event.target.closest('button[aria-label="Delete trade"]');
        if (delBtn && root.contains(delBtn)) {
          event.preventDefault();
          open({
            title: "Confirmation",
            message: "Are you sure that you want to delete the selected trade?",
            onAccept: function () {
              if (typeof handlers.onDelete === "function") {
                handlers.onDelete(delBtn.closest("tr"), delBtn);
              } else {
                var row = delBtn.closest("tr");
                if (row) row.remove();
              }
            },
          });
          return;
        }

        var sideBtn = event.target.closest("[data-trade-side]");
        if (sideBtn && root.contains(sideBtn)) {
          event.preventDefault();
          var sideRaw = (sideBtn.getAttribute("data-trade-side") || "buy").toLowerCase();
          var sideLabel = sideRaw === "sell" ? "Sell" : "Buy";
          var sideMessage = "Are you sure that want reset the " + sideLabel + "?";
          if (typeof handlers.getConfirmMessage === "function") {
            var sideCustom = handlers.getConfirmMessage(sideBtn, sideLabel);
            if (sideCustom) sideMessage = sideCustom;
          }
          open({
            title: "Confirmation",
            message: sideMessage,
            onAccept: function () {
              if (typeof handlers.onConfirm === "function") {
                handlers.onConfirm(sideBtn, sideLabel.toUpperCase());
              }
            },
          });
          return;
        }

        var confBtn = event.target.closest(".button--confirm");
        if (confBtn && root.contains(confBtn)) {
          event.preventDefault();
          var message = "Are you sure that you want to confirm this trade?";
          if (typeof handlers.getConfirmMessage === "function") {
            var custom = handlers.getConfirmMessage(confBtn);
            if (custom) message = custom;
          }
          open({
            title: "Confirmation",
            message: message,
            onAccept: function () {
              if (typeof handlers.onConfirm === "function") {
                handlers.onConfirm(confBtn);
              }
            },
          });
        }
      });
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
