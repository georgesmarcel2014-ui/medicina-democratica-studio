#!/usr/bin/env bash
set -euo pipefail
umask 077

runtime=$(realpath -m "${1:?Informe o diretório privado de dependências}")
mkdir -p "$runtime"
cd "$(dirname "$0")/.."
if [[ "$(uname -sm)" != "Linux x86_64" ]]; then
  echo "Use um ambiente Linux x86_64." >&2
  exit 1
fi

staging=$(mktemp -d "$runtime/setup.XXXXXX")
trap 'rm -rf "$staging"' EXIT
download() {
  curl --fail --location --silent --show-error --retry 3 --max-time 300 "$@"
}
export PATH="$runtime/node/bin:$PATH"
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) < 24 ? 1 : 0)' 2>/dev/null; then
  node_version=v24.22.1
  archive="node-$node_version-linux-x64.tar.xz"
  node_dist="https://nodejs.org/dist/$node_version"
  download "$node_dist/$archive" -o "$staging/$archive"
  download "$node_dist/SHASUMS256.txt" -o "$staging/SHASUMS256.txt"
  (cd "$staging" && awk -v name="$archive" '$2 == name { print }' SHASUMS256.txt | sha256sum -c -)
  mkdir -p "$runtime/node"
  tar -xJf "$staging/$archive" -C "$runtime/node" --strip-components=1
fi

if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  apt-get -qq update
  apt-get -qq install -y --no-install-recommends ffmpeg
fi
python3 -m venv "$runtime/asr"
"$runtime/asr/bin/python" -m pip install --disable-pip-version-check --only-binary=:all: -r deploy/requirements-asr.txt

model="$runtime/whisper"
weights='3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671  model.bin'
if ! (cd "$model" && sha256sum -c --status <<< "$weights" &&
  test -s config.json && test -s tokenizer.json && test -s vocabulary.txt) 2>/dev/null; then
  revision=536b0662742c02347bc0e980a01041f333bce120
  mkdir -p "$model"
  for file in config.json tokenizer.json vocabulary.txt model.bin; do
    download "https://huggingface.co/Systran/faster-whisper-small/resolve/$revision/$file" -o "$staging/$file"
  done
  (cd "$staging" && sha256sum -c <<< "$weights")
  mv "$staging/"{config.json,tokenizer.json,vocabulary.txt,model.bin} "$model/"
fi

npm ci --include=dev --no-audit --no-fund
browser="${CHROME_PATH:-}"
if [[ -z "$browser" ]]; then
  # Same Chrome Headless Shell release as Remotion 4.0.541. Curl honors
  # the managed environment proxy when the renderer's downloader cannot.
  chromium=158.0.8127.2
  browser_dir="$runtime/chromium-$chromium"
  browser="$browser_dir/chrome-headless-shell"
  if [[ ! -x "$browser" ]]; then
    download "https://remotion.media/chromium-headless-shell-linux-x64-$chromium.zip?clear" -o "$staging/chromium.zip"
    (cd "$staging" && sha256sum -c <<< '37efc23c796de6a7ae6360b545434863e1c35d9cabc7fddc8036e8c6e00697e8  chromium.zip')
    unzip -q "$staging/chromium.zip" -d "$staging"
    mv -T "$staging/chrome-headless-shell-linux64" "$browser_dir"
  fi
fi
browser=$(realpath "$browser")
if [[ "$(ldd "$browser")" == *"not found"* ]]; then
  apt-get -qq update
  libraries=(libnss3 libnspr4 libexpat1 libgbm1 fonts-liberation)
  for library in libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2; do
    if apt-cache show "${library}t64" >/dev/null 2>&1; then library="${library}t64"; fi
    libraries+=("$library")
  done
  apt-get -qq install -y --no-install-recommends "${libraries[@]}"
fi
"$browser" --version
printf '%s\n' "$browser" > "$runtime/chrome-path"
