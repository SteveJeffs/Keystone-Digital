/* Keystone Digital: shared JS.
   Everything here is an enhancement; every page works with JS disabled. */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  var header = document.querySelector(".site-header");

  function closeNav(returnFocus) {
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
    if (header) header.classList.remove("nav-open");
    if (returnFocus) toggle.focus();
  }
  function openNav() {
    toggle.setAttribute("aria-expanded", "true");
    links.classList.add("is-open");
    document.body.classList.add("nav-locked");
    if (header) header.classList.add("nav-open");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      open ? closeNav(false) : openNav();
    });

    // Escape closes the menu and returns focus to the toggle button.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeNav(true);
      }
      // Keep focus inside the open menu (simple trap between first & last focusable).
      if (e.key === "Tab" && toggle.getAttribute("aria-expanded") === "true") {
        var focusables = [toggle].concat(
          Array.prototype.slice.call(links.querySelectorAll("a"))
        );
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    // Close when a link inside the menu is chosen.
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });
  }

  /* ---------- Scroll reveal (skipped entirely under reduced motion) ---------- */
  var motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (motionOK && "IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // Reduced motion, no IO support, or JS-late: just show everything.
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Visitor stats: Cloudflare Web Analytics ----------
     Cookie-free visit counts. Paste your site token from the Cloudflare
     dashboard between the quotes below to switch it on. Empty = off. */
  var CF_ANALYTICS_TOKEN = "";
  if (CF_ANALYTICS_TOKEN) {
    var cf = document.createElement("script");
    cf.defer = true;
    cf.src = "https://static.cloudflareinsights.com/beacon.min.js?token=" + encodeURIComponent(CF_ANALYTICS_TOKEN);
    document.head.appendChild(cf);
  }

  /* ---------- Where did this visitor come from? ----------
     Reads ?ref=facebook (or similar) from the link someone arrived on, falls
     back to the site that sent them, and records it in the hidden "source"
     field of both forms. Nothing is stored on the visitor's device: the tag is
     carried between pages by adding it to the site's own links instead. */
  function cleanTag(s) { return String(s).toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40); }
  var source = "";
  try {
    var params = new URLSearchParams(location.search);
    source = params.get("ref") || params.get("utm_source") || (params.has("fbclid") ? "facebook" : "");
    if (!source && document.referrer) {
      var host = new URL(document.referrer).hostname;
      if (host && host !== location.hostname) source = host.replace(/^(www|m|l|lm)\./, "");
    }
  } catch (e) { source = ""; }
  source = cleanTag(source);

  if (source) {
    // Carry the tag through internal links so it survives clicking around.
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(function (a) {
      var href = a.getAttribute("href");
      if (/^(https?:|mailto:|tel:)/.test(href)) return;
      var parts = href.split("#");
      a.setAttribute("href", parts[0] + (parts[0].indexOf("?") > -1 ? "&" : "?") + "ref=" + encodeURIComponent(source) + (parts[1] ? "#" + parts[1] : ""));
    });
  }
  document.querySelectorAll('input[name="source"]').forEach(function (input) {
    input.value = source || "direct";
  });

  /* ---------- Form enhancement ----------
     Native HTML5 validation still runs with JS off. With JS on, we add
     inline, screen-reader-announced messages instead of browser bubbles. */
  var forms = document.querySelectorAll("form[data-enhance]");
  forms.forEach(function (form) {
    form.setAttribute("novalidate", "novalidate");

    function showError(input, msg) {
      var field = input.closest(".field");
      if (!field) return;
      field.classList.add("has-error");
      var err = field.querySelector(".error-msg");
      if (err) err.textContent = msg;
      input.setAttribute("aria-invalid", "true");
    }
    function clearError(input) {
      var field = input.closest(".field");
      if (!field) return;
      field.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
    }

    form.addEventListener("submit", function (e) {
      var bad = [];
      form.querySelectorAll("input, textarea, select").forEach(function (input) {
        if (input.type === "hidden" || input.closest(".hp-field")) return;
        clearError(input);
        if (!input.checkValidity()) {
          var msg =
            input.validity.valueMissing ? "This one's needed before I can get back to you." :
            input.type === "email" ? "That email doesn't look quite right. Check it for me?" :
            input.type === "url" ? "That web address doesn't look right. It needs to start with https://" :
            "Please check this field.";
          showError(input, msg);
          bad.push(input);
        }
      });
      if (bad.length) {
        e.preventDefault();
        bad[0].focus();
        var live = form.querySelector("[data-form-status]");
        if (live) {
          live.textContent = bad.length === 1
            ? "One field needs a look before this can send."
            : bad.length + " fields need a look before this can send.";
        }
      }
    });
  });
})();
