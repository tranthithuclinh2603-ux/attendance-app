import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react';
import { chatAPI } from '../services/api';

const QUICK_PROMPTS = [
  'Hôm nay có lịch học không?',
  'Cách điểm danh như thế nào?',
  'Xin nghỉ phép bằng cách nào?',
  'Tỉ lệ điểm danh của tôi?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}/>
      ))}
    </div>
  );
}

export default function ChatBox({ user }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Xin chào ${user?.name?.split(' ').pop() || 'bạn'}! 👋 Mình là trợ lý AI của Điểm Danh. Mình có thể giúp gì cho bạn?` }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!open && messages[messages.length-1]?.role === 'assistant') setUnread(u => u + 1);
  }, [messages]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await chatAPI.send(
        newMessages.filter(m => m.role !== 'system'),
        { name: user?.name, mssv: user?.mssv, classId: user?.classId }
      );
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message || '';
      const errText = detail
        ? `Lỗi kết nối AI: ${detail}`
        : 'Xin lỗi, mình đang bị lỗi kết nối. Thử lại sau nhé!';
      setMessages(prev => [...prev, { role: 'assistant', content: errText }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-[88px] right-4 z-50 w-13 h-13 w-[52px] h-[52px] rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-lg shadow-indigo-400/40 flex items-center justify-center transition-all">
        {open
          ? <ChevronDown size={22}/>
          : <>
              <MessageCircle size={22}/>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </>
        }
      </button>

      {/* Chat panel */}
      <div className={`fixed right-4 z-50 transition-all duration-300 ease-out ${
        open ? 'bottom-[152px] opacity-100 scale-100' : 'bottom-[152px] opacity-0 scale-95 pointer-events-none'
      }`} style={{ width: 'min(360px, calc(100vw - 32px))' }}>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col"
          style={{ height: 'min(480px, calc(100vh - 220px))' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Bot size={18} className="text-white"/>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Trợ lý Điểm Danh</p>
              <p className="text-indigo-200 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"/>
                Luôn sẵn sàng hỗ trợ
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 text-white/60 hover:text-white">
              <X size={16}/>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} className="text-indigo-500"/>
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-indigo-500"/>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm">
                  <TypingDots/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts — chỉ hiện khi chỉ có 1 tin (lời chào) */}
          {messages.length === 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Nhập câu hỏi..." rows={1}
                className="flex-1 resize-none text-sm bg-transparent dark:text-white focus:outline-none max-h-20 leading-5"
                style={{ scrollbarWidth: 'none' }}/>
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center shrink-0 transition-all active:scale-90">
                <Send size={14} className="text-white"/>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-1.5">Trợ lý AI · Powered by Claude</p>
          </div>
        </div>
      </div>
    </>
  );
}
