"use client";

import InOutAnimation from '@/src/components/InOutAnimation';
import css from './page.module.css';
import { animated, easings, useSpringValue } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';
import REST from '@/src/modules/rest';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageTitle from '@/src/components/pageTitle';

export default function Page() {
    const router = useRouter();
    const [session, setSession] = useState<APIUser>();
    const [controlDisabled, setControlDisabled] = useState(false);

    const pwRef = useRef<HTMLInputElement>(null);
    const pwConfirmRef = useRef<HTMLInputElement>(null);

    const opacity = useSpringValue(1, {
        "config": {
            "duration": 480,
            "easing": easings.easeOutCubic
        }
    });

    useEffect(() => {
        (async () => {
            const r = await REST<APIUser, APIError>("/api/users/me");
            if (!r.success) {
                alert(r.data.message);
                return;
            }

            setSession(r.data);
        })();
    }, []);

    if (!session) return null;

    return <InOutAnimation animate>
        <animated.div className={css.container} style={{
            opacity,
            "pointerEvents": controlDisabled ? "none" : "auto"
        }}>
            <div className={css.form}>
                <PageTitle title="비밀번호 변경" href="/edit" />
                <div className={css.inputBox}>
                    <span className={css.label} onClick={() => pwRef.current && pwRef.current.focus()}>변경할 비밀번호</span>
                    <input
                        type="password"
                        placeholder='비밀번호 입력'
                        ref={pwRef}
                    />
                </div>
                <div className={css.inputBox}>
                    <span className={css.label} onClick={() => pwConfirmRef.current && pwConfirmRef.current.focus()}>비밀번호 확인</span>
                    <input
                        type="password"
                        placeholder='비밀번호 확인'
                        ref={pwConfirmRef}
                    />
                </div>
                <div className={css.buttons}>
                    <button className={css.button} onClick={async () => {
                        if (!pwRef.current || !pwConfirmRef.current) {
                            alert("예기치 않은 오류가 발생했어요.");
                            location.reload();
                            return;
                        }
                        if (pwRef.current.value !== pwConfirmRef.current.value) {
                            alert("비밀번호가 일치하지 않아요.");
                            return;
                        }

                        setControlDisabled(true);

                        const r = await REST<APIUsersMePUT, APIError>("/api/users/me", {
                            "method": "PUT",
                            "data": {
                                "pw": pwRef.current.value
                            }
                        });
                        if (!r.success) {
                            alert(r.data.message);
                            return;
                        }

                        if (r.data.password) {
                            alert("비밀번호가 변경되었어요.");
                            router.push("/chats");
                        } else {
                            alert("비밀번호가 변경되지 않았어요.\n비밀번호는 8글자 이상이여야 해요.");
                            setControlDisabled(false);
                        }
                    }}>
                        <span>변경하기</span>
                    </button>
                    <Link className={css.secondary} href="/edit">
                        <span>프로필 수정</span>
                    </Link>
                </div>
            </div>
        </animated.div>
    </InOutAnimation>;
}
