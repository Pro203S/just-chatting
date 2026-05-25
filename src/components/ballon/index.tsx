import css from './styles.module.css';

type Props = {
    "sender": {
        "name": string,
        "profile": UserProfile,
        "sentByMe": boolean
    },
    "messages": APIMessage[];
    "resolveAttachment": (attachment: Attachment["id"] | APIAttachment) => Promise<APIAttachment>;
}

export default function Ballon(props: Props) {
    const { sender, messages, resolveAttachment } = props;

    return <div className={css.message}>
        <div className={css.profileContainer}>

        </div>
        <div className={css.contents}>
            
        </div>
    </div>;
}