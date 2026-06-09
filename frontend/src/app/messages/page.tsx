'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Send, ArrowRight, Search, MessageCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { messagesAPI, usersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Navbar } from '@/components/ui/Navbar';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ChatMessage {
  _id: string;
  sender: { _id: string; firstName: string; lastName: string; profilePicture?: string };
  content: string;
  mediaUrl?: string;
  createdAt: string;
  readBy: string[];
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    grade: string;
    lastSeen: string;
  }>;
  lastMessage?: { content: string; createdAt: string };
  lastMessageAt: string;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();
  const { t } = useTranslation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvUserId, setActiveConvUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isMobileConvOpen, setIsMobileConvOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<Conversation | null>(null);

  // Keep ref in sync so socket handler can access latest conversation
  useEffect(() => { activeConvRef.current = conversation; }, [conversation]);

  // Socket setup
  useEffect(() => {
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('new_message', ({ message, conversationId }: { message: ChatMessage; conversationId: string }) => {
      const currentConv = activeConvRef.current;
      if (currentConv && currentConv._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId
            ? { ...c, lastMessage: { content: message.content, createdAt: message.createdAt }, lastMessageAt: message.createdAt }
            : c
        )
      );
    });

    socket.on('typing_start', ({ userId }: { userId: string }) => {
      setTypingUserIds(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    socket.on('typing_stop', ({ userId }: { userId: string }) => {
      setTypingUserIds(prev => prev.filter(id => id !== userId));
    });

    socket.on('user_online', ({ userId }: { userId: string }) => {
      setOnlineUserIds(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    socket.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUserIds(prev => prev.filter(id => id !== userId));
    });

    return () => { socket.disconnect(); };
  }, [token]);

  // Load conversations on mount
  useEffect(() => {
    messagesAPI.getConversations()
      .then(r => setConversations(r.data.conversations))
      .catch(console.error);
  }, []);

  // Handle ?with= param
  useEffect(() => {
    const withUserId = searchParams.get('with');
    if (withUserId) openConversation(withUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (userId: string) => {
    setLoadingConv(true);
    setActiveConvUserId(userId);
    setIsMobileConvOpen(true);
    setMessages([]);

    try {
      const res = await messagesAPI.getConversation(userId);
      setConversation(res.data.conversation);
      setMessages(res.data.messages);
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', res.data.conversation._id);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setLoadingConv(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending || !activeConvUserId) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      const res = await messagesAPI.sendMessage(activeConvUserId, text);
      setMessages(prev => [...prev, res.data.message]);
      setConversations(prev =>
        prev.map(c => {
          const other = c.participants.find(p => p._id !== user?._id);
          if (other?._id === activeConvUserId) {
            return { ...c, lastMessage: { content: text, createdAt: new Date().toISOString() }, lastMessageAt: new Date().toISOString() };
          }
          return c;
        })
      );

      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
        if (conversation) {
          socketRef.current?.emit('typing_stop', { conversationId: conversation._id, recipientId: activeConvUserId });
        }
      }
    } catch {
      toast.error(t.error);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConvUserId || !conversation) return;

    socketRef.current?.emit('typing_start', { conversationId: conversation._id, recipientId: activeConvUserId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { conversationId: conversation._id, recipientId: activeConvUserId });
    }, 2000);
  };

  const { data: searchResults } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: () => usersAPI.search(searchQuery).then(r => r.data.users),
    enabled: searchQuery.length >= 2,
  });

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find(p => p._id !== user?._id);

  const isOnline = (userId: string) => onlineUserIds.includes(userId);
  const isTyping = (userId: string) => typingUserIds.includes(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-14 h-screen flex flex-col">
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <div className={`${isMobileConvOpen ? 'hidden md:flex' : 'flex'} md:flex flex-col w-full md:w-80 bg-white border-r border-gray-100 shrink-0`}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-black text-gray-900 text-lg mb-3">{t.messages}</h2>
              <div className="relative">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`${t.search}...`}
                  className="w-full bg-gray-100 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              {searchQuery.length >= 2 && searchResults && (
                <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {searchResults.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3 text-center">לא נמצאו תלמידים</p>
                  ) : (searchResults as Array<{ _id: string; firstName: string; lastName: string; profilePicture?: string; grade: string }>).map(u => (
                    <button
                      key={u._id}
                      onClick={() => { openConversation(u._id); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-right"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{u.firstName} {u.lastName}</div>
                        <span className="grade-badge text-[10px]">{u.grade}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="text-center py-12 text-gray-400 px-4">
                  <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t.noConversations}</p>
                  <p className="text-xs mt-1">חפש תלמיד כדי להתחיל שיחה</p>
                </div>
              )}
              {conversations.map(conv => {
                const other = getOtherParticipant(conv);
                if (!other) return null;
                const active = activeConvUserId === other._id;
                return (
                  <button
                    key={conv._id}
                    onClick={() => openConversation(other._id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right ${active ? 'bg-primary-50' : ''}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                        {other.profilePicture
                          ? <Image src={other.profilePicture} alt="" width={44} height={44} className="w-full h-full object-cover" />
                          : <>{other.firstName.charAt(0)}{other.lastName.charAt(0)}</>
                        }
                      </div>
                      {isOnline(other._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900 truncate">{other.firstName} {other.lastName}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: he })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="grade-badge text-[10px]">{other.grade}</span>
                        {isTyping(other._id) ? (
                          <span className="text-xs text-primary-500 animate-pulse">מקליד...</span>
                        ) : conv.lastMessage ? (
                          <span className="text-xs text-gray-400 truncate">{conv.lastMessage.content}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className={`${!isMobileConvOpen ? 'hidden md:flex' : 'flex'} md:flex flex-1 flex-col bg-white`}>
            {!activeConvUserId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageCircle size={56} className="opacity-20 mb-4" />
                <p className="font-semibold text-gray-500">{t.startConversation}</p>
                <p className="text-sm mt-1">בחר שיחה מהצד או חפש תלמיד</p>
              </div>
            ) : (
              <>
                {conversation && (() => {
                  const other = getOtherParticipant(conversation);
                  if (!other) return null;
                  return (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                      <button
                        onClick={() => setIsMobileConvOpen(false)}
                        className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                      >
                        <ArrowRight size={18} />
                      </button>
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                          {other.profilePicture
                            ? <Image src={other.profilePicture} alt="" width={40} height={40} className="w-full h-full object-cover" />
                            : <>{other.firstName.charAt(0)}</>
                          }
                        </div>
                        {isOnline(other._id) && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <Link href={`/profile/${other._id}`} className="font-bold text-gray-900 text-sm hover:underline">
                          {other.firstName} {other.lastName}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <span className="grade-badge text-[10px]">{other.grade}</span>
                          <span className={`text-xs ${isOnline(other._id) ? 'text-green-500' : 'text-gray-400'}`}>
                            {isOnline(other._id) ? t.online : t.offline}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingConv ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageCircle size={40} className="opacity-20 mb-2" />
                      <p className="text-sm">התחל שיחה!</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isOwn = msg.sender._id === user?._id;
                      return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                          {!isOwn && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0 ml-2">
                              {msg.sender.firstName.charAt(0)}
                            </div>
                          )}
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}>
                            {msg.content}
                            <div className={`text-[10px] mt-1 ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
                              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: he })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {activeConvUserId && isTyping(activeConvUserId) && (
                    <div className="flex justify-end">
                      <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-md flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleTyping}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder={t.typeMessage}
                      className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim() || sending}
                      className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-primary-700 transition-colors active:scale-95 shrink-0"
                    >
                      {sending
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send size={16} />
                      }
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
