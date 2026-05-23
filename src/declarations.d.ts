declare global {
    namespace NodeJS {
        interface ProcessEnv {
            readonly JWT_ACCESS_SECRET: string;
            readonly JWT_REFRESH_SECRET: string;

            readonly ACCESS_TOKEN_EXPIRES_IN: string;
            readonly REFRESH_TOKEN_EXPIRES_IN: string;
        }
    }

    type SocketEmitEvents = {
        "identify": () => any;
        "welcome": (session: APIUser) => any;

        "inputing": (user: APIUser) => any;
        "cancelInputing": (user: APIUser) => any;

        "messageCreate": (message: APIMessage) => any;
        "messageDelete": (message: APIMessage) => any;
        "messageEdit": (oldMsg: APIMessage, newMsg: APIMessage) => any;

        "roomCreate": (room: APIRoom) => any;
        "roomEdit": (oldRoom: APIRoom, newRoom: APIRoom) => any;
        "roomJoin": (room: APIRoom) => any;
        "roomKicked": (room: APIRoom) => any;
        "roomLeave": (room: APIRoom, user: APIUser) => any;
        "roomDelete": (room: APIRoom) => any;

        "error": (code: number, reason: string) => any;
    };

    type SocketOnEvents = {
        "identify": (token: string) => any;
        "joinRoom": (roomId: `ROM-${number}`) => any;
    }

    // 언젠간 쓸모가 있지 않을까
    type SocketData = {
        "userData": APIUser;
    };

    type IdPrefixes = "USR" | "ATH" | "MSG" | "ROM";
    type IdTypes = User["id"] | Attachment["id"] | Message["id"] | Room["id"];

    type User = {
        "id": `USR-${number}`,
        "userId": string,
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
        "content"?: string,
        "attachment"?: Attachment["id"],
        "sender": User["id"];
    };

    type APIMessage = {
        "id": Message["id"],
        "content"?: string,
        "attachment"?: Attachment,
        "sender": APIUser
    }

    type Room = {
        "id": `ROM-${number}`,
        "name": string,
        "icon": string,
        "members": User["id"][],
        "invitedUsers": User["id"][],
        "owner": User["id"];
        "messages": Message["id"][];
    };

    type APIRoom = {
        "id": Room["id"];
        "name": string,
        "icon": string,
        "members": APIUser[],
        "owner": User["id"]
    }

    type Database = {
        "users": User[],
        "attachments": Attachment[],
        "messages": Message[],
        "rooms": Room[]
    };

    type APIError = {
        "code"?: string,
        "message": string
    };

    type APIAuthError = {
        "code": "TOKEN_NOT_PROVIDED" | "INVALID_TOKEN" | "USER_NOT_FOUND",
        "message": string
    };

    type APIAuthLogin = {
        "access_token": string,
        "expires_in": number
    };

    type APIUsersMePUT = {
        "password": boolean,
        "name": boolean,
        "profile": boolean
    }
}

export { };