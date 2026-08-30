(() => {
  const STATUS_URL = new URL("cws-status.json", document.baseURI).href;
  const DISMISSED_KEY = "json-viewer-cws-cta-dismissed";

  if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;

  fetch(STATUS_URL, { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((status) => {
      if (!status || status.status !== "live" || !status.storeUrl) return;

      const style = document.createElement("style");
      style.textContent = `
        .cws-install-bar{position:relative;z-index:10000;display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 42px 10px 16px;background:#172554;color:#fff;font:600 14px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;text-align:center}
        .cws-install-bar a{display:inline-block;border-radius:7px;background:#fff;color:#1d4ed8;padding:7px 12px;text-decoration:none;white-space:nowrap}
        .cws-install-bar button{position:absolute;right:12px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#bfdbfe;font-size:22px;line-height:1;cursor:pointer}
        @media(max-width:620px){.cws-install-bar{align-items:flex-start;flex-direction:column;padding-right:44px;text-align:left}.cws-install-bar a{align-self:flex-start}}
      `;

      const bar = document.createElement("aside");
      bar.className = "cws-install-bar";
      bar.setAttribute("aria-label", "Chrome extension");
      bar.innerHTML = `<span>Open raw JSON from any tab with the free Chrome extension.</span><a rel="noopener" target="_blank">Add to Chrome →</a><button type="button" aria-label="Dismiss">×</button>`;
      bar.querySelector("a").href = status.storeUrl;
      bar.querySelector("button").addEventListener("click", () => {
        sessionStorage.setItem(DISMISSED_KEY, "1");
        bar.remove();
      });

      document.head.append(style);
      document.body.prepend(bar);
    })
    .catch(() => {});
})();
