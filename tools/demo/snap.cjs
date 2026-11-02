// node snap.cjs <out> <cases.json> [chromium|webkit] [widths] — see README.md
const { chromium, webkit } = require(require.resolve("playwright", { paths: [process.cwd()] }));
const fs = require("fs");
const path = require("path");

const [out, casesFile, engine = "chromium", widths = "390"] = process.argv.slice(2);
const cases = JSON.parse(fs.readFileSync(casesFile, "utf8"));
const theme = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../theme.json"), "utf8"));
const fxMount = fs.readFileSync(path.join(__dirname, "fxmount.js"), "utf8");
const TOKENS = {};
for (const mode of ["light", "dark"]) {
  TOKENS[mode] = Object.fromEntries(
    Object.entries(theme.variants[mode])
      .filter(([key, value]) => typeof value === "string" && key !== "color_scheme")
      .map(([key, value]) => ["--" + key.replace(/_/g, "-"), value])
  );
}
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = engine === "webkit" ? await webkit.launch() : await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
  for (const width of widths.split(",").map(Number))
    for (const mode of (process.env.MODES || "light,dark").split(","))
      for (const c of cases) {
        const height = width > 700 ? 900 : c.h || 844;
        const page = await browser.newPage({ viewport: { width, height }, colorScheme: mode, reducedMotion: c.fx ? "no-preference" : "reduce", locale: "ru-RU" });
        page.on("pageerror", (error) => console.log(c.name, "pageerror", error.message));
        await page.goto(`http://127.0.0.1:8130/demo/runtime${c.path || "/home"}?mode=${mode}${c.mock ? "&mock=" + c.mock : ""}`);
        try {
          await page.waitForSelector(".app-shell", { timeout: 20000 });
        } catch {
          console.log(c.name, "no shell");
        }
        await page.waitForTimeout(900);
        await page.evaluate(
          async ([mode, TOKENS]) => {
            const fix = (el) => {
              if (!el) return;
              el.className = el.className
                .replace(/theme-key-\S+/g, "theme-key-avio-soft")
                .replace(/theme-(dark|light)\b/, "theme-" + mode)
                .replace(/theme-variant-\S+/, "theme-variant-" + mode);
              if (!el.classList.contains("theme-key-avio-soft")) el.classList.add("theme-key-avio-soft", "theme-variant-" + mode);
            };
            const roots = () => [document.querySelector(".app-shell"), document.documentElement];
            roots().forEach(fix);
            for (const el of roots()) if (el) for (const [k, v] of Object.entries(TOKENS[mode])) el.style.setProperty(k, v);
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/webapp-theme-css/avio-soft/style.css?" + Date.now();
            document.head.append(link);
            await new Promise((resolve) => (link.onload = resolve));
            document.documentElement.dataset.avioDaypart ||= "day";
            document.documentElement.dataset.avioSeason ||= "autumn";
            // Core re-applies its classes on rerender: keep the theme's.
            new MutationObserver(() => {
              for (const el of roots()) if (el && !el.classList.contains("theme-key-avio-soft")) fix(el);
            }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
          },
          [mode, TOKENS]
        );
        if (c.fx) await page.evaluate(fxMount);
        if (c.js) {
          try {
            await page.evaluate(c.js);
          } catch (error) {
            console.log(c.name, "js error", error.message);
          }
        }
        await page.waitForTimeout(c.wait || 900);
        const debug = await page.evaluate(() => window.__dbg);
        if (debug) console.log(c.name, debug);
        await page.screenshot({ path: `${out}/${c.name}-${width}-${mode}.png`, fullPage: !!c.full });
        await page.close();
      }
  await browser.close();
})();
