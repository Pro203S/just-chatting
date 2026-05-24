import { findSocketServer } from "@/socket";
import { getDatabase } from "@/src/modules/database";
import generateId from "@/src/modules/generateId";
import {
    createTokenNotProvidedResponse,
    createUserNotFoundResponse,
    getAuthenticatedUserId
} from "@/src/modules/apiAuth";
import { NextRequest, NextResponse } from "next/server";
import { MakeApiRoom } from "@/src/modules/makeApiType";

export async function GET(req: NextRequest) {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const rooms = database.get("rooms");
        const rawFoundRooms = rooms.findAll(v => v.members.includes(userId));
        const foundRooms: APIRoom[] = rawFoundRooms.map(v => MakeApiRoom(v.value()));
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

        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");

        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const rooms = database.get("rooms");
        const room: Room = {
            "id": generateId("ROM"),
            "invitedUsers": [],
            "members": [user.id],
            "name": name ?? `${user.name}님의 방`,
            "icon": user.profile,
            "owner": user.id,
            "messages": []
        };
        rooms.add(room);

        const io = findSocketServer();
        io?.to(`user:${user.id}`).emit("roomCreate", MakeApiRoom(room));

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
        const { id }: { id: string } = await req.json();

        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id);
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        const roomValue = room.value();
        if (!roomValue.invitedUsers.includes(userId)) return NextResponse.json({
            "message": "방에 초대되지 않았습니다."
        }, { "status": 403 });

        room.get("invitedUsers").set(roomValue.invitedUsers.filter(v => v !== userId));
        room.get("members").add(userId);

        const io = findSocketServer();
        io?.to(`user:${userId}`).emit("roomCreate", MakeApiRoom(roomValue));
        io?.to(`room:${roomValue.id}`).emit("roomJoin", MakeApiRoom(roomValue));

        io?.to(`user:${userId}`).socketsJoin(`room:${roomValue.id}`);

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}
