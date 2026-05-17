import { findSocketServer } from "@/socket";
import { getDatabase } from "@/src/modules/database";
import generateId from "@/src/modules/generateId";
import { verifyAccessToken } from "@/src/modules/token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
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
            "message": "유저를 찾을 수 없습니다."
        }, { "status": 403 });

        const rooms = database.get("rooms");
        const rawFoundRooms = rooms.findAll(v => v.members.map(v => v.id).includes(user.id));
        const foundRooms = rawFoundRooms.map(v => v.value());
        return NextResponse.json(foundRooms, {
            "status": 200
        });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name }: { name: string } = await req.json();

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
            "message": "유저를 찾을 수 없습니다."
        }, { "status": 403 });

        const rooms = database.get("rooms");
        const room: Room = {
            "id": generateId("ROM"),
            "invitedUsers": [],
            "members": [user],
            "name": name ?? `${user.name}님의 방`,
            "icon": user.profile
        };
        rooms.add(room);

        const io = findSocketServer();
        io?.to(`user:${user.id}`).emit("roomCreate", room);

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { name }: { name: string } = await req.json();

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
            "message": "유저를 찾을 수 없습니다."
        }, { "status": 403 });

        const rooms = database.get("rooms");
        rooms.add({
            "id": generateId("ROM"),
            "invitedUsers": [],
            "members": [user],
            "name": name ?? `${user.name}님의 방`,
            "icon": user.profile
        });

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}
