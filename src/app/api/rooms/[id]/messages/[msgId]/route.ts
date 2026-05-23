import { getSocketServer } from "@/socket";
import { getAuthenticatedUserId, createTokenNotProvidedResponse, createUserNotFoundResponse } from "@/src/modules/apiAuth";
import { getDatabase } from "@/src/modules/database";
import { MakeApiMessage } from "@/src/modules/makeApiType";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: {
    "params": Promise<{ id: string, msgId: Message["id"] }>
}) {
    try {
        const { body }: { body: string } = await req.json();

        if (!body || typeof body !== "string") return NextResponse.json({
            "message": "body was null"
        }, { "status": 400 });

        const { id, msgId } = await params;
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const users = getDatabase().get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const rooms = getDatabase().get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({ "message": "채팅방을 찾지 못했어요." }, { "status": 404 });

        const messages = getDatabase().get("messages");
        const target = messages.find(v => v.id === msgId);
        if (!target) return NextResponse.json({ "message": "메시지를 찾지 못했어요." }, { "status": 404 }); 

        const old = target.value();
        target.get("content").set(body);

        const io = getSocketServer();
        io.to(`room:${room.id}`).emit("messageEdit", MakeApiMessage(old), MakeApiMessage({
            ...old,
            "content": body
        }));

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: {
    "params": Promise<{ id: string, msgId: Message["id"] }>
}) {
    try {
        const { body }: { body: string } = await req.json();

        if (!body || typeof body !== "string") return NextResponse.json({
            "message": "body was null"
        }, { "status": 400 });

        const { id, msgId } = await params;
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const users = getDatabase().get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const rooms = getDatabase().get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({ "message": "채팅방을 찾지 못했어요." }, { "status": 404 });

        const messages = getDatabase().get("messages");
        const target = messages.findIndex(v => v.id === msgId);
        if (target === -1) return NextResponse.json({ "message": "메시지를 찾지 못했어요." }, { "status": 404 }); 

        const targetMsg = messages.get(target).value();
        messages.remove(target);
        const io = getSocketServer();
        io.to(`room:${room.id}`).emit("messageDelete", MakeApiMessage(targetMsg));

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}