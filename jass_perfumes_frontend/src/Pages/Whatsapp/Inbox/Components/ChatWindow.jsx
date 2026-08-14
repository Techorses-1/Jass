import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

const ChatWindow = ({
    selectedConversation,
    messages,
    setMessages,
    loading
}) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!loading) {
            scrollToBottom();
        }
    }, [loading]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!selectedConversation) {
        return (
            <div className="whatsapp-inbox-empty-chat-window">
                Select a conversation to start chatting
            </div>
        );
    }

    return (
        <div className="whatsapp-inbox-chat-window">
            <div className="whatsapp-inbox-chat-header">
                <div className="whatsapp-inbox-chat-avatar">
                    {selectedConversation.customerName?.charAt(0)}
                </div>
                <div>
                    <h3>{selectedConversation.customerName}</h3>
                    <span>{selectedConversation.customerPhone}</span>
                </div>
            </div>

            <div className="whatsapp-inbox-chat-messages">
                {loading ? (
                    <div className="whatsapp-inbox-loading-box">Loading messages...</div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.messageId}
                                message={message}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <MessageInput
                selectedConversation={selectedConversation}
                setMessages={setMessages}
            />
        </div>
    );
};

export default ChatWindow;