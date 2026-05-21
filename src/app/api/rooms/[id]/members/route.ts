import { getSocketServer } from "@/socket";
import { getDatabase } from "@/src/modules/database";
import { verifyAccessToken } from "@/src/modules/token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const { id } = await params;
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({
            "code": "TOKEN_NOT_PROVIDED",
            "message": "로그인해주세요."
        }, { "status": 401 });

        const payload = await verifyAccessToken(token);
        if (!payload) return NextResponse.json({
            "code": "INVALID_TOKEN",
            "message": "다시 로그인 해주세요."
        }, { "status": 401 });

        const { userId } = payload;

        const database = getDatabase();
        const users = database.get("users");

        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return NextResponse.json({
            "code": "USER_NOT_FOUND",
            "message": "다시 가입해주세요."
        }, { "status": 403 });

        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        const members = users.findAll(v => room.members.includes(v.id)).map(v => v.value());

        return NextResponse.json(members);
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const target = req.nextUrl.searchParams.get("target");
        if (!target) return NextResponse.json({
            "message": "강퇴할 대상이 지정되지 않았어요."
        }, { "status": 400 });

        const { id } = await params;
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({
            "code": "TOKEN_NOT_PROVIDED",
            "message": "로그인해주세요."
        }, { "status": 401 });

        const payload = await verifyAccessToken(token);
        if (!payload) return NextResponse.json({
            "code": "INVALID_TOKEN",
            "message": "다시 로그인 해주세요."
        }, { "status": 401 });

        const { userId } = payload;

        const database = getDatabase();
        const users = database.get("users");

        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return NextResponse.json({
            "code": "USER_NOT_FOUND",
            "message": "다시 가입해주세요."
        }, { "status": 403 });

        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id);
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        if (target === "me") {
            const members = room.get("members");
            const memberIndex = members.findIndex(v => v === userId);
            if (memberIndex === -1) return NextResponse.json({
                "message": "대상을 찾을 수 없습니다."
            }, { "status": 404 });

            const targetId = members.get(memberIndex).value();

            members.remove(memberIndex);

            const io = getSocketServer();
            io?.to(`user:${targetId}`).emit("roomKicked", room.value());
            io?.to(`room:${room.value().id}`).emit("roomLeave", room.value(), user);

            return new Response(null, { "status": 204 });
        }

        if (room.value().owner !== user.id) return NextResponse.json({
            "message": "방장만 변경할 수 있습니다."
        }, { "status": 403 });

        const members = room.get("members");
        const memberIndex = members.findIndex(v => v === target);
        if (memberIndex === -1) return NextResponse.json({
            "message": "대상을 찾을 수 없습니다."
        }, { "status": 404 });

        members.remove(memberIndex);

        const io = getSocketServer();
        io?.to(`user:${target}`).emit("roomKicked", room.value());
        io?.to(`room:${room.value().id}`).emit("roomLeave", room.value(), user);

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}