FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV USER_SERVICE_URL=http://host.docker.internal:9000
ENV ACCOUNT_SERVICE_URL=http://host.docker.internal:9005
ENV LOAN_SERVICE_URL=http://host.docker.internal:9001
EXPOSE 80
