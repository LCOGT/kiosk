FROM node:12 as builder

WORKDIR /app
COPY . .
RUN yarn install --non-interactive \
        && yarn run build

FROM nginx:1.16-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html
