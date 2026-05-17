import Shadowly from "shadowly";
import * as fs from 'node:fs';

const DB_PATH = "./database.json";

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
        "users": [],
        "attachments": [],
        "messages": [],
        "rooms": []
    }), "utf-8");
}

export const getDatabase = () => new Shadowly<Database>(DB_PATH);