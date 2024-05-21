ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/app

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh python3 make g++


# Create a stage for installing production dependecies.
FROM base as deps

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage bind mounts to package.json and package-lock.json to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev


FROM deps as build

# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN npm run lint && \
    npm run build && \
    npm run test:ci

FROM scratch as testoutput
# Only copy the output directory from the build stage.
COPY --from=build /usr/app/output /

FROM base as prod

ARG BUILD_ID=unknown
ENV BUILD_ID=${BUILD_ID}

RUN addgroup -g 1234 campudus && \
    adduser -u 5678 -S campudus -G campudus -s /bin/bash -h /usr/app campudus && \
    chown -R campudus:campudus /usr/app

COPY --from=deps /usr/app/node_modules /usr/app/node_modules
COPY --from=build /usr/app/package.json /usr/app/package.json
COPY --from=build /usr/app/out /usr/app/out

USER campudus
ARG BRANCH_NAME
ARG BUILD_DATE
ARG GIT_COMMIT
ARG GIT_COMMIT_DATE

CMD [ "npm", "run", "start"]
