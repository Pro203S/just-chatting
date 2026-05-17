import { getDatabase } from "@/src/modules/database";
import { hashPassword } from "@/src/modules/password";
import { verifyAccessToken } from "@/src/modules/token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
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

        const { id } = await params;

        if (id === "me") return NextResponse.json({
            "id": user.id,
            "userId": user.userId,
            "name": user.name,
            "profile": user.profile
        }, { "status": 200 });

        const foundUser = users.find(v => v.id === id)?.value?.();
        if (!foundUser) return NextResponse.json({
            "message": "사용자를 찾을 수 없습니다."
        }, { "status": 404 });

        return NextResponse.json({
            "id": foundUser.id,
            "userId": foundUser.userId,
            "name": foundUser.name,
            "profile": foundUser.profile
        }, { "status": 200 });
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

        if (id !== "me") return NextResponse.json({
            "message": "본인이 아닌 유저는 삭제할 수 없습니다."
        }, { "status": 400 });
        
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

        if (id === "me") return NextResponse.json({
            "id": user.id,
            "userId": user.userId,
            "name": user.name,
            "profile": user.profile
        }, { "status": 200 });

        const foundUser = users.find(v => v.id === id)?.value?.();
        if (!foundUser) return NextResponse.json({
            "message": "사용자를 찾을 수 없습니다."
        }, { "status": 404 });

        return NextResponse.json({
            "id": foundUser.id,
            "userId": foundUser.userId,
            "name": foundUser.name,
            "profile": foundUser.profile
        }, { "status": 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

type Body = {
    id: string,
    pw: string,
    name: string,
    profile: string
};

export async function PUT(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const query = (await params).id;
        if (query !== "me") return NextResponse.json({
            "message": "본인이 아닌 유저는 수정할 수 없습니다."
        }, { "status": 400 });

        const { id, pw, name, profile }: Partial<Body> = await req.json();

        if (id && typeof id !== "string") return NextResponse.json({
            "message": "예기치 않은 오류에요."
        }, { "status": 415 });

        if (pw && typeof pw !== "string") return NextResponse.json({
            "message": "예기치 않은 오류에요."
        }, { "status": 415 });

        if (pw && pw.length < 8) return NextResponse.json({
            "message": "비밀번호는 8글자 이상이여야해요."
        }, { "status": 400 });

        if (name && typeof name !== "string") return NextResponse.json({
            "message": "예기치 않은 오류에요."
        }, { "status": 415 });
        
        if (profile && typeof profile !== "string") return NextResponse.json({
            "message": "예기치 않은 오류에요."
        }, { "status": 415 });

        const users = getDatabase().get("users");
        const user = users.find(v => v.userId === id);
        if (!user) return NextResponse.json({
            "code": "USER_NOT_FOUND",
            "message": "유저를 찾을 수 없어요."
        }, { "status": 403 });

        if (id) user.get("userId").set(id);
        if (pw) user.get("password").set(await hashPassword(pw));
        if (name) user.get("name").set(name);
        if (profile) user.get("profile").set(profile);

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}