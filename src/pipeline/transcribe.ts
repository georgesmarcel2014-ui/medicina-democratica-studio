import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {captionSchema, wordSchema, type Caption} from '../shared/schema';
import {normalize, validateCaptions} from './captions';
import {execute} from './media';

export type AlignmentOptions = {python: string; modelPath: string};
export class TranscriptMismatchError extends Error {}

const transcriptionScript = fileURLToPath(new URL('../../deploy/transcribe.py', import.meta.url));
const speechWordSchema = z.object({...wordSchema.shape, end: z.number().finite().nonnegative()}).strict()
  .refine(word => word.end >= word.start, 'Intervalo de fala invertido');
const wordsSchema = z.array(speechWordSchema).max(3000);
type Word = z.infer<typeof wordSchema>;

function lexicalWords(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function wordEdits(expected: string[], heard: string[]) {
  let previous = heard.map((_, index) => index + 1);
  previous.unshift(0);
  for (const [index, word] of expected.entries()) {
    const row = [index + 1];
    for (const [position, recognized] of heard.entries()) {
      row.push(Math.min(previous[position + 1] + 1, row[position] + 1,
        previous[position] + (word === recognized ? 0 : 1)));
    }
    previous = row;
  }
  return previous[heard.length];
}

export function captionsFromSpeech(raw: unknown, script: string, duration: number) {
  const recognized = wordsSchema.parse(raw);
  const expected = lexicalWords(script);
  const heard = recognized.flatMap(word => lexicalWords(word.text));
  const tolerance = Math.floor(expected.length * 0.2);
  if (!heard.length || !expected.length || Math.abs(expected.length - heard.length) > tolerance ||
      wordEdits(expected, heard) > tolerance) {
    throw new TranscriptMismatchError('O áudio reconhecido diverge do roteiro aprovado.');
  }

  const approved = normalize(script).split(' ').filter(word => lexicalWords(word).length);
  const useApprovedSpelling = approved.length === recognized.length && approved.every((word, index) =>
    lexicalWords(word).join(' ') === lexicalWords(recognized[index].text).join(' '));
  const captions: Caption[] = [];
  let group: Word[] = [];
  let previousEnd = 0;
  const finishGroup = () => {
    const timed = group.filter(word => word.end > word.start);
    if (!timed.length) return;
    const text = group.map(word => word.text).join(' ');
    // Whisper can return a collapsed interval for a short word. Keep the text
    // and the timed cue, with word highlighting only when every word has a time.
    const words = timed.length === group.length ? timed : undefined;
    captions.push(captionSchema.parse({text, start: timed[0].start, end: timed[timed.length - 1].end, words}));
    group = [];
  };

  for (const [index, word] of recognized.entries()) {
    // Whisper rounds timestamps; only clip minor boundary differences, never invent word timings.
    const start = Math.max(previousEnd, word.start);
    const end = Math.min(duration, word.end);
    if (start - word.start > 0.08 || word.end - end > 0.08 ||
        end < start || (end === start && word.end > word.start)) {
      throw new Error('O alinhador retornou tempos de palavras inconsistentes.');
    }
    const text = useApprovedSpelling ? approved[index] : word.text;
    if (group.length && (group.length === 7 || start - previousEnd > 0.6 ||
        [...group.map(item => item.text), text].join(' ').length > 60)) finishGroup();
    group.push({text, start, end});
    previousEnd = end;
    if (/[.!?]$/.test(text)) finishGroup();
  }
  if (group.length) finishGroup();
  if (group.length) throw new Error('O alinhador retornou um bloco de legenda sem duração.');
  return validateCaptions(captions, duration);
}

export async function transcribeCaptions(audioFile: string, script: string, duration: number, options: AlignmentOptions) {
  const {stdout} = await execute(options.python, [transcriptionScript, options.modelPath, audioFile], {
    timeout: 600_000,
    maxBuffer: 512 * 1024,
    env: {...process.env, HF_HUB_OFFLINE: '1'},
  });
  return captionsFromSpeech(JSON.parse(stdout), script, duration);
}
