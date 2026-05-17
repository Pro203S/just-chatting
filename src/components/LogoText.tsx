import { animated, AnimatedProps } from "@react-spring/web";
import Link from "next/link";
import { CSSProperties } from "react";

type SpanProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

type Props = {
    "style"?: CSSProperties;
};

type AnimatedLogoProps = {
    "style"?: AnimatedProps<SpanProps>["style"];
}

const AnimatedLogo = animated(LogoText);

export default function LogoText(props: Props) {
    return <span style={{
        "fontFamily": "continuous",
        "color": "white",
        "fontSize": "2.67rem",
        "userSelect": "none",
        ...props.style,
    }}>Just Chatting</span>;
}

export function LogoRedirect(props: Props) {
    return <Link href="/" style={{
        "fontFamily": "continuous",
        "color": "white",
        "fontSize": "2.67rem",
        "userSelect": "none",
        "textDecoration": "none",
        "cursor": "pointer",
        ...props.style,
    }}>Just Chatting</Link>;
}

export function AnimatedLogoText(props: AnimatedLogoProps) {
    return <AnimatedLogo style={props.style} />;
}