import { useEffect } from 'react';
import css from './styles.module.css';
import { animated, easings, useSpringValue } from '@react-spring/web';

export type DialogButton = {
    "text": string,
    "onClick"?: () => any
}

type Props = {
    "title": string,
    "description": string | { "text": string, "draggable"?: boolean }[],
    "buttons": DialogButton[],
    "open": boolean,
    "onCancel"?: () => any
};

const BACKGROUND_ANIMATE_CONFIG = {
    "config": {
        "duration": 375,
        "easing": easings.easeOutQuad
    }
};

const DIALOG_ANIMATE_CONFIG = {
    "config": {
        "duration": 375,
        "easing": easings.easeOutCubic
    }
};

export default function Dialog(props: Props) {
    const { title, description, buttons, open, onCancel } = props;

    const bgOpacity = useSpringValue(0, BACKGROUND_ANIMATE_CONFIG);
    const bgBlur = useSpringValue(0, BACKGROUND_ANIMATE_CONFIG);

    const dialogOpacity = useSpringValue(0, DIALOG_ANIMATE_CONFIG);
    const dialogY = useSpringValue(10, DIALOG_ANIMATE_CONFIG);

    useEffect(() => {
        if (open) {
            bgOpacity.start(1);
            bgBlur.start(5);

            dialogOpacity.start(1);
            dialogY.start(0);
        } else {
            bgOpacity.start(0);
            bgBlur.start(0);

            dialogOpacity.start(0);
            dialogY.start(10);
        }
    }, [open]);

    useEffect(() => {
        const cb = ({ key }: KeyboardEvent) => {
            if (key !== "Escape") return;

            onCancel?.();
        };

        document.addEventListener("keydown", cb);

        return () => document.removeEventListener("keydown", cb);
    }, []);

    return <animated.div
        className={css.background}
        onClick={({ target, currentTarget }) => {
            if (target !== currentTarget) return;

            onCancel?.();
        }}
        style={{
            "pointerEvents": open ? "auto" : "none",
            "backdropFilter": bgBlur.to(v => `blur(${v}px)`)
        }}>
        <animated.div
            className={css.dialog}
            style={{
                "opacity": dialogOpacity,
                "transform": dialogY.to(v => `translateY(${v}px)`)
            }}
        >
            <div className={css.texts}>
                <span className={css.title}>{title}</span>
                {typeof description === "string" && description.split("\n").map(v => <span
                    className={css.description}
                    key={v}
                >
                    {v}
                </span>)}
                {typeof description === "object" && description.map(v => <span
                    className={css.description}
                    key={v.text}
                    style={{
                        "userSelect": v.draggable ? "auto" : "none"
                    }}
                >
                    {v.text}
                </span>)}
            </div>
            <div className={css.buttons}>
                {buttons.map(v => <button key={v.text} className={css.button} onClick={v.onClick}>
                    <span>{v.text}</span>
                </button>)}
            </div>
        </animated.div>
    </animated.div>;
}
