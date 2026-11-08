import {link, lstat, mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {MAX_DURATION, MAX_TTS_SCRIPT_CHARS} from '../shared/schema';
import {NarrationTooLongError, probe, validateNarration} from './media';

/**
 * Google AI Studio / Gemini API TTS. No other voice provider is used.
 * The approved transcript is kept separate from direction in the prompt.
 */
export type GoogleTtsOptions = {
  script: string;
  apiKey: string;
  voice?: string;
  model?: string;
  direction?: string;
  fetchImpl?: typeof fetch;
};

export const DEFAULT_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const DEFAULT_TTS_VOICE = 'Charon';
export const CHARON_AUDIO_PROFILE = 'Português brasileiro. Narração documental masculina, madura, de registro médio-grave e encorpada. Dicção nítida e fala coloquial sóbria.';
export const CHARON_DIRECTION = 'Abra com curiosidade contida. Mantenha pulso entre frases e parágrafos, com respirações naturais e pausas curtas nas revelações. Conclua afirmações com queda natural de entonação e articule nomes e termos médicos com clareza. Evite melodia cantada, suavidade publicitária, sussurro e teatralidade.';
export class GoogleTtsHttpError extends Error {
  constructor(readonly status: number) {
    super(`Google TTS falhou (HTTP ${status}). Confira chave, cota e modelo.`);
  }
}
const SAMPLE_RATE = 24_000;
const CHANNELS = 1;
const BYTES_PER_SAMPLE = 2;
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

function pcmToWav(pcm: Buffer): Buffer {
  if (!pcm.length || pcm.length % 2 !== 0 || pcm.length > MAX_AUDIO_BYTES) {
    throw new Error('Resposta PCM inválida do Google TTS.');
  }
  const duration = pcm.length / (SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE);
  if (duration > MAX_DURATION) throw new NarrationTooLongError('Narração gerada excede 179 segundos. Reduza o roteiro e gere novamente.');
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
  if (!script || script.length > MAX_TTS_SCRIPT_CHARS) throw new Error('Roteiro TTS vazio ou excessivamente longo.');
  if (!options.apiKey.trim()) throw new Error('Configure GEMINI_API_KEY no ambiente privado; nunca envie a chave pelo chat ou GitHub.');
  const model = options.model ?? DEFAULT_TTS_MODEL;
  const voice = options.voice ?? DEFAULT_TTS_VOICE;
  if (!/^gemini-[a-z0-9.-]+-tts(?:-preview)?$/.test(model)) throw new Error('Modelo Google TTS inválido.');
  if (voice !== DEFAULT_TTS_VOICE) throw new Error('A voz de produção deve ser Charon.');
  const episodeDirection = options.direction?.trim();
  const direction = episodeDirection ? `${CHARON_DIRECTION} ${episodeDirection}` : CHARON_DIRECTION;
  const part = /^gemini-3\.8-flash(?:-lite)?-tts$/.test(model)
    ? {text: script, speech_metadata: {style: `${CHARON_AUDIO_PROFILE} ${direction}`}}
    : {text: `# Audio Profile\n${CHARON_AUDIO_PROFILE}\n\n# Director's Notes\n${direction}\n\n# Transcript\n${script}`};

  // Newer TTS models treat the text as literal speech. Keep direction in metadata.
  const response = await (options.fetchImpl ?? fetch)(
    'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
    {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-goog-api-key': options.apiKey},
      body: JSON.stringify({
        contents: [{role: 'user', parts: [part]}],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: voice}},
            languageCode: 'pt-BR'
          }
        }
      }),
      signal: AbortSignal.timeout(120_000),
      redirect: 'error'
    }
  );
  if (!response.ok) {
    // Never echo provider error bodies: they can contain script or sensitive inputs.
    throw new GoogleTtsHttpError(response.status);
  }
  const result: unknown = await response.json();
  const data = (result && typeof result === 'object' ? result : {}) as {
    candidates?: Array<{finishReason?: string; content?: {parts?: Array<{inlineData?: {data?: string; mimeType?: string}}>} }>;
  };
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') throw new Error('O Google TTS não concluiu a narração.');
  const audio = candidate?.content?.parts?.find(part => part.inlineData?.data)?.inlineData;
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
    throw new Error('Formato de áudio Google não suportado.');
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
  const absolute = path.resolve(outputPath);
  if (path.extname(absolute).toLowerCase() !== '.wav') throw new Error('Saída TTS deve ter extensão .wav.');
  const existing = await lstat(absolute).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
  if (existing) throw new Error('A narração já existe. Para reutilizá-la, use o modo de WAV aprovado.');
  const wav = await generateGoogleTts(options);
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
