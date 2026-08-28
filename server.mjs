import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? 4173);
const REPOSITORY_ROOT = fileURLToPath(new URL(".", import.meta.url));
const SAMPLE_APP_ROOT = resolve(REPOSITORY_ROOT, "sample-app");
const REMOTE_SDK_BUNDLE = resolve(
  REPOSITORY_ROOT,
  "node_modules/@medwand/mwsdk-javascript-remote/dist/mwsdk-javascript-remote.js"
);
const SAMPLE_APP_PREFIX = SAMPLE_APP_ROOT.endsWith(sep)
  ? SAMPLE_APP_ROOT
  : SAMPLE_APP_ROOT + sep;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".txt", "text/plain; charset=utf-8"]
]);

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? HOST}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/vendor/mwsdk-javascript-remote.js") {
      await sendFile(response, REMOTE_SDK_BUNDLE);
      return;
    }
    const requestedPath = pathname.endsWith("/") ? pathname + "index.html" : pathname;
    const filePath = resolve(SAMPLE_APP_ROOT, "." + requestedPath);

    if (filePath !== SAMPLE_APP_ROOT && !filePath.startsWith(SAMPLE_APP_PREFIX)) {
      sendText(response, 403, "Forbidden");
      return;
    }

    await sendFile(response, filePath);
  } catch (error) {
    const statusCode = error?.code === "ENOENT" ? 404 : 500;
    sendText(response, statusCode, statusCode === 404 ? "Not found" : "Server error");
  }
});

async function sendFile(response, filePath) {
  const file = await stat(filePath);
  if (!file.isFile()) {
    sendText(response, 404, "Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Length": file.size,
    "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}

server.listen(PORT, HOST, () => {
  console.log(`MedWand remote ECG demo: http://${HOST}:${PORT}/`);
});

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}
