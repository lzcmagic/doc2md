import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Key, Shield, Save } from 'lucide-react';

interface SettingsPageProps {
  onSave: (accountId: string, apiToken: string, mistralKey: string) => void;
  initialAccountId?: string | null;
  initialApiToken?: string | null;
  initialMistralKey?: string | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  onSave, 
  initialAccountId, 
  initialApiToken,
  initialMistralKey 
}) => {
  // --- 删除调试日志 ---

  // 使用 initial 值初始化状态，如果存在的话
  const [accountId, setAccountId] = useState(initialAccountId || '');
  const [apiToken, setApiToken] = useState(initialApiToken || '');
  const [mistralKey, setMistralKey] = useState(initialMistralKey || '');

  useEffect(() => {
    if (initialAccountId) {
      setAccountId(initialAccountId);
    }
    if (initialApiToken) {
      setApiToken(initialApiToken);
    }
    if (initialMistralKey) {
      setMistralKey(initialMistralKey);
    }
  }, [initialAccountId, initialApiToken, initialMistralKey]);

  const handleSave = () => {
    if (!accountId || !apiToken || !mistralKey) {
      toast.error('请输入所有必需的凭据。');
      return;
    }
    onSave(accountId, apiToken, mistralKey);
    toast.success('凭据保存成功！');
  };

  return (
    <div className="ghibli-card max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">API 凭据设置</h3>
        <p className="text-sm text-gray-600">
          输入您的 Cloudflare 和 Mistral API 凭据以使用 Markdown 转换服务。
          这些信息将存储在您的浏览器本地。
        </p>
      </div>
      
      <div className="space-y-6 mb-8">
        <div className="space-y-2">
          <Label 
            htmlFor="accountId" 
            className="flex items-center text-gray-700 font-medium mb-1"
          >
            <Key size={16} className="mr-2" />
            Cloudflare 账户 ID
          </Label>
          <input
            id="accountId"
            type="text"
            value={accountId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountId(e.target.value)}
            placeholder="输入您的 Cloudflare 账户 ID"
            className="ghibli-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label 
            htmlFor="apiToken"
            className="flex items-center text-gray-700 font-medium mb-1"
          >
            <Shield size={16} className="mr-2" />
            Cloudflare API 令牌
          </Label>
          <input
            id="apiToken"
            type="password"
            value={apiToken}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiToken(e.target.value)}
            placeholder="输入您的 Cloudflare API 令牌"
            className="ghibli-input"
          />
        </div>

        <div className="space-y-2">
          <Label 
            htmlFor="mistralKey"
            className="flex items-center text-gray-700 font-medium mb-1"
          >
            <Key size={16} className="mr-2" />
            Mistral API 密钥
          </Label>
          <input
            id="mistralKey"
            type="password"
            value={mistralKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMistralKey(e.target.value)}
            placeholder="输入您的 Mistral API 密钥"
            className="ghibli-input"
          />
        </div>
      </div>
      
      <div className="text-center">
        <button 
          onClick={handleSave} 
          className="ghibli-button"
        >
          <Save className="mr-2 h-5 w-5" />
          <span>保存凭据</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage; 