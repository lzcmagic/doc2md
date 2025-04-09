import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Key, Shield, Save } from 'lucide-react';

interface SettingsPageProps {
  onSave: (accountId: string, apiToken: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onSave }) => {
  const [accountId, setAccountId] = useState('');
  const [apiToken, setApiToken] = useState('');

  const handleSave = () => {
    if (!accountId || !apiToken) {
      toast.error('请输入账户ID和API令牌。');
      return;
    }
    onSave(accountId, apiToken);
    toast.success('凭据保存成功！');
  };

  return (
    <div className="ghibli-card max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Cloudflare 凭据设置</h3>
        <p className="text-sm text-gray-600">
          输入您的 Cloudflare 账户 ID 和 API 令牌以使用 Markdown 转换服务。
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
            账户 ID
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
            API 令牌
          </Label>
          <input
            id="apiToken"
            type="password"
            value={apiToken}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiToken(e.target.value)}
            placeholder="输入您的 Cloudflare API 令牌"
            className="ghibli-input"
          />
          <p className="text-xs text-gray-500 mt-1 italic">
            您的 API 令牌将存储在本地。对于生产环境，请考虑使用后端代理。
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <button onClick={handleSave} className="ghibli-button">
          <Save size={16} className="mr-2" />
          保存凭据
        </button>
      </div>
    </div>
  );
};

export default SettingsPage; 