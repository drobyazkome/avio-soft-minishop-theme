// node sheet.cjs <out.png> <scale> <png>... — screenshots side by side
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd()] }));
const fs = require("fs");

const [out, scale, ...files] = process.argv.slice(2);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

(async () => {
  const browser = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const images = files.map((file) => `<img src="data:image/png;base64,${fs.readFileSync(file).toString("base64")}">`).join("");
  await page.setContent(`<body style="margin:0;display:flex;gap:10px;align-items:flex-start;width:max-content;background:#fff">${images}</body>`);
  await page.evaluate(async (s) => {
    await Promise.all([...document.images].map((img) => img.decode()));
    for (const img of document.images) img.style.width = img.naturalWidth * s + "px";
  }, Number(scale));
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
})();
