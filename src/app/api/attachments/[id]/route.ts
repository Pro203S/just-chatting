import { getAuthenticatedUserId, createTokenNotProvidedResponse, createUserNotFoundResponse } from "@/src/modules/apiAuth";
import { getDatabase } from "@/src/modules/database";
import { MakeApiAttachment } from "@/src/modules/makeApiType";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: {
    params: Promise<{ id: string }>
}) {
    try {
        const { id } = await params;

        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const attachments = database.get("attachments");
        const found = attachments.find(v => v.id === id);
        if (!found) return NextResponse.json({
            "message": "파일을 찾지 못했어요."
        }, { "status": 404 });

        return NextResponse.json(MakeApiAttachment(found.value()));
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: {
    params: Promise<{ id: string }>
}) {
    try {
        const { id } = await params;

        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const attachments = database.get("attachments");
        const found = attachments.findIndex(v => v.id === id);
        if (found === -1) return NextResponse.json({
            "message": "파일을 찾지 못했어요."
        }, { "status": 404 });

        attachments.remove(found);

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}