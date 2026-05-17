"use client";

import { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animated, easings, to, useSpring } from '@react-spring/web';
import { createPortal } from 'react-dom';
import css from './styles.module.css';

type DropdownButtonItem = {
    "type"?: "button",
    "label": ReactNode,
    "src"?: string,
    "onClick"?: () => any,
    "className"?: string,
    "style"?: CSSProperties,
    "disabled"?: boolean,
    "closeOnClick"?: boolean
};

type DropdownSeparatorItem = {
    "type": "separator",
    "className"?: string,
    "style"?: CSSProperties
};

export type DropdownItem = DropdownButtonItem | DropdownSeparatorItem;

type Props = {
    "children": ReactNode,
    "dropdown"?: ReactNode,
    "items"?: DropdownItem[],
    "className"?: string,
    "style"?: CSSProperties,
    "containerClassName"?: string,
    "containerStyle"?: CSSProperties,
    "defaultOpen"?: boolean,
    "onOpenChange"?: (isOpen: boolean) => any
};

const DROPDOWN_ANIMATE_CONFIG = {
    "config": {
        "duration": 180,
        "easing": easings.easeOutCubic
    }
};

const DROPDOWN_CLOSED_STYLE = {
    "opacity": 0,
    "y": -8
};

const DROPDOWN_OPEN_STYLE = {
    "opacity": 1,
    "y": 0
};

function mergeClassNames(...values: (string | undefined)[]) {
    return values.filter(Boolean).join(" ");
}

export default function Dropdown(props: Props) {
    const {
        children,
        dropdown,
        items,
        className,
        style,
        containerClassName,
        containerStyle,
        defaultOpen = false,
        onOpenChange
    } = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownPanelRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(defaultOpen);
    const [renderDropdown, setRenderDropdown] = useState(defaultOpen);
    const [dropdownPosition, setDropdownPosition] = useState<{
        "top": number,
        "left": number
    }>();
    const [dropdownAnimatedStyle, dropdownAnimationApi] = useSpring(() => ({
        ...(defaultOpen ? DROPDOWN_OPEN_STYLE : DROPDOWN_CLOSED_STYLE),
        ...DROPDOWN_ANIMATE_CONFIG
    }));

    const closeDropdown = () => {
        setOpen(false);
        onOpenChange?.(false);
    };

    const toggleDropdown = () => {
        setOpen(v => {
            const next = !v;
            if (next) {
                setDropdownPosition(undefined);
            }

            onOpenChange?.(next);

            return next;
        });
    };

    const updateDropdownPosition = () => {
        if (!rootRef.current || !dropdownPanelRef.current) return;

        const gap = 8;
        const triggerRect = rootRef.current.getBoundingClientRect();
        const dropdownRect = dropdownPanelRef.current.getBoundingClientRect();

        let left = triggerRect.left;
        let top = triggerRect.bottom + gap;

        if (left + dropdownRect.width > window.innerWidth - gap) {
            left = window.innerWidth - dropdownRect.width - gap;
        }
        if (top + dropdownRect.height > window.innerHeight - gap) {
            top = triggerRect.top - dropdownRect.height - gap;
        }

        setDropdownPosition({
            "top": Math.max(gap, top),
            "left": Math.max(gap, left)
        });
    };

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current) return;
            if (!(event.target instanceof Node)) return;
            if (rootRef.current.contains(event.target)) return;
            if (dropdownRef.current?.contains(event.target)) return;

            closeDropdown();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            closeDropdown();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onOpenChange]);

    useLayoutEffect(() => {
        if (!open || !renderDropdown) return;

        updateDropdownPosition();

        const handleReposition = () => updateDropdownPosition();

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [open, renderDropdown, items, dropdown]);

    useEffect(() => {
        let cancelled = false;

        if (open) {
            setRenderDropdown(true);
            dropdownAnimationApi.set(DROPDOWN_CLOSED_STYLE);

            requestAnimationFrame(() => {
                if (cancelled) return;

                void dropdownAnimationApi.start({
                    ...DROPDOWN_OPEN_STYLE
                });
            });

            return () => {
                cancelled = true;
            };
        }

        void dropdownAnimationApi.start({
            ...DROPDOWN_CLOSED_STYLE,
            "onRest": () => {
                if (cancelled) return;

                setRenderDropdown(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [open, dropdownAnimationApi]);

    const dropdownContent = items ? items.map((item, index) => {
        if (item.type === "separator") {
            return <div
                key={`separator-${index}`}
                className={mergeClassNames(css.separator, item.className)}
                style={item.style}
                aria-hidden="true"
            />;
        }

        return <button
            key={`item-${index}`}
            type="button"
            className={mergeClassNames(css.item, item.className)}
            style={item.style}
            disabled={item.disabled}
            onPointerDown={(event) => {
                event.stopPropagation();
            }}
            onClick={(event) => {
                event.stopPropagation();
                item.onClick?.();

                if (item.closeOnClick === false) return;

                closeDropdown();
            }}
        >
            {item.src && <img
                draggable={false}
                src={item.src}
                alt=""
                aria-hidden="true"
                className={css.itemIcon}
            />}
            <span className={css.itemLabel}>{item.label}</span>
        </button>;
    }) : dropdown;

    return <div
        ref={rootRef}
        className={mergeClassNames(css.container, css.trigger, containerClassName)}
        style={containerStyle}
        onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;

            event.preventDefault();
            toggleDropdown();
        }}
        onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
            if (event.defaultPrevented) return;
            if (event.key !== "Enter" && event.key !== " ") return;

            event.preventDefault();
            toggleDropdown();
        }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="menu"
    >
        {children}
        {renderDropdown && createPortal(<div
            ref={dropdownRef}
            style={{
                "position": "fixed",
                "top": dropdownPosition?.top ?? 0,
                "left": dropdownPosition?.left ?? 0,
                "visibility": dropdownPosition ? "visible" : "hidden",
                "pointerEvents": open ? "auto" : "none",
                "zIndex": 200,
                "overflow": "visible"
            }}
        >
            <animated.div
                ref={dropdownPanelRef}
                className={mergeClassNames(css.dropdown, className)}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                style={{
                    ...style,
                    "opacity": dropdownAnimatedStyle.opacity,
                    "transform": to(
                        [dropdownAnimatedStyle.y],
                        (y) => `translateY(${y}px)`
                    )
                }}
            >
            {dropdownContent}
            </animated.div>
        </div>, document.body)}
    </div>;
}
