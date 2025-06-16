import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: string) => void;
  currentModel: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  currentModel
}) => {
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const navigate = useNavigate();

  const modelGroups = [
    {
      label: 'OpenAI Models',
      options: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Cheap)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cheap)' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      ]
    },
    {
      label: 'DeepSeek Models',
      options: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat (Cheap)' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder (Cheap)' },
      ]
    }
  ];

  const handleSave = () => {
    onSave(selectedModel);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('guest');
    navigate('/auth');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Панель администратора</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">Выберите AI модель</label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {modelGroups.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Самая дешёвая модель выбрана по умолчанию. Сервис использует самую дешёвую модель по умолчанию.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-border">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Сохранить
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
