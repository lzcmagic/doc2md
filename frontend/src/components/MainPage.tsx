import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { convertToMarkdown, type ToMarkdownDocumentResult as ApiResultType } from '../lib/api';
import { toast } from 'sonner';
import { Upload, Copy, FileText, CloudUpload } from 'lucide-react';

interface MainPageProps {
  accountId: string;
  apiToken: string;
  onClearCredentials: () => void;
}

interface ConversionResult {
  name: string;
  markdown: string;
}

const MainPage: React.FC<MainPageProps> = ({ accountId, apiToken, onClearCredentials }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
      setConversionResults([]); // Clear previous results when new files are selected
    }
  };

  const handleConvert = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.warning('请选择要转换的文件。');
      return;
    }

    setIsLoading(true);
    setConversionResults([]); // Clear previous results before new conversion

    const filesArray = Array.from(selectedFiles);

    try {
      const results = await convertToMarkdown(filesArray, accountId, apiToken);
      if (results) {
        const formattedResults = results.map((result: ApiResultType) => ({
          name: result.name,
          markdown: result.data
        }));
        setConversionResults(formattedResults);
        toast.success(`成功转换 ${results.length} 个文件。`);
      } else {
        // Error handled within convertToMarkdown via toast
      }
    } catch (error) { // Catch any unexpected errors not handled by the API function
      console.error('Conversion process error:', error);
      toast.error('转换过程中发生意外错误。');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFiles, accountId, apiToken]);

  const copyToClipboard = (text: string, fileName: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`${fileName} 的Markdown已复制到剪贴板！`);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast.error('复制Markdown到剪贴板失败。');
      });
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center transition-colors duration-500">

      <div className="ghibli-card">
        <div className="ghibli-upload-area" onClick={() => document.getElementById('file-upload')?.click()}>
          <CloudUpload size={48} className="mx-auto mb-4 text-white" />
          <h3 className="text-white text-xl font-medium mb-2">上传文档</h3>
          <p className="text-white/80 mb-4">选择一个或多个文件（PDF、图片、Office文档等）</p>
          
          <Label htmlFor="file-upload" className="sr-only">选择文件</Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          
          {selectedFiles && (
            <div className="mt-4 py-2 px-3 bg-white/30 backdrop-blur-sm rounded-lg text-white">
              <p className="text-sm">
                已选择 {selectedFiles.length} 个文件: {Array.from(selectedFiles).map(f => f.name).join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="text-center mb-6">
          <button 
            onClick={handleConvert} 
            disabled={isLoading || !selectedFiles || selectedFiles.length === 0} 
            className="ghibli-button"
          >
            {isLoading ? '正在转换...' : <>
              <Upload className="mr-2 h-5 w-5" /> 
              <span>转换为Markdown</span>
            </>}
          </button>
        </div>

        {conversionResults.length > 0 && (
          <div className="space-y-6 mt-8">
            <h2 className="text-xl font-semibold text-center mb-4">转换结果</h2>
            {conversionResults.map((result, index) => (
              <div key={index} className="ghibli-result-card">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <FileText size={20} className="mr-2 text-gray-700" />
                    <h3 className="font-medium">{result.name}</h3>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(result.markdown, result.name)} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="复制Markdown"
                  >
                    <Copy size={16} className="text-gray-600" />
                  </button>
                </div>
                <div className="bg-white/50 rounded-lg border border-gray-200 p-1">
                  <div className="ghibli-textarea">
                    <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">{result.markdown}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainPage; 