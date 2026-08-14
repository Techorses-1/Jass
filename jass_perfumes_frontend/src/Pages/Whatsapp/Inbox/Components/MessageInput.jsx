import React, { useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";

const MessageInput = ({ selectedConversation, setMessages }) => {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        try {
            setSending(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/whatsapp/send-message`,
                {
                    conversationId: selectedConversation.conversationId,
                    customerPhone: selectedConversation.customerPhone,
                    message,
                }
            );

            setMessages((prev) => [...prev, response.data.data]);
            setMessage("");
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="whatsapp-inbox-message-input-wrapper">
            <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !sending) {
                        handleSendMessage();
                    }
                }}
            />
            <button onClick={handleSendMessage} disabled={sending}>
                {sending ? "Sending..." : <Send size={18} />}
            </button>
        </div>
    );
};

export default MessageInput;