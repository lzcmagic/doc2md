FROM node:20-alpine AS backend

WORKDIR /app

# Context is root, so copy directly
COPY package.json package-lock.json* ./
COPY .npmrc* ./

# Use npm ci for clean installs based on the lock file.
# This typically installs all dependencies (dev included) as specified in the lock file.
# If you need to prune dev dependencies later, that's a separate step.
RUN npm ci

# Copy backend code (which is in ./backend relative to context)
COPY ./backend/server ./server

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.mjs"] 