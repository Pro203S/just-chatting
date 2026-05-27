import { createServer } from "node:http";
import next from "next";
import c from 'chalk';
import ora from "ora";
import './src/modules/database';
import { initSocketServer } from "./socket";
import { internalIpV4 } from "internal-ip";

const start = new Date().getTime();
const loading = ora("Starting...").start();

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const useWebpack = process.argv.includes("--webpack");
const useTurbopack = process.argv.includes("--turbopack");

const app = next({
    dev,
    port,
    ...(useWebpack ? {
        "webpack": true,
        "turbopack": false
    } : {}),
    ...(useTurbopack ? {
        "turbopack": true,
        "webpack": false
    } : {})
});

const handler = app.getRequestHandler();

await app.prepare();

const httpServer = createServer(handler);

initSocketServer(httpServer);

httpServer.listen(port, async () => {
    loading.succeed(`Server is running!`);
    console.log(`  - http://localhost:${port}`);
    console.log(`  - http://${await internalIpV4()}:${port}`);
    console.log(`  Ready in ` + c.cyanBright((new Date().getTime() - start) + "ms"));
    if (dev) {
        const bundler = useWebpack ? "webpack" : useTurbopack ? "turbopack" : "default (turbopack)";
        console.log(`  Dev bundler: ` + c.yellowBright(bundler));
    }
});
