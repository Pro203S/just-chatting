import { getDatabase } from "@/src/modules/database";
import {
    createTokenNotProvidedResponse,
    getAuthenticatedUserId
} from "@/src/modules/apiAuth";
import { NextRequest, NextResponse } from "next/server";
import { MakeApiUser } from "@/src/modules/makeApiType";

export async function GET(req: NextRequest) {
    try {
        if (!getAuthenticatedUserId(req)) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({
            "message": "사용자를 찾을 수 없습니다."
        }, { "status": 404 });

        const foundUser = users.find(v => v.id === id)?.value?.();
        if (!foundUser) return NextResponse.json({
            "message": "사용자를 찾을 수 없습니다."
        }, { "status": 404 });

        return NextResponse.json(MakeApiUser(foundUser), { "status": 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}
