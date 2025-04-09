// @ts-expect-error - 如果没有安装next包，请先安装：npm install next
import { NextApiRequest, NextApiResponse } from 'next';
// 暂时注释掉未使用的导入，实际使用时取消注释并安装相关依赖
// import formidable from 'formidable';
// import fs from 'fs';
// import { Readable } from 'stream';

/**
 * Cloudflare API代理
 * 此API路由用于解决浏览器端直接调用Cloudflare API时的CORS问题
 * 
 * 注意：要完全实现文件上传功能，需要安装:
 * npm install formidable
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    // 从请求中获取API路径参数
    const { path } = req.query;
    
    // 构建Cloudflare API URL
    const pathArray = Array.isArray(path) ? path : [path];
    const cloudflareApiUrl = `https://api.cloudflare.com/client/v4/accounts/${pathArray.join('/')}`;
    
    // 从请求头中获取认证信息
    const authHeader = req.headers.authorization;
    const accountIdHeader = req.headers['x-cloudflare-account-id'] as string;
    
    if (!authHeader) {
      return res.status(401).json({ error: '缺少Authorization请求头' });
    }
    
    console.log(`代理请求到: ${cloudflareApiUrl}`);
    console.log(`账户ID: ${accountIdHeader || '未提供'}`);

    // 简单的流式请求转发
    // 注意：这种方式可能无法处理文件上传，实际项目中请使用下面注释的formidable方式
    const cloudflareResponse = await fetch(cloudflareApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      // 将原始请求体直接传递给Cloudflare API
      // 警告：这种方式在处理文件上传时可能不工作
      body: req.body,
    });
    
    // 获取响应数据
    const data = await cloudflareResponse.json();
    
    // 返回响应结果
    return res.status(cloudflareResponse.status).json(data);
  } catch (error) {
    console.error('代理请求失败:', error);
    return res.status(500).json({ 
      error: '代理请求处理失败', 
      message: error instanceof Error ? error.message : '未知错误' 
    });
  }
}

// 配置，禁用 Next.js 的默认 body parser，因为我们需要处理文件上传
export const config = {
  api: {
    bodyParser: false,
  },
}; 