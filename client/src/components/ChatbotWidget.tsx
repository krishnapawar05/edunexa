import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Sparkles,
  User,
  Bot,
  ExternalLink,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  MessageCircle,
} from 'lucide-react';
import { chatbotApi } from '../services/api.js';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  intent?: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
}

interface ChatbotWidgetProps {
  schoolIdentifier?: string;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ schoolIdentifier }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasUnread, setHasUnread] = useState(false);

  // In-chat Modal / Forms State
  const [activeForm, setActiveForm] = useState<'NONE' | 'ENQUIRY' | 'ESCALATION'>('NONE');
  const [enquiryForm, setEnquiryForm] = useState({
    parentName: '',
    studentName: '',
    phone: '',
    email: '',
    classApplying: 'Grade 9',
    message: '',
  });
  const [escalationForm, setEscalationForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    query: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, activeForm]);

  // Load public chatbot configuration & FAQs
  useEffect(() => {
    let isMounted = true;
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const data = await chatbotApi.getPublicData(schoolIdentifier);
        if (!isMounted) return;
        let parsedQuestions = data?.config?.suggestedQuestions;
        if (typeof parsedQuestions === 'string') {
          try {
            parsedQuestions = JSON.parse(parsedQuestions);
          } catch {
            parsedQuestions = [];
          }
        }
        const safeConfig = {
          ...data.config,
          suggestedQuestions: Array.isArray(parsedQuestions) ? parsedQuestions : [],
        };
        setConfig(safeConfig);
        setSchool(data.school);
        setFaqs(Array.isArray(data.faqs) ? data.faqs : []);

        // Initialize messages from sessionStorage or default welcome
        const savedChat = sessionStorage.getItem('edunexa_public_chat');
        if (savedChat) {
          try {
            const parsed = JSON.parse(savedChat);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const cleaned = parsed
                .map((m: any) => ({
                  id: m.id || `msg-${Date.now()}`,
                  sender: (m.sender === 'user' || m.role === 'user' ? 'user' : 'bot') as 'user' | 'bot',
                  text: String(m.text || m.content || m.message || '').trim(),
                  timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  suggestedActions: m.suggestedActions,
                  intent: m.intent,
                }))
                .filter((m: any) => m.text.length > 0 && !m.text.startsWith('Validation failed:'));
              if (cleaned.length > 0) {
                setMessages(cleaned);
              } else {
                setInitialWelcome(safeConfig, data.school);
              }
            } else {
              setInitialWelcome(safeConfig, data.school);
            }
          } catch {
            setInitialWelcome(safeConfig, data.school);
          }
        } else {
          setInitialWelcome(safeConfig, data.school);
        }
      } catch (err) {
        console.warn('Failed to load public chatbot data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPublicData();
    return () => {
      isMounted = false;
    };
  }, [schoolIdentifier]);

  const setInitialWelcome = (cfg: any, sch: any) => {
    const welcomeText =
      cfg?.welcomeMessage ||
      `Hello! Welcome to ${sch?.name || 'our school'}. I am your AI Academic Assistant. How may I help you today?`;

    const initialMsg: Message = {
      id: 'welcome-msg',
      sender: 'bot',
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Submit Admission Enquiry', action: 'OPEN_ENQUIRY' },
        { label: 'View Fee Structure', action: 'ASK_QUESTION', payload: 'What is the fee structure?' },
        { label: 'Talk to Counselor', action: 'OPEN_ESCALATION' },
      ],
    };
    setMessages([initialMsg]);
  };

  // Sync messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('edunexa_public_chat', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Build sanitized lightweight conversation history
      const history = messages
        .slice(-6)
        .map((m: any) => ({
          sender: (m.sender === 'user' || m.role === 'user' ? 'user' : 'bot') as 'user' | 'bot',
          text: String(m.text || m.content || m.message || '').trim(),
        }))
        .filter((m) => m.text.length > 0 && !m.text.startsWith('Validation failed:'));

      const response = await chatbotApi.sendMessage({
        message: text,
        question: text,
        history,
        conversationHistory: history,
        schoolIdentifier,
      });

      const actions = response.suggestedActions || [];
      if (actions.length === 0 && response.action) {
        actions.push({
          label: response.action.label || 'Apply for Admission',
          action: response.action.type === 'ADMISSION_ENQUIRY' ? 'OPEN_ENQUIRY' : 'NAVIGATE',
          payload: response.action.url || '/admission/apply',
        });
      }
      if (actions.length === 0 && Array.isArray(response.suggestedNext)) {
        response.suggestedNext.forEach((s: string) => {
          actions.push({ label: s, action: 'ASK_QUESTION', payload: s });
        });
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.answer || config?.fallbackMessage || 'How else can I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent || response.source,
        suggestedActions: actions.length > 0 ? actions : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const friendlyError =
        err?.message && !err.message.includes('Validation failed')
          ? err.message
          : 'I am here to assist with admissions, classes, curriculum, fee details, timings, and facilities. How can I help you today?';
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: friendlyError,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: 'Submit Admission Enquiry', action: 'OPEN_ENQUIRY' },
          { label: 'Connect with Counselor', action: 'OPEN_ESCALATION' },
        ],
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: string, payload?: any) => {
    if (action === 'OPEN_ENQUIRY') {
      setActiveForm('ENQUIRY');
      setFormError(null);
    } else if (action === 'OPEN_ESCALATION') {
      setActiveForm('ESCALATION');
      setFormError(null);
    } else if (action === 'ASK_QUESTION' && payload) {
      handleSendMessage(payload);
    } else if (action === 'NAVIGATE' && payload) {
      window.location.href = payload;
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.parentName.trim() || !enquiryForm.studentName.trim() || !enquiryForm.phone.trim()) {
      setFormError('Please fill in Student Name, Parent Name, and Contact Number.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const res = await chatbotApi.submitEnquiry({
        ...enquiryForm,
        schoolIdentifier,
      });

      setActiveForm('NONE');
      // Append confirmation bot message
      const confirmMsg: Message = {
        id: `enq-${Date.now()}`,
        sender: 'bot',
        text: `✅ **Admission Enquiry Recorded!**\n\nReference Number: **${res.enquiryNumber}**\n\nThank you, ${enquiryForm.parentName}. Our admissions counselor has received your enquiry for **${enquiryForm.studentName}** (${enquiryForm.classApplying}) and will contact you shortly.\n\nYou can also complete the full formal application directly at any time.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: 'Apply Online Form →', action: 'NAVIGATE', payload: res.applyUrl || '/admission/apply' },
          { label: 'Ask Another Question', action: 'ASK_QUESTION', payload: 'What are the admission requirements?' },
        ],
      };
      setMessages((prev) => [...prev, confirmMsg]);
      setEnquiryForm({
        parentName: '',
        studentName: '',
        phone: '',
        email: '',
        classApplying: 'Grade 9',
        message: '',
      });
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit admission enquiry. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEscalationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationForm.visitorName.trim() || !escalationForm.visitorPhone.trim()) {
      setFormError('Please provide your name and phone number so our counselor can reach you.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const res = await chatbotApi.submitEscalation({
        ...escalationForm,
        query: escalationForm.query || 'Visitor requested human counselor support from chat.',
        schoolIdentifier,
        conversationSnapshot: messages.slice(-5),
      });

      setActiveForm('NONE');
      const counselorInfo = config?.escalationContactName
        ? ` (${config.escalationContactName} - ${config.escalationPhone || school?.contactPhone || 'School Office'})`
        : '';

      const confirmMsg: Message = {
        id: `esc-${Date.now()}`,
        sender: 'bot',
        text: `🤝 **Counselor Support Requested!**\n\nTicket ID: **${res.escalationId.slice(0, 8).toUpperCase()}**\n\n${config?.escalationMessage || 'Our admissions and counseling desk has been notified and will reach out to you.'}${counselorInfo}\n\n**Office Hours:** ${config?.escalationAvailability || 'Monday to Saturday, 9:00 AM - 4:00 PM'}\n**Direct Phone:** ${config?.escalationPhone || school?.contactPhone || 'Check website contact'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: config?.whatsappNumber
          ? [
              {
                label: 'Chat on WhatsApp',
                action: 'NAVIGATE',
                payload: `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  config.whatsappPrefillText || 'Hello, I have an admission enquiry.'
                )}`,
              },
            ]
          : undefined,
      };
      setMessages((prev) => [...prev, confirmMsg]);
      setEscalationForm({
        visitorName: '',
        visitorPhone: '',
        visitorEmail: '',
        query: '',
      });
    } catch (err: any) {
      setFormError(err?.message || 'Failed to request counselor support. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResetChat = () => {
    sessionStorage.removeItem('edunexa_public_chat');
    setInitialWelcome(config, school);
    setActiveForm('NONE');
  };

  // WhatsApp quick url
  const whatsappUrl =
    config?.whatsappEnabled && config?.whatsappNumber
      ? `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          config.whatsappPrefillText || `Hello, I would like to enquire about ${school?.name || 'admissions'}.`
        )}`
      : null;

  const botTitle = config?.botName || `${school?.name || 'EduNexa'} Assistant`;

  return (
    <>
      {/* Floating Buttons Container (Bottom Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
        }}
      >
        {/* WhatsApp Floating Button (if enabled) */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat with us on WhatsApp"
            style={{
              backgroundColor: '#25D366',
              color: '#ffffff',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.45)',
              textDecoration: 'none',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <MessageCircle size={26} />
          </a>
        )}

        {/* Main AI Chatbot Launcher Button */}
        <button
          onClick={() => {
            setIsOpen((prev) => !prev);
            setHasUnread(false);
          }}
          title={isOpen ? 'Close Assistant' : 'Chat with School AI Assistant'}
          style={{
            backgroundColor: 'var(--brand-primary, #1e3a8a)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: isOpen ? '12px' : '12px 20px',
            boxShadow: '0 8px 24px rgba(30, 58, 138, 0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isOpen ? (
            <X size={24} />
          ) : (
            <>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} style={{ color: '#fbbf24' }} />
              </div>
              <span>Ask School AI</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {/* Chat Window Header */}
          <div
            style={{
              backgroundColor: 'var(--brand-primary, #1e3a8a)',
              color: '#ffffff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: '1.2' }}>{botTitle}</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.72rem',
                    color: '#93c5fd',
                    marginTop: '2px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                    }}
                  />
                  <span>Online | Grounded School AI</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleResetChat}
                title="Restart conversation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#bfdbfe',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#bfdbfe',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#f8fafc',
            }}
          >
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      maxWidth: '88%',
                      flexDirection: isBot ? 'row' : 'row-reverse',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isBot ? '#e0e7ff' : 'var(--brand-primary, #1e3a8a)',
                        color: isBot ? '#3730a3' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isBot ? <Sparkles size={13} /> : <User size={13} />}
                    </div>

                    <div
                      style={{
                        backgroundColor: isBot ? '#ffffff' : 'var(--brand-primary, #1e3a8a)',
                        color: isBot ? '#1e293b' : '#ffffff',
                        padding: '10px 14px',
                        borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                        fontSize: '0.86rem',
                        lineHeight: '1.45',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Message Timestamp */}
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#94a3b8',
                      marginTop: '3px',
                      marginRight: isBot ? '0' : '32px',
                      marginLeft: isBot ? '32px' : '0',
                    }}
                  >
                    {msg.timestamp}
                  </div>

                  {/* Suggested Action Buttons from Bot */}
                  {isBot && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px',
                        marginLeft: '32px',
                      }}
                    >
                      {msg.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act.action, act.payload)}
                          style={{
                            backgroundColor: '#eff6ff',
                            color: 'var(--brand-primary, #1e3a8a)',
                            border: '1px solid #bfdbfe',
                            borderRadius: '9999px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* In-chat Embedded Forms */}
            {activeForm === 'ENQUIRY' && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '6px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                    Quick Admission Enquiry
                  </div>
                  <button
                    onClick={() => setActiveForm('NONE')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {formError && (
                  <div
                    style={{
                      color: '#dc2626',
                      fontSize: '0.74rem',
                      marginBottom: '8px',
                      backgroundColor: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {formError}
                  </div>
                )}

                <form onSubmit={handleEnquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Student Full Name *"
                    value={enquiryForm.studentName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                    required
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.80rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Parent / Guardian Name *"
                    value={enquiryForm.parentName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })}
                    required
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.80rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                      required
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        fontSize: '0.80rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                    <select
                      value={enquiryForm.classApplying}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, classApplying: e.target.value })}
                      style={{
                        padding: '6px',
                        fontSize: '0.80rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11 - Science">Grade 11 (Science)</option>
                      <option value="Grade 11 - Commerce">Grade 11 (Commerce)</option>
                      <option value="Grade 12 - Science">Grade 12 (Science)</option>
                      <option value="Grade 12 - Commerce">Grade 12 (Commerce)</option>
                    </select>
                  </div>
                  <input
                    type="email"
                    placeholder="Parent Email (optional)"
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.80rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveForm('NONE')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--brand-primary, #1e3a8a)',
                        color: '#ffffff',
                        fontWeight: 600,
                        cursor: formSubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {formSubmitting ? 'Saving...' : 'Submit Enquiry'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeForm === 'ESCALATION' && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '6px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                    Connect with Human Counselor
                  </div>
                  <button
                    onClick={() => setActiveForm('NONE')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {formError && (
                  <div
                    style={{
                      color: '#dc2626',
                      fontSize: '0.74rem',
                      marginBottom: '8px',
                      backgroundColor: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {formError}
                  </div>
                )}

                <form onSubmit={handleEscalationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={escalationForm.visitorName}
                    onChange={(e) => setEscalationForm({ ...escalationForm, visitorName: e.target.value })}
                    required
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.80rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Your Contact Phone *"
                    value={escalationForm.visitorPhone}
                    onChange={(e) => setEscalationForm({ ...escalationForm, visitorPhone: e.target.value })}
                    required
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.80rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <textarea
                    placeholder="Brief description of what you'd like to ask..."
                    rows={2}
                    value={escalationForm.query}
                    onChange={(e) => setEscalationForm({ ...escalationForm, query: e.target.value })}
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.80rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      resize: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveForm('NONE')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--brand-primary, #1e3a8a)',
                        color: '#ffffff',
                        fontWeight: 600,
                        cursor: formSubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {formSubmitting ? 'Connecting...' : 'Request Callback'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  width: 'fit-content',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  color: '#64748b',
                  fontSize: '0.78rem',
                }}
              >
                <Sparkles size={14} style={{ color: '#3b82f6', animation: 'spin 2s linear infinite' }} />
                <span>Assistant is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Questions Bar (if chat is short) */}
          {messages.length <= 3 && Array.isArray(config?.suggestedQuestions) && config.suggestedQuestions.length > 0 && (
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {config.suggestedQuestions.map((q: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '9999px',
                    padding: '3px 8px',
                    fontSize: '0.70rem',
                    color: '#475569',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Footer */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Ask a question about admissions, fees, timings..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              disabled={isTyping}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '9999px',
                padding: '8px 14px',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: inputValue.trim() && !isTyping ? 'var(--brand-primary, #1e3a8a)' : '#e2e8f0',
                color: inputValue.trim() && !isTyping ? '#ffffff' : '#94a3b8',
                border: 'none',
                cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

