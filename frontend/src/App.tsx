import { useState } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ChatSection } from './components/ChatSection';
import { askQuestion } from './lib/api';
import type { DocumentInfo, Message, View } from './types';

const DEFAULT_TOP_K = 4;

export default function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [uploadedDocument, setUploadedDocument] = useState<DocumentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);

  const handleDocumentUpload = (doc: DocumentInfo) => {
    setUploadedDocument(doc);
    setActiveView('chat');
  };

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      type: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAnswering(true);
    setActiveView('chat');

    try {
      const result = await askQuestion(trimmed, DEFAULT_TOP_K);
      const sources = (result.sources ?? []).map((source, idx) => {
        const typed = source as Record<string, unknown>;
        const pageValue = typed.page ?? typed.page_number;
        return {
          page: typeof pageValue === 'number' ? pageValue : Number(pageValue) || idx + 1,
          page_number: typeof pageValue === 'number' ? pageValue : Number(pageValue) || idx + 1,
          text:
            typeof typed.text === 'string'
              ? typed.text
              : typeof typed === 'object'
                ? JSON.stringify(typed)
                : 'No text provided',
        };
      });

      const aiMessage: Message = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-ai`,
        type: 'ai',
        content: result.answer ?? 'No answer returned.',
        sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: Message = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-error`,
        type: 'ai',
        content:
          error instanceof Error ? error.message : 'Something went wrong while contacting the backend.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <Header activeView={activeView} onNavigate={setActiveView} />

      <main className="flex-1 overflow-hidden">
        {activeView === 'home' && (
          <div className="h-full flex items-center justify-center px-4">
            <div className="max-w-3xl w-full text-center space-y-8 animate-in fade-in duration-700">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI Document Q&A
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                  Upload your documents and get instant AI-powered answers with precise citations
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setActiveView('upload')}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Get Started
                </button>
                <button
                  onClick={() => setActiveView('chat')}
                  className="px-8 py-4 bg-white text-slate-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-200"
                >
                  View Demo
                </button>
              </div>

              {uploadedDocument && (
                <div className="mt-8 p-4 bg-white rounded-lg shadow-md border border-slate-200 inline-block">
                  <p className="text-sm text-slate-600">
                    Current document: <span className="font-medium text-slate-900">{uploadedDocument.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'upload' && (
          <UploadSection onDocumentUpload={handleDocumentUpload} />
        )}

        {activeView === 'chat' && (
          <ChatSection
            messages={messages}
            onSendMessage={handleSendMessage}
            documentName={uploadedDocument?.name}
            isAnswering={isAnswering}
          />
        )}
      </main>
    </div>
  );
}
