import { getDatabase } from "@/src/modules/database";
import { verifyAccessToken } from "@/src/modules/token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const { id } = await params;
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
            "message": "다시 가입해주세요."
        }, { "status": 403 });

        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

        return NextResponse.json(room, { "status": 200 });
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
            "message": "다시 가입해주세요."
        }, { "status": 403 });

        if (users.findIndex(v => v.id === invite) === -1) return NextResponse.json({
            "message": "초대할 상대를 찾을 수 없습니다."
        }, { "status": 403 });

        const rooms = database.get("rooms");
        const room = rooms.find(v => v.id === id)?.value?.();
        if (!room) return NextResponse.json({
            "message": "방을 찾을 수 없습니다."
        }, { "status": 404 });

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
            "message": "다시 가입해주세요."
        }, { "status": 403 });

        const rooms = database.get("rooms");

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
            "message": "다시 가입해주세요."
        }, { "status": 403 });

        const rooms = database.get("rooms");

    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}