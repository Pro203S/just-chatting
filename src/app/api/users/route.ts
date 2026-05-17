import { getDatabase } from "@/src/modules/database";
import generateId from "@/src/modules/generateId";
import { hashPassword } from "@/src/modules/password";
import { NextRequest, NextResponse } from "next/server";

type Body = {
    id: string,
    pw: string,
    name: string
};

export async function POST(req: NextRequest) {
    try {
        const { id, pw, name }: Body = await req.json();

        if (!id || typeof id !== "string") return NextResponse.json({
            "message": "ID를 입력해주세요!"
        }, { "status": 415 });

        if (!pw || typeof pw !== "string") return NextResponse.json({
            "message": "비밀번호를 입력해주세요!"
        }, { "status": 415 });

        if (pw.length < 8) return NextResponse.json({
            "message": "비밀번호는 8글자 이상이여야해요."
        }, { "status": 400 });

        if (!name || typeof name !== "string") return NextResponse.json({
            "message": "닉네임을 입력해주세요!"
        }, { "status": 415 });

        const users = getDatabase().get("users");

        if (users.find(v => v.userId === id)) return NextResponse.json({
            "message": "이미 이 ID를 가진 유저가 존재해요."
        }, { "status": 409 });

        const user: User = {
            "id": generateId("USR"),
            "userId": id,
            name,
            "password": await hashPassword(pw)
        };

        users.add(user);

        return new Response(null, { "status": 204 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id, pw, name, profile }: Partial<Body & { "profile": string }> = await req.json();

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