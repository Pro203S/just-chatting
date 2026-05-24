"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import css from './page.module.css';
import InOutAnimation from '@/src/components/InOutAnimation';
import Link from 'next/link';
import { animated, easings, useSpringValue } from '@react-spring/web';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import PageTitle from '@/src/components/pageTitle';

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const idRef = useRef<HTMLInputElement>(null);
    const pwRef = useRef<HTMLInputElement>(null);

    const opacity = useSpringValue(1, {
        "config": {
            "duration": 480,
            "easing": easings.easeOutCubic
        }
    });

    const [controlDisabled, setControlDisabled] = useState(false);

    useEffect(() => {
        if (controlDisabled) {
            opacity.start(0.5);
        } else {
            opacity.start(1);
        }
    }, [controlDisabled]);

    const handleSignIn = async () => {
        try {
            setControlDisabled(true);

            const r = await axios.post("/api/auth/login", {
                "id": idRef.current?.value,
                "pw": pwRef.current?.value
            }, {
                "validateStatus": () => true
            });
            if (r.status !== 200) {
                alert(r.data.message);
                return;
            }

            const data: APIAuthLogin = r.data;
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("expires_at", String(new Date().getTime() + (data.expires_in * 1000)));
        } catch (err) {
            const e = err as Error;
            alert(e.message);
        } finally {
            setControlDisabled(false);
        }

        const redirectTo = searchParams.get("redirectTo");
        if (!redirectTo) return router.push("/chats");
        if (!redirectTo.startsWith("/")) return router.push("/chats");
        return router.push(redirectTo);
    };

    return <InOutAnimation animate>
        <animated.div className={css.container} style={{
            opacity,
            "pointerEvents": controlDisabled ? "none" : "auto"
        }}>
            <div className={css.form}>
                <PageTitle title="로그인" href="/" />
                <div className={css.inputBox}>
                    <span className={css.label} onClick={() => idRef.current && idRef.current.focus()}>ID</span>
                    <input type="text" placeholder='ID 입력' ref={idRef} />
                </div>
                <div className={css.inputBox}>
                    <span className={css.label} onClick={() => pwRef.current && pwRef.current.focus()}>비밀번호</span>
                    <input type="password" placeholder='비밀번호 입력' ref={pwRef} />
                </div>
                <div className={css.buttons}>
                    <button className={css.primary} onClick={handleSignIn}>
                        <span>로그인</span>
                    </button>
                    <Link href="/register" className={css.secondary}>
                        <span>가입하기</span>
                    </Link>
                </div>
            </div>
        </animated.div>
    </InOutAnimation>;
}

export default function Page() {
    return <Suspense fallback={null}>
        <LoginPageContent />
    </Suspense>;
}
