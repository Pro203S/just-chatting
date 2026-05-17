import { Socket as SocketIOType, Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import { verifyAccessToken } from "./src/modules/token";
import { getDatabase } from "./src/modules/database";

function close(socket: SocketIOType<SocketOnEvents, SocketEmitEvents>, code: number, reason: string) {
    socket.emit("error", code, reason);
    socket.disconnect(true);
}

const socketIdentifyTimeout: Record<string, NodeJS.Timeout> = {};

export default class Socket {
    private _socket!: Server<SocketOnEvents, SocketEmitEvents>;

    constructor(
        private _httpServer: HttpServer
    ) { }

    run() {
        const io = new Server<SocketOnEvents, SocketEmitEvents>(this._httpServer, {
            "path": "/socket",
            "cors": {
                "origin": "*",
            },
        });
        this._socket = io;

        io.on("connection", async (socket) => {
            console.log("  Socket Connected: " + socket.id);
            socketIdentifyTimeout[socket.id] = setTimeout(() => {
                close(socket, 103, "인증에 실패했습니다.");
            }, 10000);
            socket.emit("identify");

            socket.once("identify", async (token) => {
                /*
                100 = 토큰 제공이 안됨
                101 = 토큰에서 payload 추출 실패
                102 = 유저를 DB에서 찾을 수 없음
                103 = identify를 너무 느리게 줌
                */

                if (!token) return close(socket, 100, "다시 로그인 해주세요.");

                const payload = await verifyAccessToken(token);
                if (!payload) return close(socket, 101, "다시 로그인 해주세요.");

                const { userId } = payload;

                const database = getDatabase();
                const users = database.get("users");

                const user = users.find(v => v.id === userId)?.value?.();
                if (!user) return close(socket, 102, "다시 로그인 해주세요.");

                socket.emit("welcome", {
                    "id": user.id,
                    "name": user.name,
                    "profile": user.profile,
                    "userId": user.userId
                });
            });
        });
    }
}