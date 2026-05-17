"use client";

import Link from 'next/link';
import { LogoRedirect } from '../logoText';
import css from './styles.module.css';
import { useEffect, useRef, useState } from 'react';
import REST from '@/src/modules/rest';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen, faUser } from '@fortawesome/free-solid-svg-icons';
import { animated, easings, useTransition } from '@react-spring/web';

export default function Header() {
    const router = useRouter();
    const [account, setAccount] = useState<APIUser>();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const profileAreaRef = useRef<HTMLDivElement>(null);
    const menuTransitions = useTransition(menuOpen, {
        "from": {
            "opacity": 0,
            "y": -8
        },
        "enter": {
            "opacity": 1,
            "y": 0
        },
        "leave": {
            "opacity": 0,
            "y": -6
        },
        "config": {
            "duration": 180,
            "easing": easings.easeOutCubic
        }
    });

    useEffect(() => {
        (async () => {
            try {
                const r = await REST<APIUser, APIError>("/api/auth/session");
                if (!r.success) throw new Error(r.data.message);

                setAccount(r.data);
            } catch (err) {
                const e = err as Error;
                alert(e.message);
                router.replace("/login");
            }
        })();
    }, [router]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!profileAreaRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, []);

    return <div className={css.header}>
        <LogoRedirect style={{
            "fontSize": 24,
            "margin": "auto 0"
        }} />

        <div className={css.profileArea} ref={profileAreaRef}>
            <button
                className={css.profile}
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
            >
                {(() => {
                    if (!account) return <FontAwesomeIcon icon={faDoorOpen} />;
                    if (!account.profile) return <FontAwesomeIcon icon={faUser} />;

                    return <img src={account.profile} alt={`${account.name} profile`} />
                })()}
            </button>

            {menuTransitions((style, item) => item ? <animated.div
                className={css.profileMenu}
                style={{
                    "opacity": style.opacity,
                    "transform": style.y.to((value) => `translateY(${value}px)`)
                }}
            >
                <div className={css.profileMeta}>
                    <span className={css.profileName}>{account?.name ?? "계정 불러오는 중..."}</span>
                    <span className={css.profileId}>{account?.userId ? `@${account.userId}` : "세션 확인 중"}</span>
                </div>

                <Link
                    className={css.profileLinkAction}
                    href="/users/@me/edit"
                >
                    프로필 변경
                </Link>

                <button
                    className={css.profileAction}
                    disabled={loggingOut}
                    onClick={async () => {
                        try {
                            setLoggingOut(true);

                            await fetch("/api/auth/logout", {
                                "method": "POST"
                            });
                        } finally {
                            localStorage.removeItem("access_token");
                            localStorage.removeItem("expires_at");
                            setMenuOpen(false);
                            router.replace("/login");
                        }
                    }}
                >
                    {loggingOut ? "로그아웃 중..." : "로그아웃"}
                </button>
            </animated.div> : null)}
        </div>
    </div>;
}
