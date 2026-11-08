"use client";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X, LoaderCircle, ArrowUpRight } from 'lucide-react';

type Message={role:'user'|'assistant';text:string;id:number};
const suggestions=['What products do you offer?','How does the Business Starter System work?','Which product should I choose?'];

function renderAnswer(text:string){
  const pieces=text.split(/(\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\))/g);
  return pieces.map((piece,index)=>{
    const match=/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\)$/.exec(piece);
    if(!match)return <span key={index}>{piece}</span>;
    const href=match[2];
    if(href.startsWith('/'))return <a key={index} href={href}>{match[1]}</a>;
    try{const url=new URL(href);if(url.hostname==='bizpilotstudio.com'||url.hostname==='www.bizpilotstudio.com')return <a key={index} href={href}>{match[1]}</a>;}catch{}
    return <span key={index}>{match[1]}</span>;
  });
}

export function PublicChatbot(){
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState('');
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const [messages,setMessages]=useState<Message[]>([{role:'assistant',id:1,text:'Hi! I’m the BizPilot assistant. Ask me about our products, pricing, or how the tools work.'}]);
  const listRef=useRef<HTMLDivElement>(null); const inputRef=useRef<HTMLInputElement>(null); const nextId=useRef(2);
  useEffect(()=>{if(open){listRef.current?.scrollTo({top:listRef.current.scrollHeight,behavior:'smooth'});inputRef.current?.focus();}},[open,messages,sending]);
  async function sendMessage(value:string){
    const text=value.trim();if(!text||sending)return;
    const userMessage:Message={role:'user',text,id:nextId.current++};
    const previous=messages;
    setMessages([...previous,userMessage]);setInput('');setError('');setSending(true);
    try{
      const response=await fetch('/api/chatbot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:previous.slice(-8).map(({role,text})=>({role,text}))})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'The assistant could not answer.');
      setMessages(current=>[...current,{role:'assistant',text:result.answer,id:nextId.current++}]);
    }catch(e){setError(e instanceof Error?e.message:'The assistant is temporarily unavailable.');}
    finally{setSending(false);}
  }
  function handleSubmit(event:FormEvent){event.preventDefault();void sendMessage(input);}
  function handleKeyDown(event:KeyboardEvent<HTMLInputElement>){if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void sendMessage(input);}}
  return <div className="public-chatbot">
    {open&&<section className="public-chat-window" role="dialog" aria-label="Chat with the BizPilot assistant" aria-modal="false">
      <header className="public-chat-header"><span className="public-chat-avatar"><Sparkles size={17}/></span><div><strong>BizPilot assistant</strong><small>Product help · AI powered</small></div><button type="button" aria-label="Close chat" onClick={()=>setOpen(false)}><X size={18}/></button></header>
      <div className="public-chat-messages" ref={listRef} aria-live="polite">{messages.map(message=><article className={`public-chat-message ${message.role}`} key={message.id}><span>{message.role==='assistant'?'B':'You'}</span><p>{renderAnswer(message.text)}</p></article>)}{sending&&<article className="public-chat-message assistant"><span>B</span><p className="public-chat-thinking"><i/><i/><i/><small>Thinking…</small></p></article>}</div>
      {messages.length===1&&!sending&&<div className="public-chat-suggestions">{suggestions.map(item=><button type="button" key={item} onClick={()=>void sendMessage(item)}>{item}</button>)}</div>}
      {error&&<p className="public-chat-error" role="alert">{error}</p>}
      <form className="public-chat-form" onSubmit={handleSubmit}><input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} maxLength={1200} placeholder="Ask about our products…" aria-label="Your question" disabled={sending}/><button type="submit" aria-label="Send message" disabled={sending||!input.trim()}>{sending?<LoaderCircle className="spin" size={17}/>:<Send size={17}/>}</button></form>
      <footer className="public-chat-footer">No sign-in needed · <a href="/shop">Browse the shop <ArrowUpRight size={11}/></a></footer>
    </section>}
    <button className={open?'public-chat-launch open':'public-chat-launch'} type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-label={open?'Close BizPilot chat':'Chat with BizPilot for help'}>{open?<X size={21}/>:<><MessageCircle size={19}/><span>Need help? Ask us</span></>}</button>
  </div>;
}
