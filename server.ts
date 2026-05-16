import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import c from 'chalk';
import { internalIpV4 } from "internal-ip";
import ora from "ora";
import './src/modules/database';

const start = new Date().getTime();
const loading = ora("Starting...").start();

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const hostname = await internalIpV4();

const app = next({
    dev,
    hostname,
    port,
});

const handler = app.getRequestHandler();

await app.prepare();

const httpServer = createServer(handler);

const io = new Server(httpServer, {
    "path": "/socket",
    "cors": {
        "origin": "*",
    },
});

io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("message", (data) => {
        console.log("message:", data);
        socket.emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("disconnected:", socket.id);
    });
});

httpServer.listen(port, hostname, () => {
    loading.succeed(`Server running on ` + c.green(`http://${hostname}:${port}`));
    console.log(`  Ready in ` + c.cyanBright((new Date().getTime() - start) + "ms"));
});
