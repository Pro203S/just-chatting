import { animated, AnimatedProps } from "@react-spring/web";
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
        ...props.style,
        "fontFamily": "continuous",
        "color": "white",
        "fontSize": "2.67rem",
        "userSelect": "none"
    }}>Just Chatting</span>;
}

export function AnimatedLogoText(props: AnimatedLogoProps) {
    return <AnimatedLogo style={props.style} />;
}