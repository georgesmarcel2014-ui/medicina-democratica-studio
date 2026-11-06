import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {episodeSchema,FPS,type Episode,type EpisodeProps} from '../shared/schema';
import {localFile,probe,validateNarration} from './media';
import {prepareCaptions} from './captions';
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
export async function prepareEpisode(inputPath:string){
 const episode=episodeSchema.parse(JSON.parse(await readFile(inputPath,'utf8'))),base=path.dirname(path.resolve(inputPath));
 const audioFile=await localFile(base,episode.audio.path);
 const duration=validateNarration(await probe(audioFile));
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
