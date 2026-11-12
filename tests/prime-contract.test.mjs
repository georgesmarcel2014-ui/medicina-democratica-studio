import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

test('invariantes técnicos legados permanecem explícitos', () => {
  const schema = read('src/shared/schema.ts');
  assert.match(schema, /export const FPS\s*=\s*30\s*;/);
  assert.match(schema, /export const MAX_DURATION\s*=\s*179\s*;/);
  assert.match(schema, /z\.literal\('google-ai-studio'\)/);
  assert.match(schema, /approved:z\.literal\(true\)/);
  assert.match(schema, /visualIdentity:z\.literal\('medicina-democratica'\)/);
});

test('AGENTS aponta para fontes canônicas e proíbe postagem automática', () => {
  const agents = read('AGENTS.md');
  for (const file of ['docs/prime-enxuto.md', 'docs/mobile.md', 'docs/quality.md', 'docs/episode-handoff.template.md', 'docs/harness-evaluation.md', 'docs/security.md']) {
    assert.ok(agents.includes(file), 'Referência obrigatória ausente: ' + file);
  }
  assert.match(agents, /Não publique, agende ou envie posts/);
  assert.match(agents, /WAV definitivo/);
});

test('fluxo oficial usa WAV aprovado pelo operador sem gerar TTS automaticamente', () => {
  const prime = read('docs/prime-enxuto.md');
  const mobile = read('docs/mobile.md');
  const readme = read('README.md');
  assert.match(prime, /o operador gera o TTS/);
  assert.match(prime, /WAV Charon definitivo que eu anexei/);
  assert.match(mobile, /WAV Charon/);
  assert.match(readme, /WAV Charon/);
  const workOrder = prime.split('## Ordem copiável para o Work')[1];
  assert.ok(workOrder, 'Ordem copiável ausente');
  assert.match(workOrder, /não gere novo TTS/i);
  assert.match(workOrder, /Não publique nem agende nada/);
});

test('qualidade distingue verificação técnica de aprovação editorial', () => {
  const quality = read('docs/quality.md');
  assert.match(quality, /Gate A/);
  assert.match(quality, /Gate B/);
  assert.match(quality, /Gate C/);
  assert.match(quality, /não.*implica.*aprovação clínica/i);
  assert.match(quality, /MP4/);
});

test('handoff não exige armazenamento público de conteúdo privado', () => {
  const handoff = read('docs/episode-handoff.template.md');
  assert.match(handoff, /fora do repositório público/);
  assert.match(handoff, /WAV Charon definitivo recebido/);
  assert.match(handoff, /Próxima ação menor e segura/);
  assert.match(handoff, /Ao retomar/);
});
