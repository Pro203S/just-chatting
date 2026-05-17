import { DefaultEventsMap, Server, Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { verifyAccessToken } from "./src/modules/token";
import { getDatabase } from "./src/modules/database";

type IOServer = Server<
    SocketOnEvents,
    SocketEmitEvents,
    DefaultEventsMap,
    SocketData
>;

type IOSocket = Socket<
    SocketOnEvents,
    SocketEmitEvents,
    DefaultEventsMap,
    SocketData
>;

type SocketGlobal = typeof globalThis & {
    __justChattingSocketServer?: IOServer | null;
};

const socketGlobal = globalThis as SocketGlobal;

let io: IOServer | null = socketGlobal.__justChattingSocketServer ?? null;

function setSocketServer(server: IOServer) {
    socketGlobal.__justChattingSocketServer = server;
    io = server;
    return server;
}

export function findSocketServer() {
    return socketGlobal.__justChattingSocketServer ?? io;
}

function close(socket: IOSocket, code: number, reason: string) {
    socket.emit("error", code, reason);
    socket.disconnect(true);
}

export function initSocketServer(httpServer: HttpServer) {
    const existingServer = findSocketServer();
    if (existingServer) {
        return existingServer;
    }

    const server = setSocketServer(new Server<
        SocketOnEvents,
        SocketEmitEvents,
        DefaultEventsMap,
        SocketData
    >(httpServer, {
        path: "/socket",
        cors: {
            origin: "*",
        },
    }));

    server.on("connection", async (socket) => {
        console.log("Socket Connected:", socket.id);

        const identifyTimeout = setTimeout(() => {
            close(socket, 103, "인증에 실패했습니다.");
        }, 10000);

        socket.emit("identify");

        socket.once("identify", async (token) => {
            clearTimeout(identifyTimeout);

            if (!token) {
                return close(socket, 100, "다시 로그인 해주세요.");
            }

            const payload = await verifyAccessToken(token);

            if (!payload) {
                return close(socket, 101, "다시 로그인 해주세요.");
            }

            const { userId } = payload;

            const database = getDatabase();
            const users = database.get("users");

            const user = users.find(v => v.id === userId)?.value?.();

            if (!user) {
                return close(socket, 102, "다시 로그인 해주세요.");
            }

            await socket.join(`user:${user.id}`);
            socket.emit("welcome", {
                id: user.id,
                name: user.name,
                profile: user.profile,
                userId: user.userId,
            });
        });

        socket.on("disconnect", (reason) => {
            clearTimeout(identifyTimeout);
            console.log("Socket Disconnected:", socket.id, reason);
        });
    });

    return server;
}

export function getSocketServer() {
    const server = findSocketServer();
    if (!server) {
        throw new Error("Socket.IO server is not initialized.");
    }

    return server;
}
