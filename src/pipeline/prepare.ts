import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {episodeSchema,FPS,type Episode,type EpisodeProps} from '../shared/schema';
import {localFile,NarrationTooLongError,probe,validateNarration} from './media';
import {prepareCaptions} from './captions';
import {generateGoogleTtsFile, GoogleTtsHttpError} from './google-tts';
import {transcribeCaptions, TranscriptMismatchError, type AlignmentOptions} from './transcribe';

export type ProductionOptions = {geminiApiKey?: string; googleFetch?: typeof fetch; alignment?: AlignmentOptions};
export type ProductionErrorCode = 'TTS_FAILED' | 'TTS_ACCESS_DENIED' | 'TTS_RATE_LIMITED' |
 'NARRATION_TOO_LONG' | 'INVALID_NARRATION' | 'CAPTIONS_FAILED' | 'CAPTIONS_MISMATCH';
export class ProductionError extends Error {
 constructor(readonly code: ProductionErrorCode) { super(code); }
}

async function generateNarration(episode: Episode, base: string, automation: ProductionOptions) {
 try {
  return await generateGoogleTtsFile({script:episode.script,apiKey:automation.geminiApiKey??'',fetchImpl:automation.googleFetch},
   path.join(base,episode.audio.path));
 } catch (error) {
  if (error instanceof NarrationTooLongError) throw new ProductionError('NARRATION_TOO_LONG');
  if (error instanceof GoogleTtsHttpError) {
   if (error.status===401 || error.status===403) throw new ProductionError('TTS_ACCESS_DENIED');
   if (error.status===429) throw new ProductionError('TTS_RATE_LIMITED');
  }
  throw new ProductionError('TTS_FAILED');
 }
}

export function prepareScenes(episode:Episode,duration:number){
 const visual=episode.series==='na-pratica'?'clinic' as const:episode.series==='historia'?'timeline' as const:'headline' as const;
 // Mudanças de cena seguem limites já aprovados das legendas, sem modificar a narração.
 const starts=[0];
 for(const caption of episode.captions??[]){if(caption.start-starts[starts.length-1]>=8&&duration-caption.start>=2)starts.push(caption.start);}
 const automatic:Episode['scenes']=starts.map((start,i)=>({id:`auto-${i+1}`,start,end:starts[i+1]??duration,title:i===0?episode.title:(episode.captions?.find(c=>c.start>=start)?.text??episode.title),visual}));
 const scenes=episode.scenes.length?episode.scenes:automatic;
 let last=0; const ids=new Set<string>();
 for(const s of scenes){
  if(ids.has(s.id))throw new Error('IDs de cenas duplicados');ids.add(s.id);
  if(Math.abs(s.start-last)>0.001||s.end>duration+0.001)throw new Error('Cenas devem cobrir a narração em sequência, sem lacunas ou sobreposição');
  if(s.assetId&&!episode.assets.some(a=>a.id===s.assetId))throw new Error('Recurso da cena não registrado');
  if(s.data&&s.labels&&s.data.length!==s.labels.length)throw new Error('Gráfico com rótulos incompatíveis');
  last=s.end;
 }
 if(Math.abs(last-duration)>0.001)throw new Error('Cenas não cobrem toda a narração');
 return scenes;
}
export async function prepareEpisode(inputPath:string,automation?:ProductionOptions){
 const episode=episodeSchema.parse(JSON.parse(await readFile(inputPath,'utf8'))),base=path.dirname(path.resolve(inputPath));
 const generated=automation && episode.audio.source==='google-tts' ? await generateNarration(episode,base,automation) : undefined;
 let audioFile:string, duration:number;
 try {
  audioFile=await localFile(base,episode.audio.path);
  duration=generated?.duration ?? validateNarration(await probe(audioFile));
 } catch (error) {
  if (!automation) throw error;
  throw new ProductionError(error instanceof NarrationTooLongError?'NARRATION_TOO_LONG':'INVALID_NARRATION');
 }
 if(automation?.alignment && !episode.captions){
  try {
   episode.captions=await transcribeCaptions(audioFile,episode.script,duration,automation.alignment);
  } catch (error) {
   throw new ProductionError(error instanceof TranscriptMismatchError?'CAPTIONS_MISMATCH':'CAPTIONS_FAILED');
  }
 }
 const captions=prepareCaptions(episode,duration),scenes=prepareScenes(episode,duration);
 const assetFiles:Record<string,string>=Object.create(null);
 for(const asset of episode.assets){
  if(assetFiles[asset.id])throw new Error('IDs de recursos duplicados');
  const file=await localFile(base,asset.path);
  // SVG/HTML podem carregar rede ou código. Aceitar apenas mídia raster e vídeo local.
  const extensions=asset.type==='image'?['.png','.jpg','.jpeg','.webp']:['.mp4','.webm','.mov'];
  if(!extensions.includes(path.extname(file).toLowerCase()))throw new Error('Formato de recurso não permitido');
  assetFiles[asset.id]=file;
 }
 const {audio:_,captions:__,...visualEpisode}=episode;
 const props:EpisodeProps={episode:{...visualEpisode,scenes},captions,durationInFrames:Math.ceil(duration*FPS),assetSources:{}};
 return {episode,props,duration,audioFile,assetFiles};
}
