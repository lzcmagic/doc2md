# 构建阶段
FROM node:20-alpine as builder

WORKDIR /app

# 复制项目文件
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# 安装依赖并构建
RUN npm ci
RUN npm run build

# 运行阶段
FROM node:20-alpine

WORKDIR /app

# 复制构建产物和必要文件
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/frontend/.env* ./frontend/

# 安装生产环境依赖和全局 serve
RUN npm ci --production && npm install -g serve

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 3000
EXPOSE 5174

# 创建启动脚本
COPY <<EOF /app/start.sh
#!/bin/sh
# 启动后端服务，监听所有网络接口
HOST=0.0.0.0 node backend/server/index.mjs &
# 启动前端服务，允许外部访问
serve frontend/dist -l tcp://0.0.0.0:5174 -s
EOF

RUN chmod +x /app/start.sh

# 启动命令
CMD ["/app/start.sh"] 