import { getAuthenticatedUserId, createTokenNotProvidedResponse, createUserNotFoundResponse } from "@/src/modules/apiAuth";
import { getDeletedUser } from "@/src/modules/constants";
import { getDatabase } from "@/src/modules/database";
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