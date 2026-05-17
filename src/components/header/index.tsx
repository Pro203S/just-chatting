import Link from 'next/link';
import { LogoRedirect } from '../logoText';
import css from './styles.module.css';
import { useEffect, useState } from 'react';
import REST from '@/src/modules/rest';
import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();
    const [account, setAccount] = useState<APIUser>();

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
    }, []);

    return <div className={css.header}>
        <LogoRedirect style={{
            "fontSize": 24,
            "margin": "auto 0"
        }} />

        <div className={css.linearH}>
            <Link href="/users">
                <span>친구 찾기</span>
            </Link>

            <Link href="/chats">
                <span>채팅방 목록</span>
            </Link>
        </div>

        <div className={css.profile}>
            {account ? (account.profile ? <img /> : <div></div>) : <div></div>}
        </div>
    </div>;
}