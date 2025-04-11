// Removed unused type definition
// interface BackendConvertResponse {
//   markdown: string;
// }

// Define the structure we will return to the calling component
// Include original file name for context
export interface ConversionResult {
  name: string; // Original filename
  markdown: string;
}

type ServiceType = 'cloudflare' | 'mistral';

interface MistralFileResponse {
  id: string;
  object: string;
  size_bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  deleted: boolean;
}

interface MistralSignedUrlResponse {
  url: string;
  expires_at: number;
}

interface MistralOcrResponse {
  pages: {
    index: number;
    markdown: string;
  }[];
}

async function uploadFileToMistral(file: File, mistralKey: string): Promise<string> {
  console.log(`[Mistral Upload] File Name: ${file.name}, Detected MIME Type: ${file.type}`); // 打印文件类型
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'ocr');

  const response = await fetch('https://api.mistral.ai/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mistralKey}`,
    },
    body: formData
  });

  if (!response.ok) {
    let errorDetails = response.statusText;
    try {
      // 尝试读取 Mistral 返回的 JSON 错误详情
      const errorJson = await response.json(); 
      errorDetails = JSON.stringify(errorJson);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // 如果响应不是 JSON，尝试读取文本
      try {
        errorDetails = await response.text();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e2) { /* 忽略读取错误 */ }
    }
    console.error('Mistral API 文件上传错误详情:', errorDetails); // 添加详细日志
    throw new Error(`文件上传失败: ${errorDetails}`);
  }

  const fileData: MistralFileResponse = await response.json();
  return fileData.id;
}

async function getMistralSignedUrl(fileId: string, mistralKey: string): Promise<string> {
  const response = await fetch(`https://api.mistral.ai/v1/files/${fileId}/url?expiry=24`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${mistralKey}`,
    }
  });

  if (!response.ok) {
    throw new Error(`获取签名URL失败: ${response.statusText}`);
  }

  const urlData: MistralSignedUrlResponse = await response.json();
  return urlData.url;
}

async function processMistralOcr(documentUrl: string, mistralKey: string, isImage: boolean = false): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mistralKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: isImage ? 'image_url' : 'document_url',
        [isImage ? 'image_url' : 'document_url']: documentUrl,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OCR处理失败: ${response.statusText}`);
  }

  const ocrData: MistralOcrResponse = await response.json();
  // 合并所有页面的markdown内容
  return ocrData.pages.map(page => page.markdown).join('\n\n');
}

const getApiBaseUrl = () => {
  // 在开发环境（通过Vite代理）或生产环境（Docker内）确定API基础URL
  if (import.meta.env.MODE === 'development') {
    // 开发环境使用相对路径，让Vite代理处理
    return '';
  } else {
    // 生产环境直接指向后端服务的端口和路径
    // 假设后端服务在容器内部的3000端口
    return 'http://localhost:3000'; // Docker容器内部通过localhost访问
  }
};

export async function convertToMarkdown(
  files: File[],
  accountId: string,
  apiToken: string,
  mistralKey: string,
  serviceType: ServiceType
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];
  const apiBaseUrl = getApiBaseUrl();

  for (const file of files) {
    try {
      let markdown = '';

      if (serviceType === 'cloudflare') {
        // 使用 Cloudflare API
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${apiBaseUrl}/api/cloudflare/convert`, {
          method: 'POST',
          headers: {
            'x-account-id': accountId,
            'x-api-token': apiToken,
          },
          body: formData,
        });

        if (!response.ok) {
          // 尝试读取错误响应体
          let errorBody = '未知错误';
          try {
            errorBody = await response.text();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) { /* 忽略读取错误 */ }
          throw new Error(`Cloudflare API 错误: ${response.status} ${response.statusText}. 响应: ${errorBody}`);
        }

        const data = await response.json();
        markdown = data.markdown;
      } else {
        // 使用 Mistral API
        const fileId = await uploadFileToMistral(file, mistralKey);
        const signedUrl = await getMistralSignedUrl(fileId, mistralKey);
        
        // 根据文件类型决定使用哪种处理方式
        const isImage = file.type.startsWith('image/');
        markdown = await processMistralOcr(signedUrl, mistralKey, isImage);
      }

      results.push({
        name: file.name,
        markdown,
      });
    } catch (error) {
      console.error(`处理文件 ${file.name} 时出错:`, error);
      // 抛出更详细的错误信息
      throw new Error(`处理文件 ${file.name} 时出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return results;
} 