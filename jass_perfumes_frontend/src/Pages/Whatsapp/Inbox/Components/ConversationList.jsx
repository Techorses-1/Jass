import React, { useState } from "react";

const ConversationList = ({
    conversations,
    selectedConversation,
    setSelectedConversation,
    loading
}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredConversations = conversations.filter((conversation) => {
        const term = searchTerm.toLowerCase();
        return (
            conversation.customerName?.toLowerCase().includes(term) ||
            conversation.customerPhone?.includes(term)
        );
    });

    return (
        <div className="whatsapp-inbox-conversation-sidebar">
            <div className="whatsapp-inbox-conversation-sidebar-header">
                <h2>Chats</h2>
            </div>

            <div className="whatsapp-inbox-search-box">
                <input
                    type="text"
                    placeholder="Search by name or number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="whatsapp-inbox-conversation-list">
                {loading ? (
                    <div className="whatsapp-inbox-loading-box">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="whatsapp-inbox-loading-box">No conversations found</div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <div
                            key={conversation.conversationId}
                            className={`whatsapp-inbox-conversation-item ${selectedConversation?.conversationId === conversation.conversationId
                                    ? "active"
                                    : ""
                                }`}
                            onClick={() => setSelectedConversation(conversation)}
                        >
                            <div className="whatsapp-inbox-conversation-avatar">
                                {conversation.customerName?.charAt(0)}
                            </div>

                            <div className="whatsapp-inbox-conversation-content">
                                <div className="whatsapp-inbox-conversation-top">
                                    <h4>{conversation.customerName}</h4>
                                    <span>
                                        {conversation.lastMessageTime
                                            ? new Date(conversation.lastMessageTime).toLocaleTimeString(
                                                [],
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )
                                            : ""}
                                    </span>
                                </div>

                                <div className="whatsapp-inbox-conversation-bottom">
                                    <p>{conversation.lastMessage}</p>
                                    {conversation.unreadCount > 0 && (
                                        <div className="whatsapp-inbox-unread-badge">
                                            {conversation.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConversationList;