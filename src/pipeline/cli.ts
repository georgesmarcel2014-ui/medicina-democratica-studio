import {parseArgs} from 'node:util';
import {access,readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {episodeSchema} from '../shared/schema';
import {renderDemo,renderEpisode} from './render';
import {prepareEpisode} from './prepare';
import {importWhisperX,toSrt} from './captions';

async function produce(input:string,output:string,freeTier:boolean){
 const keyFile=process.env.GEMINI_API_KEY_FILE;
 const key=process.env.GEMINI_API_KEY;
 delete process.env.GEMINI_API_KEY;
 delete process.env.GEMINI_API_KEY_FILE;

 if(path.extname(output)!=='.mp4')throw new Error('A saída deve ter extensão .mp4.');
 const episode=episodeSchema.parse(JSON.parse(await readFile(input,'utf8')));
 const modelPath=process.env.STUDIO_WHISPER_MODEL;
 if(!episode.captions){
  if(!modelPath)throw new Error('Configure STUDIO_WHISPER_MODEL com o modelo de alinhamento local.');
  await access(path.join(modelPath,'model.bin'));
 }
 let geminiApiKey:string|undefined;
 if(episode.audio.source==='google-tts'){
  if(!freeTier)throw new Error('Confirme um projeto Gemini Free Tier com faturamento desativado usando --free-tier.');
  geminiApiKey=(keyFile?await readFile(keyFile,'utf8'):key)?.trim();
  if(!geminiApiKey)throw new Error('GEMINI_API_KEY ausente no ambiente seguro.');
 }
 const alignment=modelPath?{modelPath,python:process.env.STUDIO_ASR_PYTHON??'python3'}:undefined;
 console.log(JSON.stringify(await renderEpisode(input,output,{alignment,geminiApiKey}),null,2));
}

async function main(){
 const command=process.argv[2];
 const {values}=parseArgs({args:process.argv.slice(3),options:{input:{type:'string'},output:{type:'string'},'free-tier':{type:'boolean'}}});
 if(command==='demo'){console.log(JSON.stringify(await renderDemo(values.output??'outputs/demo.mp4'),null,2));return;}
 if(!values.input)throw new Error('Use --input caminho/do/episode.json (ou JSON WhisperX para align)');
 if(command==='validate'){const p=await prepareEpisode(values.input);console.log(JSON.stringify({valid:true,duration:p.duration,scenes:p.props.episode.scenes.length,captions:p.props.captions.length},null,2));return;}
 if(command==='render'||command==='produce'){
  if(!values.output)throw new Error('Use --output caminho/privado/final.mp4');
  if(command==='produce'){await produce(values.input,values.output,values['free-tier']??false);return;}
  console.log(JSON.stringify(await renderEpisode(values.input,values.output),null,2));return;
 }
 if(command==='align'){
  if(!values.output)throw new Error('Use --output caminho/captions.json');
  const captions=importWhisperX(JSON.parse(await readFile(values.input,'utf8')));
  await mkdir(path.dirname(path.resolve(values.output)),{recursive:true,mode:0o700});
  await writeFile(values.output,JSON.stringify(captions,null,2),{mode:0o600});await writeFile(`${values.output}.srt`,toSrt(captions),{mode:0o600});
  console.log('Alinhamento WhisperX importado; revise as legendas antes de renderizar.');return;
 }
 throw new Error('Comandos: demo, validate, render, produce, align');
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
