import assert from 'node:assert/strict';
import {test} from 'node:test';
import {generateGoogleTts, DEFAULT_TTS_MODEL, CHARON_AUDIO_PROFILE, CHARON_DIRECTION} from '../src/pipeline/google-tts';

const oneSecond = Buffer.alloc(24_000 * 2);
function responseFor(pcm: Buffer, mimeType = 'audio/L16;rate=24000') {
  return new Response(JSON.stringify({
    candidates: [{content: {parts: [{inlineData: {mimeType, data: pcm.toString('base64')}}]}}]
  }), {status: 200, headers: {'content-type': 'application/json'}});
}

test('Google AI Studio TTS converte PCM 24 kHz para WAV sem cortar ou acelerar', async () => {
  let called = false;
  const wav = await generateGoogleTts({
    script: 'A ciência transforma vidas.',
    apiKey: 'segredo-de-teste-nao-real',
    fetchImpl: async (url, init) => {
      called = true;
      assert.match(String(url), /gemini-2\.5-flash-preview-tts:generateContent/);
      assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'segredo-de-teste-nao-real');
      const payload = JSON.parse(String(init?.body));
      const prompt = payload.contents[0].parts[0].text;
      assert.ok(prompt.includes(CHARON_AUDIO_PROFILE));
      assert.ok(prompt.includes(CHARON_DIRECTION));
      assert.equal(prompt.split('# Transcript\n')[1], 'A ciência transforma vidas.');
      assert.equal(payload.generationConfig.speechConfig.languageCode, 'pt-BR');
      assert.equal(payload.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon');
      return responseFor(oneSecond);
    }
  });
  assert.equal(called, true);
  assert.equal(DEFAULT_TTS_MODEL, 'gemini-2.5-flash-preview-tts');
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt32LE(24), 24_000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.length, 44 + oneSecond.length);
  assert.deepEqual(wav.subarray(44), oneSecond);
});

test('Google AI Studio TTS preserva WAV já encapsulado', async () => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.write('WAVE', 8);
  const source = Buffer.concat([header, oneSecond]);
  const output = await generateGoogleTts({
    script: 'Teste.',
    apiKey: 'teste',
    fetchImpl: async () => responseFor(source, 'audio/wav')
  });
  assert.deepEqual(output, source);
});

test('Gemini 3.8 TTS mantém roteiro literal e direção em speech_metadata.style', async () => {
  const script = 'A água da Broad Street.';
  for (const model of ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts']) {
    await generateGoogleTts({
      model, script, apiKey: 'teste',
      fetchImpl: async (url, init) => {
        assert.ok(String(url).endsWith(`/${model}:generateContent`));
        const payload = JSON.parse(String(init?.body));
        assert.deepEqual(payload.contents, [{role: 'user', parts: [{
          text: script, speech_metadata: {style: `${CHARON_AUDIO_PROFILE} ${CHARON_DIRECTION}`}
        }]}]);
        assert.deepEqual(payload.generationConfig.speechConfig, {
          voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Charon'}}, languageCode: 'pt-BR'
        });
        return responseFor(oneSecond);
      }
    });
  }
});

test('TTS rejeita roteiro vazio, credencial ausente, modelo suspeito e outra voz', async () => {
  await assert.rejects(generateGoogleTts({script: '  ', apiKey: 'x'}), /Roteiro TTS vazio/);
  await assert.rejects(generateGoogleTts({script: 'Teste', apiKey: ''}), /GEMINI_API_KEY/);
  await assert.rejects(generateGoogleTts({script: 'Teste', apiKey: 'x', model: '../outro'}), /Modelo Google TTS inválido/);
  await assert.rejects(generateGoogleTts({script: 'Teste', apiKey: 'x', voice: 'Zephyr'}), /voz de produção deve ser Charon/);
});

test('TTS rejeita áudio sem payload e limita duração de 179 segundos', async () => {
  await assert.rejects(generateGoogleTts({
    script: 'Teste', apiKey: 'x',
    fetchImpl: async () => new Response(JSON.stringify({candidates: [{content: {parts: []}}]}), {status: 200})
  }), /não retornou áudio/);
  const oversizedPcm = Buffer.alloc(180 * 24_000 * 2);
  await assert.rejects(generateGoogleTts({
    script: 'Teste', apiKey: 'x',
    fetchImpl: async () => responseFor(oversizedPcm)
  }), /excede 179 segundos/);
});

test('TTS não expõe corpo de erro ou roteiro em falha HTTP', async () => {
  const script = 'Texto confidencial de produção';
  await assert.rejects(generateGoogleTts({
    script, apiKey: 'x',
    fetchImpl: async () => new Response('Erro externo: ' + script, {status: 429})
  }), error => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /HTTP 429/);
    assert.ok(!error.message.includes(script));
    return true;
  });
});
