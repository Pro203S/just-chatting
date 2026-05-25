import { getDeletedAttachment, getDeletedUser } from "./constants";
import { getDatabase } from "./database";

export function MakeApiUser(user: User | APIUser): APIUser {
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

export function MakeApiMessage(message: Message): APIMessage {
    const db = getDatabase().get("users");
    const aths = getDatabase().get("attachments");

    const found = aths.find(v => v.id === message.attachment)?.value?.();

    return {
        "id": message.id,
        "sender": db.find(v => v.id === message.sender)?.value?.() ?? getDeletedUser(),
        "content": message.content,
        "attachment": found ? MakeApiAttachment(found) : getDeletedAttachment()
    };
}

export function MakeApiAttachment(ath: Attachment): APIAttachment {
    const db = getDatabase().get("users");

    return {
        "id": ath.id,
        "size": ath.size,
        "uploader": db.find(v => v.id === ath.uploader)?.value?.() ?? getDeletedUser(),
        "url": ath.url
    };
}