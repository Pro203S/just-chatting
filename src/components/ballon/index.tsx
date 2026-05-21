import css from './styles.module.css';

type Props = {
    "sender": {
        "name": string,
        "profile": string,
        "sentByMe": boolean
    },
    "messages": APIMessage[];
}

export default function Ballon(props: Props) {
    return <div>

    </div>;
}