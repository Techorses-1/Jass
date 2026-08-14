import React from "react";
import { Check, CheckCheck } from "lucide-react";

const MessageBubble = ({ message }) => {

    const isAgent = message.senderType === "agent";

    const renderTicks = () => {
        if (!isAgent) return null;

        if (message.messageStatus === "sent") {
            return <Check size={16} color="#8696A0" />;
        }

        if (message.messageStatus === "delivered") {
            return <CheckCheck size={16} color="#8696A0" />;
        }

        if (message.messageStatus === "read") {
            return <CheckCheck size={16} color="#3f3f91" />;
        }

        return null;
    };

    const renderContent = () => {
        if (message.messageType === "image" && message.mediaUrl) {
            return (
                <div className="whatsapp-inbox-media-wrapper">
                    <img
                        src={message.mediaUrl}
                        alt={message.message || "image"}
                        className="whatsapp-inbox-media-image"
                        onClick={() => window.open(message.mediaUrl, "_blank")}
                    />
                    {message.message && message.message !== "📷 Image" && (
                        <p className="whatsapp-inbox-media-caption">{message.message}</p>
                    )}
                </div>
            );
        }

        if (message.messageType === "video" && message.mediaUrl) {
            return (
                <div className="whatsapp-inbox-media-wrapper">
                    <video
                        src={message.mediaUrl}
                        controls
                        className="whatsapp-inbox-media-video"
                    />
                    {message.message && message.message !== "🎥 Video" && (
                        <p className="whatsapp-inbox-media-caption">{message.message}</p>
                    )}
                </div>
            );
        }

        // fallback for text, audio, document, or missing mediaUrl
        return <p>{message.message}</p>;
    };

    return (
        <div className={`whatsapp-inbox-message-row ${isAgent ? "agent" : "customer"}`}>
            <div className="whatsapp-inbox-message-bubble">
                {renderContent()}
                <div className="whatsapp-inbox-message-footer">
                    <span>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                    {renderTicks()}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;