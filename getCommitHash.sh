#!/usr/bin/env sh

HASH=$(git rev-parse --short HEAD)
DATE=$(git show -s --format=%ci HEAD | sed 's/ /_/g')
BUILD_ID="$DATE.$HASH"

if [ "$NODE_ENV" = "production" ]; then
    echo "$BUILD_ID"
else
    echo "$BUILD_ID-devel"
fi
