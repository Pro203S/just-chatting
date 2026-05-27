import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Dropdown from '../dropdown';
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

    return <div className={sender.sentByMe ? css.messageSentByMe : css.message}>
        {!sender.sentByMe && <div className={css.profileContainer}>
            <span className={css.name}>{sender.name}</span>
            <img
                className={css.profile}
                draggable={false}
                src={sender.profile.url}
            />
        </div>}
        <div className={`${css.contents} ${sender.sentByMe ? css.contentsSentByMe : css.contentsReceived}`}>
            {messages.map((v, i) => <div
                key={v.id}
                className={css.content}
            >
                <span className={css.text}>{v.content}</span>
            </div>)}
        </div>
    </div>;
}
