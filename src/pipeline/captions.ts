import type {Caption,Episode} from '../shared/schema';
import {captionSchema} from '../shared/schema';
export function validateCaptions(captions:Caption[],duration:number){
 let last=0;
 for(const c of captions){
  if(c.start<last||c.end>duration+0.001)throw new Error('Legendas sobrepostas, fora de ordem ou fora da narração');
  let wordEnd=c.start;
  for(const w of c.words??[]){
   if(w.start<wordEnd||w.start<c.start||w.end>c.end+0.001)throw new Error('Palavras fora do intervalo ou sobrepostas');
   wordEnd=w.end;
  }
  if(c.words?.length&&normalize(c.words.map(w=>w.text).join(' '))!==normalize(c.text))throw new Error('Texto das palavras diverge da legenda');
  last=c.end;
 }
 if(!captions.length)throw new Error('Legendas sincronizadas são obrigatórias');
 return captions;
}
export function normalize(text:string){return text.normalize('NFC').replace(/\s+/g,' ').trim();}
export function prepareCaptions(episode:Episode,duration:number){
 if(!episode.captions)throw new Error('Forneça legendas aprovadas com timestamps ou importe JSON alinhado com npm run align. Não estimamos tempos por tamanho do texto.');
 const captions=validateCaptions(episode.captions,duration);
 // Correções editoriais de legendas são permitidas. O roteiro e o WAV permanecem intactos.
 return captions;
}
export function importWhisperX(raw:unknown):Caption[]{
 if(!raw||typeof raw!=='object'||!('segments' in raw)||!Array.isArray(raw.segments))throw new Error('JSON WhisperX inválido: segments ausente');
 const captions=raw.segments.map((s:unknown)=>{
  if(!s||typeof s!=='object')throw new Error('Segmento inválido');
  const segment=s as Record<string,unknown>;
  const words=Array.isArray(segment.words)?segment.words.map((w:Record<string,unknown>)=>({text:w.word,start:w.start,end:w.end})):undefined;
  return captionSchema.parse({text:segment.text,start:segment.start,end:segment.end,...(words?{words}:{})});
 });
 // Falha se o alinhador deixou palavras sem timestamp; nunca fabricar sincronização.
 validateCaptions(captions,179);
 return captions;
}
function stamp(seconds:number){const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;}
export function toSrt(captions:Caption[]){return captions.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');}
