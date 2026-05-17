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

export default function Page() {
    const router = useRouter();
    const socket = useRef<ReturnType<typeof io>>(null);

    const { width } = useWindowDimensions();

    const [css, setCss] = useState<Record<string, string>>(desktopCss);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<APIUser>();
    const [rooms, setRooms] = useState<Room[]>([]);

    const [selectedRoom, setSelectedRoom] = useState<Room>();

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
        console.log(id);
    };

    if (loading) return <Loading />;

    return <div className={css.container}>
        <Header sessionOverride={session} />
        <div className={css.screen}>
            <div className={css.rooms}>
                <button className={css.room}>
                    <FontAwesomeIcon icon={faPlus} className={css.roomIcon} />
                    <div className={css.roomTexts}>
                        <span className={css.roomName}>방 만들기</span>
                        <span className={css.roomDesc}>여기를 클릭해 방을 만들어요.</span>
                    </div>
                </button>
                <button className={css.room}>
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
                >

                </button>)}
            </div>
            {!selectedRoom ? <div className={css.blank}>
                <div className={css.iconContainer}>
                    <FontAwesomeIcon icon={faPaperPlane} className={css.icon} />
                </div>
                <span className={css.text}>왼쪽에서 채팅방을 선택해주세요.</span>
            </div> : <>
                <div className={css.chatting}>

                </div>
            </>}

        </div>
    </div>;
}