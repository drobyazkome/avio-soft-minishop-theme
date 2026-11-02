// Mounts effects/main.js with a host shaped like Core's (the demo does not run theme effects).
(async () => {
  const effect = await import("/webapp-theme-assets/avio-soft/effects/main.js?" + Date.now());
  const watchers = new Set();
  new MutationObserver(() => watchers.forEach((watch) => watch())).observe(document.body, { childList: true, subtree: true });
  effect.mount(
    {
      targets: (name) => [...document.querySelectorAll(`[data-theme-effect-target="${name}"]`)],
      watchTargets: (watch) => {
        watchers.add(watch);
        return () => watchers.delete(watch);
      },
      listen: (target, type, handler) => target.addEventListener(type, handler),
      timeout: (fn, ms) => {
        const id = setTimeout(fn, ms);
        return () => clearTimeout(id);
      },
      signal: new AbortController().signal,
    },
    { variant: document.documentElement.classList.contains("theme-variant-dark") ? "dark" : "light", reducedMotion: false }
  );
})();
