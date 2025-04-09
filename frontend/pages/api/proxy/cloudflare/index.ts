// @ts-expect-error - 确保安装依赖: npm install next formidable node-fetch form-data
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
// Readable未使用，移除
// import { Readable } from 'stream';

/**
 * Cloudflare API文件上传代理
 * 专门处理文件上传到Cloudflare tomarkdown API
 * 
 * 安装所需依赖:
 * npm install next formidable node-fetch form-data
 * npm install --save-dev @types/formidable @types/node-fetch
 */

export const config = {
  api: {
    bodyParser: false, // 禁用默认解析器以手动处理multipart/form-data
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    // 获取环境变量中的API令牌，更安全的方式
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    // 解析multipart/form-data请求
    const { fields, files } = await parseForm(req);
    
    // 从请求中获取账户ID
    const accountId = fields.accountId?.[0] || process.env.CLOUDFLARE_ACCOUNT_ID;
    
    // 验证必要的参数
    if (!accountId) {
      return res.status(400).json({ error: '缺少Cloudflare账户ID' });
    }
    
    if (!apiToken && !req.headers.authorization) {
      return res.status(400).json({ error: '缺少API令牌' });
    }
    
    // 构建目标URL
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/tomarkdown`;
    console.log(`代理请求到: ${url}`);
    
    // 创建新的FormData对象
    const formData = new FormData();
    
    // 添加所有文件
    const uploadedFiles = files.files || [];
    for (const file of uploadedFiles) {
      // 读取文件内容
      const fileContent = fs.readFileSync(file.filepath);
      // 添加到FormData
      formData.append('files', fileContent, {
        filename: file.originalFilename || 'file.txt',
        contentType: file.mimetype || 'application/octet-stream',
      });
      console.log(`添加文件: ${file.originalFilename}, 类型: ${file.mimetype}, 大小: ${fileContent.length} 字节`);
    }
    
    // 发送请求到Cloudflare API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiToken ? `Bearer ${apiToken}` : req.headers.authorization as string,
      },
      body: formData,
    });
    
    // 获取和返回响应
    const data = await response.json();
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('代理请求处理失败:', error);
    return res.status(500).json({ 
      error: '处理文件上传时出错', 
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}

// 处理form数据的辅助函数
function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields, files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ 
      multiples: true, // 支持多文件上传
      keepExtensions: true,
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
} 