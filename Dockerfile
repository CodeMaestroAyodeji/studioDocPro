# Dockerfile

# 1. Builder Stage: Install dependencies and build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# 2. Production Stage: Create a smaller image with only necessary files
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules (so Prisma CLI & deps exist)
COPY --from=builder /app/node_modules ./node_modules

# Copy the standalone Next.js output
COPY --from=builder /app/.next/standalone ./

# Copy prisma schema
COPY --from=builder /app/prisma ./prisma

# Copy public and .next/static folders
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Run migrations before starting
CMD ["sh", "-c", "npm run db:migrate && npm start"]
