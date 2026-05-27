import { getSocketServer } from "@/socket";
import { getAuthenticatedUserId, createTokenNotProvidedResponse, createUserNotFoundResponse } from "@/src/modules/apiAuth";
import { getDeletedUser } from "@/src/modules/constants";
import { getDatabase } from "@/src/modules/database";
import generateId from "@/src/modules/generateId";
import { MakeApiAttachment, MakeApiUser } from "@/src/modules/makeApiType";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const rawOffset = req.nextUrl.searchParams.get("offset");
        const rawCount = req.nextUrl.searchParams.get("count");

        let offset: number = NaN;
        let count: number = NaN;

        if (rawOffset) {
            offset = Number(rawOffset);
            if (!offset) return NextResponse.json({
                "message": "offset이 number가 아니에요."
            }, { "status": 400 });
        }

        if (rawCount) {
            count = Number(rawCount);
            if (!count) return NextResponse.json({
                "message": "rawCount이 number가 아니에요."
            }, { "status": 400 });
        }

        const { id } = await params;
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({ "message": "채팅방을 찾지 못했어요." }, { "status": 404 });

        const messageDB = database.get("messages");
        let messages = messageDB.findAll(v => room.messages.includes(v.id)).map(v => v.value());

        messages = messages.filter(v => room.messages.includes(v.id));

        if (!isNaN(offset))
            messages = messages.slice(messages.length - offset);

        if (!isNaN(count))
            messages = messages.slice(0, count);

        return NextResponse.json(messages.map(v => ({
            "id": v.id,
            "attachment": v.attachment,
            "content": v.content,
            "sender": MakeApiUser(users.find(u => u.id === v.sender)?.value?.() ?? getDeletedUser())
        } as APIMessage)));
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
        const { body, attachmentId }: { body: string, attachmentId: Attachment["id"] } = await req.json();

        if (!body || typeof body !== "string") return NextResponse.json({
            "message": "body was null"
        }, { "status": 400 });

        if (attachmentId && typeof attachmentId !== "string") return NextResponse.json({
            "message": "attachment's type was wrong"
        }, { "status": 400 });

        const { id } = await params;
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id);
        if (!room) return NextResponse.json({ "message": "채팅방을 찾지 못했어요." }, { "status": 404 });
        const roomId = room.value().id;

        const io = getSocketServer();

        const messages = database.get("messages");
        if (attachmentId) {
            const attachments = database.get("attachments");
            const foundAttachment = attachments.find(v => v.id === attachmentId)?.value?.();

            if (!foundAttachment) return NextResponse.json({
                "message": "파일을 찾지 못했어요."
            }, { "status": 404 });

            const msgId = generateId("MSG");
            messages.add({
                "id": msgId,
                "sender": user.id,
                "attachment": foundAttachment.id
            });
            room.get("messages").add(msgId);

            io.to(`room:${roomId}`).emit("messageCreate", {
                "id": msgId,
                "sender": MakeApiUser(user),
                "attachment": MakeApiAttachment(foundAttachment)
            });

            return new Response(null, { "status": 204 });
        }

        const msgId = generateId("MSG");
        messages.add({
            "id": msgId,
            "sender": user.id,
            "content": body
        });
        room.get("messages").add(msgId);

        io.to(`room:${roomId}`).emit("messageCreate", {
            "id": msgId,
            "sender": MakeApiUser(user),
            "content": body
        });

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}
