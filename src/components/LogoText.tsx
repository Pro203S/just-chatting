import { animated } from "@react-spring/web";
import { CSSProperties } from "react";

type Props = {
    "style"?: CSSProperties;
};

export default function LogoText(props: Props) {
    return <span style={{
        ...props.style,
        "fontFamily": "continuous",
        "color": "white",
        "fontSize": "2.67rem"
    }}>Just Chatting</span>;
}

export function AnimatedLogoText(props: Props) {
    return <animated.span style={{
        ...props.style,
        "fontFamily": "continuous",
        "color": "white",
        "fontSize": "2.67rem"
    }}>Just Chatting</animated.span>;
}