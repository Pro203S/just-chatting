declare global {
    namespace NodeJs {
        interface ProcessEnv {
            readonly SECRET: string;
        }
    }

    type IdPrefixes = "USR" | "ATH" | "MSG" | "ROM";
    type IdTypes = User["id"] | Attachment["id"] | Message["id"] | Room["id"];

    type User = {
        "id": `USR-${number}`,
        "name": string,
        "profile": string,
        "password": string
    };

    type APIUser = Omit<User, "password">;

    type Attachment = {
        "id": `ATH-${number}`,
        "url": string,
        "size": number
    };

    type Message = {
        "id": `MSG-${number}`,
        "content": string,
        "attachment": Attachment
    };

    type Room = {
        "id": `ROM-${number}`,
        "name": string,
        "members": APIUser[]
    };

    type Database = {
        "users": User[],
        "attachments": Attachment[],
        "messages": Message[],
        "rooms": Room[]
    };
}

export { };