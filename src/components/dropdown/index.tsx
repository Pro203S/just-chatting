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
    "children"?: ReactNode,
    "dropdown"?: ReactNode,
    "items"?: DropdownItem[],
    "className"?: string,
    "style"?: CSSProperties,
    "containerClassName"?: string,
    "containerStyle"?: CSSProperties,
    "defaultOpen"?: boolean,
    "open"?: boolean,
    "anchorPosition"?: {
        "top": number,
        "left": number
    },
    "triggerMode"?: "click" | "manual",
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
        open: controlledOpen,
        anchorPosition,
        triggerMode = "click",
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
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;

    const getInitialDropdownPosition = () => {
        if (anchorPosition) return anchorPosition;
        if (!rootRef.current) return undefined;

        const gap = 8;
        const triggerRect = rootRef.current.getBoundingClientRect();

        return {
            "top": Math.max(gap, triggerRect.bottom + gap),
            "left": Math.max(gap, triggerRect.left)
        };
    };

    const closeDropdown = () => {
        if (!isControlled) setOpen(false);
        onOpenChange?.(false);
    };

    const openDropdown = () => {
        dropdownAnimationApi.stop();
        dropdownAnimationApi.set(DROPDOWN_CLOSED_STYLE);
        setDropdownPosition(getInitialDropdownPosition());
        setRenderDropdown(true);
        if (!isControlled) setOpen(true);
        onOpenChange?.(true);
    };

    const toggleDropdown = () => {
        if (isOpen) {
            closeDropdown();
            return;
        }

        openDropdown();
    };

    const updateDropdownPosition = () => {
        if (!dropdownPanelRef.current) return;

        const gap = 8;
        const dropdownRect = dropdownPanelRef.current.getBoundingClientRect();
        let left = gap;
        let top = gap;

        if (anchorPosition) {
            left = anchorPosition.left;
            top = anchorPosition.top;
        } else {
            if (!rootRef.current) return;

            const triggerRect = rootRef.current.getBoundingClientRect();

            left = triggerRect.left;
            top = triggerRect.bottom + gap;

            if (top + dropdownRect.height > window.innerHeight - gap) {
                top = triggerRect.top - dropdownRect.height - gap;
            }
        }

        if (left + dropdownRect.width > window.innerWidth - gap) {
            left = window.innerWidth - dropdownRect.width - gap;
        }
        if (top + dropdownRect.height > window.innerHeight - gap) {
            top = window.innerHeight - dropdownRect.height - gap;
        }

        setDropdownPosition({
            "top": Math.max(gap, top),
            "left": Math.max(gap, left)
        });
    };

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!(event.target instanceof Node)) return;
            if (rootRef.current?.contains(event.target)) return;
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
    }, [isOpen, onOpenChange]);

    useLayoutEffect(() => {
        if (!isOpen || !renderDropdown) return;

        updateDropdownPosition();

        const handleReposition = () => updateDropdownPosition();

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [anchorPosition, isOpen, renderDropdown, items, dropdown]);

    useEffect(() => {
        if (!isOpen || !renderDropdown) return;

        const frame = requestAnimationFrame(() => {
            void dropdownAnimationApi.start({
                ...DROPDOWN_OPEN_STYLE
            });
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [isOpen, renderDropdown, dropdownAnimationApi]);

    useEffect(() => {
        if (isOpen || !renderDropdown) return;

        let cancelled = false;

        void dropdownAnimationApi.start({
            ...DROPDOWN_CLOSED_STYLE,
            "onRest": () => {
                if (cancelled) return;

                setRenderDropdown(false);
                setDropdownPosition(undefined);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [isOpen, renderDropdown, dropdownAnimationApi]);

    useEffect(() => {
        if (!isControlled) return;

        if (controlledOpen) {
            dropdownAnimationApi.stop();
            dropdownAnimationApi.set(DROPDOWN_CLOSED_STYLE);
            setDropdownPosition(getInitialDropdownPosition());
            setRenderDropdown(true);
            return;
        }

        setOpen(false);
    }, [anchorPosition, controlledOpen, dropdownAnimationApi, isControlled]);

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

    const dropdownPortal = renderDropdown && createPortal(<div
            ref={dropdownRef}
            style={{
                "position": "fixed",
                "top": dropdownPosition?.top ?? 0,
                "left": dropdownPosition?.left ?? 0,
                "visibility": dropdownPosition ? "visible" : "hidden",
                "pointerEvents": isOpen ? "auto" : "none",
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
        </div>, document.body);

    if (triggerMode === "manual") {
        return <>{dropdownPortal}</>;
    }

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
        aria-expanded={isOpen}
        aria-haspopup="menu"
    >
        {children}
        {dropdownPortal}
    </div>;
}
