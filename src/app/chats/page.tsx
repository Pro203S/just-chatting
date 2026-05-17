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

export default function Page() {
    const router = useRouter();
    const socket = useRef<ReturnType<typeof io>>(null);

    const { width } = useWindowDimensions();

    const [css, setCss] = useState<Record<string, string>>(desktopCss);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<APIUser>();
    const [rooms, setRooms] = useState<Room[]>([]);

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
                    alert("예기치 않은 이유로 연결이 종료되었습니다.");
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

                const r = await REST("/api/rooms");
                
            } catch (err) {
                const e = err as Error;
                alert(e.message);
                router.replace("/login");
            }
        })();
    }, []);

    if (loading) return <Loading />;

    return <div className={css.container}>
        <Header sessionOverride={session} />
        <div className={css.screen}>
            <div className={css.rooms}>

            </div>
            <div className={css.chatting}>

            </div>
        </div>
    </div>;
}