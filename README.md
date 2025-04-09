# 文档转Markdown转换器

一个优雅的吉卜力风格界面的文档转Markdown工具，使用Cloudflare AI技术将PDF、图片和Office文档转换为Markdown格式。

## 特性

- 🌸 精美的吉卜力风格用户界面
- 🔄 支持多种文档格式转换
- 🔒 安全的本地凭据存储
- 🎨 明暗主题切换
- 📋 一键复制转换结果

## 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/doc2md.git
   cd doc2md
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 创建 `.env` 文件，添加你的 Cloudflare 凭据：
   ```
   VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   VITE_CLOUDFLARE_API_TOKEN=your_api_token_here
   ```

## 使用方法

1. 使用提供的启动脚本运行应用：
   ```bash
   ./start.sh
   ```
   或者手动启动：
   ```bash
   nvm use 22  # 如果你使用 nvm
   npm run dev
   ```

2. 在浏览器中打开显示的URL（默认是 http://localhost:5174）

3. 如果没有设置 `.env` 文件，你需要在界面上输入 Cloudflare 凭据

4. 上传文档文件，点击"转换为Markdown"按钮

5. 查看和复制转换结果

## 技术栈

- React + TypeScript
- Vite
- Tailwind CSS
- Cloudflare AI API

## 演示

![应用截图](./screenshot.png)

## 许可证

MIT
