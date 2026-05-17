import { cookies } from "next/headers";

export async function POST() {
    const cookie = await cookies();
    cookie.delete("refresh_token");

    return new Response(null, { "status": 204 });
}
