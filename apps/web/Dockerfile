FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
COPY packages/rules/package.json packages/rules/
COPY packages/seed/package.json packages/seed/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @hermes/web build
RUN pnpm prune --prod --filter @hermes/web...

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/web
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/apps/web/next.config.mjs ./next.config.mjs
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages /app/packages
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml
EXPOSE 3000
CMD ["node", "/app/node_modules/next/dist/bin/next", "start", "-p", "3000"]
