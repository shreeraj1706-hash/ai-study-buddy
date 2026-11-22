import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, BrainCircuit, Calculator, FlaskConical, Languages, Plus, Send, Sparkles, MessageSquare, Trash2, Menu, X, GraduationCap, Lightbulb, PanelLeftClose } from "lucide-react";
import "./style.css";

const subjects = [
  { name: "Maths", icon: Calculator, color: "violet" },
  { name: "Science", icon: FlaskConical, color: "blue" },
  { name: "English", icon: Languages, color: "pink" }
];
const starterPrompts = ["Explain photosynthesis in simple words", "Solve 2x + 7 = 19 step by step", "Give me 5 questions on fractions"];

function App() {
  const [subject, setSubject] = useState("Maths");
  const [mode, setMode] = useState("explain");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [chats, setChats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("study-buddy-chats") || "[]"); } catch { return []; }
  });
  const bottomRef = useRef(null);
  const activeChat = chats.find(c => c.id === activeId);
  const messages = activeChat?.messages || [];

  useEffect(() => localStorage.setItem("study-buddy-chats", JSON.stringify(chats)), [chats]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, busy]);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const updateMessages = (id, next) => setChats(old => old.map(c => c.id === id ? { ...c, messages: next, updatedAt: Date.now() } : c));
  const newChat = () => {
    const id = crypto.randomUUID();
    setChats(old => [{ id, title: "New study session", subject, messages: [], updatedAt: Date.now() }, ...old]);
    setActiveId(id); setInput(""); setMobileOpen(false);
  };
  const startPrompt = (text) => { if (!activeId) newChat(); setInput(text); };
  const send = async (override) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    let id = activeId;
    if (!id) {
      id = crypto.randomUUID();
      setChats(old => [{ id, title: text.slice(0, 38), subject, messages: [], updatedAt: Date.now() }, ...old]);
      setActiveId(id);
    }
    const current = chats.find(c => c.id === id)?.messages || [];
    const next = [...current, { role: "user", content: text }];
    setInput(""); setBusy(true);
    updateMessages(id, next);
    setChats(old => old.map(c => c.id === id ? { ...c, title: c.messages.length ? c.title : text.slice(0, 38), subject } : c));
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12), subject, mode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      updateMessages(id, [...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      updateMessages(id, [...next, { role: "assistant", content: `⚠️ ${err.message || "Could not connect to the server."}` }]);
    } finally { setBusy(false); }
  };
  const deleteChat = (id, e) => {
    e.stopPropagation();
    setChats(old => old.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const formatDate = t => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><BrainCircuit size={22}/></div><span>Study<span className="brand-accent">Buddy</span></span><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={19}/></button></div>
      <button className="new-chat" onClick={newChat}><Plus size={18}/> New study session</button>
      <div className="side-label">LEARN</div>
      <div className="subject-list">{subjects.map(s => <button key={s.name} className={`subject-link ${subject === s.name ? "selected" : ""}`} onClick={() => {setSubject(s.name); setMobileOpen(false);}}><span className={`subject-icon ${s.color}`}><s.icon size={17}/></span>{s.name}<span className="subject-dot"/></button>)}</div>
      <div className="side-label history-label">RECENT CHATS</div>
      <div className="history-list">{chats.length === 0 ? <p className="empty-history">Your study sessions will appear here.</p> : chats.map(c => <button key={c.id} className={`history-item ${activeId === c.id ? "active" : ""}`} onClick={() => {setActiveId(c.id); setSubject(c.subject || "Maths"); setMobileOpen(false);}}><MessageSquare size={15}/><span>{c.title}</span><span className="history-date">{formatDate(c.updatedAt)}</span><span className="delete-chat" onClick={e => deleteChat(c.id,e)}><Trash2 size={14}/></span></button>)}</div>
      <div className="sidebar-bottom"><div className="profile-avatar">S</div><div><strong>My Study Space</strong><small>Keep learning every day</small></div></div>
    </aside>
    {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileOpen(true)}><Menu size={21}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{subject}</b></div><div className="topbar-right"><span className="online-dot"/> AI tutor ready <div className="top-avatar">S</div></div></header>
      <section className="content">
        {messages.length === 0 ? <div className="welcome">
          <div className="welcome-chip"><Sparkles size={14}/> YOUR PERSONAL LEARNING COMPANION</div>
          <h1>Make learning<br/><span>click.</span></h1>
          <p className="welcome-sub">Big questions? Small steps. Let's make your next study session count.</p>
          <div className="subject-cards">{subjects.map(s => <button key={s.name} className={`subject-card ${subject === s.name ? "chosen" : ""}`} onClick={() => setSubject(s.name)}><span className={`subject-icon large ${s.color}`}><s.icon size={21}/></span><strong>{s.name}</strong><small>{s.name === "Maths" ? "Understand every step" : s.name === "Science" ? "Explore how things work" : "Build language confidence"}</small></button>)}</div>
          <div className="prompt-heading"><Lightbulb size={16}/> TRY ASKING</div>
          <div className="suggestions">{starterPrompts.map((p,i) => <button key={p} onClick={() => {setInput(p);}}>{p}<span>↗</span></button>)}</div>
        </div> : <div className="conversation">
          <div className="conversation-heading"><div><span className="eyebrow">STUDY SESSION</span><h2>{activeChat?.title || "Let's learn together"}</h2></div><span className="subject-pill">{subject}</span></div>
          {messages.map((m,i) => <div className={`message-row ${m.role}`} key={i}><div className={`message-avatar ${m.role}`}>{m.role === "assistant" ? <BrainCircuit size={18}/> : "S"}</div><div className="message-content"><div className="message-name">{m.role === "assistant" ? "Study Buddy" : "You"}</div><div className="message-bubble">{m.content}</div></div></div>)}
          {busy && <div className="message-row assistant"><div className="message-avatar assistant"><BrainCircuit size={18}/></div><div className="message-content"><div className="message-name">Study Buddy</div><div className="message-bubble typing"><i/><i/><i/> <span>Thinking through this…</span></div></div></div>}
          <div ref={bottomRef}/>
        </div>}
      </section>
      <footer className="composer-wrap">
        <div className="mode-switch"><button className={mode === "explain" ? "active" : ""} onClick={() => setMode("explain")}><BookOpen size={14}/> Explain</button><button className={mode === "practice" ? "active" : ""} onClick={() => setMode("practice")}><GraduationCap size={15}/> Practice questions</button></div>
        <form className="composer" onSubmit={e => {e.preventDefault(); send();}}><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if(e.key === "Enter" && !e.shiftKey){e.preventDefault();send();}}} placeholder={`Ask anything about ${subject.toLowerCase()}…`} rows="1"/><button type="submit" disabled={!input.trim() || busy} aria-label="Send message"><Send size={18}/></button></form>
        <div className="composer-note">AI can make mistakes. Check important answers with your teacher or textbook.</div>
      </footer>
    </main>
  </div>;
}
createRoot(document.getElementById("root")).render(<App/>);