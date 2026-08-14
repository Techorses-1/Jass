import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import ConversationList from "./Components/ConversationList";
import ChatWindow from "./Components/ChatWindow";
import "./WhatsAppInbox.scss";
import Navbar from "../../../Components/Sidebar/Navbar";

const WhatsAppInbox = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversationLoading, setConversationLoading] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);

    const selectedConversationRef = useRef(selectedConversation);
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    const fetchConversations = async () => {
        try {
            setConversationLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/whatsapp/get-conversations`);
            setConversations(res.data.data || []);
        } catch (err) { console.error(err); } finally { setConversationLoading(false); }
    };

    const fetchMessages = async (conversationId) => {
        try {
            setMessageLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/whatsapp/get-messages/${conversationId}`);
            setMessages(res.data.data || []);

            await axios.patch(`${import.meta.env.VITE_API_URL}/whatsapp/reset-unread/${conversationId}`);

            setConversations(prev =>
                prev.map(c =>
                    c.conversationId === conversationId
                        ? { ...c, unreadCount: 0 }
                        : c
                )
            );
        } catch (err) { console.error(err); } finally { setMessageLoading(false); }
    };

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
        const socket = io(baseUrl, {
            path: "/socket.io",
            transports: ["websocket", "polling"]
        });

        socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
        socket.on("connect_error", (err) => console.error("❌ Socket error:", err.message));

        socket.on("new-message", (data) => {
            console.log("📨 Real-time message:", data);

            if (selectedConversationRef.current?.conversationId === data.conversationId) {
                setMessages(prev => [...prev, data.message]);

                setConversations(prev =>
                    prev.map(c =>
                        c.conversationId === data.conversationId
                            ? { ...c, unreadCount: 0, lastMessage: data.message.message, lastMessageTime: new Date() }
                            : c
                    )
                );
            } else {
                fetchConversations();
            }
        });

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation?.conversationId) {
            fetchMessages(selectedConversation.conversationId);
        }
    }, [selectedConversation]);

    return (
        <Navbar>
            <div className="whatsapp-inbox-container">
                <div className="whatsapp-inbox-page">
                    <ConversationList
                        conversations={conversations}
                        selectedConversation={selectedConversation}
                        setSelectedConversation={setSelectedConversation}
                        loading={conversationLoading}
                    />
                    <ChatWindow
                        selectedConversation={selectedConversation}
                        messages={messages}
                        setMessages={setMessages}
                        loading={messageLoading}
                    />
                </div>
            </div>
        </Navbar>
    );
};

export default WhatsAppInbox;