"use client";

import { useEffect } from 'react';
import { AnimatedLogoText } from '../components/LogoText';
import css from './page.module.css';
import Link from 'next/link';
import { animated, easings, useSpringValue } from '@react-spring/web';

const ANIMATE_CONFIG = {
    "config": {
        "duration": 470,
        "easing": easings.easeOutBack
    }
}

export default function Page() {
    const elem1_opacity = useSpringValue(0, ANIMATE_CONFIG);
    const elem1_y = useSpringValue(10, ANIMATE_CONFIG);

    const elem2_opacity = useSpringValue(0, ANIMATE_CONFIG);
    const elem2_y = useSpringValue(10, ANIMATE_CONFIG);

    const elem3_opacity = useSpringValue(0, ANIMATE_CONFIG);
    const elem3_y = useSpringValue(10, ANIMATE_CONFIG);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (cancelled) {
                return;
            }

            await Promise.all([
                elem1_opacity.start(1),
                elem1_y.start(0),
            ]);

            if (cancelled) {
                return;
            }

            await Promise.all([
                elem2_opacity.start(1),
                elem2_y.start(0),
            ]);

            if (cancelled) {
                return;
            }

            await Promise.all([
                elem3_opacity.start(1),
                elem3_y.start(0),
            ]);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return <div className={css.container}>
        <AnimatedLogoText style={{
            "opacity": elem1_opacity,
            "transform": elem1_y.to((value) => `translateY(${value}px)`)
        }} />
        <animated.span
            className={css.desc}
            style={{
                "opacity": elem2_opacity,
                "transform": elem2_y.to((value) => `translateY(${value}px)`)
            }}
        >
            친구들과 간단히 채팅을 시작해보세요.
        </animated.span>
        <animated.div
            className={css.linearH}
            style={{
                "opacity": elem3_opacity,
                "transform": elem3_y.to((value) => `translateY(${value}px)`)
            }}
        >
            <Link className={css.button} href="/account/signup">
                <span>가입하기</span>
            </Link>
        </animated.div>
    </div>;
}
