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
import Dropdown from '@/src/components/dropdown';
import Dialog, { DialogButton } from '@/src/components/dialog';

export default function Page() {
    const router = useRouter();
    const socket = useRef<ReturnType<typeof io>>(null);
    const currentRoomRef = useRef<Room | undefined>(undefined);
    const sessionRef = useRef<APIUser | undefined>(undefined);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { width } = useWindowDimensions();

    const [css, setCss] = useState<Record<string, string>>(desktopCss);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<APIUser>();
    const [rooms, setCurrentRooms] = useState<Room[]>([]);

    const [currentRoom, setCurrentRoom] = useState<Room>();
    const [members, setMembers] = useState<APIUser[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

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
    const [dialogDesc, setDialogDesc] = useState("");
    const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogClosable, setDialogClosable] = useState(true);

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
                const sock: Socket<SocketEmitEvents, SocketOnEvents> = io({
                    "host": location.host,
                    "path": "/socket",
                    "autoConnect": false
                });
                socket.current = sock;

                sock.on("error", async (code, reason) => {
                    sock.disconnect();
                    if (code === 101) {
                        await refreshSession();
                        console.error("[Socket] session expired.");
                        debugger;
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

                sock.on("identify", async () => {
                    try {
                        if (!localStorage.getItem("access_token")) {
                            await refreshSession();
                        }
                        sock.emit("identify", localStorage.getItem("access_token") ?? "");
                    } catch {
                        sock.disconnect();
                    }
                });

                sock.on("roomCreate", (room) => setCurrentRooms(v => [
                    room,
                    ...v
                ]));

                const syncMembers = async (roomId: Room["id"]) => {
                    const r = await REST<APIUser[], APIError>(`/api/rooms/${roomId}/members`);
                    if (!r.success) {
                        alert("예기치 않은 오류가 발생했어요.");
                        console.error("[syncMembers] Request failed with status code " + r.status);
                        debugger;
                        location.reload();
                        return;
                    }

                    setMembers(r.data.filter(v => v.id !== sessionRef.current?.id));
                };

                const editRoom = (room: Room) => {
                    setCurrentRooms(v => {
                        const index = v.findIndex(r => r.id === room.id);
                        if (index === -1) return v;

                        const arr = [...v];
                        arr[index] = room;

                        return arr;
                    });

                    setCurrentRoom(v => v?.id === room.id ? room : v);
                };

                const deleteRoom = (room: Room) => {
                    setCurrentRoom(undefined);
                    setCurrentRooms(v => v.filter(r => r.id !== room.id));
                }

                sock.on("roomJoin", async (room) => {
                    editRoom(room);

                    if (currentRoomRef.current?.id !== room.id) return;

                    await syncMembers(room.id);
                });
                sock.on("roomEdit", editRoom);
                sock.on("roomLeave", async (room) => {
                    editRoom(room);

                    if (currentRoomRef.current?.id !== room.id) return;

                    await syncMembers(room.id);
                });

                sock.on("roomKicked", deleteRoom);
                sock.on("roomDelete", deleteRoom);

                sock.connect();

                const session: APIUser = await new Promise<APIUser>((resolve) => sock.once("welcome", resolve));

                setSession(session);
                setLoading(false);

                const r = await REST<Room[], APIError>("/api/rooms");
                if (!r.success) {
                    alert(r.data.message);
                    return router.replace("/");
                }

                setCurrentRooms(r.data);
            } catch (err) {
                const e = err as Error;
                alert(e.message);
                router.replace("/login");
            }
        })();
    }, []);

    const handleRoomClick = async (id: Room["id"]) => {
        if (!socket.current) {
            alert("서버와의 연결이 끊겼어요.");
            location.reload();
            return;
        }
        const room = rooms.find(v => v.id === id);
        if (!room) {
            alert("예기치 않은 오류가 발생했어요.");
            console.error("[handleRoomClick] Cannot find the room");
            debugger;
            location.reload();
            return;
        }
        setCurrentRoom(room);

        const r = await REST<APIUser[], APIError>(`/api/rooms/${room.id}/members`);
        if (!r.success) {
            alert("예기치 않은 오류가 발생했어요.");
            console.error(`[handleRoomClick] /api/rooms/${room.id}/members request failed with status code ${r.status}`);
            debugger;
            location.reload();
            return;
        }

        setMembers(r.data.filter(v => v.id !== session?.id));

        socket.current.emit("joinRoom", id);
    };

    if (loading) return null;

    return <>
        <input
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
                if (!files || files.length < 0) return;

                const file = files[files.length - 1];

                if (file.size > 16 * 1000 * 1000) {
                    alert("파일 크기는 16MB 미만이여야 합니다.");
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

                const r = await REST<null, APIError>(`/api/rooms/${currentRoom.id}`, {
                    "method": "PUT",
                    "data": {
                        "icon": base64
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
            description={`유저를 초대해요.\n현재 방 코드는 ${currentRoom?.id}입니다.`}
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
                setDialogDesc("초대할 상대에게 아래 방 코드를 알려주세요.\n" + currentRoom.id);
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
                    <button className={css.room} onClick={() => setCreateRoomShow(true)}>
                        <FontAwesomeIcon icon={faPlus} className={css.roomIcon} />
                        <div className={css.roomTexts}>
                            <span className={css.roomName}>방 만들기</span>
                            <span className={css.roomDesc}>여기를 클릭해 방을 만들어요.</span>
                        </div>
                    </button>
                    <button className={css.room} onClick={() => setJoinRoomShow(true)}>
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
                    >
                        <img draggable={false} src={v.icon} className={css.roomIcon} />
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
                                <img draggable={false} src={currentRoom.icon} className={css.icon} />
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
                                                    console.error("fileInputRef was null.");
                                                    debugger;
                                                    reloadWithWarning("예기치 않은 오류가 발생했어요.");
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
                                            "src": v.profile,
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
                        <div className={css.messages}>
                        </div>
                        <div className={css.inputContainer}>
                        </div>
                    </div>
                }
            </div>
        </div>
    </>;
}
