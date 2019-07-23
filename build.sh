#!/usr/bin/env bash

# Create version string.

VERS=`date +%s`

# If the `build` directory exists, delete it.

if [ -d build ]; then
    rm -Rf build
fi

# Create a clean build directory.

mkdir build

# If the `dist` directory exists, clear its contents.

if [ -d dist ]; then
    rm -Rf dist/*
fi

# If the `dist` directory does not exist, create it.

if [ ! -d dist ]; then
    mkdir dist
fi

# Copy source code to build directory.

cp -R client build/client
cp -R csxs build/csxs
cp -R host build/host
cp icon.png build/icon.png

# Build and sign the extension.

./bin/ZXPSignCmd -sign build ./dist/com.atomic.aisessions.zxp ./bin/selfDB.p12 Alias2Mocha7 -tsa https://www.safestamper.com/tsa

# Delete the build directory.

if [ -d build ]; then
    rm -Rf build
fi
