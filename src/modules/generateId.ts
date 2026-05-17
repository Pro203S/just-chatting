import { randomInt } from "crypto";
import { getDatabase } from "./database";

const HasDuplicate = (array: { "id": string }[], id: IdTypes) => array.map(v => v.id).includes(id);

export default function generateId<T extends IdPrefixes>(type: T): `${T}-${number}` {
    const id: IdTypes = `${type}-${randomInt(2147483647)}`;

    let dup = false;

    const Database = getDatabase();

    switch (type) {
        case "USR":
            dup = HasDuplicate(Database.get("users").value(), id);
            break;
        case "ATH":
            dup = HasDuplicate(Database.get("attachments").value(), id);
            break;
        case "MSG":
            dup = HasDuplicate(Database.get("messages").value(), id);
            break;
        case "ROM":
            dup = HasDuplicate(Database.get("rooms").value(), id);
            break;
    }

    if (dup) return generateId(type);

    return id as `${T}-${number}`;
}