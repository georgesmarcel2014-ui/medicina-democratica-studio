/** Static, dependency-free operator UI. Secrets stay only in page memory. */
export const studioHtml = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Medicina Democrática — Estúdio</title><style>
:root{font-family:system-ui,sans-serif;color:#e8f0ef;background:#0c191e;color-scheme:dark}*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0}main{max-width:960px;margin:auto;padding:40px 24px}header{border-bottom:1px solid #29414b;padding-bottom:24px;margin-bottom:28px}.brand{color:#4fe0bf;font-weight:800;letter-spacing:.1em;font-size:.82rem}h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;margin:12px 0}p{color:#b5c7cc;line-height:1.6}form,.result{background:#132830;border:1px solid #29414b;padding:24px;border-radius:16px}label{display:block;font-weight:650;margin:20px 0 8px}label:first-child{margin-top:0}input,select,textarea,button{font:inherit;border-radius:8px}input,select,textarea{width:100%;border:1px solid #46616b;padding:12px;background:#0c1d24;color:#fff}textarea{resize:vertical;min-height:140px}input[type=checkbox]{width:auto;margin-right:10px;accent-color:#4fe0bf}input:focus,textarea:focus,select:focus{outline:2px solid #4fe0bf;outline-offset:2px}.row{display:grid;grid-template-columns:1fr 1fr;gap:20px}.hint{font-size:.87rem;margin:7px 0 16px}button,.download{display:inline-block;background:#4fe0bf;color:#08231d;border:0;padding:14px 22px;font-weight:750;cursor:pointer;text-decoration:none;margin-top:18px}button:disabled{opacity:.5;cursor:wait}.result{margin-top:24px;border-color:#427d73}#status{white-space:pre-wrap;overflow-wrap:anywhere;color:#e8f0ef}.secondary{background:#29414b;color:#fff}.notice{border-left:3px solid #4fe0bf;padding-left:16px}.checkbox{font-weight:450;line-height:1.5}.footer{font-size:.85rem;margin-top:26px}@media(max-width:600px){.row{grid-template-columns:1fr}main{padding:24px 16px}form{padding:20px}}
</style><script src="/ui.js" defer></script></head><body><main>
<header><div class="brand">MEDICINA DEMOCRÁTICA</div><h1>Seu estúdio de produção</h1><p>Envie os insumos aprovados. O estúdio organiza as cenas, renderiza o vídeo vertical e entrega o MP4.</p></header>
<p class="notice">A narração deve ser o WAV definitivo do Google AI Studio, com até 179 segundos. Esta versão requer um arquivo JSON de legendas já alinhadas; ainda não recebe arquivos diretamente de uma conversa no ChatGPT.</p>
<form id="production-form">
<label for="token">Chave de acesso do estúdio</label><input id="token" name="token" type="password" required autocomplete="off" minlength="32" aria-describedby="token-hint"><p class="hint" id="token-hint">Fornecida pelo administrador. Usada apenas nesta página, sem armazenamento no navegador.</p>
<div class="row"><div><label for="title">Título do episódio</label><input id="title" name="title" required maxlength="140"></div><div><label for="series">Série</label><select id="series" name="series"><option value="noticias">Notícias</option><option value="historia">História</option><option value="na-pratica">Na Prática</option></select></div></div>
<label for="script">Roteiro aprovado</label><textarea id="script" name="script" required placeholder="Cole o roteiro final, exatamente como foi aprovado."></textarea>
<div class="row"><div><label for="audio">Narração definitiva (WAV)</label><input id="audio" name="audio" type="file" accept=".wav,audio/wav,audio/x-wav" required></div><div><label for="captions">Legendas alinhadas (JSON)</label><input id="captions" name="captions" type="file" accept=".json,application/json" required></div></div>
<p class="hint">Selecione o arquivo de legendas exportado pelo alinhamento, com início e fim de cada trecho. Não é necessário escrever JSON nesta interface. A correção das legendas preserva o WAV.</p>
<label class="checkbox"><input id="approved" name="approved" type="checkbox" required>Confirmo que este é o WAV definitivo aprovado, produzido no Google AI Studio, e que tenho autorização para usar os insumos enviados.</label>
<button id="produce" type="submit">Produzir vídeo</button>
</form>
<section class="result" aria-live="polite"><strong>Produção</strong><p id="status">Nenhum episódio enviado.</p><a id="download" class="download" hidden>Baixar MP4</a>
<details><summary>Retomar uma produção</summary><label for="job-id">Identificador da produção</label><input id="job-id" autocomplete="off" placeholder="ID recebido ao enviar o episódio"><button id="resume" class="secondary" type="button">Consultar produção</button></details></section>
<p class="footer">Os insumos ficam no armazenamento privado do servidor. O download exige a chave de acesso. A disponibilidade, o endereço HTTPS e a política de retenção são definidos pelo administrador.</p>
</main></body></html>`;

export const studioScript = `(() => {
'use strict';
const byId = (id) => document.getElementById(id);
const form = byId('production-form');
const status = byId('status');
const button = byId('produce');
const download = byId('download');
let timer;
let blobUrl;
let generation = 0;
const text = (message) => { status.textContent = message; };
const fail = (message) => { text(message); button.disabled = false; };
const accessToken = () => byId('token').value;
const errors = {UNAUTHORIZED:'Chave de acesso inválida.',QUEUE_FULL:'A fila está cheia. Tente novamente em alguns minutos.',UPLOAD_TOO_LARGE:'Os insumos excedem o limite de upload.',INVALID_EPISODE:'O episódio ou as legendas não têm o formato esperado.',MISSING_INPUT:'Falta o roteiro ou o WAV.',JOB_NOT_FOUND:'Produção não encontrada.',INVALID_REQUEST:'Os insumos não puderam ser recebidos.',INVALID_UPLOAD:'Formato de arquivo inválido.'};
async function api(path, options = {}) {
  const response = await fetch(path, {...options, headers: {...options.headers, Authorization:'Bearer ' + accessToken()}, cache:'no-store'});
  if (!response.ok) {
    let data; try { data = await response.json(); } catch {}
    throw new Error(errors[data?.error] || 'O servidor não concluiu a solicitação. Consulte o administrador.');
  }
  return response;
}
function reset() {
  generation++; clearTimeout(timer); download.hidden = true;
  if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = undefined; }
  return generation;
}
async function poll(id, run) {
  if (run !== generation) return;
  try {
    const job = await (await api('/v1/jobs/' + encodeURIComponent(id))).json();
    if (run !== generation) return;
    const labels = {pending:'Na fila',rendering:'Renderizando',completed:'Concluído',failed:'Falhou'};
    text('Produção ' + id + '\\n' + labels[job.status]);
    if (job.status === 'completed') {
      text('Produção ' + id + '\\nPreparando o download...');
      const blob = await (await api('/v1/jobs/' + encodeURIComponent(id) + '/video')).blob();
      if (run !== generation) return;
      blobUrl = URL.createObjectURL(blob); download.href = blobUrl; download.download = 'medicina-democratica-' + id + '.mp4'; download.hidden = false;
      text('Vídeo concluído. Seu MP4 está disponível para download.');button.disabled = false;
    } else if (job.status === 'failed') {
      fail('A renderização falhou. Verifique se o WAV tem até 179 segundos e se as legendas correspondem à sua duração. Encaminhe o ID ' + id + ' ao administrador para diagnóstico.');
    } else timer = setTimeout(() => { void poll(id,run); },1500);
  } catch (error) { fail(error.message); }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault(); if (!form.reportValidity()) return;
  const run = reset(); button.disabled = true; text('Validando os arquivos...');
  try {
    const audio = byId('audio').files[0]; const file = byId('captions').files[0];
    if (!audio || !file) throw new Error('Selecione o WAV e o arquivo de legendas.');
    if (!/\\.wav$/i.test(audio.name)) throw new Error('A narração precisa ser um arquivo WAV.');
    if (file.size > 256 * 1024) throw new Error('O arquivo de legendas excede 256 KiB.');
    if (audio.size > 256 * 1024 * 1024) throw new Error('O WAV excede o limite de 256 MiB.');
    let captions;try {captions=JSON.parse(await file.text());} catch {throw new Error('O arquivo de legendas não contém JSON válido.');}
    if (!Array.isArray(captions) || captions.length === 0) throw new Error('O arquivo de legendas deve conter os trechos alinhados exportados pelo estúdio.');
    const episode = {title:byId('title').value.trim(),series:byId('series').value,script:byId('script').value.trim(),visualIdentity:'medicina-democratica',audio:{path:'narration.wav',source:'google-ai-studio',approved:true},captions,scenes:[],assets:[]};
    const payload=new FormData();payload.append('episode',new Blob([JSON.stringify(episode)],{type:'application/json'}),'episode.json');payload.append('narration',audio,'narration.wav');
    text('Enviando os insumos privados...');
    const job = await (await api('/v1/jobs',{method:'POST',body:payload})).json();
    byId('job-id').value = job.id; await poll(job.id,run);
  } catch(error) {fail(error.message);}
});
byId('resume').addEventListener('click',() => {
  const id=byId('job-id').value.trim();
  if (!/^[0-9a-f-]{36}$/.test(id)) return fail('Informe um identificador de produção válido.');
  if (!accessToken()) return fail('Informe a chave de acesso do estúdio.');
  const run=reset();button.disabled=true;void poll(id,run);
});
window.addEventListener('pagehide',()=>{clearTimeout(timer);if(blobUrl) URL.revokeObjectURL(blobUrl);});
})();`;
