"use client";

import { useEffect, useRef, useState } from 'react';
import css from './page.module.css';
import InOutAnimation from '@/src/components/InOutAnimation';
import Link from 'next/link';
import { animated, easings, useSpringValue } from '@react-spring/web';
import axios from 'axios';

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

    const handleSignUp = async () => {
        try {
            setControlDisabled(true);

            const r = await axios.post("/api/users", {
                "id": idRef.current?.value,
                "pw": pwRef.current?.value,
                "name": nameRef.current?.value
            }, {
                "validateStatus": () => true
            });
            if (r.status !== 204) {
                alert(r.data.message);
                return;
            }

            alert("가입하신걸 축하해요!\n이제 로그인해주세요.");

            window.location.href = "/login";
        } catch (err) {
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
                <span className={css.title}>가입하기</span>
                <div className={css.inputBox}>
                    <span className={css.label} onClick={() => idRef.current && idRef.current.focus()}>ID</span>
                    <input type="text" placeholder='ID 입력' ref={idRef} />
                </div>
                <div className={css.inputBox}>
                    <span className={css.label} onClick={() => pwRef.current && pwRef.current.focus()}>비밀번호</span>
                    <input type="password" placeholder='비밀번호 입력' ref={pwRef} />
                </div>
                <div className={css.inputBox}>
                    <span className={css.label} onClick={() => nameRef.current && nameRef.current.focus()}>닉네임</span>
                    <input type="text" placeholder='닉네임 입력' ref={nameRef} />
                </div>
                <div className={css.buttons}>
                    <button className={css.primary} onClick={handleSignUp}>
                        <span>가입하기</span>
                    </button>
                    <Link href="/login" className={css.secondary}>
                        <span>로그인</span>
                    </Link>
                </div>
            </div>
        </animated.div>
    </InOutAnimation>;
}
