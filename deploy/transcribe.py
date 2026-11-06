"""Transcribe local WAVs with a preinstalled Whisper model."""

import json
import sys

from faster_whisper import WhisperModel


def main():
    model_path, wav_path = sys.argv[1:]
    model = WhisperModel(
        model_path, device="cpu", compute_type="int8", cpu_threads=2,
        local_files_only=True,
    )
    segments, _ = model.transcribe(
        wav_path, language="pt", word_timestamps=True,
        vad_filter=True, condition_on_previous_text=False,
    )
    words = [
        {"text": word.word.strip(), "start": word.start, "end": word.end}
        for segment in segments
        for word in segment.words or []
        if word.word.strip()
    ]
    print(json.dumps(words, ensure_ascii=True, allow_nan=False))


if __name__ == "__main__":
    main()
