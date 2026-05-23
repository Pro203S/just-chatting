import { getDatabase } from "@/src/modules/database";
import { hashPassword } from "@/src/modules/password";
import {
    createTokenNotProvidedResponse,
    createUserNotFoundResponse,
    getAuthenticatedUserId
} from "@/src/modules/apiAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: {
    "params": Promise<{ id: string }>
}) {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const users = getDatabase().get("users");
        const { id } = await params;

        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return createUserNotFoundResponse();

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

        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");

        const user = users.find(v => v.id === userId);
        if (!user) return createUserNotFoundResponse();

        const index = users.findIndex(v => v.id === user.get("id").value());
        if (index === -1) return NextResponse.json({
            "message": "asdf"
        }, { "status": 404 });

        users.remove(index);

        return new Response(null, { "status": 204 });
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

        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const { pw, name, profile }: Partial<Body> = await req.json();

        if (pw && typeof pw !== "string") return NextResponse.json({
            "message": "예기치 않은 오류에요."
        }, { "status": 415 });

        if (name && typeof name !== "string") return NextResponse.json({
            "message": "예기치 않은 오류에요."
        }, { "status": 415 });

        if (profile && typeof profile !== "string") return NextResponse.json({
            "message": "예기치 않은 오류에요."
        }, { "status": 415 });

        // base64 때문에 +2MB 오차 허용
        if (new TextEncoder().encode(profile).length > 18 * 1000 * 1000) return NextResponse.json({
            "message": "프로필 사진의 용량은 16MB 미만이여야 해요."
        }, { "status": 413 });

        const users = getDatabase().get("users");
        const user = users.find(v => v.id === userId);
        if (!user) return createUserNotFoundResponse();

        if (pw && pw.length >= 8) user.get("password").set(await hashPassword(pw));
        if (name) user.get("name").set(name);
        if (profile) user.get("profile").set(profile);

        return NextResponse.json({
            "password": pw && pw.length >= 8,
            "name": Boolean(name),
            "profile": Boolean(profile)
        });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}
