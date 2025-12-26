#!/usr/bin/env bash
# Copyright 2025 Jason Dillon
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Homebrew Bootstrap Script
# Called automatically on first run when installed via Homebrew
# Bootstraps ~/.commando from the commando package staged in Homebrew's libexec

set -euo pipefail

LIBEXEC_PATH="${1:-}"

if [[ -z "${LIBEXEC_PATH}" ]]; then
  echo "ERROR: libexec path required" >&2
  exit 1
fi

if [[ ! -d "${LIBEXEC_PATH}" ]]; then
  echo "ERROR: libexec path does not exist: ${LIBEXEC_PATH}" >&2
  exit 1
fi

# Determine installation location
COMMANDO_HOME="${COMMANDO_HOME:-$HOME/.commando}"

echo "Completing Commando installation to ${COMMANDO_HOME}..."

# Create directory structure
mkdir -p "${COMMANDO_HOME}"/{config,state,cache,logs}
cd "${COMMANDO_HOME}"

# Create package.json for meta project
cat > package.json << 'EOF'
{
  "name": "commando-meta",
  "version": "1.0.0",
  "private": true,
  "description": "Commando meta-project for shared dependencies"
}
EOF

# Create bunfig.toml for bun install configuration
cat > bunfig.toml << 'EOF'
[install]
exact = true
dev = false
peer = true
optional = false
auto = "disable"
EOF

# Create tsconfig.json for module resolution control
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@commando/*": ["./node_modules/@planet57/commando/lib/*"]
    }
  }
}
EOF

# Install commando from Homebrew's staged package
# Copy files directly instead of using bun add (which creates symlinks for file:// packages)
echo "Installing @planet57/commando from Homebrew package..."

COMMANDO_PKG_DIR="${COMMANDO_HOME}/node_modules/@planet57/commando"
mkdir -p "${COMMANDO_PKG_DIR}"

# Copy package contents (not symlink - bun's file:// creates symlinks which break module resolution)
cp -R "${LIBEXEC_PATH}/lib" "${COMMANDO_PKG_DIR}/"
cp -R "${LIBEXEC_PATH}/bin" "${COMMANDO_PKG_DIR}/"
cp "${LIBEXEC_PATH}/package.json" "${COMMANDO_PKG_DIR}/"
cp "${LIBEXEC_PATH}/README.md" "${COMMANDO_PKG_DIR}/" 2>/dev/null || true
cp "${LIBEXEC_PATH}/LICENSE" "${COMMANDO_PKG_DIR}/" 2>/dev/null || true

# Install dependencies from the commando package
echo "Installing dependencies..."
cd "${COMMANDO_PKG_DIR}"
if ! bun install --production; then
  echo "ERROR: Failed to install dependencies" >&2
  exit 1
fi
cd "${COMMANDO_HOME}"

# Verify installation
COMMANDO_PKG_DIR="${COMMANDO_HOME}/node_modules/@planet57/commando"
if [[ ! -d "${COMMANDO_PKG_DIR}" ]]; then
  echo "ERROR: Installation verification failed: package not found at ${COMMANDO_PKG_DIR}" >&2
  exit 1
fi

# Generate version.json
VERSION=$(node -p "require('${COMMANDO_PKG_DIR}/package.json').version" 2>/dev/null || echo "unknown")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TIMESTAMP_UNIX=$(date +%s)
DATE_PART=$(echo "$TIMESTAMP" | cut -d'T' -f1 | tr -d '-')
TIME_PART=$(echo "$TIMESTAMP" | cut -d'T' -f2 | cut -d':' -f1,2 | tr -d ':')
DATE_TIME="${DATE_PART}.${TIME_PART}"
SEMVER="${VERSION}+${DATE_TIME}.homebrew"

cat > "${COMMANDO_HOME}/version.json" <<EOF
{
  "version": "$VERSION",
  "hash": "homebrew",
  "hashFull": "homebrew",
  "timestamp": "$TIMESTAMP",
  "timestampUnix": $TIMESTAMP_UNIX,
  "branch": "homebrew",
  "dirty": false,
  "semver": "$SEMVER"
}
EOF

echo "Commando ${VERSION} installed successfully"
