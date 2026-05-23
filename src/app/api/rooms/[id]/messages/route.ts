import { getSocketServer } from "@/socket";
import { getAuthenticatedUserId, createTokenNotProvidedResponse, createUserNotFoundResponse } from "@/src/modules/apiAuth";
import { getDeletedUser } from "@/src/modules/constants";
import { getDatabase } from "@/src/modules/database";
import generateId from "@/src/modules/generateId";
import { MakeApiUser } from "@/src/modules/makeApiType";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const rawOffset = req.nextUrl.searchParams.get("offset");
        const rawCount = req.nextUrl.searchParams.get("count");

        let offset: number;
        let count: number;

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

        const users = getDatabase().get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const rooms = getDatabase().get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({ "message": "채팅방을 찾지 못했어요." }, { "status": 404 });

        const messageDB = getDatabase().get("messages");
        const messageCount = messageDB.value().length;
        const messages = messageDB.findAll((v, i) => {
            const flag = room.messages.includes(v.id);
            if (!flag) return false;

            const start = messageCount - offset;
            const end = start + count;
            return start >= i && i >= end;
        }).map(v => v.value());

        return NextResponse.json(messages.map(v => ({
            "id": v.id,
            "attachment": v.attachment,
            "content": v.content,
            "sender": users.find(u => u.id === v.sender)?.value?.() ?? getDeletedUser()
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
        const { body, attachment }: { body: string, attachment: string } = await req.json();

        if (!body || typeof body !== "string") return NextResponse.json({
            "message": "body was null"
        });

        if (!attachment || typeof attachment !== "string") return NextResponse.json({
            "message": "attachment was null"
        });

        // base64 때문에 +2MB 오차 허용
        const attachmentSize = new TextEncoder().encode(attachment).length;
        if (attachmentSize > 27 * 1000 * 1000) return NextResponse.json({
            "message": "파일의 용량은 25MB 미만이여야 해요."
        }, { "status": 413 });

        const { id } = await params;
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const users = getDatabase().get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const rooms = getDatabase().get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({ "message": "채팅방을 찾지 못했어요." }, { "status": 404 });

        const io = getSocketServer();

        const messages = getDatabase().get("messages");
        if (attachment) {
            const attachments = getDatabase().get("attachments");

            const ath = {
                "id": generateId("ATH"),
                "url": attachment,
                "size": attachmentSize
            }
            attachments.add(ath);

            const msgId = generateId("MSG");
            messages.add({
                "id": msgId,
                "sender": user.id,
                "attachment": ath.id
            });

            io.to(`room:${room.id}`).emit("messageCreate", {
                "id": msgId,
                "sender": MakeApiUser(user),
                "attachment": ath
            });

            return new Response(null, { "status": 204 });
        }

        const msgId = generateId("MSG");
        messages.add({
            "id": msgId,
            "sender": user.id,
            "content": body
        });

        io.to(`room:${room.id}`).emit("messageCreate", {
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
