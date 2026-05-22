import React, { useState, useEffect, useRef } from 'react';
import { messagesAPI } from '../services/api';
import { Send } from 'lucide-react';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
      const interval = setInterval(() => loadMessages(selectedConversation._id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data.conversations || []);
      if (!selectedConversation && response.data.conversations.length > 0) {
        setSelectedConversation(response.data.conversations[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await messagesAPI.getMessages(conversationId, { limit: 50 });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const otherParticipant = selectedConversation.participantIds.find(
        p => p._id !== (localStorage.getItem('userId') || 'me')
      );

      await messagesAPI.sendMessage({
        conversationId: selectedConversation._id,
        recipientId: otherParticipant?._id,
        content: messageContent
      });

      await loadMessages(selectedConversation._id);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageContent);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-96 md:h-[600px]">
          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No conversations yet</div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 border-b border-gray-200 text-left hover:bg-gray-50 transition ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-purple-50 border-l-4 border-l-purple-600'
                        : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {conversation.participantIds
                        .map(p => p.name)
                        .join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage ? 'Last message' : 'No messages yet'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation.participantIds
                      .map(p => p.name)
                      .join(', ')}
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.senderId._id === (localStorage.getItem('userId') || '')
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.senderId._id === (localStorage.getItem('userId') || '')
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId._id === (localStorage.getItem('userId') || '')
                                ? 'text-purple-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
