FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install --legacy-peer-deps
RUN npm run build --workspaces --if-present

FROM base AS api
CMD ["npm", "--workspace=apps/api", "start"]

FROM base AS web
EXPOSE 3000
CMD ["npm", "--workspace=apps/web", "start"]
