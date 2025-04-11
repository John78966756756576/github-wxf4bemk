import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface Message {
  type: 'user' | 'bot';
  content: string;
}

interface MistralResponse {
  response?: {
    content?: string;
    error?: string;
  };
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: 'Hi! I\'m MetaJungkok, powered by Jhunpaul. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [messages]);

  const pollForResponse = async (messageId: string, retries = 0) => {
    if (retries > 30) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I apologize, but I didn't receive a response in time. Please try again."
      }]);
      setIsTyping(false);
      return;
    }

    try {
      const response = await fetch(`https://hook.eu2.make.com/plpujxjbd2przne1po7kolyibx6vqh3g/status/${messageId}`);
      
      if (response.status === 202) {
        pollTimeoutRef.current = setTimeout(() => pollForResponse(messageId, retries + 1), 1000);
        return;
      }

      const contentType = response.headers.get('Content-Type') || '';
      let responseData;

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textResponse = await response.text();
        responseData = { response: { content: textResponse } };
      }
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: responseData.response?.content || "I apologize, but I couldn't understand your request."
      }]);
    } catch (error) {
      console.error('Error polling for response:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I apologize, but I encountered an error while processing your request."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('https://hook.eu2.make.com/plpujxjbd2przne1po7kolyibx6vqh3g', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          timestamp: new Date().toISOString(),
          conversation_history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('Content-Type') || '';
        let data;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textResponse = await response.text();
          data = { messageId: `fallback-${Date.now()}` };
          
          setMessages(prev => [...prev, {
            type: 'bot',
            content: textResponse
          }]);
          setIsTyping(false);
          return;
        }

        if (data.messageId) {
          pollForResponse(data.messageId);
        } else {
          throw new Error('No messageId received in the response');
        }
      } else {
        let errorMessage = `Server error (Status ${response.status}): `;
        
        switch (response.status) {
          case 400:
            errorMessage += 'Invalid request format';
            break;
          case 401:
            errorMessage += 'Unauthorized access';
            break;
          case 403:
            errorMessage += 'Access forbidden';
            break;
          case 429:
            errorMessage += 'Too many requests, please try again later';
            break;
          case 500:
            errorMessage += 'Internal server error';
            break;
          default:
            errorMessage += 'Unexpected error occurred';
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error connecting to Make.com:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: error instanceof Error ? error.message : "An unexpected error occurred. Please try again later."
      }]);
      setIsTyping(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-lg rounded-b-2xl border-b`}>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <img 
                src="https://prgpijirkcfzzupyswsj.supabase.co/storage/v1/object/sign/files/468299231_861026152904225_5304760152410024946_n.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJmaWxlcy80NjgyOTkyMzFfODYxMDI2MTUyOTA0MjI1XzUzMDQ3NjAxNTI0MTAwMjQ5NDZfbi5qcGciLCJpYXQiOjE3NDQzNjU1ODksImV4cCI6MTkxOTc1NzU4OX0.gGVvYNjD4p7gK5zjU5AbtxHtd9gp0hiD5EQFOaQkQt8"
                alt="MetaJungkok Profile"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-blue-500"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
            <div>
              <h1 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>MetaJungkok</h1>
              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>The only one pogi</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 sm:p-2.5 rounded-xl ${
              theme === 'dark' 
                ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' 
                : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
            } transition-all duration-200`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        {/* Chat Container */}
        <div className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 sm:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <div className="relative flex-shrink-0">
                  <img 
                    src="https://prgpijirkcfzzupyswsj.supabase.co/storage/v1/object/sign/files/468299231_861026152904225_5304760152410024946_n.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJmaWxlcy80NjgyOTkyMzFfODYxMDI2MTUyOTA0MjI1XzUzMDQ3NjAxNTI0MTAwMjQ5NDZfbi5qcGciLCJpYXQiOjE3NDQzNjU1ODksImV4cCI6MTkxOTc1NzU4OX0.gGVvYNjD4p7gK5zjU5AbtxHtd9gp0hiD5EQFOaQkQt8"
                    alt="MetaJungkok"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-blue-500"
                  />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[80%] px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-slate-900 text-gray-100 border border-slate-800'
                    : 'bg-white text-gray-800 border border-gray-100'
                } shadow-sm`}
              >
                <p className="text-sm sm:text-[15px] leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                <img 
                  src="https://prgpijirkcfzzupyswsj.supabase.co/storage/v1/object/sign/files/468299231_861026152904225_5304760152410024946_n.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJmaWxlcy80NjgyOTkyMzFfODYxMDI2MTUyOTA0MjI1XzUzMDQ3NjAxNTI0MTAwMjQ5NDZfbi5qcGciLCJpYXQiOjE3NDQzNjU1ODksImV4cCI6MTkxOTc1NzU4OX0.gGVvYNjD4p7gK5zjU5AbtxHtd9gp0hiD5EQFOaQkQt8"
                  alt="MetaJungkok"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-blue-500"
                />
              </div>
              <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-gray-100'} shadow-sm`}>
                <div className="flex gap-1">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-bounce`} />
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]`} />
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]`} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-t border-slate-800' : 'bg-white border-t border-gray-100'} p-3 sm:p-6 shadow-lg rounded-t-2xl`}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className={`flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-[15px] ${
                theme === 'dark'
                  ? 'bg-slate-800 text-white placeholder-gray-400 focus:ring-blue-500 border-slate-700'
                  : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-blue-500 border-gray-200'
              } border focus:outline-none focus:ring-2 transition-all duration-200`}
            />
            <button
              type="submit"
              className={`p-2.5 sm:p-3 rounded-xl ${
                input.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : theme === 'dark'
                  ? 'bg-slate-800 text-gray-400 border border-slate-700'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              } transition-colors duration-200`}
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;