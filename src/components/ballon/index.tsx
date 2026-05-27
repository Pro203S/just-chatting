import { useState } from 'react';
import Dropdown, { DropdownItem } from '../dropdown';
import css from './styles.module.css';

type Props = {
    "sender": {
        "name": string,
        "profile": UserProfile,
        "sentByMe": boolean
    },
    "messages": APIMessage[];
    "getMessageDropdownItems": (message: APIMessage) => DropdownItem[];
}

export default function Ballon(props: Props) {
    const { sender, messages, getMessageDropdownItems } = props;
    const [contextMenuState, setContextMenuState] = useState<{
        "messageId": APIMessage["id"],
        "top": number,
        "left": number
    } | null>(null);

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
            {messages.map((v) => <div
                key={v.id}
                className={css.content}
                onContextMenu={(event) => {
                    event.preventDefault();

                    setContextMenuState({
                        "messageId": v.id,
                        "top": event.clientY,
                        "left": event.clientX
                    });
                }}
            >
                <span className={css.text}>{v.content}</span>
                {contextMenuState?.messageId === v.id && <Dropdown
                    triggerMode="manual"
                    open={true}
                    anchorPosition={{
                        "top": contextMenuState.top,
                        "left": contextMenuState.left
                    }}
                    items={getMessageDropdownItems(v)}
                    onOpenChange={(open) => {
                        if (open) return;

                        setContextMenuState(null);
                    }}
                />}
            </div>)}
        </div>
    </div>;
}
