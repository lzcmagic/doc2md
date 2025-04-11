// Load dotenv at the very top
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env.local');
// 删除 dotenv 调试日志
dotenv.config({ path: envPath });

// 删除 dotenv 结果检查日志

// Now import other modules
import express from 'express';
import cors from 'cors';
import { formidable } from 'formidable';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

// 删除未使用的 __filename 和 __dirname

const app = express();

// 启用CORS
app.use(cors());

// 日志中间件，记录所有请求
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 文件处理工具函数
const handleFileUpload = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
};

// 清理临时文件
const cleanupTempFile = (filepath) => {
  if (filepath) {
    fs.unlink(filepath, (err) => {
      if (err) console.error('清理临时文件失败:', err);
    });
  }
};

// POST /api/cloudflare/convert endpoint
app.post('/api/cloudflare/convert', async (req, res) => {
  let uploadedFile = null;
  
  try {
    // 处理文件上传
    const files = await handleFileUpload(req);
    uploadedFile = files.file?.[0];
    
    if (!uploadedFile) {
      return res.status(400).json({ error: '未上传文件' });
    }

    // 获取凭据
    const cloudflareAccountId = req.headers['x-account-id'] || process.env.CLOUDFLARE_ACCOUNT_ID;
    const cloudflareApiToken = req.headers['x-api-token'] || process.env.CLOUDFLARE_API_TOKEN;

    if (!cloudflareAccountId || !cloudflareApiToken) {
      return res.status(400).json({ error: '缺少 Cloudflare 凭据' });
    }

    // 准备请求数据
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/tomarkdown`;
    const formData = new FormData();
    formData.append('files', fs.createReadStream(uploadedFile.filepath), {
      filename: uploadedFile.originalFilename || 'uploaded_file',
      contentType: uploadedFile.mimetype,
    });

    // 调用 Cloudflare API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudflareApiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cloudflare API 错误 (${response.status}):`, errorText);
      return res.status(response.status).json({ error: `Cloudflare API 错误: ${errorText}` });
    }

    const result = await response.json();

    if (result?.success && result?.result?.[0]?.data) {
      res.json({ markdown: result.result[0].data });
    } else {
      console.error('Cloudflare 返回了意外的响应格式:', result);
      res.status(500).json({ error: result.success ? '解析转换结果失败' : 'Cloudflare API 调用失败' });
    }

  } catch (error) {
    console.error('转换过程中发生错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    cleanupTempFile(uploadedFile?.filepath);
  }
});

// POST /api/mistral/convert endpoint
app.post('/api/mistral/convert', (req, res) => {
  // 由于Mistral API直接在前端调用，这个端点暂时不需要实现
  res.status(501).json({ error: 'Mistral API 直接在前端调用' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`API 服务器运行在 http://${HOST}:${PORT}`);
});