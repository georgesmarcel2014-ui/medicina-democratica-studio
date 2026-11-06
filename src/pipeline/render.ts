import {bundle} from '@remotion/bundler';
import {renderMedia,selectComposition} from '@remotion/renderer';
import {copyFile,mkdir,mkdtemp,rm,rename,writeFile,access,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {type EpisodeProps,FPS} from '../shared/schema';
import {prepareEpisode} from './prepare';
import {verifyOutput,execute} from './media';
import {toSrt} from './captions';
async function browser(){
 if(process.env.CHROME_PATH){await access(process.env.CHROME_PATH);return process.env.CHROME_PATH;}
 for(const p of ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome']){try{await access(p);return p;}catch{}}
 throw new Error('Chromium/Chrome não encontrado. Instale o navegador e configure CHROME_PATH.');
}
async function render(props:EpisodeProps,outputPath:string,media?:{audioFile:string;assetFiles:Record<string,string>}){
 const target=path.resolve(outputPath);if(!target.endsWith('.mp4'))throw new Error('A saída deve ter extensão .mp4');
 await mkdir(path.dirname(target),{recursive:true,mode:0o700});
 const work=await mkdtemp(path.join(tmpdir(),'md-render-'));
 const temporary=path.join(work,'final.mp4');
 try{
  const publicDir=path.join(work,'public');await mkdir(publicDir);
  const sources:Record<string,string>=Object.create(null);
  if(media){
   await copyFile(media.audioFile,path.join(publicDir,'narration.wav'));
   for(const [id,file]of Object.entries(media.assetFiles)){
    const name=`asset-${id}${path.extname(file).toLowerCase()}`;await copyFile(file,path.join(publicDir,name));sources[id]=name;
   }
  }
  const inputProps={...props,assetSources:sources,...(media?{audioSrc:'narration.wav'}:{})};
  const serveUrl=await bundle({entryPoint:fileURLToPath(new URL('../video/index.ts',import.meta.url)),publicDir,outDir:path.join(work,'bundle')});
  const browserExecutable=await browser();
  const composition=await selectComposition({serveUrl,id:'MedicinaDemocratica',inputProps,browserExecutable});
  await renderMedia({composition,serveUrl,inputProps,codec:'h264',audioCodec:'aac',outputLocation:path.join(work,'video.mp4'),muted:true,browserExecutable,concurrency:2,crf:18,pixelFormat:'yuv420p',overwrite:true,chromiumOptions:{gl:'swangle'},onProgress:({progress})=>{if(progress===1)console.log('Renderização concluída.');}});
  if(media){
   await execute('ffmpeg',['-v','error','-i',path.join(work,'video.mp4'),'-i',media.audioFile,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',temporary],{timeout:180000,maxBuffer:2*1024*1024});
  }else{await copyFile(path.join(work,'video.mp4'),temporary);}
  const verification=await verifyOutput(temporary,props.durationInFrames/FPS,Boolean(media));
  // Copiar para o mesmo filesystem antes de publicar por rename atômico.
  const staging=`${target}.${process.pid}.tmp`;
  await copyFile(temporary,staging);await chmod(staging,0o600);await rename(staging,target);
  const report={version:1,mode:media?'production':'silent-demo',verifiedAt:new Date().toISOString(),...verification,scenes:props.episode.scenes.length,captions:props.captions.length,narration:media?'WAV aprovado, sem corte ou alteração temporal':'ausente — demonstração visual silenciosa',...(media?{sourceAudioSha256:createHash('sha256').update(await readFile(media.audioFile)).digest('hex')}:{})};
  await writeFile(`${target}.report.json`,JSON.stringify(report,null,2),{mode:0o600});
  if(props.captions.length){await writeFile(`${target}.srt`,toSrt(props.captions),{mode:0o600});await writeFile(`${target}.captions.json`,JSON.stringify(props.captions,null,2),{mode:0o600});}
  return report;
 }finally{await rm(work,{recursive:true,force:true});}
}
export async function renderEpisode(inputPath:string,outputPath:string){
 const prepared=await prepareEpisode(inputPath);
 return render(prepared.props,outputPath,{audioFile:prepared.audioFile,assetFiles:prepared.assetFiles});
}
export async function renderDemo(outputPath:string){
 const props:EpisodeProps={episode:{title:'Ciência que se move',series:'noticias',visualIdentity:'medicina-democratica',script:'Demonstração visual silenciosa. Sem narração de produção.',instructions:'Gráficos e geometria originais; números apenas ilustrativos.',assets:[],scenes:[
  {id:'noticia',start:0,end:3,title:'Informação ganha contexto',body:'NOTÍCIAS • Dados ilustrativos',visual:'chart',data:[35,58,82],labels:['Evidência','Contexto','Clareza']},
  {id:'historia',start:3,end:6,title:'Toda descoberta tem história',body:'HISTÓRIA • Linha do tempo demonstrativa',visual:'timeline',labels:['Perguntar','Investigar','Compreender']},
  {id:'pratica',start:6,end:10,title:'Conhecimento em movimento',body:'NA PRÁTICA • Animação 3D esquemática',visual:'clinic'}
 ]},captions:[],durationInFrames:300,assetSources:{}};
 return render(props,outputPath);
}
