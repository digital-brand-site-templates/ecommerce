/*
Template Name: flowerspetal-html5-florist-website-template
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

    /* Counters — replaces counterUp + waypoints. The real number stays in the
       markup until the moment it animates, so anyone without JS still sees it. */
    var counters = document.querySelectorAll(".counter");
    if (counters.length) {
        var runCounter = function (el) {
            var target = parseInt(String(el.dataset.target || el.textContent).replace(/\D/g, ""), 10);
            if (!isFinite(target)) return;
            if (reduceMotion) { el.textContent = String(target); return; }
            el.textContent = "0";
            var started = null;
            var step = function (now) {
                if (started === null) started = now;
                var progress = Math.min((now - started) / 1000, 1);
                el.textContent = String(Math.floor(progress * target));
                if (progress < 1) requestAnimationFrame(step); else el.textContent = String(target);
            };
            requestAnimationFrame(step);
        };
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); } });
            }, { threshold: 0.4 });
            counters.forEach(function (c) { c.dataset.target = c.textContent.trim(); io.observe(c); });
        } else counters.forEach(runCounter);
    }

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

/* Back to top (the shell's #back-to-top): shown past 100px, smooth scroll up. */
(function () {
    var toTop = document.getElementById("back-to-top");
    if (!toTop) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var toggle = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
    toggle(); window.addEventListener("scroll", toggle, { passive: true });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
})();

/* Footer year */
(function () { var y = document.getElementById("tv-year"); if (y) y.textContent = String(new Date().getFullYear()); })();

/* single-product: thumbnails swap the main photo; the qty stepper; Bootstrap tooltips */
(function () {
    var main = document.querySelector(".product-gallery .photo, .product-gallery .main-image-set img, .product-gallery .main-image-set [data-image]");
    document.querySelectorAll(".galleryimg").forEach(function (t) { t.addEventListener("click", function () { if (!main) return; if (main.tagName === "IMG") main.src = t.src; else main.style.backgroundImage = "url(" + t.src + ")"; }); });
    var count = document.getElementById("count");
    if (count) {
        var step = function (d) { var v = parseInt(count.value, 10) || 1; count.value = Math.max(1, v + d); };
        document.querySelectorAll("[onclick*='plus'], .qty-plus").forEach(function (b) { b.removeAttribute("onclick"); b.addEventListener("click", function () { step(1); }); });
        document.querySelectorAll("[onclick*='minus'], .qty-minus").forEach(function (b) { b.removeAttribute("onclick"); b.addEventListener("click", function () { step(-1); }); });
    }
    if (window.bootstrap) document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) { new bootstrap.Tooltip(el); });
})();

(function () {
    document.querySelectorAll("form button[type=submit][data-next]").forEach(function (btn) {
        var form = btn.closest("form");
        form.addEventListener("submit", function () {
            var ok = Array.prototype.every.call(form.querySelectorAll("[required]"), function (f) { return f.checkValidity(); });
            if (ok) setTimeout(function () { location.href = btn.getAttribute("data-next"); }, 600);
        });
    });
})();

/* single-product main photo: v1's custom.js filled .tile with a .photo child from data-image and zoomed it on hover */
(function () {
    document.querySelectorAll(".tile[data-image]").forEach(function (tile) {
        var photo = document.createElement("div"); photo.className = "photo"; photo.style.backgroundImage = "url(" + tile.getAttribute("data-image") + ")"; tile.appendChild(photo);
        var scale = parseFloat(tile.getAttribute("data-scale")) || 1.1;
        tile.addEventListener("mouseenter", function () { photo.style.transform = "scale(" + scale + ")"; });
        tile.addEventListener("mouseleave", function () { photo.style.transform = "scale(1)"; });
        tile.addEventListener("mousemove", function (e) { var r = tile.getBoundingClientRect(); photo.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%"; });
        document.querySelectorAll(".galleryimg").forEach(function (t, i) {
            if (i === 0) t.parentElement.classList.add("is-current");
            t.addEventListener("click", function () { photo.style.backgroundImage = "url(" + t.src + ")"; tile.setAttribute("data-image", t.src); document.querySelectorAll(".galleryimg").forEach(function (x) { x.parentElement.classList.remove("is-current"); }); t.parentElement.classList.add("is-current"); });
        });
    });
    /* currency picker: the label follows the choice */
    document.querySelectorAll(".tv-left-content .dropdown").forEach(function (d) {
        var btn = d.querySelector(".dropbtn");
        d.querySelectorAll(".currency-select").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); if (btn) btn.firstChild.textContent = (a.textContent.trim() === "Euros" ? "EUR" : "USD") + " "; }); });
    });
})();

/* ---- round 1b ---- */
/* product tabs: v1 styles li.active; Bootstrap 5 moves .active on the <a> — keep the li in step */
document.querySelectorAll('.product-tab-part [data-bs-toggle="tab"]').forEach(function (a) {
    a.addEventListener("shown.bs.tab", function () {
        a.closest("ul").querySelectorAll("li").forEach(function (li) { li.classList.remove("active"); });
        a.parentElement.classList.add("active");
    });
});
/* v1 custom.js: the category tree (+/-), the sidebar box and footer block collapses */
(function () {
    var slide = function (el, open) { el.style.display = open ? "block" : "none"; };
    document.querySelectorAll(".box-category .menu li > a + i").forEach(function (i) {
        var ul = i.parentElement.querySelector(":scope > ul"); if (!ul) return;
        i.setAttribute("role", "button"); i.setAttribute("tabindex", "0"); i.setAttribute("aria-label", "Toggle subcategories");
        var go = function () { var open = !i.classList.contains("fa-minus"); i.classList.toggle("fa-minus", open); i.classList.toggle("fa-plus", !open); slide(ul, open); };
        i.addEventListener("click", go); i.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    document.querySelectorAll(".category h3 i").forEach(function (i) {
        i.addEventListener("click", function () { var box = i.closest(".category").querySelector(".box-content"); if (!box) return; var open = i.classList.toggle("fa-angle-down"); slide(box, open); });
    });
    document.querySelectorAll(".footer-block h4 i").forEach(function (i) {
        i.addEventListener("click", function () { var list = i.closest(".footer-block").querySelector(".list-unstyled"); if (!list) return; var open = i.classList.toggle("fa-angle-down"); slide(list, open); });
    });
})();
/* blog post: the like button counts */
document.querySelectorAll(".nectar-love").forEach(function (b) {
    b.addEventListener("click", function () {
        var c = b.querySelector(".nectar-love-count"), n = parseInt(c.textContent, 10) || 0, on = b.classList.toggle("is-liked");
        n = on ? n + 1 : Math.max(0, n - 1); c.textContent = n + (n === 1 ? " like" : " likes");
    });
});
