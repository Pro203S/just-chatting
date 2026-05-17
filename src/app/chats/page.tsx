"use client";

import { useEffect, useRef, useState } from 'react';
import desktopCss from './desktop.module.css';
import mobileCss from './mobile.module.css';
import Header from "@/src/components/header";
import Loading from '@/src/components/loading';
import { useRouter } from 'next/navigation';
import REST from '@/src/modules/rest';
import { io, Socket } from 'socket.io-client';
import refreshSession from '@/src/modules/refreshSession';
import useWindowDimensions from '@/src/modules/useWindowDimensions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane, faPlus } from '@fortawesome/free-solid-svg-icons';
import Form from '@/src/components/form';

export default function Page() {
    const router = useRouter();
    const socket = useRef<ReturnType<typeof io>>(null);

    const { width } = useWindowDimensions();

    const [css, setCss] = useState<Record<string, string>>(desktopCss);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<APIUser>();
    const [rooms, setRooms] = useState<Room[]>([]);

    const [selectedRoom, setSelectedRoom] = useState<Room>();
    const [messages, setMessages] = useState<Message[]>([]);

    const [createRoomShow, setCreateRoomShow] = useState(false);
    const [createRoomLoading, setCreateRoomLoading] = useState(false);
    const [createRoomError, setCreateRoomError] = useState<string>();

    const [joinRoomShow, setJoinRoomShow] = useState(false);
    const [joinRoomLoading, setJoinRoomLoading] = useState(false);
    const [joinRoomError, setJoinRoomError] = useState<string>();

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
                        router.push("/login");
                        return;
                    }

                    router.push("/");
                    return;
                });

                sock.on("disconnect", () => {
                    return router.replace("/");
                });

                sock.on("identify", async () => {
                    if (!localStorage.getItem("access_token")) {
                        await refreshSession();
                    }
                    sock.emit("identify", localStorage.getItem("access_token") ?? "");
                });

                sock.on("roomCreate", (room) => setRooms(v => [
                    room,
                    ...v
                ]));

                sock.on("roomJoin", (room) => setRooms(v => {
                    const index = v.findIndex(r => r.id === room.id);
                    if (index === -1) return v;
                    
                    const arr = [...v];
                    arr[index] = room;

                    return arr;
                }));

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
        setSelectedRoom(rooms.find(v => v.id === id));

        socket.current.emit("joinRoom", id);
    };

    if (loading) return <Loading />;

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
                            "backgroundColor": selectedRoom?.id === v.id ? "#464646" : undefined
                        }}
                    >
                        <img src={v.icon} className={css.roomIcon} />
                        <div className={css.roomTexts}>
                            <span className={css.roomName}>{v.name}</span>
                            <span className={css.roomDesc}>채팅방 멤버 {v.members.length}명</span>
                        </div>
                    </button>)}
                </div>
                {!selectedRoom ?
                    <div className={css.blank}>
                        <div className={css.iconContainer}>
                            <FontAwesomeIcon icon={faPaperPlane} className={css.icon} />
                        </div>
                        <span className={css.text}>왼쪽에서 채팅방을 선택해주세요.</span>
                    </div> :
                    <div className={css.chatting}>

                    </div>
                }
            </div>
        </div>
    </>;
}