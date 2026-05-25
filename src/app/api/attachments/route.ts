import { getAuthenticatedUserId, createTokenNotProvidedResponse, createUserNotFoundResponse } from "@/src/modules/apiAuth";
import { getDatabase } from "@/src/modules/database";
import generateId from "@/src/modules/generateId";
import { MakeApiAttachment } from "@/src/modules/makeApiType";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const { content }: { content: string } = await req.json();

        if (!content || typeof content !== "string") return NextResponse.json({
            "message": "malformed body"
        }, { "status": 400 });

        // base64 때문에 1.5배 오차 허용
        const contentLength = new TextEncoder().encode(content).length;
        if (contentLength > 25 * 1.5 * 1000 * 1000) return NextResponse.json({
            "message": "파일의 용량은 25MB 이하여야 해요."
        }, { "status": 413 });

        const database = getDatabase();
        const users = database.get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const attachments = database.get("attachments");
        const ath: Attachment = {
            "id": generateId("ATH"),
            "uploader": user.id,
            "size": contentLength,
            "url": content
        };

        attachments.add(ath);

        return NextResponse.json(MakeApiAttachment(ath));
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}