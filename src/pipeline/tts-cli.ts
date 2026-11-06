import {parseArgs} from 'node:util';
import {readFile} from 'node:fs/promises';
import {generateGoogleTtsFile} from './google-tts';

async function main() {
  const {values} = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: {type: 'string'},
      output: {type: 'string'},
      voice: {type: 'string'},
      model: {type: 'string'}
    }
  });
  if (!values.input || !values.output) {
    throw new Error('Uso: npm run tts -- --input roteiro-aprovado.txt --output /pasta/privada/narration.wav [--voice Charon]');
  }
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Configure GEMINI_API_KEY como segredo do ambiente de execução.');
  const script = await readFile(values.input, 'utf8');
  const result = await generateGoogleTtsFile({script, apiKey, voice: values.voice, model: values.model}, values.output);
  console.log(JSON.stringify({ok: true, duration: result.duration, model: result.model, voice: result.voice, output: result.file}));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Falha no TTS');
  process.exitCode = 1;
});
