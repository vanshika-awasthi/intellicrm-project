"use client";

import { useAuthStore } from "@/app/store/authStore";
import { useState, useRef, useEffect } from "react";

const pageStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .ai-container {
    height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;
    background: transparent;
    animation: fadeIn 0.4s ease both;
    position: relative;
  }

  .ai-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--dash-border);
    margin-bottom: 1rem;
  }

  .ai-icon-box {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
    color: white;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  }

  .ai-title h1 {
    margin: 0; font-size: 24px; font-weight: 600; color: var(--dash-text);
    font-family: var(--font-display, 'DM Serif Display', serif);
  }
  .ai-title p {
    margin: 4px 0 0 0; font-size: 14px; color: var(--dash-text-muted);
  }

  .chat-history {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem 0 4rem 0; /* extra padding at bottom for input */
    scroll-behavior: smooth;
  }
  
  /* Hide scrollbar for cleaner look */
  .chat-history::-webkit-scrollbar { width: 6px; }
  .chat-history::-webkit-scrollbar-track { background: transparent; }
  .chat-history::-webkit-scrollbar-thumb { background: var(--dash-border); border-radius: 10px; }

  .message-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .message {
    display: flex;
    gap: 16px;
    max-width: 800px;
    width: 100%;
    animation: fadeIn 0.4s ease both;
  }

  .message.user {
    flex-direction: row-reverse;
  }

  .avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; flex-shrink: 0;
  }
  .user-avatar { background: var(--dash-surface-hover); color: var(--dash-text-muted); border: 1px solid var(--dash-border); }
  .ai-avatar { background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); }

  .bubble {
    font-size: 15px;
    line-height: 1.7;
    color: var(--dash-text);
  }

  .user .bubble {
    padding: 14px 20px;
    border-radius: 20px 20px 4px 20px;
    background: var(--dash-surface-hover);
    border: 1px solid var(--dash-border);
    max-width: 80%;
  }

  .ai .bubble {
    padding-top: 6px;
    flex: 1;
    min-width: 0;
  }

  .bubble p { margin: 0 0 12px 0; }
  .bubble p:last-child { margin-bottom: 0; }
  .bubble strong { font-weight: 600; color: inherit; }
  .bubble ul, .bubble ol { margin: 12px 0; padding-left: 24px; }
  .bubble li { margin-bottom: 6px; }
  .bubble h2, .bubble h3 { margin: 24px 0 12px 0; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
  .bubble h1 { font-size: 22px; margin-bottom: 16px; }

  .chat-input-area {
    position: sticky;
    bottom: 0px;
    padding: 1rem 0 0 0;
    width: 100%;
    display: flex;
    justify-content: center;
    background: linear-gradient(0deg, var(--dash-bg) 60%, transparent);
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    padding: 10px 10px 10px 20px;
    border-radius: 32px;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    max-width: 800px;
    width: 100%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  }

  .input-wrapper:focus-within {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 8px 40px rgba(99, 102, 241, 0.12);
    background: var(--dash-surface);
  }

  .chat-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 15px;
    color: var(--dash-text);
    outline: none;
  }

  .chat-input::placeholder { color: var(--dash-text-muted); }

  .send-btn {
    background: transparent;
    color: #E2E8F0; border: 1px solid #475569; border-radius: 12px;
    padding: 10px 1.25rem; font-weight: 500; font-size: 14px;
    cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
  }
  .send-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: #94A3B8; color: #fff; }
  .send-btn:disabled {
    opacity: 0.5; cursor: not-allowed;
    background: var(--dash-text-muted);
  }

  .typing-indicator {
    display: inline-flex; gap: 6px; align-items: center; justify-content: flex-start;
    padding: 4px 0;
  }
  .typing-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #818CF8;
    animation: bounce 1.4s infinite ease-in-out both;
  }
  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* Basic Markdown Styling */
  .md-content b, .md-content strong {
    font-weight: 600;
  }
  .md-content em { color: var(--dash-text-muted); font-style: italic; }
  .md-content hr { border: none; border-top: 1px solid var(--dash-border); margin: 20px 0; }
  .md-content li > strong { color: var(--dash-text); }
`;

type Message = { role: "user" | "ai"; content: string; };

export default function AIReviewPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am your IntelliCRM AI Data Analyst. Ask me anything about your active deals, contacts, pipeline revenue, or open tickets!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user?.company_id,
          prompt: userMessage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");

      setMessages(prev => [...prev, { role: "ai", content: data.result }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ultra-simple markdown parser for clean formatted AI responses
  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/> (.*?)\n/g, '<blockquote>$1</blockquote>')
      .replace(/### (.*?)\n/g, '<h3>$1</h3>')
      .replace(/## (.*?)\n/g, '<h2>$1</h2>')
      .replace(/# (.*?)\n/g, '<h1>$1</h1>')
      .replace(/\n/g, '<br/>')
      .replace(/- (.*?)<br\/>/g, '<li>$1</li>')
      .replace(/\* (.*?)<br\/>/g, '<li>$1</li>');
      
    // Wrap consecutive list items in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/g, match => `<ul>${match}</ul>`);
    
    return { __html: html };
  };

  return (
    <>
      <style>{pageStyles}</style>
      <div className="ai-container">
        
        <div className="ai-header">
          <div className="ai-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <div className="ai-title">
            <h1>VARKS Analyst</h1>
          </div>
        </div>

        <div className="chat-history" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className="message-wrapper">
              <div className={`message ${msg.role}`}>
                <div className={`avatar ${msg.role === "ai" ? "ai-avatar" : "user-avatar"}`}>
                  {msg.role === "ai" ? "AI" : user?.employee_id.substring(0, 2).toUpperCase() || "US"}
                </div>
                <div className="bubble">
                  {msg.role === "ai" ? (
                    <div className="md-content" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-wrapper">
              <div className="message ai">
                <div className="avatar ai-avatar">AI</div>
                <div className="bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <div className="input-wrapper">
            <input 
              type="text" 
              className="chat-input"
              placeholder="Ask about top sales, low performing reps, or summarize pipeline..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </form>

      </div>
    </>
  );
}
