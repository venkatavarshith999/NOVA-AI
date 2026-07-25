'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, PenSquare, Settings, LayoutDashboard, 
  LogOut, Paperclip, Send, X, Search, BookOpen, FileUp, Sparkles,
  CheckCircle2, AlertTriangle, AlertOctagon, ChevronDown, ChevronUp,
  Copy, Download, FileText, Menu, Trash2, MoreHorizontal
} from 'lucide-react';
import clsx from 'clsx';
import { streamResearch, API_BASE, Report, StreamEvent, Claim, Source, HallucinationFlag } from '@/lib/api';
import { isLoggedIn, getUser, logout, authHeaders, User } from '@/lib/auth';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  report?: Report;
  status?: string;
  isStreaming?: boolean;
}

interface HistoryItem {
  id: string;
  query: string;
  report?: Report;
  timestamp: string;
}

export default function ResearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    const currUser = getUser();
    if (currUser) setUser(currUser);
    
    loadHistory();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const localHistoryStr = localStorage.getItem('nova_history');
      const localHistory: HistoryItem[] = localHistoryStr ? JSON.parse(localHistoryStr) : [];
      
      let apiHistory: HistoryItem[] = [];
      try {
        const res = await fetch(`${API_BASE}/api/reports`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend history format to HistoryItem if needed
          apiHistory = Array.isArray(data) ? data.map(item => ({
            id: item.id || String(Date.now()),
            query: item.query,
            report: item,
            timestamp: item.created_at || new Date().toISOString()
          })) : [];
        }
      } catch (err) {
        console.error('Failed to load history from API', err);
      }
      
      const merged = [...apiHistory];
      for (const localItem of localHistory) {
        if (!merged.find(m => m.id === localItem.id || m.query === localItem.query)) {
          merged.push(localItem);
        }
      }
      
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(merged);
    } catch (err) {
      console.error('Failed to parse history', err);
    }
  };

  const saveToHistory = (query: string, report: Report) => {
    const newItem: HistoryItem = {
      id: String(Date.now()),
      query,
      report,
      timestamp: new Date().toISOString()
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem('nova_history', JSON.stringify(updated));
      return updated;
    });
    
    setActiveChatId(newItem.id);
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        setHistory(prev => {
          const updated = prev.filter(h => h.id !== id);
          localStorage.setItem('nova_history', JSON.stringify(updated));
          return updated;
        });
        if (activeChatId === id) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete history', err);
      // Fallback local deletion
      setHistory(prev => {
        const updated = prev.filter(h => h.id !== id);
        localStorage.setItem('nova_history', JSON.stringify(updated));
        return updated;
      });
      if (activeChatId === id) {
        startNewChat();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    e.target.value = ''; // Reset
  };

  const handleSubmit = async () => {
    let query = inputValue.trim();
    if (!query && !selectedFile) return;
    
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setIsLoading(true);
    
    if (selectedFile) {
      // Fake upload for demonstration, assume backend extracts text
      query = `Extract and analyze claims from: ${selectedFile.name}\n${query}`;
      setSelectedFile(null);
    }
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query
    };
    
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      status: 'Starting research...',
      isStreaming: true
    };
    
    setMessages(prev => [...prev, userMsg, aiMsg]);
    
    try {
      let finalReport: Report | undefined;
      await streamResearch(query, (event: StreamEvent) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === aiMsgId) {
            let status = msg.status;
            if (event.type === 'stage_start') status = event.label;
            if (event.type === 'substep') status = event.message;
            if (event.type === 'done') {
              finalReport = event.report;
              return { ...msg, status: 'Done', isStreaming: false, report: event.report };
            }
            if (event.type === 'error') {
              return { ...msg, status: 'Error occurred.', isStreaming: false, content: event.message };
            }
            return { ...msg, status };
          }
          return msg;
        }));
      });
      
      if (finalReport) {
        saveToHistory(query, finalReport);
      }
    } catch (error) {
      console.error('Research error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, status: 'Error', isStreaming: false, content: 'An unexpected error occurred.' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInputValue('');
    setActiveChatId(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const loadChat = (item: HistoryItem) => {
    setActiveChatId(item.id);
    if (item.report) {
      setMessages([
        { id: item.id + '-u', role: 'user', content: item.query },
        { id: item.id + '-a', role: 'ai', content: '', report: item.report, isStreaming: false }
      ]);
    } else {
      setMessages([
        { id: item.id + '-u', role: 'user', content: item.query }
      ]);
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-[#171717] text-gray-300 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-bold text-xl">
              N
            </div>
            <span className="font-semibold text-lg text-white">Nova AI</span>
          </div>
          <button 
            onClick={startNewChat}
            className="p-2 hover:bg-white/10 rounded-md transition-colors text-white"
            title="New Chat"
          >
            <PenSquare size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-600">
          <div className="px-2 py-1 mb-2 text-xs font-semibold text-gray-500">Recents</div>
          {history.length === 0 ? (
            <div className="px-2 py-3 text-sm text-gray-500 text-center">No recent chats</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadChat(item)}
                className={clsx(
                  "group flex items-center justify-between px-2 py-2.5 rounded-md cursor-pointer transition-colors",
                  activeChatId === item.id ? "bg-[#343541] text-white" : "hover:bg-[#2A2B32]"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="text-sm truncate">{item.query}</span>
                </div>
                <button
                  onClick={(e) => deleteHistoryItem(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md shrink-0 transition-opacity"
                >
                  <Trash2 size={14} className="text-gray-400 hover:text-white" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-white/10 relative">
          <div 
            className="flex items-center justify-between p-2 rounded-md hover:bg-[#343541] cursor-pointer transition-colors"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white truncate max-w-[120px]">{user.name}</span>
            </div>
            <MoreHorizontal size={16} className="text-gray-400" />
          </div>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                ref={profileMenuRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-3 right-3 mb-2 bg-[#202123] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 text-sm"
              >
                <button onClick={() => router.push('/settings')} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#343541] text-white transition-colors">
                  <Settings size={16} />
                  Settings
                </button>
                <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#343541] text-white transition-colors">
                  <LayoutDashboard size={16} />
                  Dashboard
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#343541] text-white transition-colors">
                  <LogOut size={16} />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header (Mobile) */}
        <div className="md:hidden flex items-center p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#212121]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <Menu size={24} />
          </button>
          <span className="font-semibold ml-2">Nova AI</span>
          <div className="flex-1" />
          <button onClick={startNewChat} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <PenSquare size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 w-full max-w-4xl mx-auto pb-40 pt-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center mt-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20">
                <Sparkles size={32} />
              </div>
              <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                Hey, {user.name.split(' ')[0]}.<br />Ready to dive in?
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                <button 
                  onClick={() => handleQuickAction("Verify the claims made in the recent presidential debate regarding economic growth.")}
                  className="flex flex-col items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#383838] transition-colors shadow-sm text-center"
                >
                  <Search className="mb-2 text-[#2563EB]" size={24} />
                  <span className="font-medium">Verify a claim</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fact-check statements</span>
                </button>
                <button 
                  onClick={() => handleQuickAction("Research the history and current state of quantum computing.")}
                  className="flex flex-col items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#383838] transition-colors shadow-sm text-center"
                >
                  <BookOpen className="mb-2 text-[#7C3AED]" size={24} />
                  <span className="font-medium">Research a topic</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Deep dive analysis</span>
                </button>
                <label className="flex flex-col items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#383838] transition-colors shadow-sm text-center cursor-pointer">
                  <FileUp className="mb-2 text-[#16A34A]" size={24} />
                  <span className="font-medium">Upload a document</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Analyze PDFs or text</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={clsx(
                  "flex w-full gap-4 md:gap-6",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                      <Sparkles size={16} />
                    </div>
                  )}
                  
                  <div className={clsx(
                    "max-w-[85%] md:max-w-[75%]",
                    msg.role === 'user' ? "flex flex-col items-end" : ""
                  )}>
                    {msg.role === 'user' ? (
                      <div className="bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm inline-block">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="w-full space-y-4 text-gray-800 dark:text-gray-200">
                        {msg.isStreaming ? (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex space-x-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{msg.status}</span>
                          </div>
                        ) : msg.report ? (
                          <ReportRenderer report={msg.report} />
                        ) : (
                          <div className="text-red-500 dark:text-red-400 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/30">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-[#212121] dark:via-[#212121] pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto w-full relative">
            
            <AnimatePresence>
              {selectedFile && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute -top-12 left-0 flex items-center gap-2 bg-white dark:bg-[#2f2f2f] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <FileText size={14} className="text-[#2563EB]" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-500">
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-center rounded-2xl bg-gray-100 dark:bg-[#2f2f2f] border border-gray-300/50 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-shadow">
              <label className="p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors ml-1">
                <Paperclip size={20} />
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask Nova anything..."
                className="flex-1 max-h-[200px] min-h-[52px] py-3.5 px-2 bg-transparent border-0 focus:ring-0 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium"
                rows={1}
                disabled={isLoading}
              />
              
              <button
                onClick={handleSubmit}
                disabled={(!inputValue.trim() && !selectedFile) || isLoading}
                className={clsx(
                  "p-2 mr-2 rounded-full flex items-center justify-center transition-colors",
                  (!inputValue.trim() && !selectedFile) || isLoading
                    ? "bg-gray-200 text-gray-400 dark:bg-[#383838] dark:text-gray-500 cursor-not-allowed"
                    : "bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
                )}
              >
                <Send size={18} className={clsx(inputValue.trim() || selectedFile ? "" : "-translate-x-[1px] translate-y-[1px]")} />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Nova AI can make mistakes. Verify important information.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Components for Rendering the Report ---

function ReportRenderer({ report }: { report: Report }) {
  if (report.is_conversational) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{report.executive_summary}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Executive Summary */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg leading-relaxed">{report.executive_summary}</p>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-2 pt-2">
        <div className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800/30 flex items-center gap-1.5">
          <CheckCircle2 size={14} />
          {report.stats.verified} Verified
        </div>
        {report.stats.partially_verified > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-medium border border-amber-200 dark:border-amber-800/30 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            {report.stats.partially_verified} Partial
          </div>
        )}
        {report.stats.not_verified > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium border border-red-200 dark:border-red-800/30 flex items-center gap-1.5">
            <AlertOctagon size={14} />
            {report.stats.not_verified} Unverified
          </div>
        )}
        <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
          <BookOpen size={14} />
          {report.stats.total_sources} Sources
        </div>
      </div>

      {/* Hallucination Warnings */}
      {report.hallucinations && report.hallucinations.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
            <AlertTriangle size={18} />
            <span>Potential Inconsistencies Detected</span>
          </div>
          <div className="space-y-3">
            {report.hallucinations.map((h, i) => (
              <div key={i} className="text-sm text-red-800 dark:text-red-300 bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                <span className="font-medium block mb-1">"{h.claim_text}"</span>
                {h.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims Accordion */}
      <div className="space-y-3 pt-2">
        <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-800 pb-2">Analysis Breakdown</h3>
        {report.claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>

      {/* Conclusion */}
      <div className="bg-gray-50 dark:bg-[#2A2B32] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <h4 className="font-semibold mb-2">Conclusion</h4>
        <p className="text-sm leading-relaxed">{report.conclusion}</p>
      </div>

      {/* Sources list */}
      {report.sources && report.sources.length > 0 && (
        <div className="pt-2">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Sources</h4>
          <div className="flex flex-wrap gap-2">
            {report.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#383838] transition-colors shadow-sm"
              >
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] overflow-hidden">
                  {source.url ? <img src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}`} alt="" className="w-full h-full" onError={(e) => e.currentTarget.style.display = 'none'} /> : <BookOpen size={10} />}
                </div>
                <span className="truncate max-w-[150px]">{source.source_name || new URL(source.url).hostname.replace('www.','')}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Copy text">
          <Copy size={16} />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Download PDF">
          <Download size={16} />
        </button>
      </div>
      
    </div>
  );
}

function ClaimCard({ claim }: { claim: Claim }) {
  const [expanded, setExpanded] = useState(false);
  
  const statusColors = {
    verified: 'text-[#16A34A] border-[#16A34A]/20 bg-[#16A34A]/10',
    partially_verified: 'text-[#D97706] border-[#D97706]/20 bg-[#D97706]/10',
    not_verified: 'text-[#DC2626] border-[#DC2626]/20 bg-[#DC2626]/10'
  };

  const statusIcons = {
    verified: <CheckCircle2 size={18} />,
    partially_verified: <AlertTriangle size={18} />,
    not_verified: <AlertOctagon size={18} />
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#2A2B32] shadow-sm transition-all hover:shadow-md">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-[#32333A] transition-colors"
      >
        <div className={clsx("mt-0.5 shrink-0 rounded-full p-1", statusColors[claim.verification.status])}>
          {statusIcons[claim.verification.status]}
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-medium text-[15px] leading-snug">{claim.text}</p>
        </div>
        <div className="shrink-0 text-gray-400 mt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 pl-[52px] border-t border-gray-100 dark:border-gray-800/50">
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
                <div>
                  <span className="font-semibold block mb-1">Verification Details</span>
                  <p>{claim.verification.reason}</p>
                </div>
                
                {claim.source_urls && claim.source_urls.length > 0 && (
                  <div>
                    <span className="font-semibold block mb-1 text-xs text-gray-500 uppercase tracking-wider">Citations</span>
                    <div className="space-y-1">
                      {claim.source_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 break-all">
                          <BookOpen size={12} className="shrink-0" /> {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
