import { getSocketServer } from "@/socket";
import { getAuthenticatedUserId, createTokenNotProvidedResponse, createUserNotFoundResponse } from "@/src/modules/apiAuth";
import { getDatabase } from "@/src/modules/database";
import { MakeApiUser } from "@/src/modules/makeApiType";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const { id } = await params;

        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const socket = getSocketServer();
        socket.to(`room:${id}`).emit("inputing", MakeApiUser(user));

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

        const database = getDatabase();
        const users = database.get("users");
        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

        const socket = getSocketServer();
        socket.to(`room:${id}`).emit("cancelInputing", MakeApiUser(user));

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}