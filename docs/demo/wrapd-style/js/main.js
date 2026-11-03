/*
Template Name: wrap-d-style-online-store-website-template
File Name: main.js
Author Name: ThemeVault
Author URI: https://www.themevault.net/
Version: 2.0

Dependency-free. Bootstrap's own bundle drives the navbar, tabs, carousel,
accordion and scrollspy; everything below replaces what jQuery and its plugins
used to do.
*/
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Back to top — fades in past 100px, returns to the top */
    var toTop = document.getElementById("back-to-top");
    if (toTop) {
        var toggleToTop = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
        toggleToTop();
        window.addEventListener("scroll", toggleToTop, { passive: true });
        toTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    /* BS3 marked the active tab on the <li>; BS5 marks the <a>. Templates key CSS on li.active (flowerspetal, wrap-d-style) — keep both in step */
    document.addEventListener("shown.bs.tab", function (e) { var a = e.target, ul = a.closest(".nav"); if (!ul) return; ul.querySelectorAll("li").forEach(function (li) { li.classList.remove("active"); }); ul.querySelectorAll("[data-bs-toggle]").forEach(function (t) { if (t !== a) t.classList.remove("active"); }); var li = a.closest("li"); if (li) li.classList.add("active"); });
    /* BS3 marked an open dropdown's parent with .open; BS5 uses .show. Templates
       key CSS on .open (wrap-d-style slides its cart panel in on it) — mirror it. */
    document.addEventListener("shown.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.add("open"); });
    document.addEventListener("hidden.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.remove("open"); });

    /* Tapping a link in the collapsed menu closes it. The dropdown-toggle
       exclusion matters: without it, adding a submenu later makes the whole
       menu retract the moment it is tapped. */
    var collapse = document.querySelector(".navbar-collapse");
    if (collapse) {
        collapse.addEventListener("click", function (e) {
            var link = e.target.closest("a.nav-link");
            if (!link || link.classList.contains("dropdown-toggle")) return;
            if (!collapse.classList.contains("show")) return;
            var inst = window.bootstrap && bootstrap.Collapse.getInstance(collapse);
            if (inst) inst.hide();
        });
    }
    /* ------------------------------------------------------------------
       Carousels — replaces Owl Carousel (and jQuery with it). Shared block
       from web/scripts/upgrade-qa2/lib/js/carousel.js.

       Config travels on data-owl, lifted from v1's inline $.owlCarousel()
       call, e.g. data-owl='{"items":1,"dots":true,"loop":true,"autoplay":4000}':
         items / responsive   how many show at each MIN width ({"0":1,"768":2})
         nav, dots            arrows (navHtml for custom markup) / pager
         loop                 wrap around — with CLONES, as Owl does
         speed                transition in ms (Owl's 250 default)
         autoplay             interval in ms, or falsy for none
       The plugin's STYLESHEET (owl.carousel.css / owl.theme.default.css) is
       kept verbatim because it IS the slider's design — Owl built the
       stage/item DOM at runtime; this builds the same DOM.
       ------------------------------------------------------------------ */
    document.querySelectorAll("[data-owl]").forEach(function (root) {
        var cfg;
        try { cfg = JSON.parse(root.getAttribute("data-owl")); } catch (e) { return; }
        var slides = Array.prototype.filter.call(root.children, function (c) { return c.nodeType === 1; });
        if (!slides.length) return;
        var speed = reduceMotion ? 0 : (cfg.speed || 250);
        var loop = !!cfg.loop && slides.length > 1;

        var stage = document.createElement("div");
        stage.className = "owl-stage";
        var outer = document.createElement("div");
        outer.className = "owl-stage-outer";
        outer.appendChild(stage);

        var wrap = function (el, cloned) {
            /* a template that hand-wrote <div class="owl-item"> around each slide (wrap-d-style's thumbnails) is not wrapped twice */
            if (el.classList && el.classList.contains("owl-item")) { if (cloned) { el.classList.add("cloned"); el.setAttribute("aria-hidden", "true"); } return el; }
            var item = document.createElement("div");
            item.className = "owl-item" + (cloned ? " cloned" : "");
            if (cloned) item.setAttribute("aria-hidden", "true");
            item.appendChild(el);
            return item;
        };
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });
        slides.forEach(function (el) { stage.appendChild(wrap(el, false)); });
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });

        root.textContent = "";
        root.appendChild(outer);
        root.classList.add("owl-loaded", "owl-drag");

        var items = Array.prototype.slice.call(stage.children);
        var count = slides.length;
        var index = loop ? count : 0;
        var timer = null, animating = false;

        var nav = document.createElement("div"), navBtn = {};
        nav.className = "owl-nav" + (cfg.nav ? "" : " disabled");
        /* Owl 2 rendered the arrows as <div class="owl-prev"> (a template's CSS
           keys on `.owl-nav > div`, wrap-d-style on `div.owl2-prev`) and let
           navClass / navText rename and fill them. Same here: a <div
           role=button> when the template's CSS wants a div, its own class
           names, its own text — a11y kept with tabindex + Enter/Space. */
        ["prev", "next"].forEach(function (dir, i) {
            var b = document.createElement(cfg.navTag || "div");
            if (b.tagName === "BUTTON") b.type = "button"; else { b.setAttribute("role", "button"); b.tabIndex = 0; }
            b.className = (cfg.navClass && cfg.navClass[i]) || "owl-" + dir;
            b.setAttribute("aria-label", dir === "prev" ? "Previous slide" : "Next slide");
            var text = cfg.navText && cfg.navText[i];
            b.innerHTML = (cfg.navHtml && cfg.navHtml[dir]) || (typeof text === "string" ? text : '<i class="fas fa-angle-' + (dir === "prev" ? "left" : "right") + '" aria-hidden="true"></i>');
            var fire = function () { go(dir === "next" ? 1 : -1); restartAutoplay(); };
            b.addEventListener("click", function () { fire(); if (b.tagName !== "BUTTON") b.blur(); }); /* a focusable div keeps a template's :focus (hover) look after a mouse click — v1's divs were not focusable */
            b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
            nav.appendChild(b); navBtn[dir] = b;
        });
        root.appendChild(nav);

        var dots = document.createElement("div");
        dots.className = (cfg.dotsClass || "owl-dots") + (cfg.dots ? "" : " disabled");
        if (cfg.dots) root.appendChild(dots); /* Owl built no pager at dots:false; a custom dotsClass would otherwise miss owl.theme's .owl-dots.disabled and show two stray dashes (wrap-d-style) */

        var perView = function () {
            var w = window.innerWidth, n = cfg.items || 1;
            Object.keys(cfg.responsive || {})
                .map(Number).sort(function (a, b) { return a - b; })
                .forEach(function (bp) { if (w >= bp) n = cfg.responsive[bp]; });
            return Math.max(1, Math.min(n, count));
        };
        var itemWidth = function () {
            var n = perView(), gap = cfg.margin || 0;
            return (root.clientWidth - gap * (n - 1)) / n;
        };
        var step = function () { return loop ? 1 : perView(); };
        var lastIndex = function () { return loop ? items.length - 1 : Math.max(0, count - perView()); };

        var setTransform = function (withTransition) {
            var gap = cfg.margin || 0;
            stage.style.transition = withTransition && speed ? "transform " + speed + "ms ease" : "none";
            stage.style.transform = "translateX(" + (-index * (itemWidth() + gap)) + "px)";
            var real = loop ? ((index - count) % count + count) % count : index;
            Array.prototype.forEach.call(dots.children, function (d, i) {
                d.classList.toggle("active", i === Math.floor(real / step()));
            });
            items.forEach(function (it, i) { it.classList.toggle("active", i >= index && i < index + perView()); });
            /* Owl marked the arrow that can go no further .disabled (owl.carousel.css fades it); a template's own CSS keys on it too */
            if (!loop) { if (navBtn.prev) navBtn.prev.classList.toggle("disabled", index <= 0); if (navBtn.next) navBtn.next.classList.toggle("disabled", index >= lastIndex()); }
        };

        var guard = null;
        var go = function (d) {
            if (animating) return;
            var target = index + d * step();
            if (!loop) target = Math.max(0, Math.min(lastIndex(), target));
            if (target === index) return;
            index = target;
            animating = speed > 0;
            setTransform(true);
            if (!animating) { settleLoop(); return; }
            clearTimeout(guard);
            guard = setTimeout(settleLoop, speed + 100);
        };
        var settleLoop = function () {
            clearTimeout(guard);
            animating = false;
            if (!loop) return;
            if (index >= 2 * count) { index -= count; setTransform(false); }
            else if (index < count) { index += count; setTransform(false); }
        };
        stage.addEventListener("transitionend", function (e) { if (e.target === stage) settleLoop(); });

        var layout = function () {
            if (!root.clientWidth) return;
            var width = itemWidth(), gap = cfg.margin || 0;
            items.forEach(function (it) {
                it.style.width = width + "px";
                it.style.marginRight = gap + "px";
            });
            stage.style.width = (width + gap) * items.length + "px";
            if (!loop && index > lastIndex()) index = lastIndex();
            nav.classList.toggle("disabled", !cfg.nav || count <= perView());
            dots.textContent = "";
            var pages = Math.max(1, Math.ceil(count / step()));
            for (var i = 0; i < pages; i++) {
                (function (i) {
                    var d = document.createElement("button");
                    d.type = "button";
                    d.className = cfg.dotClass || "owl-dot";
                    d.setAttribute("aria-label", "Go to slide " + (i + 1));
                    d.appendChild(document.createElement("span"));
                    d.addEventListener("click", function () { index = (loop ? count : 0) + i * step(); setTransform(true); restartAutoplay(); });
                    dots.appendChild(d);
                })(i);
            }
            setTransform(false);
        };

        var restartAutoplay = function () {
            if (!cfg.autoplay || reduceMotion) return;
            clearInterval(timer);
            timer = setInterval(function () { go(1); }, cfg.autoplay);
        };
        root.addEventListener("mouseenter", function () { clearInterval(timer); });
        root.addEventListener("mouseleave", restartAutoplay);
        restartAutoplay();

        var startX = null;
        var onDown = function (x) { startX = x; };
        var onUp = function (x) {
            if (startX === null) return;
            var dx = x - startX;
            startX = null;
            if (Math.abs(dx) < 40) return;
            go(dx < 0 ? 1 : -1);
            restartAutoplay();
        };
        root.addEventListener("touchstart", function (e) { onDown(e.touches[0].clientX); }, { passive: true });
        root.addEventListener("touchend", function (e) { onUp(e.changedTouches[0].clientX); }, { passive: true });

        layout();
        if ("ResizeObserver" in window) {
            var lastW = root.clientWidth;
            new ResizeObserver(function () {
                if (root.clientWidth === lastW) return;
                lastW = root.clientWidth;
                layout();
            }).observe(root);
        } else {
            var t;
            window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 150); }, { passive: true });
        }
    });

    /* A static template posts nowhere, so rather than pretend, validate and
       say so plainly. */
    var form = document.querySelector(".tv-contact-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
            var note = form.querySelector(".tv-form-note");
            if (note) { note.hidden = false; note.focus(); }
            form.reset(); form.classList.remove("was-validated");
        });
    }
})();

/* Footer year */
(function () { var y = document.getElementById("tv-year"); if (y) y.textContent = String(new Date().getFullYear()); })();

/* No transitions on first paint, and no :hover-driven menus until the visitor moves: a browser can paint the new page with the cursor
   already resting on a nav item, so a hover-opened mega menu or cart panel shows for a moment and then animates shut
   (wrap-d-style, owner note 16). tv-preload drops transitions; tv-nohover keeps hover menus closed until the first real input. */
(function () {
    var body = document.body; body.classList.add("tv-nohover");
    var go = function () { requestAnimationFrame(function () { body.classList.remove("tv-preload"); }); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    var release = function () { body.classList.remove("tv-nohover"); ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.removeEventListener(t, release); }); };
    ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.addEventListener(t, release, { passive: true }); });
})();

/* ---- wrap-d-style: new pages ---- */
document.querySelectorAll(".tv-remove-row").forEach(function (b) { b.addEventListener("click", function () { var tr = b.closest("tr"); if (tr) tr.remove(); }); });

/* ---- wrap-d-style: v1 behaviours ---- */
/* custom.js fixed_cart(): the cart panel slides in from the right with a page overlay.
   Bootstrap 5 toggles .show on #cart; the overlay follows its events, and a tap on the overlay closes it. */
(function () {
    var cartTop = document.getElementById("tv-cart-top"), overlay = document.querySelector(".tv-bg-overlay");
    if (!cartTop || !overlay) return;
    var toggle = cartTop.querySelector('[data-bs-toggle="dropdown"]');
    cartTop.addEventListener("shown.bs.dropdown", function () { overlay.classList.add("show-overlay"); cartTop.querySelector(".dropdown-menu").classList.add("show-cart-block"); });
    cartTop.addEventListener("hidden.bs.dropdown", function () { overlay.classList.remove("show-overlay"); cartTop.querySelector(".dropdown-menu").classList.remove("show-cart-block"); });
    overlay.addEventListener("click", function () { if (window.bootstrap && toggle) bootstrap.Dropdown.getOrCreateInstance(toggle).hide(); overlay.classList.remove("show-overlay"); });
})();
/* custom.js: the off-canvas menu below 992px — [data-toggle="offcanvas"] toggled .active on .tv-left-canvas (the page wrapper; <body> carries its classes now).
   BS5 has its own offcanvas component on the same data-api name; without a target it does nothing, so this is the only handler. */
(function () {
    var canvas = document.querySelector(".tv-left-canvas") || document.body;
    document.querySelectorAll('[data-tv-toggle="offcanvas"], [data-bs-toggle="offcanvas"]:not([data-bs-target])').forEach(function (b) {
        b.addEventListener("click", function (e) { e.preventDefault(); canvas.classList.toggle("active"); });
    });
})();
/* custom.js: inside the off-canvas menu the +/- square beside "store" opens its mega menu (delegated in v1) */
document.addEventListener("click", function (e) {
    var i = e.target.closest("i.click-menu-open"); if (!i) return;
    var menu = i.parentElement.querySelector(".dropdown-menu"); if (!menu) return;
    var open = menu.style.display === "block";
    menu.style.display = open ? "none" : "block";
    i.classList.toggle("fa-plus-square", open); i.classList.toggle("fa-square-plus", open);
    i.classList.toggle("fa-minus-square", !open); i.classList.toggle("fa-square-minus", !open);
});
/* every form on the site: validate, show its .tv-form-note, follow data-next (login / register -> account.html) */
(function () {
    document.querySelectorAll("form[novalidate]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add("was-validated"); var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
            var note = form.querySelector(".tv-form-note"), btn = e.submitter || form.querySelector("[type=submit]");
            if (note) { note.hidden = false; note.focus(); }
            var next = btn && btn.getAttribute("data-next");
            if (next) setTimeout(function () { location.href = next; }, 900);
            else { form.reset(); form.classList.remove("was-validated"); }
        });
    });
    /* buttons that only confirm (coupon, voucher, shipping quote) */
    document.querySelectorAll(".tv-confirm[data-confirm]").forEach(function (b) {
        b.addEventListener("click", function () {
            var host = b.closest(".input-group, .form-group, form, div") || b.parentElement;
            var note = host.querySelector(".tv-form-note");
            if (!note) { note = document.createElement("p"); note.className = "tv-form-note"; note.setAttribute("role", "status"); note.tabIndex = -1; host.appendChild(note); }
            note.textContent = b.getAttribute("data-confirm"); note.hidden = false; note.focus();
        });
    });
})();
/* single-product.html: the thumbnail swaps the main photo; the quantity stepper (v1's inline script) */
(function () {
    document.querySelectorAll(".tv-current-img").forEach(function (t) {
        t.addEventListener("click", function (e) {
            e.preventDefault();
            var main = document.querySelector("#product-product .tv-replace-img, .tv-replace-img");
            var src = t.getAttribute("data-image") || (t.querySelector("img") || {}).src;
            if (main && src) main.src = src;
            document.querySelectorAll(".tv-current-img.active").forEach(function (a) { a.classList.remove("active"); });
            t.classList.add("active");
        });
    });
    var qty = document.querySelector("#product-product #input-quantity");
    if (qty) {
        var set = function (v) { qty.value = Math.max(1, v); };
        qty.addEventListener("change", function () { set(parseInt(qty.value, 10) || 1); });
        var minus = document.querySelector("#product-product #minus"), plus = document.querySelector("#product-product #plus");
        if (minus) minus.addEventListener("click", function (e) { e.preventDefault(); set((parseInt(qty.value, 10) || 1) - 1); });
        if (plus) plus.addEventListener("click", function (e) { e.preventDefault(); set((parseInt(qty.value, 10) || 1) + 1); });
    }
})();

/* ---- wrap-d-style: round 2 ---- */
/* phone sidebar accordions (the boxes are always open from 768px — the toggles only exist below) */
document.querySelectorAll(".tv-sidebar .tv-acc > .tv-box-heading, .tv-sidebar .tv-acc > .panel-heading").forEach(function (h) {
    h.addEventListener("click", function () { if (window.innerWidth >= 768) return; h.parentElement.classList.toggle("is-open"); });
});
/* help page: mark the section in view */
(function () {
    var links = document.querySelectorAll(".tv-faq-nav a[href^='#']"); if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {}; links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (!e.isIntersecting) return; links.forEach(function (a) { a.classList.remove("is-current"); }); var a = map[e.target.id]; if (a) a.classList.add("is-current"); });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
})();
