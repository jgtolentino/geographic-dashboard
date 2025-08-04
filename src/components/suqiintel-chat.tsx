'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageCircle, Send, Loader2, Sparkles, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  data?: any;
  timestamp: Date;
}

interface SuqiIntelChatProps {
  className?: string;
  onQuerySuccess?: (data: any) => void;
}

export function SuqiIntelChat({ className, onQuerySuccess }: SuqiIntelChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m SuqiIntel, your AI analytics assistant. Ask me anything about your Scout data!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('suqiintel.chat_sessions')
          .insert({
            user_id: user.id,
            title: `Chat - ${new Date().toLocaleDateString()}`
          })
          .select()
          .single();
        
        if (data) {
          setSessionId(data.session_id);
        }
      }
    };
    initSession();
  }, [supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call SuqiIntel Edge Function
      const { data, error } = await supabase.functions.invoke('suqiintel-processor', {
        body: {
          query: input,
          session_id: sessionId,
          context: {
            module: 'scout_dashboard',
            previous_messages: messages.slice(-5) // Last 5 messages for context
          }
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.explanation || 'Here are your results:',
        data: data.results,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Notify parent component if callback provided
      if (onQuerySuccess && data.results) {
        onQuerySuccess(data.results);
      }

    } catch (error) {
      console.error('SuqiIntel error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample queries for quick access
  const sampleQueries = [
    "Show me top 5 performing brands this month",
    "What's the average transaction value by region?",
    "Compare weekend vs weekday sales",
    "Which products have the highest growth rate?",
    "Show customer distribution by age group"
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-50",
          "flex items-center gap-2",
          isOpen && "bg-blue-700"
        )}
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline">SuqiIntel</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-24 right-6 w-full max-w-md bg-white rounded-lg shadow-2xl z-50 flex flex-col",
          "h-[600px] max-h-[80vh]",
          className
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">SuqiIntel Analytics Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-800'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.data && (
                    <div className="mt-2 text-xs">
                      <details className="cursor-pointer">
                        <summary className="font-medium">View Results</summary>
                        <pre className="mt-2 p-2 bg-black/10 rounded overflow-x-auto">
                          {JSON.stringify(message.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sample Queries */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.slice(0, 3).map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(query)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your Scout data..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "bg-blue-600 text-white hover:bg-blue-700",
                  "disabled:bg-gray-300 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// Export types for external use
export type { Message, SuqiIntelChatProps };