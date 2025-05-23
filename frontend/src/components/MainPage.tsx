import React, { useState, useCallback } from 'react';
import { convertToMarkdown } from '@/lib/api';
import { Copy, FileText, CloudUpload, CloudIcon, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

interface ConversionResult {
  name: string;
  markdown: string;
}

type ServiceType = 'cloudflare' | 'mistral';

interface MainPageProps {
  accountId?: string;
  apiToken?: string;
  mistralApiKey?: string;
  onClearCredentials?: () => void;
}

// 服务选择按钮组件
const ServiceButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-primary text-white shadow-lg transform scale-115'
        : 'bg-white/80 text-gray-600 hover:bg-white/90'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MainPage: React.FC<MainPageProps> = ({ accountId, apiToken, mistralApiKey }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [serviceType, setServiceType] = useState<ServiceType>('cloudflare');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (files: File[]) => {
    // 步骤 1: 在验证前添加日志
    files.forEach(file => {
      console.log(`[File Check] Name: ${file.name}, Type: ${file.type}`);
    });

    // 步骤 2: 修改验证逻辑
    const invalidFiles = files.filter(file => {
      let isSupported = false;
      const fileNameLower = file.name.toLowerCase(); // 转为小写以忽略后缀大小写

      if (serviceType === 'cloudflare') {
        const supportedTypes = [
          'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
          'text/html', 'application/xml',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel.sheet.macroenabled.12', // .xlsm
          'application/vnd.ms-excel.sheet.binary.macroenabled.12', // .xlsb
          'application/vnd.ms-excel', // .xls
          'application/vnd.oasis.opendocument.spreadsheet', // .ods
          'text/csv', // .csv
          'application/vnd.apple.numbers' // .numbers
        ];
        const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.html', '.xml', '.xlsx', '.xlsm', '.xlsb', '.xls', '.ods', '.csv', '.numbers'];

        // 优先检查 MIME 类型
        isSupported = supportedTypes.includes(file.type);

        // 如果 MIME 类型不匹配或为空，则检查后缀名
        if (!isSupported || file.type === "") {
          isSupported = supportedExtensions.some(ext => fileNameLower.endsWith(ext));
        }

      } else { // serviceType === 'mistral'
        const supportedTypes = [
          'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
        ];
        const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

        isSupported = supportedTypes.includes(file.type);
        if (!isSupported || file.type === "") {
          isSupported = supportedExtensions.some(ext => fileNameLower.endsWith(ext));
        }
      }
      // 如果不支持 (isSupported 为 false)，则返回 true (表示它是无效文件)
      return !isSupported;
    });

    if (invalidFiles.length > 0) {
      // 更新错误消息
      toast.error(`不支持的文件类型或无法识别的文件: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // 对于 Mistral 服务，检查文件大小限制（50MB）
    if (serviceType === 'mistral') {
      const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error(`文件大小超过限制 (50MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
      }
    }

    setSelectedFiles(files);
    setConversionResults([]); // Clear previous results when new files are selected
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files) {
      const files: File[] = Array.from(event.target.files);
      handleFiles(files);
    }
    console.log("Handling file change"); // Add log
  };

  const handleServiceChange = (type: ServiceType): void => {
    setServiceType(type);
    setSelectedFiles([]);
    setConversionResults([]);
  };

  const handleConvert = useCallback(async (): Promise<void> => {
    if (!selectedFiles.length) {
      toast.error('请选择要转换的文件。');
      return;
    }

    if (!accountId || !apiToken || !mistralApiKey) {
      toast.error('请在设置页面配置所有必需的 API 凭据。');
      return;
    }

    setIsConverting(true);
    try {
      const results = await convertToMarkdown(selectedFiles, accountId, apiToken, mistralApiKey, serviceType);
      if (results.length > 0) {
        setConversionResults(results);
        toast.success(`成功转换 ${results.length} 个文件。`);
      }
    } catch (error) {
      console.error('转换过程中发生错误:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`转换失败: ${errorMessage}`);
    } finally {
      setIsConverting(false);
    }
  }, [selectedFiles, accountId, apiToken, mistralApiKey, serviceType]);

  const copyToClipboard = async (text: string, fileName: string): Promise<void> => {
    // 优先尝试现代、安全的 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`已复制 ${fileName} 的内容到剪贴板 (安全)`);
        return; // 成功则直接返回
      } catch (err) {
        console.error('使用 Clipboard API 复制失败:', err);
        // Clipboard API 失败通常不是因为上下文不安全，而是其他原因 (如权限)
        toast.error(`复制 ${fileName} 失败: ${err instanceof Error ? err.message : '未知错误'}`);
        return; // 失败也直接返回
      }
    }

    // --- 后备方案：使用 document.execCommand ---
    console.warn('Clipboard API 不可用或上下文不安全，尝试使用已废弃的 document.execCommand 作为后备。');
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // 将 textarea 移到屏幕外并确保其可见性足够执行命令
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "1px"; // 避免影响布局
    textArea.style.height = "1px";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";


    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select(); // 选中 textarea 中的内容

    try {
      const successful = document.execCommand('copy'); // 执行复制命令
      if (successful) {
        toast.success(`已复制 ${fileName} 的内容到剪贴板 (后备)`);
      } else {
        // 如果 execCommand 返回 false，也视为错误
        throw new Error('document.execCommand 返回 false');
      }
    } catch (err) {
      console.error('使用 document.execCommand 复制失败:', err);
      toast.error(`复制 ${fileName} 失败，浏览器不支持或操作被阻止。请手动复制。`);
    } finally {
      // 无论成功与否，都清理临时元素
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-6">
      {/* 服务选择区域 */}
      <div className="flex justify-center gap-4 mb-6">
        <ServiceButton
          active={serviceType === 'cloudflare'}
          onClick={() => handleServiceChange('cloudflare')}
          icon={<CloudIcon size={20} />}
          label="Cloudflare AI"
        />
        <ServiceButton
          active={serviceType === 'mistral'}
          onClick={() => handleServiceChange('mistral')}
          icon={<BrainCircuit size={20} />}
          label="Mistral AI"
        />
      </div>

      {/* 文件上传区域 */}
      <div className="ghibli-upload-area">
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          multiple
          accept={
            serviceType === 'cloudflare'
              ? '.pdf,.jpg,.jpeg,.png,.webp,.svg,.html,.xml,.xlsx,.xlsm,.xlsb,.xls,.ods,.csv,.numbers'
              : '.pdf,.jpg,.jpeg,.png,.webp'
          }
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer block transition-all duration-200 ${
            isDragging ? 'bg-primary/10 border-primary' : ''
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudUpload className={`mx-auto mb-4 h-12 w-12 ${
            isDragging ? 'text-primary animate-bounce' : 'text-gray-400'
          }`} />
          <div className="text-lg font-medium mb-2">
            {selectedFiles.length === 0 && (isDragging ? '释放鼠标上传文件' : '点击或拖拽文件到此处')}
          </div>
          {selectedFiles.length > 0 ? (
            <div className="space-y-2">
              <div className="text-lg font-medium text-primary">已选择 {selectedFiles.length} 个文件：</div>
              <div className="max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-white/50 rounded-lg mb-2 shadow-sm border border-primary/20"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {serviceType === 'cloudflare'
                ? '支持 PDF、图片、HTML、XML、Excel、CSV 等格式'
                : '支持 PDF 和图片格式（JPG、PNG、WebP），文件大小不超过 50MB'}
            </p>
          )}
        </label>
      </div>

      {/* 转换按钮 */}
      <div className="flex justify-center">
        <button
          onClick={handleConvert}
          disabled={isConverting || selectedFiles.length === 0}
          className={`ghibli-button flex items-center gap-2 ${
            isConverting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isConverting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>转换中...</span>
            </>
          ) : (
            <>
              <FileText size={20} />
              <span>开始转换</span>
            </>
          )}
        </button>
      </div>

      {/* 转换结果 */}
      {conversionResults.length > 0 && (
        <div className="space-y-4">
          {conversionResults.map((result, index) => (
            <div key={index} className="ghibli-result-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{result.name}</h3>
                <button
                  id={`copy-button-${result.name}`}
                  onClick={() => copyToClipboard(result.markdown, result.name)}
                  className="ghibli-button-secondary flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                >
                  <Copy className="h-4 w-4" />
                  <span>复制</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                {result.markdown}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainPage; 