"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

type Props = {
    fullscr?: boolean;
}

export default function Loading(props: Props) {
    return <div style={{
        ...(props.fullscr ? {
            "width": "100vw",
            "height": "100vh"
        } : undefined),
        "display": "flex",
        "justifyContent": "center",
        "alignItems": "center"
    }}>
        <FontAwesomeIcon
            style={{
                "margin": "auto",
                "fontSize": "2rem"
            }}
            color="#888"
            icon={faCircleNotch}
            spin
            fontSize={"3rem"} />
    </div>;
}