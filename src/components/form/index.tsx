import { useEffect, useState } from 'react';
import css from './styles.module.css';
import { animated, easings, useSpringValue } from '@react-spring/web';

type FormInputText = {
    "id": string,
    "value"?: string,
    "password"?: boolean,
    "placeholder": string,
    "name": string
};

type Props = {
    "title": string,
    "description": string | { "text": string, "draggable": boolean }[],
    "error"?: string,
    "disabled"?: boolean,
    "showForm": boolean,
    "inputs": FormInputText[],
    "submitText": string,
    "onSubmit": (data: any) => any;
    "onCancel"?: () => any;
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

const createInputValueMap = (inputs: FormInputText[]) => Object.fromEntries(
    inputs.map(v => [v.id, v.value ?? ""])
);

export default function Form(props: Props) {
    const { title, description, error, disabled, showForm, inputs, submitText, onSubmit, onCancel } = props;

    const bgOpacity = useSpringValue(0, BACKGROUND_ANIMATE_CONFIG);
    const bgBlur = useSpringValue(0, BACKGROUND_ANIMATE_CONFIG);

    const dialogOpacity = useSpringValue(0, DIALOG_ANIMATE_CONFIG);
    const dialogY = useSpringValue(10, DIALOG_ANIMATE_CONFIG);

    const [inputValueMap, setInputValuemap] = useState<Record<string, string>>(() => createInputValueMap(inputs));

    const [displayNone, setDisplayNone] = useState(true);

    useEffect(() => {
        (async () => {
            if (showForm) {
                setDisplayNone(false);
                await Promise.all([
                    bgOpacity.start(1),
                    bgBlur.start(5),

                    dialogOpacity.start(1),
                    dialogY.start(0)
                ]);
            } else {
                await Promise.all([
                    bgOpacity.start(0),
                    bgBlur.start(0),

                    dialogOpacity.start(0),
                    dialogY.start(10)
                ]);
                setDisplayNone(true);
            }
        })();
    }, [showForm]);

    useEffect(() => {
        if (!showForm) return;

        dialogOpacity.start(disabled ? 0.5 : 1);
    }, [disabled]);

    useEffect(() => {
        setInputValuemap(createInputValueMap(inputs));
    }, [inputs]);

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
            if (disabled) return;
            if (target !== currentTarget) return;

            onCancel?.();
        }}
        style={{
            "pointerEvents": showForm ? "auto" : "none",
            "backdropFilter": bgBlur.to(v => `blur(${v}px)`),
            "cursor": disabled ? "wait" : "auto",
            "display": displayNone ? "none" : undefined
        }}>
        <animated.div
            className={css.dialog}
            style={{
                "opacity": dialogOpacity,
                "transform": dialogY.to(v => `translateY(${v}px)`),
                "pointerEvents": disabled ? "none" : "auto"
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
                {error && <span className={css.error}>{error}</span>}
            </div>
            <div className={css.inputs}>
                {inputs.map(v => <div key={v.id} className={css.inputBox}>
                    <span className={css.label}>{v.name}</span>
                    <input
                        value={inputValueMap[v.id] ?? ""}
                        placeholder={v.placeholder}
                        type={v.password ? "password" : "text"}
                        onChange={({ currentTarget }) => setInputValuemap(map => ({
                            ...map,
                            [v.id]: currentTarget.value
                        }))}
                    />
                </div>)}
            </div>
            <button className={css.button} onClick={() => {
                onSubmit(inputValueMap);
                setInputValuemap(createInputValueMap(inputs));
            }}>
                <span>{submitText}</span>
            </button>
        </animated.div>
    </animated.div>;
}
