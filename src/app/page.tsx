"use client";

import { useEffect, useState } from 'react';
import LogoText from '../components/logoText';
import css from './page.module.css';
import Link from 'next/link';
import InOutAnimation from '../components/InOutAnimation';
import { useRouter } from 'next/navigation';

export default function Page() {
    const router = useRouter();

    const [animate1, setAnimate1] = useState(false);
    const [animate2, setAnimate2] = useState(false);
    const [animate3, setAnimate3] = useState(false);

    useEffect(() => {
        (async () => {
            if (localStorage.getItem("access_token")) {
                return router.replace("/chats");
            }
            setAnimate1(true);
            await new Promise(r => setTimeout(r, 150));
            setAnimate2(true);
            await new Promise(r => setTimeout(r, 150));
            setAnimate3(true);
        })();
    }, []);

    return <div className={css.container}>
        <InOutAnimation animate={animate1}>
            <LogoText />
        </InOutAnimation>
        <InOutAnimation animate={animate2}>
            <span className={css.desc}>
                친구들과 간단히 채팅을 시작해보세요.
            </span>
        </InOutAnimation>
        <InOutAnimation animate={animate3}>
            <div className={css.linearH}>
                <Link className={css.button} href="/register">
                    <span>가입하기</span>
                </Link>
                <Link className={css.link} href="/login">
                    <span>로그인</span>
                </Link>
            </div>
        </InOutAnimation>
    </div>;
}
