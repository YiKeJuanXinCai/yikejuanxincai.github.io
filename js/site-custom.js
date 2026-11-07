/* ============================================================
 * site-custom.js — 本站交互增强：阅读进度、回到顶部、移动端菜单、
 * 当前页高亮、自动年份、本地搜索增强。纯原生 JS，无依赖。
 * ============================================================ */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    /* ---------- 1. 阅读进度条 ---------- */
    var bar = document.createElement("div");
    bar.id = "site-progress";
    document.body.prepend(bar);

    function updateProgress() {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || window.pageYOffset || 0;
      var max = doc.scrollHeight - doc.clientHeight;
      bar.style.width = max > 0 ? (scrollTop / max) * 100 + "%" : "0%";
    }
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    /* ---------- 2. 回到顶部 ---------- */
    var footer = document.querySelector(".footer");
    var b2t = document.createElement("a");
    b2t.id = "b2t";
    b2t.href = "javascript:void(0);";
    b2t.setAttribute("aria-label", "回到顶部");
    b2t.innerHTML =
      '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="20" height="20"><path d="M512 320l-298.667 298.667 60.587 60.586L512 441.173l238.08 238.08 60.587-60.586z"/></svg>';
    if (footer) {
      footer.appendChild(b2t);
    } else {
      document.body.appendChild(b2t);
    }
    b2t.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    function toggleB2t() {
      b2t.style.display = window.pageYOffset > 120 ? "flex" : "none";
    }
    window.addEventListener("scroll", toggleB2t, { passive: true });
    toggleB2t();

    /* ---------- 3. 移动端下拉菜单 ---------- */
    var btn = document.getElementById("btn-dropdown");
    var menus = document.getElementById("dropdown-menus");
    if (btn && menus) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        menus.classList.toggle("open");
      });
      document.addEventListener("click", function (e) {
        if (!menus.contains(e.target)) menus.classList.remove("open");
      });
      menus.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          menus.classList.remove("open");
        });
      });
    }

    /* ---------- 4. 当前导航高亮 ---------- */
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    document
      .querySelectorAll(".navbar-menu, .dropdown-menu")
      .forEach(function (a) {
        var href = (a.getAttribute("href") || "").replace(/\/+$/, "");
        if (href === path || (href === "" && path === "/")) {
          a.classList.add("active");
        }
      });

    /* ---------- 5. 页脚自动年份 ---------- */
    var copy = document.querySelector(".footer-copyright");
    if (copy) {
      var year = new Date().getFullYear();
      var link = copy.querySelector("a");
      copy.textContent = "Copyright © " + year + " ";
      if (link) copy.appendChild(link);
    }

    /* ---------- 6. 本地搜索增强 ---------- */
    var input = document.getElementById("search-input");
    if (input) {
      var listEl = document.getElementById("search-result__list");
      var noticeEl = document.getElementById("search-result__notice");
      var cache = null;

      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }
      function fetchData() {
        if (cache) return Promise.resolve(cache);
        return fetch("/search.json")
          .then(function (r) { return r.json(); })
          .then(function (d) { cache = d; return d; });
      }
      function render(keyword) {
        if (!listEl) return;
        var kw = keyword.trim().toLowerCase();
        if (!kw) {
          listEl.innerHTML = "";
          if (noticeEl) noticeEl.textContent = "";
          return;
        }
        fetchData().then(function (data) {
          var kws = kw.split(/\s+/);
          var hits = data.filter(function (item) {
            if (!item || !item.title) return false;
            var title = item.title.toLowerCase();
            var body = (item.content || "").toLowerCase();
            return kws.some(function (k) {
              return title.indexOf(k) >= 0 || body.indexOf(k) >= 0;
            });
          });
          if (noticeEl) {
            noticeEl.textContent =
              hits.length > 0
                ? "找到 " + hits.length + " 个相关结果"
                : "没有找到「" + keyword.trim() + "」相关结果";
          }
          if (!hits.length) {
            listEl.innerHTML = "";
            return;
          }
          listEl.innerHTML = hits
            .map(function (item) {
              var title = escapeHtml(item.title);
              var url = item.url || "#";
              var snippet = escapeHtml((item.content || "").slice(0, 180));
              kws.forEach(function (k) {
                if (!k) return;
                title = title.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "<mark>$&</mark>");
                snippet = snippet.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "<mark>$&</mark>");
              });
              return (
                '<a href="' + url + '" class="search-result__link">' +
                '<div class="search-result__item"><strong>' + title + "</strong>" +
                '<div class="search-result__content">' + (snippet || "暂无摘要") + "</div></div></a>"
              );
            })
            .join("");
        });
      }
      var timer = null;
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          render(input.value);
        }, 220);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          render(input.value);
        }
      });
      /* 页面带 ?s= 进入时兜底渲染一次 */
      var q = new URLSearchParams(window.location.search).get("s");
      if (q && listEl && !listEl.children.length) {
        input.value = q;
        render(q);
      }
    }
  });
})();
