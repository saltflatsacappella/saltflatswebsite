/* ==========================================================================
   The Salt Flats — site script
   --------------------------------------------------------------------------
   1. Mobile navigation
   2. Click-to-play YouTube tiles
   3. Contact form: booking fields toggle + validation
   No dependencies. Everything degrades gracefully without JavaScript.
   ========================================================================== */

(function () {
  "use strict";

  /* 1. Mobile navigation ------------------------------------------------ */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("mobile-menu");

  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("data-open", String(open));
      document.body.setAttribute("data-menu-open", String(open));
    };

    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });

    window.matchMedia("(min-width: 768px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* 2. Click-to-play YouTube tiles -------------------------------------- */
  /* Markup: <div class="video__frame" data-video-id="..."><button class="video__play">...</button></div>
     The thumbnail comes from YouTube via srcset; if the browser picks the high-res one and it's missing,
     we drop the srcset and fall back to the standard one. */
  var frames = document.querySelectorAll(".video__frame[data-video-id]");

  Array.prototype.forEach.call(frames, function (frame) {
    var id = frame.getAttribute("data-video-id");
    var button = frame.querySelector(".video__play");
    var img = frame.querySelector("img");

    if (img) {
      var fallback = function () {
        img.removeAttribute("srcset");
        img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
      };
      img.addEventListener("load", function () {
        // YouTube returns a 120x90 placeholder when maxresdefault doesn't exist.
        if (img.naturalWidth <= 120 && img.currentSrc.indexOf("maxresdefault") !== -1) fallback();
      });
      img.addEventListener("error", function () {
        if (img.currentSrc.indexOf("maxresdefault") !== -1) fallback();
      });
    }

    if (button) {
      button.addEventListener("click", function () {
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
        iframe.title = button.getAttribute("aria-label") || "Video";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        frame.replaceChild(iframe, button);
      });
    }
  });

  /* 3. Contact form ----------------------------------------------------- */
  var form = document.getElementById("contact-form");

  if (form) {
    var bookingToggle = form.querySelector("#booking");
    var bookingFields = form.querySelector("#booking-fields");
    var typeSelect = form.querySelector("#event-type");
    var otherField = form.querySelector("#event-type-other-field");
    var otherInput = form.querySelector("#event-type-other");

    var setBooking = function (on) {
      bookingFields.hidden = !on;
      // Required only when visible, so a plain message can be sent without them.
      Array.prototype.forEach.call(bookingFields.querySelectorAll("[data-required]"), function (el) {
        el.required = on;
      });
      if (!on && otherField) otherField.hidden = true;
      form.querySelector("#submit").textContent = on ? "Send booking request" : "Send";
      form.querySelector("#message").placeholder = on
        ? "The occasion, the room, songs you'd like to hear, anything that helps."
        : "";
    };

    var setOther = function () {
      var isOther = typeSelect.value === "Other (please specify)";
      otherField.hidden = !isOther;
      otherInput.required = isOther && !bookingFields.hidden;
    };

    if (bookingToggle && bookingFields) {
      bookingToggle.addEventListener("change", function () {
        setBooking(bookingToggle.checked);
        if (bookingToggle.checked) setOther();
      });

      // ?book in the URL pre-checks the box (used by every "Book Us" button).
      if (window.location.search.indexOf("book") !== -1 || window.location.hash === "#book") {
        bookingToggle.checked = true;
      }
      setBooking(bookingToggle.checked);
    }

    if (typeSelect && otherField && otherInput) {
      typeSelect.addEventListener("change", setOther);
      setOther();
    }

    // Inline validation messages next to each field.
    var messages = {
      name: "Please add your name.",
      email: "Please enter a valid email.",
      "event-type": "Please pick an event type.",
      "event-type-other": "Tell us what kind of event.",
      message: "Please write a message."
    };

    var showError = function (el, text) {
      var err = document.getElementById(el.id + "-error");
      el.setAttribute("aria-invalid", text ? "true" : "false");
      if (err) err.textContent = text || "";
    };

    form.addEventListener("submit", function (e) {
      var firstBad = null;
      Array.prototype.forEach.call(form.querySelectorAll("input, select, textarea"), function (el) {
        if (el.closest("[hidden]")) return;
        var bad = !el.checkValidity();
        showError(el, bad ? messages[el.id] || "Please fill this in." : "");
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
      }
    });

    Array.prototype.forEach.call(form.querySelectorAll("input, select, textarea"), function (el) {
      el.addEventListener("input", function () {
        if (el.getAttribute("aria-invalid") === "true" && el.checkValidity()) showError(el, "");
      });
    });
  }
})();
