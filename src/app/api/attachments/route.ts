import { getAuthenticatedUserId, createTokenNotProvidedResponse } from "@/src/modules/apiAuth";
import { getDatabase } from "@/src/modules/database";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return createTokenNotProvidedResponse();

        const database = getDatabase();
        const users = database.get("users");
        
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            "message": e.message
        }, { "status": 500 });
    }
}