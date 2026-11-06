FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates curl ffmpeg fonts-liberation gosu libgomp1 python3-venv tini \
       libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 \
       libgbm1 libnss3 libpango-1.0-0 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

COPY deploy/requirements-asr.txt /tmp/requirements-asr.txt
RUN python3 -m venv /opt/studio-asr \
    && /opt/studio-asr/bin/pip install --no-cache-dir --only-binary=:all: -r /tmp/requirements-asr.txt

RUN set -eu; \
    revision=536b0662742c02347bc0e980a01041f333bce120; \
    mkdir -p /opt/studio-whisper; \
    cd /opt/studio-whisper; \
    for file in config.json tokenizer.json vocabulary.txt model.bin; do \
      curl --fail --location --silent --show-error --retry 3 --max-time 300 \
        --output "$file" "https://huggingface.co/Systran/faster-whisper-small/resolve/$revision/$file"; \
    done; \
    echo '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671  model.bin' | sha256sum -c -

WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --include=dev --no-audit --no-fund \
    && install -d -o node -g node /app/node_modules/.cache
RUN node --input-type=module -e '\
    import {ensureBrowser} from "@remotion/renderer"; \
    import {rename} from "node:fs/promises"; \
    import {dirname} from "node:path"; \
    const browser = await ensureBrowser(); \
    if (!browser.path) throw new Error("Chromium Headless Shell indisponível"); \
    await rename(dirname(browser.path), "/opt/studio-browser");' \
    && /opt/studio-browser/chrome-headless-shell --version
COPY src ./src
COPY deploy/transcribe.py ./deploy/transcribe.py

ENV NODE_ENV=production \
    PORT=10000 \
    STUDIO_HOST=0.0.0.0 \
    STUDIO_JOBS_DIR=/var/data/jobs \
    STUDIO_ASR_PYTHON=/opt/studio-asr/bin/python \
    STUDIO_WHISPER_MODEL=/opt/studio-whisper \
    CHROME_PATH=/opt/studio-browser/chrome-headless-shell
EXPOSE 10000

ENTRYPOINT ["tini", "--"]
# Initialize the mounted directory as root, then run the server and its workers as node.
CMD ["sh", "-c", "umask 077 && install -d -m 0700 -o node -g node \"$STUDIO_JOBS_DIR\" && exec gosu node node --import tsx src/api/server.ts"]
