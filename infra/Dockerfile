FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/backend apps/backend
RUN npm run build --workspace=@creator-tools/backend

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-opencv \
  && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY apps/backend/src/db/migrations apps/backend/dist/db/migrations
COPY apps/backend/src/modules/processor/image/inpaint.py apps/backend/dist/modules/processor/image/inpaint.py
ENV NODE_ENV=production
WORKDIR /app/apps/backend
CMD ["node", "dist/api.js"]
