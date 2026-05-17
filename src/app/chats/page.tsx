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

    const { width } = useWindowDimensions();

    const [css, setCss] = useState<Record<string, string>>(desktopCss);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<APIUser>();
    const [rooms, setRooms] = useState<Room[]>([]);

    const [room, setRoom] = useState<Room>();
    const [members, setMembers] = useState<APIUser[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    const [createRoomShow, setCreateRoomShow] = useState(false);
    const [createRoomLoading, setCreateRoomLoading] = useState(false);
    const [createRoomError, setCreateRoomError] = useState<string>();

    const [joinRoomShow, setJoinRoomShow] = useState(false);
    const [joinRoomLoading, setJoinRoomLoading] = useState(false);
    const [joinRoomError, setJoinRoomError] = useState<string>();

    const [dialogTitle, setDialogTitle] = useState("");
    const [dialogDesc, setDialogDesc] = useState("");
    const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogClosable, setDialogClosable] = useState(true);

    useEffect(() => {
        setCss(width > 650 ? desktopCss : mobileCss);
    }, [width]);

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
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("expires_in");

                    return router.replace("/login");
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

                sock.on("roomCreate", (room) => setRooms(v => [
                    room,
                    ...v
                ]));

                const editRoom = (room: Room) => setRooms(v => {
                    const index = v.findIndex(r => r.id === room.id);
                    if (index === -1) return v;

                    const arr = [...v];
                    arr[index] = room;

                    return arr;
                });

                const deleteRoom = (room: Room) => setRooms(v => v.filter(r => r.id !== room.id));

                sock.on("roomJoin", editRoom);
                sock.on("roomEdit", editRoom);
                sock.on("roomLeave", editRoom);

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

                setRooms(r.data);
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
            location.reload();
            return;
        }
        setRoom(room);

        const r = await REST<APIUser[], APIError>(`/api/rooms/${room.id}/members`);
        if (!r.success) {
            alert("예기치 않은 오류가 발생했어요.");
            location.reload();
            return;
        }

        setMembers(r.data.filter(v => v.id !== session?.id));

        socket.current.emit("joinRoom", id);
    };

    if (loading) return null;

    return <>
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

                setJoinRoomShow(false);
            }}
            submitText={"입장하기"}
            onCancel={() => {
                setJoinRoomError(undefined);
                setJoinRoomShow(false);
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
                            "backgroundColor": room?.id === v.id ? "#464646" : undefined
                        }}
                    >
                        <img draggable={false} src={v.icon} className={css.roomIcon} />
                        <div className={css.roomTexts}>
                            <span className={css.roomName}>{v.name}</span>
                            <span className={css.roomDesc}>채팅방 멤버 {v.members.length}명</span>
                        </div>
                    </button>)}
                </div>
                {!room ?
                    <div className={css.blank}>
                        <div className={css.iconContainer}>
                            <FontAwesomeIcon icon={faPaperPlane} className={css.icon} />
                        </div>
                        <span className={css.text}>왼쪽에서 채팅방을 선택해주세요.</span>
                    </div> :
                    <div className={css.chatting}>
                        <div className={css.roomHeader}>
                            <div className={css.roomInfo}>
                                <img draggable={false} src={room.icon} className={css.icon} />
                                <span className={css.name}>{room.name}</span>
                            </div>
                            <div className={css.roomMenus}>
                                <Dropdown
                                    containerClassName={css.button}
                                    items={[
                                        {
                                            "label": "방 이름 수정",
                                            "onClick": () => {

                                            }
                                        },
                                        {
                                            "label": "방 아이콘 수정",
                                            "onClick": () => {

                                            }
                                        },
                                        {
                                            "type": "separator"
                                        },
                                        (room.owner === session?.id ? {
                                            "label": <span style={{ "color": "#f81313" }}>삭제하기</span>,
                                            "onClick": () => {

                                            }
                                        } : {
                                            "label": <span style={{ "color": "#f81313" }}>나가기</span>,
                                            "onClick": () => {

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
                                            "disabled": room.owner !== session?.id,
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
                                            "onClick": () => {

                                            }
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