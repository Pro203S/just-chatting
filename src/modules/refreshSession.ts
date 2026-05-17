import axios from "axios";

export default async function refreshSession() {
    const r = await axios.post("/api/auth/refresh", {}, {
        "withCredentials": true,
        "validateStatus": () => true
    });
    if (r.status !== 200) throw new Error(r.data.message);

    const data: APIAuthLogin = r.data;

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("expires_at", String(new Date().getTime() + (data.expires_in * 1000)));

    return true;
}