import Shadowly from "shadowly";
import * as fs from 'node:fs';

const DB_PATH = "./database.json";

if (!fs.existsSync(DB_PATH))
    Shadowly.generateNewJson(DB_PATH, false);


export const Database = new Shadowly<Database>(DB_PATH);