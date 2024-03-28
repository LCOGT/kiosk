FROM node:12 as builder

WORKDIR /app
COPY . .
RUN npm install \
        && npm run build

FROM nginx:1.16-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html
