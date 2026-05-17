"use client";

import InOutAnimation from '@/src/components/InOutAnimation';
import css from './page.module.css';
import { animated, easings, useSpringValue } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';
import REST from '@/src/modules/rest';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function convertImageToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

export default function Page() {
    const router = useRouter();
    const [session, setSession] = useState<APIUser>();
    const [controlDisabled, setControlDisabled] = useState(false);

    const profileImageRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const idRef = useRef<HTMLInputElement>(null);

    const [source, setSource] = useState<string>();

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

    return <>
        <input
            className="hidden"
            type="file"
            ref={profileImageRef}
            onChange={async (ev) => {
                const files = ev.target.files;
                if (!files || files.length < 0) return;

                const file = files[files.length - 1];

                if (file.size > 16 * 1000 * 1000) {
                    alert("파일 크기는 16MB 미만이여야 합니다.");
                    return;
                }

                const base64 = await convertImageToBase64(file);
                setSource(base64);
            }}
            accept="image/*"
        />
        <InOutAnimation animate>
            <animated.div className={css.container} style={{
                opacity,
                "pointerEvents": controlDisabled ? "none" : "auto"
            }}>
                <div className={css.form}>
                    <span className={css.title}>프로필 수정</span>
                    <div className={css.profileBox}>
                        <img
                            draggable={false}
                            src={source ?? session.profile}
                            className={css.profile}
                        />
                        <button className={css.button} style={{ "margin": "auto" }} onClick={async () => {
                            if (!profileImageRef.current) {
                                window.location.reload();
                                return;
                            }

                            profileImageRef.current.click();
                        }}>
                            <span>프로필 변경</span>
                        </button>
                    </div>
                    <div className={css.inputBox}>
                        <span style={{ "opacity": .5 }} className={css.label}>ID</span>
                        <input
                            style={{ "opacity": .5 }}
                            type="text"
                            placeholder='ID 입력'
                            ref={idRef}
                            value={session.userId}
                            disabled
                        />
                    </div>
                    <div className={css.inputBox}>
                        <span className={css.label} onClick={() => nameRef.current && nameRef.current.focus()}>닉네임 입력</span>
                        <input
                            type="text"
                            placeholder='닉네임 입력'
                            ref={nameRef}
                            defaultValue={session.name}
                        />
                    </div>
                    <div className={css.buttons}>
                        <button className={css.button} onClick={async () => {
                            try {
                                if (!nameRef.current) {
                                    alert("예기치 않은 오류가 발생했어요.");
                                    location.reload();
                                    return;
                                }
                                setControlDisabled(true);

                                const r = await REST<APIUsersMePUT, APIError>("/api/users/me", {
                                    "method": "PUT",
                                    "data": {
                                        "name": nameRef.current.value,
                                        "profile": source
                                    }
                                });
                                if (!r.success) {
                                    throw new Error(r.data.message);
                                }

                                router.push("/chats");
                            } catch (err) {
                                const e = err as Error;
                                alert(e.message);
                            } finally {
                                setControlDisabled(false);
                            }
                        }}>
                            <span>수정하기</span>
                        </button>
                        <Link className={css.secondary} href="/edit/password">
                            <span>비밀번호 변경</span>
                        </Link>
                        <button className={css.secondary} onClick={() => {

                        }}>
                            <span>탈퇴하기</span>
                        </button>
                    </div>
                </div>
            </animated.div>
        </InOutAnimation>
    </>;
}