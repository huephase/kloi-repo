# ---- Build Stage ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/app.js"]
