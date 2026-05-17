"use client";

import css from './styles.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

type Props = {
    title: string,
    href: string
};

export default function PageTitle(props: Props) {
    const { title, href } = props;
    const router = useRouter();

    const handleBack = () => {
        router.replace(href);
    };

    return <div className={css.titleRow}>
        <button
            className={css.backButton}
            type="button"
            onClick={handleBack}
            aria-label={`${title} 뒤로가기`}
        >
            <FontAwesomeIcon icon={faArrowLeft} className={css.icon} />
        </button>
        <span className={css.title}>{title}</span>
        <span className={css.spacer} aria-hidden />
    </div>;
}
