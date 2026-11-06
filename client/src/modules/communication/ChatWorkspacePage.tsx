import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  Shield,
  AlertTriangle,
  FileText,
  Download,
  Video,
  X,
  Info,
  MoreVertical,
  Flag,
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { communicationApi, coreApi, getStoredUser } from '../../services/api.js';
import {
  connectSocket,
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
  emitTypingStatus,
  emitMarkAsRead,
} from '../../services/socket.js';

interface ConversationItem {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title?: string | null;
  groupType?: string | null;
  lastMessageAt?: string | null;
  participants: Array<{
    id: string;
    userId: string;
    role: string;
    lastReadAt?: string | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string | null;
    };
  }>;
  messages?: any[];
  unreadCount?: number;
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  isDeleted: boolean;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  receipts?: Array<{
    userId: string;
    status: string;
    readAt?: string | null;
  }>;
}

export const ChatWorkspacePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [policyNoticeDismissed, setPolicyNoticeDismissed] = useState<boolean>(false);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedMessageForReport, setSelectedMessageForReport] = useState<MessageItem | null>(null);
  const [reportReason, setReportReason] = useState<string>('HARASSMENT');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);

  // Directory users for new chat & group
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [groupTitle, setGroupTitle] = useState<string>('');
  const [groupType, setGroupType] = useState<string>('CLASS_SECTION');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [creatingConv, setCreatingConv] = useState<boolean>(false);

  // Attachment upload simulation
  const [attachmentFileName, setAttachmentFileName] = useState<string>('');
  const [attachmentFileType, setAttachmentFileType] = useState<string>('application/pdf');
  const [attachmentFileSize, setAttachmentFileSize] = useState<number>(204800);
  const [showAttachModal, setShowAttachModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Initialize User, Socket and Load Conversations
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Load logged in user profile from stored auth session
        const userObj = getStoredUser();
        setCurrentUser(userObj);

        // Initialize Socket
        connectSocket();

        // Load conversation list
        await loadConversations();
        await loadTenantUsers();
      } catch (err) {
        console.error('Failed to initialize chat workspace:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('new_message');
        socket.off('message_read');
        socket.off('user_typing');
      }
    };
  }, []);

  // Socket Event Listeners for real-time messaging
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (newMsg: MessageItem) => {
      if (activeConversation && newMsg.conversationId === activeConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Auto mark as read if conversation is open
        if (currentUser && newMsg.senderId !== currentUser.id) {
          communicationApi.markMessageAsRead(activeConversation.id, newMsg.id).catch(() => {});
          emitMarkAsRead(activeConversation.id, newMsg.id);
        }
        scrollToBottom();
      }
      // Update snippet and unread counts in conversations list
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            const isCurrent = activeConversation?.id === c.id;
            return {
              ...c,
              lastMessageAt: newMsg.createdAt,
              messages: [newMsg],
              unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    };

    const handleMessageRead = ({ messageId, userId }: { messageId: string; userId: string }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return { ...m, status: 'READ' };
          }
          return m;
        })
      );
    };

    const handleUserTyping = ({ userId, userName, isTyping }: { userId: string; userName: string; isTyping: boolean }) => {
      if (currentUser && userId === currentUser.id) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(userName) ? prev : [...prev, userName];
        } else {
          return prev.filter((name) => name !== userName);
        }
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing', handleUserTyping);
    };
  }, [activeConversation, currentUser]);

  // Handle active conversation change
  useEffect(() => {
    if (!activeConversation) return;

    joinConversationRoom(activeConversation.id);
    loadMessages(activeConversation.id);

    return () => {
      leaveConversationRoom(activeConversation.id);
    };
  }, [activeConversation?.id]);

  const loadConversations = async () => {
    try {
      const res: any = await communicationApi.getConversations();
      const list = res?.data ?? res ?? [];
      setConversations(list);
      if (list.length > 0 && !activeConversation) {
        setActiveConversation(list[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadTenantUsers = async () => {
    try {
      const [staffRes, studentRes]: any = await Promise.all([
        coreApi.listStaff().catch(() => []),
        coreApi.listStudents().catch(() => []),
      ]);
      const staffList = (staffRes?.data ?? staffRes ?? []).map((s: any) => ({
        id: s.user?.id || s.userId || s.id,
        firstName: s.user?.firstName || s.firstName || 'Faculty',
        lastName: s.user?.lastName || s.lastName || 'Staff',
        email: s.user?.email || s.email || 'staff@school.edu',
      }));
      const studentList = (studentRes?.data ?? studentRes?.items ?? studentRes ?? []).map((st: any) => ({
        id: st.user?.id || st.userId || st.id,
        firstName: st.user?.firstName || st.firstName || 'Student',
        lastName: st.user?.lastName || st.lastName || '',
        email: st.user?.email || st.email || 'student@school.edu',
      }));
      setTenantUsers([...staffList, ...studentList]);
    } catch (err) {
      console.error('Failed to load school users:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      setMessagesLoading(true);
      const res: any = await communicationApi.getMessages(convId, { limit: 100 });
      const msgs = res?.data ?? res ?? [];
      setMessages(msgs);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || (!messageText.trim() && !attachmentFileName)) return;

    const content = messageText.trim();
    setMessageText('');

    let attachmentsPayload = undefined;
    if (attachmentFileName) {
      attachmentsPayload = [
        {
          fileName: attachmentFileName,
          fileUrl: `https://edunexa.storage.internal/docs/${encodeURIComponent(attachmentFileName)}`,
          fileType: attachmentFileType,
          fileSize: attachmentFileSize,
        },
      ];
      setAttachmentFileName('');
    }

    try {
      const payload = {
        conversationId: activeConversation.id,
        content: content || 'Shared an attachment',
        messageType: attachmentsPayload ? 'FILE' : 'TEXT',
        attachments: attachmentsPayload,
      };

      const res: any = await communicationApi.sendMessage(payload);
      const createdMessage = res?.data ?? res;

      setMessages((prev) => [...prev, createdMessage]);
      scrollToBottom();

      // Emit stop typing
      if (currentUser) {
        emitTypingStatus(activeConversation.id, false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (!activeConversation || !currentUser) return;

    emitTypingStatus(activeConversation.id, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStatus(activeConversation.id, false);
    }, 2000);
  };

  const handleCreateDirectChat = async () => {
    if (!selectedTargetUserId) return;
    try {
      setCreatingConv(true);
      const res: any = await communicationApi.getOrCreateDirectConversation(selectedTargetUserId);
      const conv = res?.data ?? res;
      setShowNewChatModal(false);
      setSelectedTargetUserId('');
      await loadConversations();
      setActiveConversation(conv);
    } catch (err: any) {
      alert(err.message || 'Could not initiate direct chat');
    } finally {
      setCreatingConv(false);
    }
  };

  const handleCreateGroupChat = async () => {
    if (!groupTitle.trim() || selectedGroupMemberIds.length === 0) {
      alert('Please provide a group title and select at least one member');
      return;
    }
    try {
      setCreatingConv(true);
      const res: any = await communicationApi.createGroup({
        title: groupTitle.trim(),
        groupType,
        participantUserIds: selectedGroupMemberIds,
      });
      const newGroup = res?.data ?? res;
      setShowNewGroupModal(false);
      setGroupTitle('');
      setSelectedGroupMemberIds([]);
      await loadConversations();
      setActiveConversation(newGroup);
    } catch (err: any) {
      alert(err.message || 'Could not create group chat');
    } finally {
      setCreatingConv(false);
    }
  };

  const handleOpenReportModal = (msg: MessageItem) => {
    setSelectedMessageForReport(msg);
    setReportReason('HARASSMENT');
    setReportNotes('');
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedMessageForReport) return;
    try {
      setReportSubmitting(true);
      await communicationApi.reportMessage({
        messageId: selectedMessageForReport.id,
        reason: reportReason,
      });
      alert('Message flagged successfully. School Administration will review this conversation.');
      setShowReportModal(false);
      setSelectedMessageForReport(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const getConversationTitle = (c: ConversationItem) => {
    if (c.type === 'GROUP') return c.title || 'Institutional Group';
    const otherParticipant = c.participants?.find((p) => p.userId !== currentUser?.id);
    if (otherParticipant?.user) {
      return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    }
    return 'Direct Message';
  };

  const getConversationSubtitle = (c: ConversationItem) => {
    if (c.type === 'GROUP') {
      return `${c.participants?.length || 0} participants • ${c.groupType?.replace(/_/g, ' ') || 'General'}`;
    }
    const otherParticipant = c.participants?.find((p) => p.userId !== currentUser?.id);
    return otherParticipant?.user?.email || 'School User';
  };

  const filteredConversations = conversations.filter((c) => {
    const title = getConversationTitle(c).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1440px', margin: '0 auto', height: 'calc(100vh - 120px)' }}>
      {/* Statutory School Communication Privacy Notice Banner */}
      {!policyNoticeDismissed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: 'var(--academic-gold-50, #fdfaf5)',
            border: '1px solid var(--academic-gold-200, #ebdcc0)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--academic-gold-900, #574421)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={16} style={{ color: 'var(--academic-gold-700, #8c6e37)', flexShrink: 0 }} />
            <span>
              <strong>Institutional Policy Notice:</strong> Official school communications are recorded, monitored for safeguarding, and subject to administrative compliance reviews under School Communication Policy.
            </span>
          </div>
          <button
            onClick={() => setPolicyNoticeDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Communication Layout */}
      <div
        className="ed-card"
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg, 12px)',
        }}
      >
        {/* Left Sidebar: Conversations & Contacts */}
        <div
          style={{
            borderRight: '1px solid var(--border-default, #e2e6e0)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface, #ffffff)',
          }}
        >
          {/* Header & Quick Action Buttons */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-default, #e2e6e0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} style={{ color: 'var(--color-primary, #244c3a)' }} />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Messages</h2>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewChatModal(true)}
                  title="Start Direct Chat"
                >
                  <User size={14} />
                  Chat
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowNewGroupModal(true)}
                  title="Create Group"
                >
                  <Users size={14} />
                  Group
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="ed-search-box" style={{ width: '100%' }}>
              <Search size={14} className="ed-search-icon" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ed-input"
                style={{ height: '34px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="inline-block animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <p style={{ fontSize: '0.82rem', marginTop: '8px' }}>Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageSquare size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No conversations yet</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Start a new 1-on-1 direct message or create an institutional group.</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activeConversation?.id === c.id;
                const isGroup = c.type === 'GROUP';
                const title = getConversationTitle(c);
                const subtitle = getConversationSubtitle(c);
                const lastMsg = c.messages?.[0];

                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConversation(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-default, #e2e6e0)',
                      backgroundColor: isActive ? 'var(--bg-subtle, #f0f3ee)' : 'transparent',
                      borderLeft: isActive ? '4px solid var(--color-primary, #244c3a)' : '4px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: isGroup ? '8px' : '50%',
                        backgroundColor: isGroup ? 'rgba(36, 76, 58, 0.12)' : 'rgba(196, 164, 107, 0.15)',
                        color: isGroup ? 'var(--color-primary, #244c3a)' : 'var(--academic-gold-700, #8c6e37)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {isGroup ? <Users size={18} /> : title.charAt(0).toUpperCase()}
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {title}
                        </span>
                        {c.lastMessageAt && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {lastMsg ? lastMsg.content : subtitle}
                        </span>
                        {(c.unreadCount || 0) > 0 && (
                          <span
                            className="ed-badge ed-badge-success"
                            style={{
                              borderRadius: '12px',
                              padding: '2px 6px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Pane */}
        {activeConversation ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-app, #f7f5ef)' }}>
            {/* Conversation Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderBottom: '1px solid var(--border-default, #e2e6e0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: activeConversation.type === 'GROUP' ? '8px' : '50%',
                    backgroundColor: 'rgba(36, 76, 58, 0.1)',
                    color: 'var(--color-primary, #244c3a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {activeConversation.type === 'GROUP' ? <Users size={18} /> : <User size={18} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {getConversationTitle(activeConversation)}
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {getConversationSubtitle(activeConversation)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://meet.google.com/new', '_blank')}
                  title="Start Instant Google Meet"
                >
                  <Video size={14} style={{ color: '#0d9488' }} />
                  Google Meet
                </Button>
              </div>
            </div>

            {/* Message History Stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messagesLoading ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div className="inline-block animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <p style={{ fontSize: '0.82rem', marginTop: '8px' }}>Decrypting & loading message thread...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Lock size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem' }}>No messages yet in this conversation.</p>
                  <p style={{ fontSize: '0.75rem' }}>Send a greeting or share lesson notes to begin.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = currentUser && msg.senderId === currentUser.id;
                  const senderName = msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Sender';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {/* Sender label for groups */}
                      {!isMine && activeConversation.type === 'GROUP' && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px', marginLeft: '6px' }}>
                          {senderName}
                        </span>
                      )}

                      {/* Message Bubble */}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          backgroundColor: isMine ? 'var(--color-primary, #244c3a)' : 'var(--bg-surface, #ffffff)',
                          color: isMine ? '#ffffff' : 'var(--text-primary)',
                          border: isMine ? 'none' : '1px solid var(--border-default, #e2e6e0)',
                          boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
                          fontSize: '0.88rem',
                          lineHeight: 1.45,
                          position: 'relative',
                        }}
                      >
                        {msg.isDeleted ? (
                          <span style={{ fontStyle: 'italic', opacity: 0.7 }}>This message was removed by moderator.</span>
                        ) : (
                          <>
                            <div>{msg.content}</div>

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {msg.attachments.map((att) => (
                                  <div
                                    key={att.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle, #f0f3ee)',
                                      fontSize: '0.78rem',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <FileText size={14} />
                                      <span style={{ fontWeight: 600 }}>{att.fileName}</span>
                                      <span style={{ opacity: 0.75 }}>({Math.round(att.fileSize / 1024)} KB)</span>
                                    </div>
                                    <a
                                      href={att.fileUrl}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
                                    >
                                      <Download size={14} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* Metadata & Read Receipt */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            marginTop: '4px',
                            fontSize: '0.68rem',
                            opacity: isMine ? 0.8 : 0.6,
                          }}
                        >
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                          {isMine && (
                            <span>
                              {msg.status === 'READ' ? (
                                <CheckCheck size={13} style={{ color: '#4ade80' }} />
                              ) : msg.status === 'DELIVERED' ? (
                                <CheckCheck size={13} />
                              ) : (
                                <Check size={13} />
                              )}
                            </span>
                          )}

                          {/* Report Message Action */}
                          {!isMine && !msg.isDeleted && (
                            <button
                              onClick={() => handleOpenReportModal(msg)}
                              title="Report inappropriate content"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'inherit',
                                opacity: 0.6,
                                padding: 0,
                                marginLeft: '6px',
                              }}
                            >
                              <Flag size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderTop: '1px solid var(--border-default, #e2e6e0)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAttachModal(true)}
                title="Attach Document / PDF"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '6px',
                }}
              >
                <Paperclip size={18} />
              </button>

              {attachmentFileName && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-subtle, #f0f3ee)',
                    fontSize: '0.75rem',
                  }}
                >
                  <FileText size={12} />
                  {attachmentFileName}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => setAttachmentFileName('')} />
                </span>
              )}

              <input
                type="text"
                placeholder="Type your message here..."
                value={messageText}
                onChange={handleInputChange}
                className="ed-input"
                style={{ flex: 1, height: '40px' }}
              />

              <Button type="submit" variant="primary" disabled={!messageText.trim() && !attachmentFileName}>
                <Send size={15} />
                Send
              </Button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <MessageSquare size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Conversation Selected</h3>
              <p style={{ fontSize: '0.85rem' }}>Select a chat from the left panel or initiate a new one.</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: START DIRECT CHAT */}
      <Modal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        title="Start One-to-One Communication"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Select an authorized faculty member, administrator, or enrolled student to start direct messaging.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Select Recipient
            </label>
            <select
              value={selectedTargetUserId}
              onChange={(e) => setSelectedTargetUserId(e.target.value)}
              className="ed-select"
              style={{ width: '100%' }}
            >
              <option value="">-- Choose School Member --</option>
              {tenantUsers
                .filter((u) => u.id !== currentUser?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setShowNewChatModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selectedTargetUserId || creatingConv}
              onClick={handleCreateDirectChat}
            >
              {creatingConv ? 'Starting...' : 'Start Chat'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: CREATE GROUP CHAT */}
      <Modal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        title="Create Institutional Communication Group"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Group Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Grade 10-A Physics Study Group"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              className="ed-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Group Category
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="ed-select"
              style={{ width: '100%' }}
            >
              <option value="CLASS_SECTION">Class / Section Group</option>
              <option value="SUBJECT">Subject Academic Group</option>
              <option value="DEPARTMENT">Faculty Department</option>
              <option value="ADMINISTRATIVE">Administrative Circle</option>
              <option value="PARENT_TEACHER">Parent-Teacher Meeting Circle</option>
              <option value="EVENT_MEETING">Committee / Project Circle</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Select Initial Members ({selectedGroupMemberIds.length} selected)
            </label>
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-default, #e2e6e0)',
                borderRadius: '6px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {tenantUsers
                .filter((u) => u.id !== currentUser?.id)
                .map((u) => {
                  const isChecked = selectedGroupMemberIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        backgroundColor: isChecked ? 'var(--bg-subtle, #f0f3ee)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupMemberIds((prev) => [...prev, u.id]);
                          } else {
                            setSelectedGroupMemberIds((prev) => prev.filter((id) => id !== u.id));
                          }
                        }}
                      />
                      <span>
                        <strong>{u.firstName} {u.lastName}</strong> — {u.email}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setShowNewGroupModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!groupTitle.trim() || selectedGroupMemberIds.length === 0 || creatingConv}
              onClick={handleCreateGroupChat}
            >
              {creatingConv ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: REPORT INAPPROPRIATE MESSAGE */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Inappropriate Message"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            School safety is our highest priority. Flagged content is escalated to School Administrators and logged in the Communication Audit Trail.
          </p>

          {selectedMessageForReport && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-subtle, #f0f3ee)',
                borderLeft: '4px solid #dc2626',
                fontSize: '0.82rem',
              }}
            >
              <strong>Message Content:</strong> &ldquo;{selectedMessageForReport.content}&rdquo;
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Reason for Report *
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="ed-select"
              style={{ width: '100%' }}
            >
              <option value="HARASSMENT">Bullying or Harassment</option>
              <option value="INAPPROPRIATE_LANGUAGE">Profanity or Inappropriate Language</option>
              <option value="ACADEMIC_DISHONESTY">Exam Cheating / Academic Dishonesty</option>
              <option value="SPAM">Spam or Unauthorized Solicitation</option>
              <option value="SAFETY_CONCERN">Imminent Safety / Welfare Concern</option>
              <option value="OTHER">Other School Policy Violation</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Additional Context / Details
            </label>
            <textarea
              placeholder="Describe what occurred for the administrator..."
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              className="ed-input"
              rows={3}
              style={{ width: '100%', height: 'auto', padding: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={reportSubmitting}
              onClick={handleSubmitReport}
            >
              {reportSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: ATTACH DOCUMENT */}
      <Modal
        isOpen={showAttachModal}
        onClose={() => setShowAttachModal(false)}
        title="Attach Document / File"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Document Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Physics_Formula_Sheet_Term2.pdf"
              value={attachmentFileName}
              onChange={(e) => setAttachmentFileName(e.target.value)}
              className="ed-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                File Type
              </label>
              <select
                value={attachmentFileType}
                onChange={(e) => setAttachmentFileType(e.target.value)}
                className="ed-select"
                style={{ width: '100%' }}
              >
                <option value="application/pdf">PDF Document (.pdf)</option>
                <option value="application/msword">Word Document (.docx)</option>
                <option value="image/jpeg">JPEG Image (.jpg)</option>
                <option value="image/png">PNG Image (.png)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Simulated File Size (KB)
              </label>
              <input
                type="number"
                value={Math.round(attachmentFileSize / 1024)}
                onChange={(e) => setAttachmentFileSize(Number(e.target.value) * 1024)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setShowAttachModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!attachmentFileName.trim()}
              onClick={() => setShowAttachModal(false)}
            >
              Attach to Message
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
