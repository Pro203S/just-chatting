import { NextResponse, type NextRequest } from "next/server";
import {
    AUTHENTICATED_USER_ID_HEADER,
    authenticateApiRequest,
    isPublicApiRoute
} from "@/src/modules/apiAuth";

export async function proxy(req: NextRequest) {
    if (isPublicApiRoute(req.nextUrl.pathname, req.method)) {
        return NextResponse.next();
    }

    const auth = await authenticateApiRequest(req);
    if ("response" in auth) {
        return auth.response;
    }

    const headers = new Headers(req.headers);
    headers.set(AUTHENTICATED_USER_ID_HEADER, auth.userId);

    return NextResponse.next({
        "request": {
            headers
        }
    });
}

export const config = {
    "matcher": "/api/:path*"
};
