import { animated, AnimatedProps } from "@react-spring/web";
import Link from "next/link";
import { CSSProperties } from "react";
import css from './styles.module.css';

type SpanProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

type Props = {
    "style"?: CSSProperties;
};

type AnimatedLogoProps = {
    "style"?: AnimatedProps<SpanProps>["style"];
}

const AnimatedLogo = animated(LogoText);

export default function LogoText(props: Props) {
    const { style } = props;
    return <span className={css.logoText} style={style}>Just Chatting</span>;
}

export function LogoRedirect(props: Props) {
    const { style } = props;
    return <Link href="/" className={css.logoRedirect} style={style}>Just Chatting</Link>;
}

export function AnimatedLogoText(props: AnimatedLogoProps) {
    return <AnimatedLogo style={props.style} />;
}