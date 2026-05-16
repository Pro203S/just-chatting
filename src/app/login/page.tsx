"use client";

import { useEffect, useRef, useState } from 'react';
import css from './page.module.css';
import InOutAnimation from '@/src/components/InOutAnimation';
import Link from 'next/link';
import { animated, easings, useSpringValue } from '@react-spring/web';
import axios from 'axios';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export default function Page() {
    const idRef = useRef<HTMLInputElement>(null);
    const pwRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);

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


            redirect("/login");
        } catch (err) {
            if (isRedirectError(err)) {
                throw err;
            }
            const e = err as Error;
            alert(e.message);
        } finally {
            setControlDisabled(false);
        }
    };

    return <InOutAnimation animate>
        <animated.div className={css.container} style={{
            opacity,
            "pointerEvents": controlDisabled ? "none" : "auto"
        }}>
            <div className={css.form}>
                <span className={css.title}>로그인</span>
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
                    <Link href="/login" className={css.secondary}>
                        <span>가입하기</span>
                    </Link>
                </div>
            </div>
        </animated.div>
    </InOutAnimation>;
}