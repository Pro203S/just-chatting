declare global {
    namespace NodeJS {
        interface ProcessEnv {
            readonly JWT_ACCESS_SECRET: string;
            readonly JWT_REFRESH_SECRET: string;

            readonly ACCESS_TOKEN_EXPIRES_IN: string;
            readonly REFRESH_TOKEN_EXPIRES_IN: string;
        }
    }

    type IdPrefixes = "USR" | "ATH" | "MSG" | "ROM";
    type IdTypes = User["id"] | Attachment["id"] | Message["id"] | Room["id"];

    type User = {
        "id": `USR-${number}`,
        "userId": string,
        "name": string,
        "profile"?: string,
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

    type APIError = {
        "message": string
    };

    type APIAuthLogin = {
        "access_token": string,
        "expires_in": number
    };
}

export { };