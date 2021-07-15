FROM node:10.15.0-alpine AS build

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /usr/app

COPY .npmrc ./
COPY package* ./
COPY setupTests.js ./

RUN npm ci -d

COPY [".babelrc", ".eslint*", ".prettierrc", "./"]
COPY src src

ARG BUILD_ID=unknown
ENV BUILD_ID=${BUILD_ID}

RUN echo "Build with BUILD_ID: $BUILD_ID"
RUN npm run lint
RUN npm run test:ci
RUN npm run build
RUN npm prune --production

FROM node:10.15.0-alpine

WORKDIR /usr/app

RUN addgroup -g 1234 campudus && \
    adduser -u 5678 -S campudus -G campudus -s /bin/bash -h /usr/app campudus && \
    chown -R campudus:campudus /usr/app

COPY --from=build /usr/app/node_modules /usr/app/node_modules
COPY --from=build /usr/app/package.json /usr/app/package.json
COPY --from=build /usr/app/out /usr/app/out

USER campudus

CMD [ "npm", "run", "start"]
