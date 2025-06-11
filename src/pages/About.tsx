
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Github, Shield, Zap, Globe, MessageCircle } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Вернуться к чату
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">О ChatGPT</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Современный ИИ-ассистент с потоковыми ответами в режиме реального времени 
              и красивыми анимациями
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Возможности</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Потоковые ответы в реальном времени</h3>
                    <p className="text-sm text-muted-foreground">
                      Ответы ИИ появляются символ за символом, имитируя естественную беседу
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Многоязычная поддержка</h3>
                    <p className="text-sm text-muted-foreground">
                      Поддержка множества языков для глобальной аудитории
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Интуитивный интерфейс</h3>
                    <p className="text-sm text-muted-foreground">
                      Чистый, современный дизайн, вдохновленный лучшими практиками UX
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Безопасность и приватность</h3>
                    <p className="text-sm text-muted-foreground">
                      Защита данных пользователей с современными стандартами безопасности
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Технические детали</h2>
              
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Фронтенд</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• React 18+ с TypeScript</li>
                    <li>• Vite для быстрой разработки</li>
                    <li>• Tailwind CSS для стилизации</li>
                    <li>• shadcn/ui компоненты</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Связь</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• WebSocket для потоковых ответов</li>
                    <li>• REST API для дополнительных запросов</li>
                    <li>• Автоматическое переподключение</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Особенности</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Адаптивный дизайн</li>
                    <li>• Темная/светлая темы</li>
                    <li>• Плавные анимации</li>
                    <li>• История чатов</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://github.com"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Github size={16} />
                Посмотреть на GitHub
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Shield size={16} />
                Политика конфиденциальности
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
