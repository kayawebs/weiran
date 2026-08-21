FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/web apps/web
ARG VITE_API_BASE_URL=/api
ARG VITE_MARKET=global
ARG VITE_PUBLIC_SITE_URL=https://weiran.art
ARG VITE_WEB_AD_PROVIDER=none
ARG VITE_ADSENSE_CLIENT_ID=
ARG VITE_AD_SLOT_HOME=
ARG VITE_AD_SLOT_TOOLS=
ARG VITE_AD_SLOT_RESULT=
ARG VITE_AD_SLOT_TOOL_TOP=
ARG VITE_AD_SLOT_TOOL_BOTTOM=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_MARKET=${VITE_MARKET}
ENV VITE_PUBLIC_SITE_URL=${VITE_PUBLIC_SITE_URL}
ENV VITE_WEB_AD_PROVIDER=${VITE_WEB_AD_PROVIDER}
ENV VITE_ADSENSE_CLIENT_ID=${VITE_ADSENSE_CLIENT_ID}
ENV VITE_AD_SLOT_HOME=${VITE_AD_SLOT_HOME}
ENV VITE_AD_SLOT_TOOLS=${VITE_AD_SLOT_TOOLS}
ENV VITE_AD_SLOT_RESULT=${VITE_AD_SLOT_RESULT}
ENV VITE_AD_SLOT_TOOL_TOP=${VITE_AD_SLOT_TOOL_TOP}
ENV VITE_AD_SLOT_TOOL_BOTTOM=${VITE_AD_SLOT_TOOL_BOTTOM}
RUN npm run build --workspace=@creator-tools/web

FROM nginx:1.27-alpine
COPY infra/web-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
