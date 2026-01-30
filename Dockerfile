FROM node:23-alpine

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Install dependencies first (better caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app
RUN pnpm run build

# Expose port and start
EXPOSE 3000
CMD ["pnpm", "start"]
