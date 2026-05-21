import { getDeletedUser } from "./constants";
import { getDatabase } from "./database";

export function MakeApiUser(user: User): APIUser {
    return {
        "id": user.id,
        "name": user.name,
        "profile": user.profile,
        "userId": user.userId
    };
}

export function MakeApiRoom(room: Room): APIRoom {
    const db = getDatabase().get("users");

    return {
        "id": room.id,
        "icon": room.icon,
        "name": room.name,
        "members": room.members.map(v => db.find(u => u.id === v)?.value?.() ?? getDeletedUser()),
        "owner": room.owner
    };
}