
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Chat
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="text-center mb-12 animate-fade-in">
            <div className="text-6xl mb-6">🤖</div>
            <h1 className="text-4xl font-bold mb-4">About AI Chat</h1>
            <p className="text-xl text-muted-foreground">
              A modern, real-time AI chat interface built with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card rounded-lg p-6 border border-border animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4">✨ Features</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Real-time streaming responses</li>
                <li>• Natural typing animations</li>
                <li>• Responsive design for all devices</li>
                <li>• Markdown support in messages</li>
                <li>• Persistent conversation history</li>
                <li>• WebSocket communication</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4">🛠️ Technology</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• React 18+ with TypeScript</li>
                <li>• TailwindCSS for styling</li>
                <li>• WebSocket for real-time communication</li>
                <li>• Framer Motion animations</li>
                <li>• FastAPI backend integration</li>
                <li>• Modern SSR with Next.js compatibility</li>
              </ul>
            </div>
          </div>

          <div className="bg-card rounded-lg p-8 border border-border text-center animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">🚀 Capabilities</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-muted-foreground">
              <div>
                <div className="text-2xl mb-2">🌍</div>
                <h3 className="font-medium text-foreground">Multilingual</h3>
                <p className="text-sm">Support for multiple languages and contexts</p>
              </div>
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-medium text-foreground">Real-time</h3>
                <p className="text-sm">Instant responses with streaming technology</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-medium text-foreground">Accurate</h3>
                <p className="text-sm">Powered by advanced AI models</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12 space-y-4 animate-fade-in">
            <p className="text-muted-foreground">
              Built with ❤️ using modern web technologies
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
