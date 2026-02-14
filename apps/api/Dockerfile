FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @hermes/api... build
RUN for pkg in domain rules seed; do \
	if [ -d "dist/packages/$pkg/src" ]; then \
		mkdir -p "packages/$pkg/dist"; \
		cp -R "dist/packages/$pkg/src/." "packages/$pkg/dist/"; \
	fi; \
done
RUN pnpm --filter @hermes/api --prod deploy /out/api

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/api ./
RUN for pkg in domain rules seed; do \
	if [ -d "/app/dist/packages/$pkg/src" ]; then \
		target="$(find /app -type d -path "*/node_modules/@hermes/$pkg" | head -n1)"; \
		if [ -n "$target" ]; then \
			mkdir -p "$target/dist"; \
			cp -R "/app/dist/packages/$pkg/src/." "$target/dist/"; \
		fi; \
	fi; \
done
EXPOSE 3001
CMD ["node", "dist/apps/api/src/main.js"]
