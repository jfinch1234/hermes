FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @hermes/web... build
RUN for pkg in domain rules seed; do \
	if [ -d "dist/packages/$pkg/src" ]; then \
		mkdir -p "packages/$pkg/dist"; \
		cp -R "dist/packages/$pkg/src/." "packages/$pkg/dist/"; \
	fi; \
done
RUN pnpm --filter @hermes/web --prod deploy /out/web

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/web ./
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/next/dist/bin/next start -p ${PORT:-3000}"]
