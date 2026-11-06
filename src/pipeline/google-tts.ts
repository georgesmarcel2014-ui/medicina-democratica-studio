import {link, mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {MAX_DURATION} from '../shared/schema';
import {probe, validateNarration} from './media';

/**
 * Google AI Studio / Gemini API TTS. No other voice provider is used.
 * The script is sent verbatim; the generated WAV is never cut, sped up or normalized.
 */
export type GoogleTtsOptions = {
  script: string;
  apiKey: string;
  voice?: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

export const DEFAULT_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const DEFAULT_TTS_VOICE = 'Charon';
const SAMPLE_RATE = 24_000;
const CHANNELS = 1;
const BYTES_PER_SAMPLE = 2;
const MAX_SCRIPT_CHARS = 15_000;
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

function pcmToWav(pcm: Buffer): Buffer {
  if (!pcm.length || pcm.length % 2 !== 0 || pcm.length > MAX_AUDIO_BYTES) {
    throw new Error('Resposta PCM inválida do Google TTS.');
  }
  const duration = pcm.length / (SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE);
  if (duration > MAX_DURATION) throw new Error('Narração gerada excede 179 segundos. Reduza o roteiro e gere novamente.');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE, 28);
  header.writeUInt16LE(CHANNELS * BYTES_PER_SAMPLE, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function generateGoogleTts(options: GoogleTtsOptions): Promise<Buffer> {
  const script = options.script.trim();
  if (!script || script.length > MAX_SCRIPT_CHARS) throw new Error('Roteiro TTS vazio ou excessivamente longo.');
  if (!options.apiKey.trim()) throw new Error('Configure GEMINI_API_KEY no ambiente privado; nunca envie a chave pelo chat ou GitHub.');
  const model = options.model ?? DEFAULT_TTS_MODEL;
  const voice = options.voice ?? DEFAULT_TTS_VOICE;
  if (!/^gemini-[a-z0-9.-]+-tts(?:-preview)?$/.test(model)) throw new Error('Modelo Google TTS inválido.');
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(voice)) throw new Error('Nome de voz Google inválido.');

  // Google Gemini generateContent (legacy), compatible with Gemini 2.5 TTS.
  const response = await (options.fetchImpl ?? fetch)(
    'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
    {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-goog-api-key': options.apiKey},
      body: JSON.stringify({
        contents: [{parts: [{text: script}]}],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: voice}},
            languageCode: 'pt-BR'
          }
        }
      }),
      signal: AbortSignal.timeout(120_000)
    }
  );
  if (!response.ok) {
    // Never echo provider error bodies: they can contain script or sensitive inputs.
    throw new Error('Google TTS falhou (HTTP ' + response.status + '). Confira chave, cota e modelo.');
  }
  const result: unknown = await response.json();
  const data = (result && typeof result === 'object' ? result : {}) as {
    candidates?: Array<{content?: {parts?: Array<{inlineData?: {data?: string; mimeType?: string}}>} }>;
  };
  const audio = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data)?.inlineData;
  if (!audio?.data || audio.data.length > MAX_AUDIO_BYTES * 2) throw new Error('Google TTS não retornou áudio válido.');
  if (!/^[\w+/]+={0,2}$/.test(audio.data)) throw new Error('Base64 de áudio inválido.');
  const bytes = Buffer.from(audio.data, 'base64');
  const mime = (audio.mimeType ?? 'audio/L16;rate=24000').toLowerCase();
  if (mime.startsWith('audio/wav') || mime.startsWith('audio/x-wav')) {
    if (bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') {
      throw new Error('O Google retornou WAV malformado.');
    }
    return bytes;
  }
  if (!mime.startsWith('audio/l16') && !mime.startsWith('audio/pcm')) {
    throw new Error('Formato de áudio Google não suportado: ' + mime.slice(0, 60));
  }
  const rate = /rate=(\d+)/.exec(mime)?.[1];
  if (rate && Number(rate) !== SAMPLE_RATE) throw new Error('Taxa PCM inesperada do Google TTS.');
  return pcmToWav(bytes);
}

/**
 * Only publish a full, verified WAV, atomically. No overwrites and no
 * temporary audio left behind after a failed validation.
 */
export async function generateGoogleTtsFile(options: GoogleTtsOptions, outputPath: string) {
  const wav = await generateGoogleTts(options);
  const absolute = path.resolve(outputPath);
  if (path.extname(absolute).toLowerCase() !== '.wav') throw new Error('Saída TTS deve ter extensão .wav.');
  await mkdir(path.dirname(absolute), {recursive: true, mode: 0o700});
  const temporary = absolute + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, wav, {mode: 0o600, flag: 'wx'});
    const duration = validateNarration(await probe(temporary));
    // Exclusive atomic publication; never overwrite a previously approved WAV.
    await link(temporary, absolute);
    return {duration, file: absolute, model: options.model ?? DEFAULT_TTS_MODEL, voice: options.voice ?? DEFAULT_TTS_VOICE};
  } finally {
    await rm(temporary, {force: true});
  }
}
