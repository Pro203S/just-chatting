import { createServer } from "node:http";
import next from "next";
import c from "chalk";
import ora from "ora";
import "./src/modules/database";
import { initSocketServer } from "./socket";
import { internalIpV4 } from "internal-ip";

const start = Date.now();
const loading = ora("Starting...").start();

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || "127.0.0.1";

const app = next({
    dev,
    hostname,
    port,
});

const handler = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => {
    const requestUrl = req.url ?? "";

    // Let Socket.IO's own request listener handle its polling handshake.
    if (
        requestUrl === "/socket" ||
        requestUrl === "/socket/" ||
        requestUrl.startsWith("/socket?") ||
        requestUrl.startsWith("/socket/?")
    ) {
        return;
    }

    handler(req, res);
});

initSocketServer(httpServer);

httpServer.listen(port, hostname, async () => {
    loading.succeed("Server is running!");
    console.log(`  - http://${hostname}:${port}`);

    const ip = await internalIpV4();
    if (ip) {
        console.log(`  - http://${ip}:${port}`);
    }

    console.log(`  Ready in ${c.cyanBright(`${Date.now() - start}ms`)}`);

    if (dev) {
        console.log(`  Dev mode`);
    }
});
