// CORE=<core checkout> node serve.cjs — Core's demo runtime plus this theme on port 8130.
const http = require("http");
const fs = require("fs");
const path = require("path");

const pub = path.join(process.env.CORE, "docs-site/public");
const theme = path.resolve(__dirname, "../..");
const types = { css: "text/css", js: "text/javascript", mjs: "text/javascript", svg: "image/svg+xml", json: "application/json", html: "text/html", webp: "image/webp", png: "image/png", woff2: "font/woff2" };

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const themed = url.match(/^\/webapp-theme-(?:css|assets)\/avio-soft\/(?:revisions\/[0-9a-f]+\/)?(.*)$/);
    let file;
    if (themed) file = path.join(theme, themed[1]);
    else {
      file = path.join(pub, url);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file) && url.startsWith("/demo/runtime/")) file = path.join(pub, "demo/runtime/app/index.html");
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "content-type": types[path.extname(file).slice(1)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(data);
    });
  })
  .listen(8130, () => console.log("demo on http://127.0.0.1:8130/demo/runtime/home"));
