import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';

const SUPPORTED_ROLES = new Set(['Student', 'Faculty', 'Admin']);

function normalizedRole(user) {
  return SUPPORTED_ROLES.has(user?.role) ? user.role : 'Student';
}

function firstName(user) {
  return String(user?.fullName || user?.name || '').trim().split(/\s+/)[0];
}

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function generateReply(message, role) {
  const text = message.toLowerCase();

  if (includesAny(text, ['weather', 'movie', 'song', 'football', 'recipe', 'politics', 'joke', 'news'])) {
    return `I can help with UniScout and its ${role} workflows, but I cannot answer unrelated general questions.`;
  }

  if (includesAny(text, ['what is uniscout', 'who are you', 'what can you do', 'about uniscout'])) {
    return 'I am the UniScout Assistant. I can explain the pages and workflows available to your account, including profiles, universities, applications, and recommendation requests.';
  }

  if (includesAny(text, ['password', 'login', 'log in', 'logout', 'log out', 'sign in', 'sign out'])) {
    return 'Use Profile Settings or Settings to change your password. To end your session, use the logout icon beside your profile in the sidebar.';
  }

  if (role === 'Student') {
    if (includesAny(text, ['upload', 'cv', 'resume', 'parse', 'extract'])) {
      return 'Open Upload CV from the sidebar and submit your CV. UniScout extracts the academic fields locally; review and correct the results in Profile Info before requesting university suggestions.';
    }
    if (includesAny(text, ['recommend', 'suggest', 'match', 'reach', 'target', 'safety', 'best university'])) {
      return 'Complete Profile Info, then open Suggested Universities and choose Find Universities. UniScout evaluates the full catalogue and returns one realistic Reach, Target, and Safety match when three credible options exist.';
    }
    if (includesAny(text, ['browse', 'search', 'find university', 'explore', 'shortlist', 'save university'])) {
      return 'Browse Universities lets you search and sort the catalogue. Save a university from its card, then open Shortlisted to review your saved choices.';
    }
    if (includesAny(text, ['application', 'apply', 'enroll', 'track', 'accepted', 'rejected', 'pending'])) {
      return 'Open Applications and choose New Application to add a university and programme. You can then update and track its status from the same page.';
    }
    if (includesAny(text, ['letter', 'faculty', 'recommendation request', 'reference'])) {
      return 'Open Recommendations to send a request to a faculty member. Use their registered email, include the purpose and deadline, and monitor the request status there.';
    }
    if (includesAny(text, ['profile', 'gpa', 'cgpa', 'ielts', 'gre', 'budget', 'settings'])) {
      return 'Profile Info contains your academic results, research experience, preferences, and budget. Settings contains account and password controls.';
    }
    if (includesAny(text, ['dashboard', 'navigate', 'navigation', 'menu', 'guide', 'help'])) {
      return 'The student sidebar contains Dashboard, Upload CV, Profile Info, Recommendations, Suggested Universities, Browse Universities, Shortlisted, Applications, and Settings.';
    }
  }

  if (role === 'Faculty') {
    if (includesAny(text, ['upload', 'cv', 'resume', 'profile'])) {
      return 'Use CV Upload to extract your faculty background, then review institutional, designation, specialization, research, and publication details in Profile Info.';
    }
    if (includesAny(text, ['recommendation', 'request', 'letter', 'accept', 'decline', 'pdf', 'student'])) {
      return 'Open Recommendation Requests to review student requests. You can accept or decline a request, and accepted requests allow you to submit or replace the recommendation PDF.';
    }
    if (includesAny(text, ['browse', 'university', 'shortlist', 'save'])) {
      return 'Browse Universities searches the shared catalogue. Saved choices are available under Shortlisted Universities.';
    }
    if (includesAny(text, ['settings', 'password', 'account'])) {
      return 'Profile Settings contains your account details and password controls.';
    }
    if (includesAny(text, ['dashboard', 'navigate', 'navigation', 'menu', 'guide', 'help'])) {
      return 'The faculty sidebar contains Dashboard, CV Upload, Profile Info, Browse Universities, Shortlisted Universities, Recommendation Requests, and Profile Settings.';
    }
  }

  if (role === 'Admin') {
    if (includesAny(text, ['university', 'database', 'add', 'edit', 'delete', 'modify'])) {
      return 'Open the Universities tab to access University Database Management. From there you can add, edit, or delete catalogue records.';
    }
    if (includesAny(text, ['user', 'student', 'faculty', 'block', 'unblock', 'registered'])) {
      return 'Open the Users tab for Registered Users Management. You can search users, edit their information, and block or unblock accounts.';
    }
    if (includesAny(text, ['dashboard', 'navigate', 'navigation', 'menu', 'guide', 'help'])) {
      return 'The Admin Dashboard has two primary views: Users for registered-account management and Universities for catalogue management.';
    }
  }

  return `I could not match that to a UniScout feature. Ask me about the ${role} dashboard, profile, university workflow, applications, or recommendation tools.`;
}

export default function Chatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messageId = useRef(0);
  const replyTimer = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const role = normalizedRole(user);

  const nextId = () => {
    messageId.current += 1;
    return messageId.current;
  };

  useEffect(() => {
    if (!isOpen || messages.length) return;
    const name = firstName(user);
    setMessages([{
      id: nextId(),
      sender: 'bot',
      text: `Hello${name ? ` ${name}` : ''}. I am the UniScout Assistant. What can I help you with in the ${role} portal?`
    }]);
  }, [isOpen, messages.length, role, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      if (replyTimer.current) window.clearTimeout(replyTimer.current);
    };
  }, []);

  const handleSendMessage = event => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    setMessages(previous => [...previous, { id: nextId(), sender: 'user', text }]);
    setInputValue('');
    setIsTyping(true);
    replyTimer.current = window.setTimeout(() => {
      setMessages(previous => [...previous, {
        id: nextId(),
        sender: 'bot',
        text: generateReply(text, role)
      }]);
      setIsTyping(false);
      inputRef.current?.focus();
    }, 350);
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end md:bottom-6 md:right-6">
      {isOpen && (
        <section
          role="dialog"
          aria-label="UniScout Assistant"
          className="pointer-events-auto mb-3 flex h-[28rem] max-h-[calc(100vh-7rem)] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
        >
          <header className="flex h-12 shrink-0 items-center justify-between bg-brandNavy px-4 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <Bot size={19} aria-hidden="true" />
              <span className="truncate text-sm font-bold">UniScout Assistant</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">{role}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70"
              aria-label="Close UniScout Assistant"
              title="Close assistant"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 p-3" aria-live="polite">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-relaxed ${message.sender === 'user' ? 'bg-brandBlue text-white' : 'border border-gray-200 bg-white text-brandNavy shadow-sm'}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 shadow-sm">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex shrink-0 gap-2 border-t border-gray-200 bg-white p-3">
            <label className="sr-only" htmlFor="uniscout-chat-input">Ask UniScout Assistant</label>
            <input
              ref={inputRef}
              id="uniscout-chat-input"
              type="text"
              value={inputValue}
              onChange={event => setInputValue(event.target.value)}
              placeholder="Ask about UniScout..."
              maxLength={500}
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-brandNavy outline-none focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/15"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brandBlue text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-brandBlue/30 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Send message"
              title="Send message"
            >
              <Send size={17} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-brandBlue text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-brandBlue/25"
          aria-label="Open UniScout Assistant"
          title="Open UniScout Assistant"
        >
          <MessageCircle size={23} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
