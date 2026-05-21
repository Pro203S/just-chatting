if (typeof window !== "undefined") {
    throw new Error("server-only module");
}

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "./database";
import { verifyAccessToken } from "./token";

export const AUTHENTICATED_USER_ID_HEADER = "x-authenticated-user-id";

export function isPublicApiRoute(pathname: string, method: string) {
    if (pathname.startsWith("/api/auth/")) {
        return true;
    }

    if (pathname === "/api/users" && method === "POST") {
        return true;
    }

    return false;
}

export function createTokenNotProvidedResponse() {
    return NextResponse.json({
        "code": "TOKEN_NOT_PROVIDED",
        "message": "로그인해주세요."
    }, { "status": 401 });
}

export function createInvalidTokenResponse() {
    return NextResponse.json({
        "code": "INVALID_TOKEN",
        "message": "다시 로그인 해주세요."
    }, { "status": 401 });
}

export function createUserNotFoundResponse() {
    return NextResponse.json({
        "code": "USER_NOT_FOUND",
        "message": "다시 가입해주세요."
    }, { "status": 403 });
}

export async function authenticateApiRequest(req: NextRequest) {
    const token = req.headers.get("authorization");
    if (!token) {
        return {
            "response": createTokenNotProvidedResponse()
        };
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
        return {
            "response": createInvalidTokenResponse()
        };
    }

    const user = getDatabase()
        .get("users")
        .find(v => v.id === payload.userId)
        ?.value?.();

    if (!user) {
        return {
            "response": createUserNotFoundResponse()
        };
    }

    return {
        "userId": user.id
    };
}

export function getAuthenticatedUserId(req: Pick<Request, "headers">) {
    const userId = req.headers.get(AUTHENTICATED_USER_ID_HEADER);
    return userId ? userId as User["id"] : null;
}
