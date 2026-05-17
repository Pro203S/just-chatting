import { getDatabase } from "@/src/modules/database";
import { verifyPassword } from "@/src/modules/password";
import { ACCESS_TOKEN_EXPIRES_IN, createAccessToken, createRefreshToken, REFRESH_TOKEN_EXPIRES_IN } from "@/src/modules/token";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Body = {
    id: string,
    pw: string
};

export async function POST(req: NextRequest) {
    try {
        const cookie = await cookies();
        const { id, pw }: Body = await req.json();

        if (!id || typeof id !== "string") return NextResponse.json({
            "message": "ID를 입력해주세요!"
        }, { "status": 415 });

        if (!pw || typeof pw !== "string") return NextResponse.json({
            "message": "비밀번호를 입력해주세요!"
        }, { "status": 415 });

        const users = getDatabase().get("users");
        const user = users.find((v) => v.userId === id)?.value?.();
        if (!user || !await verifyPassword(user.password, pw)) return NextResponse.json({
            "message": "ID 또는 비밀번호가 일치하지 않아요."
        }, { "status": 400 });

        cookie.set("refresh_token", await createRefreshToken(user.id), {
            "httpOnly": true,
            "secure": process.env.NODE_ENV === "production",
            "maxAge": REFRESH_TOKEN_EXPIRES_IN,
        });

        return NextResponse.json({
            "access_token": await createAccessToken(user.id),
            "expires_in": ACCESS_TOKEN_EXPIRES_IN
        }, { "status": 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}
