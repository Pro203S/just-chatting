import { getDatabase } from "@/src/modules/database";
import { ACCESS_TOKEN_EXPIRES_IN, createAccessToken, createRefreshToken, REFRESH_TOKEN_EXPIRES_IN, verifyRefreshToken } from "@/src/modules/token";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const cookie = await cookies();
        const refreshToken = cookie.get("refresh_token")?.value;
        if (!refreshToken) return NextResponse.json({
            "code": "TOKEN_NOT_PROVIDED",
            "message": "다시 로그인 해주세요."
        });

        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) return NextResponse.json({
            "code": "INVALID_TOKEN",
            "message": "다시 로그인 해주세요."
        });

        const { userId } = payload;

        const database = getDatabase();
        const users = database.get("users");

        const user = users.find(v => v.id === userId)?.value?.();
        if (!user) return NextResponse.json({
            "code": "USER_NOT_FOUND",
            "message": "다시 가입해주세요."
        }, { "status": 403 });

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