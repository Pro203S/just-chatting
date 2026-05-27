"use client";

import { useEffect, useRef, useState } from 'react';
import desktopCss from './desktop.module.css';
import mobileCss from './mobile.module.css';
import Header from "@/src/components/header";
import { useRouter } from 'next/navigation';
import REST from '@/src/modules/rest';
import { io, Socket } from 'socket.io-client';
import refreshSession from '@/src/modules/refreshSession';
import useWindowDimensions from '@/src/modules/useWindowDimensions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBars, faPaperPlane, faPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import Form from '@/src/components/form';
import Dropdown, { DropdownItem } from '@/src/components/dropdown';
import Dialog, { DialogButton, DialogDescription } from '@/src/components/dialog';
import Ballon from '@/src/components/ballon';

type RoomMessageResponse = {
    "id": APIMessage["id"];
    "content"?: APIMessage["content"];
    "attachment"?: Attachment["id"] | APIAttachment;
    "sender": APIUser | User;
};

function getExtensionFromDataUrl(dataUrl: string): string | null {
    const match = dataUrl.match(/^data:([^;]+);/);

    if (!match) {
        return null;
    }

    const mime = match[1];

    const mimeToExt: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "text/plain": "txt",
        "application/json": "json",
        "application/pdf": "pdf",
    };

    return mimeToExt[mime] ?? mime.split("/")[1] ?? null;
}

export default function Page() {
    const router = useRouter();
    const socket = useRef<ReturnType<typeof io> | null>(null);
    const currentRoomRef = useRef<APIRoom | undefined>(undefined);
    const sessionRef = useRef<APIUser | undefined>(undefined);
    const inputMessageRef = useRef<HTMLInputElement | null>(null);
    const sendMessageRef = useRef<HTMLButtonElement | null>(null);
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const attachmentCacheRef = useRef<Partial<Record<Attachment["id"], APIAttachment>>>({});

    const inputingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { width } = useWindowDimensions();

    const [css, setCss] = useState<Record<string, string>>(desktopCss);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<APIUser>();
    const [rooms, setCurrentRooms] = useState<APIRoom[]>([]);

    const [currentRoom, setCurrentRoom] = useState<APIRoom>();
    const [members, setMembers] = useState<APIUser[]>([]);
    const [messages, setMessages] = useState<APIMessage[]>([]);
    const [inputers, setInputers] = useState<{ "id": string, "name": string }[]>([]);

    const [createRoomShow, setCreateRoomShow] = useState(false);
    const [createRoomLoading, setCreateRoomLoading] = useState(false);
    const [createRoomError, setCreateRoomError] = useState<string>();

    const [joinRoomShow, setJoinRoomShow] = useState(false);
    const [joinRoomLoading, setJoinRoomLoading] = useState(false);
    const [joinRoomError, setJoinRoomError] = useState<string>();

    const [inviteUserShow, setInviteUserShow] = useState(false);
    const [inviteUserLoading, setInviteUserLoading] = useState(false);
    const [inviteUserError, setInviteUserError] = useState<string>();

    const [roomNameShow, setRoomNameShow] = useState(false);
    const [roomNameLoading, setRoomNameLoading] = useState(false);
    const [roomNameError, setRoomNameError] = useState<string>();

    const [dialogTitle, setDialogTitle] = useState("");
    const [dialogDesc, setDialogDesc] = useState<DialogDescription>("");
    const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogClosable, setDialogClosable] = useState(true);

    //#region 유틸 함수

    const reloadWithWarning = (message: string) => {
        alert(message);
        location.reload();
    };

    const confirmDialog = (title: string, message: string, opt?: Partial<{
        "closable": boolean,
        "ok": string,
        "cancel": string
    }>) => new Promise<boolean>(r => {
        setDialogTitle(title);
        setDialogDesc(message);
        setDialogButtons([
            {
                "text": opt?.cancel ?? "취소",
                "onClick": () => {
                    r(false);
                    setDialogOpen(false);
                }
            },
            {
                "text": opt?.ok ?? "확인",
                "onClick": () => {
                    r(true);
                    setDialogOpen(false);
                }
            }
        ]);
        setDialogClosable(opt?.closable ?? true);
        setDialogOpen(true);
    });

    const showErrorDialog = (msg: string) => {
        setDialogTitle("오류");
        setDialogDesc(msg);
        setDialogButtons([
            {
                "text": "확인",
                "onClick": () => {
                    setDialogOpen(false);
                }
            }
        ]);
        setDialogClosable(true);
        setDialogOpen(true);
    };

    const resolveAttachment = async (attachment: Attachment["id"] | APIAttachment): Promise<APIAttachment> => {
        if (typeof attachment !== "string") {
            attachmentCacheRef.current[attachment.id] = attachment;
            return attachment;
        }

        const cached = attachmentCacheRef.current[attachment];
        if (cached) return cached;

        const r = await REST<APIAttachment, APIError>(`/api/attachments/${attachment}`);
        if (!r.success) {
            throw new Error(r.data.message);
        }

        attachmentCacheRef.current[attachment] = r.data;

        return r.data;
    };

    const resolveProfile = async (profile: UserProfile): Promise<UserProfile> => {
        if (profile.type === "asset") return profile;

        const attachment = await resolveAttachment(profile.url);

        return {
            "type": "asset",
            "url": attachment.url
        };
    };

    const resolveUser = async (user: APIUser | User): Promise<APIUser> => ({
        "id": user.id,
        "name": user.name,
        "profile": await resolveProfile(user.profile),
        "userId": user.userId
    });

    const resolveRoom = async (room: APIRoom): Promise<APIRoom> => ({
        ...room,
        "icon": await resolveProfile(room.icon),
        "members": await Promise.all(room.members.map(resolveUser))
    });

    const resolveMessage = async (message: RoomMessageResponse | APIMessage): Promise<APIMessage> => ({
        "id": message.id,
        "content": message.content,
        "sender": await resolveUser(message.sender),
        "attachment": message.attachment ? await resolveAttachment(message.attachment) : undefined
    });

    const syncMembersFromRoom = (room: APIRoom) => {
        setMembers(room.members.filter(member => member.id !== sessionRef.current?.id));
    };

    const upsertRoom = (room: APIRoom) => {
        setCurrentRooms(v => {
            const index = v.findIndex(foundRoom => foundRoom.id === room.id);
            if (index === -1) return [
                room,
                ...v
            ];

            const nextRooms = [...v];
            nextRooms[index] = room;

            return nextRooms;
        });

        if (currentRoomRef.current?.id === room.id) {
            setCurrentRoom(room);
            syncMembersFromRoom(room);
        }
    };

    const deleteRoom = (room: APIRoom) => {
        setCurrentRooms(v => v.filter(foundRoom => foundRoom.id !== room.id));

        if (currentRoomRef.current?.id !== room.id) return;

        setCurrentRoom(undefined);
        setMembers([]);
        setMessages([]);
        setInputers([]);
    };

    //#endregion

    useEffect(() => {
        setCss(width > 650 ? desktopCss : mobileCss);
    }, [width]);

    useEffect(() => {
        currentRoomRef.current = currentRoom;
    }, [currentRoom]);

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    useEffect(() => {
        (async () => {
            try {
                const initalizeSocket = () => {
                    let doNotReconnect = false;

                    const sock: Socket<SocketEmitEvents, SocketOnEvents> = io({
                        "host": location.host,
                        "path": "/socket",
                        "autoConnect": false
                    });

                    //#region 소켓 기본 이벤트

                    sock.on("error", async (code, reason) => {
                        doNotReconnect = true;
                        sock.disconnect();
                        if (code === 101) {
                            await refreshSession();
                            location.reload();
                            return;
                        }

                        alert(reason);

                        if (Math.floor(code / 100) === 1) {
                            localStorage.removeItem("access_token");
                            localStorage.removeItem("expires_in");

                            router.push("/login");
                            return;
                        }

                        router.push("/");
                        return;
                    });

                    sock.on("disconnect", () => {
                        if (!doNotReconnect)
                            socket.current = initalizeSocket();

                        sock.removeAllListeners();
                    });

                    sock.on("identify", async () => {
                        try {
                            if (!localStorage.getItem("access_token")) {
                                await refreshSession();
                            }
                            sock.emit("identify", localStorage.getItem("access_token") ?? "");
                        } catch {
                            router.push("/login");
                            return;
                        }
                    });

                    //#endregion

                    //#region 채팅방 관련 이벤트

                    sock.on("roomCreate", async (room) => {
                        upsertRoom(await resolveRoom(room));
                    });

                    sock.on("roomJoin", async (room) => {
                        upsertRoom(await resolveRoom(room));
                    });
                    sock.on("roomEdit", async (_, room) => {
                        upsertRoom(await resolveRoom(room));
                    });
                    sock.on("roomLeave", async (room) => {
                        const resolvedRoom = await resolveRoom(room);
                        upsertRoom(resolvedRoom);
                        setInputers(v => v.filter(user => resolvedRoom.members.some(member => member.id === user.id)));
                    });

                    sock.on("roomKicked", deleteRoom);
                    sock.on("roomDelete", deleteRoom);

                    //#endregion

                    //#region inputing 관련 이벤트

                    sock.on("inputing", (user) => {
                        if (user.id === sessionRef.current?.id) return;

                        setInputers(v => {
                            if (v.some(inputer => inputer.id === user.id)) return v;

                            return [
                                ...v,
                                { "id": user.id, "name": user.name }
                            ];
                        });
                    });
                    sock.on("cancelInputing", (user) => {
                        setInputers(v => v.filter(u => u.id !== user.id));
                    });

                    //#endregion

                    //#region 메시지 관련 이벤트

                    sock.on("messageCreate", async (message) => {
                        const resolvedMessage = await resolveMessage(message);

                        setMessages(v => [...v, resolvedMessage]);
                    });
                    sock.on("messageEdit", async (oldMessage, newMessage) => {
                        const resolvedMessage = await resolveMessage(newMessage);

                        setMessages(v => v.map(message => message.id === oldMessage.id ? resolvedMessage : message));
                    });
                    sock.on("messageDelete", (message) => {
                        setMessages(v => v.filter(foundMessage => foundMessage.id !== message.id));
                    });

                    //#endregion

                    sock.connect();

                    return sock;
                };

                const sock = initalizeSocket();
                socket.current = sock;

                const welcomeSession: APIUser = await new Promise<APIUser>((resolve) => sock.once("welcome", resolve));
                const resolvedSession = await resolveUser(welcomeSession);

                setSession(resolvedSession);
                setLoading(false);

                const r = await REST<APIRoom[], APIError>("/api/rooms");
                if (!r.success) {
                    alert(r.data.message);
                    return location.reload();
                }

                setCurrentRooms(await Promise.all(r.data.map(resolveRoom)));
            } catch (err) {
                const e = err as Error;
                alert(e.message);
                router.replace("/login");
            }
        })();
    }, []);

    useEffect(() => {
        if (!messagesRef.current) return;

        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, [inputers, messages]);

    const handleRoomClick = async (id: Room["id"]) => {
        if (!socket.current) {
            alert("서버와의 연결이 끊겼어요.");
            location.reload();
            return;
        }
        const room = rooms.find(v => v.id === id);
        if (!room) {
            alert("예기치 않은 오류가 발생했어요. (3)");
            setCurrentRoom(undefined);
            return;
        }

        setCurrentRoom(room);
        syncMembersFromRoom(room);
        setMessages([]);
        setInputers([]);

        socket.current.emit("joinRoom", id);

        const messages = await REST<RoomMessageResponse[], APIError>(`/api/rooms/${room.id}/messages`);
        if (!messages.success) {
            alert("채팅방 메시지를 가져오지 못했어요.");
            return;
        }

        setMessages(await Promise.all(messages.data.map(resolveMessage)));
    };

    const getMessageDropdownItems = (message: APIMessage): DropdownItem[] => [
        ...(message.attachment ? [{
            "label": "다운로드",
            "onClick": async () => {
                if (!message.attachment) return;

                const a = document.createElement("a");
                a.href = message.attachment.url;
                a.download = "image." + getExtensionFromDataUrl(message.attachment.url);

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        }] : []),
        {
            "label": "복사하기",
            "onClick": async () => {
                if (!message.content) return;

                await navigator.clipboard.writeText(message.content);
            }
        },
        ...(session?.id === message.sender.id ? [{
            "type": "separator" as const
        }, {
            "label": <span style={{ "color": "#f81313" }}>삭제하기</span>,
            "onClick": async () => {
                if (!currentRoom) return;
                if (!await confirmDialog("메시지 삭제하기", "정말로 이 메시지를 삭제하시겠어요?", {
                    "ok": "삭제"
                })) return;

                const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}/messages/${message.id}`, {
                    "method": "DELETE",
                    "data": {
                        "body": message.content ?? "delete"
                    }
                });
                if (!r.success) {
                    showErrorDialog("메시지 삭제에 실패했어요.\n" + r.data.message);
                }
            }
        }] : [])
    ];

    if (loading) return null;

    return <>
        <input
            name="채팅방 프로필 변경"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={async (ev) => {
                if (!currentRoom) {
                    alert("방을 선택해주세요.");
                    return;
                }

                const files = ev.target.files;
                if (!files || files.length <= 0) return;

                const file = files[files.length - 1];

                if (file.size > 25 * 1000 * 1000) {
                    alert("파일 크기는 25MB 미만이여야 합니다.");
                    return;
                }

                function convertImageToBase64(file: File) {
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = (error) => reject(error);
                    });
                }

                const base64 = await convertImageToBase64(file);

                const ath = await REST<APIAttachment, APIError>(`/api/attachments`, {
                    "method": "POST",
                    "data": {
                        "content": base64
                    }
                });
                if (!ath.success) {
                    alert(ath.data.message);
                    return;
                }

                const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}`, {
                    "method": "PUT",
                    "data": {
                        "icon": {
                            "type": "attachment",
                            "url": ath.data.id
                        }
                    }
                });
                if (!r.success) {
                    alert(r.data.message);
                    return;
                }
            }}
        />
        <Form
            title="방 만들기"
            description="채팅방을 새로 만들게요."
            error={createRoomError}
            disabled={createRoomLoading}
            inputs={[{
                "id": "name",
                "placeholder": "방 이름",
                "name": "방 이름"
            }]}
            showForm={createRoomShow}
            onSubmit={async (data: { "name": string }) => {
                const { name } = data;
                if (!name) return setCreateRoomError("방 이름을 입력해주세요!");

                setCreateRoomLoading(true);

                const r = await REST<null, APIError>("/api/rooms", {
                    "method": "POST",
                    "data": {
                        name
                    }
                });
                if (!r.success) {
                    setCreateRoomError(r.data.message);
                    setCreateRoomLoading(false);
                    return;
                }

                setCreateRoomLoading(false);
                setCreateRoomShow(false);
            }}
            submitText={"만들기"}
            onCancel={() => {
                setCreateRoomError(undefined);
                setCreateRoomShow(false);
            }}
        />
        <Form
            title="방 입장하기"
            description="채팅방에 입장해요."
            error={joinRoomError}
            disabled={joinRoomLoading}
            inputs={[{
                "id": "id",
                "placeholder": "방 코드",
                "name": "방 코드"
            }]}
            showForm={joinRoomShow}
            onSubmit={async (data: { "id": string }) => {
                const { id } = data;
                if (!id) return setJoinRoomError("방 코드를 입력해주세요!");

                setJoinRoomLoading(true);

                const r = await REST<null, APIError>("/api/rooms", {
                    "method": "PUT",
                    "data": {
                        id
                    }
                });
                if (!r.success) {
                    setJoinRoomError(r.data.message);
                    setJoinRoomLoading(false);
                    return;
                }

                setJoinRoomLoading(false);
                setJoinRoomShow(false);
            }}
            submitText={"입장하기"}
            onCancel={() => {
                setJoinRoomError(undefined);
                setJoinRoomShow(false);
            }}
        />
        <Form
            title="초대하기"
            description={[
                {
                    "text": "유저를 초대해요."
                },
                {
                    "text": ""
                },
                {
                    "text": "현재 방 코드:"
                },
                {
                    "text": currentRoom?.id ?? "알 수 없음",
                    "draggable": true
                }
            ]}
            error={inviteUserError}
            disabled={inviteUserLoading}
            inputs={[{
                "id": "id",
                "placeholder": "유저 ID",
                "name": "유저 ID"
            }]}
            showForm={inviteUserShow}
            onSubmit={async (data: { "id": string }) => {
                if (!currentRoom) {
                    alert("방을 선택해주세요.");
                    return;
                }

                const { id } = data;
                if (!id) return setInviteUserError("유저 ID를 입력해주세요!");

                setInviteUserLoading(true);

                const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}`, {
                    "method": "POST",
                    "data": {
                        "invite": id
                    }
                });
                if (!r.success) {
                    setInviteUserError(r.data.message);
                    setInviteUserLoading(false);
                    return;
                }

                setInviteUserLoading(false);
                setInviteUserShow(false);

                setDialogTitle("초대하기");
                setDialogDesc([
                    {
                        "text": "초대할 상대에게 아래 방 코드를 알려주세요."
                    },
                    {
                        "text": currentRoom.id,
                        "draggable": true
                    }
                ]);
                setDialogButtons([
                    {
                        "text": "확인",
                        "onClick": () => setDialogOpen(false)
                    }
                ]);
                setDialogClosable(true);
                setDialogOpen(true);
            }}
            submitText={"초대하기"}
            onCancel={() => {
                setInviteUserError(undefined);
                setInviteUserShow(false);
            }}
        />
        <Form
            title="방 이름 수정"
            description="새로운 방 이름을 아래에 입력해주세요."
            error={roomNameError}
            disabled={roomNameLoading}
            inputs={[{
                "id": "name",
                "placeholder": "방 이름",
                "name": "방 이름",
                "value": currentRoom?.name
            }]}
            showForm={roomNameShow}
            onSubmit={async (data: { "name": string }) => {
                if (!currentRoom) {
                    alert("방을 선택해주세요.");
                    return;
                }

                const { name } = data;
                if (!name) return setRoomNameError("유저 ID를 입력해주세요!");

                setRoomNameLoading(true);

                const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}`, {
                    "method": "PUT",
                    "data": {
                        name
                    }
                });
                if (!r.success) {
                    setRoomNameError(r.data.message);
                    setRoomNameLoading(false);
                    return;
                }

                setRoomNameLoading(false);
                setRoomNameShow(false);
            }}
            submitText={"수정하기"}
            onCancel={() => {
                setRoomNameError(undefined);
                setRoomNameShow(false);
            }}
        />
        <Dialog
            title={dialogTitle}
            description={dialogDesc}
            buttons={dialogButtons}
            open={dialogOpen}
            onCancel={() => {
                if (!dialogClosable) return;
                setDialogOpen(false);
            }}
        />
        <div className={css.container}>
            <Header sessionOverride={session} />
            <div className={css.screen}>
                <div className={css.rooms}>
                    <button
                        className={css.room}
                        onClick={() => setCreateRoomShow(true)}
                        onContextMenu={(ev) => {
                            ev.preventDefault();
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} className={css.roomIcon} />
                        <div className={css.roomTexts}>
                            <span className={css.roomName}>방 만들기</span>
                            <span className={css.roomDesc}>여기를 클릭해 방을 만들어요.</span>
                        </div>
                    </button>
                    <button
                        className={css.room}
                        onClick={() => setJoinRoomShow(true)}
                        onContextMenu={(ev) => {
                            ev.preventDefault();
                        }}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className={css.roomIcon} />
                        <div className={css.roomTexts}>
                            <span className={css.roomName}>방에 입장하기</span>
                            <span className={css.roomDesc}>이미 방 코드가 있으신가요?</span>
                        </div>
                    </button>
                    {rooms.map(v => <button
                        key={v.id}
                        className={css.room}
                        onClick={() => handleRoomClick(v.id)}
                        style={{
                            "backgroundColor": currentRoom?.id === v.id ? "#464646" : undefined
                        }}
                        onContextMenu={(ev) => {
                            ev.preventDefault();
                            handleRoomClick(v.id);
                        }}
                    >
                        <img draggable={false} src={v.icon.url} className={css.roomIcon} />
                        <div className={css.roomTexts}>
                            <span className={css.roomName}>{v.name}</span>
                            <span className={css.roomDesc}>멤버 {v.members.length}명</span>
                        </div>
                    </button>)}
                </div>
                {!currentRoom ?
                    <div className={css.blank}>
                        <div className={css.iconContainer}>
                            <FontAwesomeIcon icon={faPaperPlane} className={css.icon} />
                        </div>
                        <span className={css.text}>왼쪽에서 채팅방을 선택해주세요.</span>
                    </div> :
                    <div className={css.chatting}>
                        <div className={css.roomHeader}>
                            <div className={css.roomInfo}>
                                <img draggable={false} src={currentRoom.icon.url} className={css.icon} />
                                <span className={css.name}>{currentRoom.name}</span>
                            </div>
                            <div className={css.roomMenus}>
                                <Dropdown
                                    containerClassName={css.button}
                                    items={[
                                        {
                                            "label": "방 이름 수정",
                                            "onClick": () => setRoomNameShow(true)
                                        },
                                        {
                                            "label": "방 아이콘 수정",
                                            "onClick": () => {
                                                if (!fileInputRef.current) {
                                                    reloadWithWarning("예기치 않은 오류가 발생했어요. (1)");
                                                    return;
                                                }

                                                fileInputRef.current.click();
                                            }
                                        },
                                        {
                                            "type": "separator"
                                        },
                                        (currentRoom.owner === session?.id ? {
                                            "label": <span style={{ "color": "#f81313" }}>삭제하기</span>,
                                            "onClick": async () => {
                                                if (!await confirmDialog("방 삭제하기", `정말로 ${currentRoom.name} 방을 삭제하시겠어요?`, {
                                                    "ok": "삭제"
                                                })) return;

                                                const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}`, {
                                                    "method": "DELETE"
                                                });
                                                if (!r.success) {
                                                    showErrorDialog("방 삭제에 실패했어요.\n" + r.data.message);
                                                    return;
                                                }
                                            }
                                        } : {
                                            "label": <span style={{ "color": "#f81313" }}>나가기</span>,
                                            "onClick": async () => {
                                                const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}/members`, {
                                                    "method": "DELETE",
                                                    "params": {
                                                        "target": "me"
                                                    }
                                                });
                                                if (!r.success) {
                                                    showErrorDialog("방 삭제에 실패했어요.\n" + r.data.message);
                                                    return;
                                                }
                                            }
                                        })
                                    ]}
                                >
                                    <FontAwesomeIcon
                                        icon={faBars}
                                    />
                                </Dropdown>
                                <Dropdown
                                    containerClassName={css.button}
                                    items={[
                                        ...(members.map(v => ({
                                            "label": v.name,
                                            "src": v.profile.url,
                                            "disabled": currentRoom.owner !== session?.id,
                                            "onClick": () => {
                                                setDialogTitle("유저 관리");
                                                setDialogDesc(v.name + "\n이 유저에 대해 수행할 작업을 선택해주세요.");
                                                setDialogButtons([
                                                    {
                                                        "text": "취소",
                                                        "onClick": () => setDialogOpen(false)
                                                    },
                                                    {
                                                        "text": "강퇴",
                                                        "onClick": async () => {
                                                            setDialogOpen(false);

                                                            const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}/members`, {
                                                                "method": "DELETE",
                                                                "params": {
                                                                    "target": v.id
                                                                }
                                                            });
                                                            if (!r.success) {
                                                                alert(r.data.message);
                                                                return;
                                                            }
                                                        }
                                                    },
                                                    {
                                                        "text": "소유권 넘기기",
                                                        "onClick": async () => {
                                                            setDialogOpen(false);

                                                            const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}`, {
                                                                "method": "PUT",
                                                                "data": {
                                                                    "owner": v.id
                                                                }
                                                            });
                                                            if (!r.success) {
                                                                alert(r.data.message);
                                                                return;
                                                            }
                                                        }
                                                    }
                                                ]);
                                                setDialogClosable(true);
                                                setDialogOpen(true);
                                            }
                                        }))),
                                        ...(members.length > 1 ? [{
                                            "type": "separator" as const
                                        }] : []),
                                        {
                                            "label": "초대하기",
                                            "onClick": () => setInviteUserShow(true)
                                        }
                                    ]}
                                >
                                    <FontAwesomeIcon
                                        icon={faUsers}
                                    />
                                </Dropdown>
                            </div>
                        </div>
                        <div className={css.messages} ref={messagesRef}>
                            <div className={css.messagesList}>
                                {(() => {
                                    type GroupedMessages = {
                                        "sender": APIUser;
                                        "messages": APIMessage[];
                                    }[];

                                    const toReturn: GroupedMessages = [];
                                    let lastSender: APIUser | undefined;
                                    let msgs: APIMessage[] = [];

                                    for (const message of messages) {
                                        if (lastSender && lastSender.id !== message.sender.id) {
                                            toReturn.push({
                                                "sender": lastSender,
                                                "messages": msgs
                                            });
                                            msgs = [];
                                        }

                                        msgs.push(message);
                                        lastSender = message.sender;
                                    }

                                    if (lastSender && msgs.length > 0)
                                        toReturn.push({
                                            "sender": lastSender,
                                            "messages": msgs
                                        });

                                    return toReturn;
                                })()
                                    .map((v, i) => <Ballon
                                        key={i}
                                        sender={{
                                            "name": v.sender.name,
                                            "profile": v.sender.profile,
                                            "sentByMe": session?.id === v.sender.id
                                        }}
                                        messages={v.messages}
                                        getMessageDropdownItems={getMessageDropdownItems}
                                    />)}
                            </div>
                        </div>
                        <div className={css.inputContainer}>
                            {inputers.length > 0 && <span className={css.inputing}>{inputers.length > 3 ? "여러 사람이 입력중이에요..." : inputers.map(v => v.name).join("님, ") + "님이 입력중이에요..."}</span>}
                            <div className={css.linearH}>
                                <button className={css.iconBtn}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                                <input
                                    type="text"
                                    className={css.input}
                                    ref={inputMessageRef}
                                    placeholder="메시지 입력..."
                                    onKeyDown={async (ev) => {
                                        if (ev.key === "Enter") {
                                            if (!sendMessageRef.current) return;

                                            sendMessageRef.current.click();
                                            return
                                        }

                                        // 입력 핸들링
                                        const INTERVAL_CALLBACK = async () => {
                                            if (!socket.current) return;

                                            await REST<null, APIError>(`/api/rooms/${currentRoom.id}/inputing`, {
                                                "method": "DELETE"
                                            });

                                            inputingTimeoutRef.current = null;
                                        };
                                        if (inputingTimeoutRef.current) {
                                            // setTimeout이 있을 때
                                            clearTimeout(inputingTimeoutRef.current);
                                            inputingTimeoutRef.current = setTimeout(INTERVAL_CALLBACK, 500);
                                            return;
                                        }

                                        // setTimeout이 없을 때
                                        // 알파벳이나 숫자가 아니면 리턴
                                        if (!/^[a-z0-9]$/i.test(ev.key)) return;

                                        inputingTimeoutRef.current = setTimeout(INTERVAL_CALLBACK, 500);

                                        await REST<null, APIError>(`/api/rooms/${currentRoom.id}/inputing`, {
                                            "method": "POST"
                                        });
                                    }}
                                />
                                <button className={css.iconBtn} ref={sendMessageRef} onClick={async () => {
                                    const value = inputMessageRef.current?.value;
                                    if (!inputMessageRef.current || !value) return;
                                    inputMessageRef.current.value = "";

                                    const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}/messages`, {
                                        "method": "POST",
                                        "data": {
                                            "body": value
                                        }
                                    });
                                    if (!r.success) {
                                        showErrorDialog(`메시지 보내기에 실패했어요.\n${r.data.message}`);
                                        return;
                                    }
                                }}>
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    </>;
}
