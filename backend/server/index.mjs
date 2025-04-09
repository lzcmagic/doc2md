// Load dotenv at the very top
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename_dotenv = fileURLToPath(import.meta.url);
const __dirname_dotenv = path.dirname(__filename_dotenv);
const envPath_dotenv = path.resolve(__dirname_dotenv, '../../.env.local');
// Remove debug logs for dotenv
// console.log(`[DOTENV DEBUG] Attempting to load env vars from: ${envPath_dotenv}`);
dotenv.config({ path: envPath_dotenv }); // Remove debug: true

// Remove result checking logs for dotenv
// if (dotenvResult.error) {
//   console.error('[DOTENV DEBUG] Error loading .env file:', dotenvResult.error);
// } else {
//   console.log('[DOTENV DEBUG] .env file loaded successfully. Parsed variables:', dotenvResult.parsed);
// }

// Now import other modules
import express from 'express';
import cors from 'cors';
import { formidable } from 'formidable';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 启用CORS
app.use(cors());

// 日志中间件，记录所有请求
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// POST /api/convert endpoint
app.post('/api/convert', (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error processing file upload.' });
    }

    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!cloudflareAccountId || !cloudflareApiToken) {
      console.error('Cloudflare credentials missing in environment variables.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    try {
      const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/tomarkdown`;
      const formData = new FormData();

      formData.append('files', fs.createReadStream(uploadedFile.filepath), {
        filename: uploadedFile.originalFilename || 'uploaded_file',
        contentType: uploadedFile.mimetype,
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cloudflare API error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: `Cloudflare API error: ${errorText}` });
      }

      const result = await response.json();

      if (result && result.success && result.result && result.result.length > 0 && result.result[0].data) {
        res.json({ markdown: result.result[0].data });
      } else {
        console.error('Unexpected or unsuccessful response format from Cloudflare:', result);
        let errorMessage = 'Failed to parse conversion result from Cloudflare.';
        if (result && !result.success) {
            errorMessage = 'Cloudflare API indicated failure.';
        }
        res.status(500).json({ error: errorMessage });
      }

    } catch (error) {
      console.error('Error calling Cloudflare API:', error);
      res.status(500).json({ error: 'Internal server error during conversion.' });
    } finally {
      if (uploadedFile && uploadedFile.filepath) {
        fs.unlink(uploadedFile.filepath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary file:', unlinkErr);
          }
        });
      }
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`API 服务器运行在 http://127.0.0.1:${PORT}`); // Changed log message
});