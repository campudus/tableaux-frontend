FROM node:22.14-alpine AS build

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /usr/app

COPY package*.json vite.config* tsconfig.* ./
COPY .npmrc .eslint* .prettierrc.yaml ./

RUN npm ci -d

COPY ./src/ ./src/
COPY ./public/ ./public/
COPY ./server/ ./server/
COPY ./index.html ./index.html

ARG BUILD_ID=unknown
ENV BUILD_ID=${BUILD_ID}

RUN echo "Build with BUILD_ID: $BUILD_ID"
RUN npm run lint && \
    npm run test:ci && \
    npm run build && \
    npm prune --omit=dev

FROM node:22.14-alpine

WORKDIR /usr/app

RUN addgroup -g 1234 campudus && \
    adduser -u 5678 -S campudus -G campudus -s /bin/bash -h /usr/app campudus && \
    chown -R campudus:campudus /usr/app

COPY --from=build /usr/app/node_modules /usr/app/node_modules
COPY --from=build /usr/app/package.json /usr/app/package.json
COPY --from=build /usr/app/out /usr/app/out
COPY --from=build /usr/app/server /usr/app/server

USER campudus

CMD [ "npm", "run", "start"]
