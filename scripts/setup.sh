#!/bin/bash

set -e

# Install system dependencies
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  dpkg \
  fakeroot \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgl1-mesa-glx \
  libgtk3.0-cil \
  libnss3 \
  mono-complete \
  rpm \
  wine \
  wine32 \
  wine64 \
  zip \
  libgcc-s1:i386 \
  libstdc++6:i386
