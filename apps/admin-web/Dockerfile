FROM node:24-slim

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --dir apps/admin-web run build

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "--dir", "apps/admin-web", "run", "start"]
