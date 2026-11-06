import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {buildServer, type JobStatus} from '../src/api/app';
import {execute, probe, validateNarration, verifyOutput} from '../src/pipeline/media';

const script = 'A ciência começa com uma pergunta. A pesquisa ajuda a encontrar respostas.';
const auth = {authorization: 'Bearer studio-local-integration-token-only'};

test('HTTP gera WAV por TTS simulado, alinha fala real e entrega MP4/SRT privados', {timeout: 600_000}, async () => {
  const modelPath = process.env.STUDIO_WHISPER_MODEL;
  assert.ok(modelPath, 'Defina STUDIO_WHISPER_MODEL para o modelo Whisper small local.');
  const folder = await mkdtemp(join(tmpdir(), 'studio-production-integration-'));
  let calls = 0;
  const app = await buildServer({
    token: auth.authorization.slice('Bearer '.length), jobsRoot: join(folder, 'jobs'),
    automation: {
      geminiApiKey: 'test-key-only',
      alignment: {modelPath, python: process.env.STUDIO_ASR_PYTHON ?? 'python3'},
      googleFetch: async (url, options) => {
        calls++;
        assert.equal(new URL(String(url)).hostname, 'generativelanguage.googleapis.com');
        assert.equal(new Headers(options?.headers).get('x-goog-api-key'), 'test-key-only');
        assert.equal(JSON.parse(String(options?.body)).contents[0].parts[0].text, script);
        const pcm = await readFile(join(folder, 'speech.pcm'));
        return Response.json({candidates: [{finishReason: 'STOP', content: {parts: [
          {inlineData: {mimeType: 'audio/L16;rate=24000', data: pcm.toString('base64')}},
        ]}}]});
      },
    },
  });
  try {
    const speech = process.env.STUDIO_TEST_SPEECH_WAV ?? join(folder, 'speech.wav');
    if (!process.env.STUDIO_TEST_SPEECH_WAV) {
      await execute('espeak-ng', ['-v', 'pt-br', '-s', '148', '-w', speech, script], {timeout: 30_000});
    }
    await execute('ffmpeg', ['-v', 'error', '-i', speech, '-ac', '1', '-ar', '24000', '-f', 's16le', join(folder, 'speech.pcm')], {timeout: 30_000});
    const base = await app.listen({host: '127.0.0.1', port: 0});
    const create = await fetch(`${base}/v1/jobs`, {
      method: 'POST', headers: {...auth, 'content-type': 'application/json'},
      body: JSON.stringify({
        title: 'Teste sintético do estúdio', series: 'na-pratica', script, visualIdentity: 'medicina-democratica',
        audio: {path: 'narration.wav', source: 'google-tts', scriptApproved: true},
      }),
    });
    assert.equal(create.status, 202, await create.text());
    const url = `${base}${create.headers.get('location')}`;
    let job: JobStatus | undefined;
    const deadline = Date.now() + 480_000;
    while (Date.now() < deadline) {
      const result = await fetch(url, {headers: auth});
      assert.equal(result.status, 200);
      job = await result.json() as JobStatus;
      if (job.status === 'completed' || job.status === 'failed') break;
      await delay(500);
    }
    assert.equal(job?.status, 'completed', job?.error);
    assert.equal(calls, 1);

    for (const artifact of ['video', 'captions', 'narration']) {
      const denied = await fetch(`${url}/${artifact}`);
      assert.equal(denied.status, 401);
      await denied.body?.cancel();
    }
    const wav = await fetch(`${url}/narration`, {headers: auth});
    assert.equal(wav.status, 200);
    const wavBytes = Buffer.from(await wav.arrayBuffer());
    assert.deepEqual(wavBytes.subarray(44), await readFile(join(folder, 'speech.pcm')));
    const wavFile = join(folder, 'download.wav');
    await writeFile(wavFile, wavBytes);
    const duration = validateNarration(await probe(wavFile));

    const captions = await fetch(`${url}/captions`, {headers: auth});
    assert.equal(captions.status, 200);
    const srt = await captions.text();
    assert.match(srt, /A ciência começa com uma pergunta\./);
    assert.match(srt, /A pesquisa ajuda a encontrar respostas\./);
    assert.match(srt, /\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}/);

    const video = await fetch(`${url}/video`, {headers: auth});
    assert.equal(video.status, 200);
    assert.equal(video.headers.get('content-type'), 'video/mp4');
    assert.match(video.headers.get('content-disposition') ?? '', /attachment.*\.mp4/);
    assert.equal(video.headers.get('cache-control'), 'no-store');
    const output = join(folder, 'download.mp4');
    await writeFile(output, Buffer.from(await video.arrayBuffer()));
    const verified = await verifyOutput(output, duration, true);
    assert.equal(verified.decoded, true);
    console.log(`Fluxo HTTP verificado: H.264 ${verified.width}×${verified.height}/${verified.fps} FPS, AAC, ${verified.duration}s e SRT.`);
  } finally {
    await app.close();
    await rm(folder, {recursive: true, force: true});
  }
});
