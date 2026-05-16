import { randomInt } from "crypto";
import { Database } from "./database";

const HasDuplicate = (array: { "id": string }[], id: IdTypes) => array.map(v => v.id).includes(id);

export default function generateId(type: IdPrefixes): IdTypes {
    const id: IdTypes = `${type}-${randomInt(100000000)}`;

    let dup = false;

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

    return id;
}