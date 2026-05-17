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

        "messageCreate": (message: Message) => any;
        "messageDelete": (message: Message) => any;
        "messageEdit": (oldMsg: Message, newMsg: Message) => any;

        "roomCreate": (room: Room) => any;
        "roomEdit": (oldRoom: Room, newRoom: Room) => any;
        "roomJoin": (room: Room) => any;
        "roomKicked": (room: Room) => any;
        "roomLeave": (room: Room, user: APIUser) => any;
        "roomDelete": (room: Room) => any;

        "error": (code: number, reason: string) => any;
    };

    type SocketOnEvents = {
        "identify": (token: string) => any;
        "joinRoom": (roomId: `ROM-${number}`) => any;
    }

    // 언젠간 쓸모가 있지 않을까
    type SocketData = {
        [key: string]: any
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
        "content": string,
        "attachment": Attachment,
        "sender": User["id"];
    };

    type Room = {
        "id": `ROM-${number}`,
        "name": string,
        "icon": string,
        "members": User["id"][],
        "invitedUsers": User["id"][],
        "owner": User["id"];
        "messages": Message["id"][];
    };

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