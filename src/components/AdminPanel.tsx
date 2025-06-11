import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: {
    model: string;
    provider: 'openai' | 'deepseek';
  }) => void;
  currentConfig: {
    model: string;
    provider: 'openai' | 'deepseek';
  };
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig
}) => {
  const [selectedModel, setSelectedModel] = useState(currentConfig.model);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'deepseek'>(currentConfig.provider);

  const modelGroups = {
    openai: [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Cheap)', description: 'Fast and affordable' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cheap)', description: 'Latest cheap model' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance' },
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (Cheap)', description: 'Cost-effective reasoning' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder (Cheap)', description: 'Optimized for coding' },
    ]
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    // Auto-detect provider based on model
    if (modelGroups.openai.some(m => m.id === modelId)) {
      setSelectedProvider('openai');
    } else {
      setSelectedProvider('deepseek');
    }
  };

  const handleSave = () => {
    onSave({
      model: selectedModel,
      provider: selectedProvider
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-background">
          <h2 className="text-lg font-semibold">Model Selection</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Choose AI Model</label>
            
            {/* OpenAI Models */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">OpenAI Models</h4>
              <div className="space-y-1">
                {modelGroups.openai.map((model) => (
                  <label key={model.id} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={selectedModel === model.id}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* DeepSeek Models */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">DeepSeek Models</h4>
              <div className="space-y-1">
                {modelGroups.deepseek.map((model) => (
                  <label key={model.id} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={selectedModel === model.id}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Current Selection Info */}
          {selectedModel && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Selected:</span> {selectedProvider === 'openai' ? 'OpenAI' : 'DeepSeek'} - {
                  [...modelGroups.openai, ...modelGroups.deepseek].find(m => m.id === selectedModel)?.name
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                API Key: ✓ Configured (Hardcoded)
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Model
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
