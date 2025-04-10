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
    throw new Error(`文件上传失败: ${response.statusText}`);
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

export async function convertToMarkdown(
  files: File[],
  accountId: string,
  apiToken: string,
  mistralKey: string,
  serviceType: ServiceType
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];

  for (const file of files) {
    try {
      let markdown = '';

      if (serviceType === 'cloudflare') {
        // 使用 Cloudflare API
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/cloudflare/convert`, {
          method: 'POST',
          headers: {
            'x-account-id': accountId,
            'x-api-token': apiToken,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Cloudflare API 错误: ${response.statusText}`);
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
      throw error;
    }
  }

  return results;
} 