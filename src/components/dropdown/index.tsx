"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import css from './styles.module.css';

type Props = {
    "children": ReactNode,
    "dropdown": ReactNode,
    "className"?: string,
    "style"?: CSSProperties,
    "containerClassName"?: string,
    "containerStyle"?: CSSProperties,
    "defaultOpen"?: boolean,
    "onOpenChange"?: (isOpen: boolean) => any
};

function mergeClassNames(...values: (string | undefined)[]) {
    return values.filter(Boolean).join(" ");
}

export default function Dropdown(props: Props) {
    const {
        children,
        dropdown,
        className,
        style,
        containerClassName,
        containerStyle,
        defaultOpen = false,
        onOpenChange
    } = props;

    const rootRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current) return;
            if (!(event.target instanceof Node)) return;
            if (rootRef.current.contains(event.target)) return;

            setOpen(false);
            onOpenChange?.(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            setOpen(false);
            onOpenChange?.(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onOpenChange]);

    return <div
        ref={rootRef}
        className={mergeClassNames(css.container, containerClassName)}
        style={containerStyle}
    >
        <div
            className={css.trigger}
            onClick={() => {
                setOpen(v => {
                    const next = !v;
                    onOpenChange?.(next);

                    return next;
                });
            }}
            onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;

                event.preventDefault();

                setOpen(v => {
                    const next = !v;
                    onOpenChange?.(next);

                    return next;
                });
            }}
            role="button"
            tabIndex={0}
            aria-expanded={open}
        >
            {children}
        </div>
        {open && <div
            className={mergeClassNames(css.dropdown, className)}
            style={style}
        >
            {dropdown}
        </div>}
    </div>;
}
