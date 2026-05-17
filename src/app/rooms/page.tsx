"use client";

import { useEffect, useRef, useState } from 'react';
import css from './page.module.css';
import Header from "@/src/components/header";
import Loading from '@/src/components/loading';
import { useRouter } from 'next/navigation';
import REST from '@/src/modules/rest';
import { io, Socket } from 'socket.io-client';
import refreshSession from '@/src/modules/refreshSession';

export default function Page() {
    const router = useRouter();
    const socket = useRef<ReturnType<typeof io>>(null);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<APIUser>();

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
                    alert(reason);

                    if (code === 101) {
                        await refreshSession();
                        location.reload();
                        return;
                    }

                    if (Math.floor(code / 100) === 1) {
                        router.push("/login");
                        return;
                    }

                    router.push("/");
                    return;
                });

                sock.on("identify", async () => {
                    if (!localStorage.getItem("access_token")) {
                        await refreshSession();
                    }
                    sock.emit("identify", localStorage.getItem("access_token") ?? "");
                });

                sock.connect();

                sock.once("welcome", (session) => {
                    setSession(session);
                    setLoading(false);
                });
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
        </div>
    </div>;
}