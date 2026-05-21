import { getSocketServer } from "@/socket";
import { getDatabase } from "@/src/modules/database";
import {
    createTokenNotProvidedResponse,
    getAuthenticatedUserId
} from "@/src/modules/apiAuth";
import { NextRequest, NextResponse } from "next/server";
import { getDeletedUser } from "@/src/modules/constants";
import { MakeApiRoom, MakeApiUser } from "@/src/modules/makeApiType";

export async function GET(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const { id } = await params;
        if (!getAuthenticatedUserId(req)) return createTokenNotProvidedResponse();

        const rooms = getDatabase().get("rooms");
        const users = getDatabase().get("users");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        return NextResponse.json(({
            "id": room.id,
            "icon": room.icon,
            "members": room.members.map(m => {
                const found = users.find(u => u.id === m)?.value?.();
                if (!found) return getDeletedUser();

                return MakeApiUser(found);
            }),
            "name": room.name
        } as APIRoom), { "status": 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function POST(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const { invite }: { invite: string } = await req.json();

        if (!invite) return NextResponse.json({
            "message": "초대할 사람을 제공해주세요."
        }, { "status": 400 });

        const { id } = await params;
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        const target = users.find(v => v.userId === invite);
        if (!target) return NextResponse.json({
            "message": "초대할 상대를 찾을 수 없습니다."
        }, { "status": 404 });

        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id);
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        if (room.value().owner !== userId) return NextResponse.json({
            "message": "방장만 초대할 수 있습니다."
        }, { "status": 403 });

        const invitedUsers = room.get("invitedUsers").value();

        if (room.value().members.includes(target.value().id)) return NextResponse.json({
            "message": "이미 방에 참여해있습니다."
        }, { "status": 400 });

        if (invitedUsers.includes(target.value().id)) return NextResponse.json({
            "message": "이미 초대했습니다."
        }, { "status": 400 });

        room.get("invitedUsers").add(target.value().id);

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function PUT(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const { id } = await params;
        const { name, icon, owner }: Partial<Room> = await req.json();
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const rooms = getDatabase().get("rooms");
        const room = rooms.find(v => v.id === id);
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        if (room.value().owner !== userId) return NextResponse.json({
            "message": "방장만 변경할 수 있습니다."
        }, { "status": 403 });

        const oldValue = room.value();

        if (name) room.get("name").set(name);
        if (icon) room.get("icon").set(icon);
        if (owner) room.get("owner").set(owner);

        const io = getSocketServer();
        io?.to(`room:${room.value().id}`).emit("roomEdit", MakeApiRoom(oldValue), MakeApiRoom(room.value()));

        return new Response(null, { "status": 204 });
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
        const { id } = await params;
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const rooms = getDatabase().get("rooms");
        const room = rooms.find(v => v.id === id);
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        if (room.value().owner !== userId) return NextResponse.json({
            "message": "방장만 변경할 수 있습니다."
        }, { "status": 403 });

        const io = getSocketServer();
        io?.to(`room:${room.value().id}`).emit("roomDelete", MakeApiRoom(room.value()));

        rooms.remove(rooms.findIndex(v => v.id === room.value().id));

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}
