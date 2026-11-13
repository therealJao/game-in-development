import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist"),
  mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".glb": "model/gltf-binary",
    ".txt": "text/plain; charset=utf-8",
  };
const port = Number(process.env.ESCAPE_PORT) || 4176;
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost"),
        name = decodeURIComponent(url.pathname);
      if (name === "/qa") {
        res
          .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
          .end(await fs.readFile("work/qa-studio.html"));
        return;
      }
      const file = path.resolve(root, "." + (name === "/" ? "/index.html" : name));
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const data = await fs.readFile(file);
      res
        .writeHead(200, {
          "Content-Type": mime[path.extname(file)] || "application/octet-stream",
          "Cache-Control": "no-cache",
        })
        .end(data);
    } catch {
      res.writeHead(404).end("Não encontrado");
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`Local: http://127.0.0.1:${port}`));
