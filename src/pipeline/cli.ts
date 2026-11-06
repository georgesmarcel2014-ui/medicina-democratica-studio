import {parseArgs} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {renderDemo,renderEpisode} from './render';
import {prepareEpisode} from './prepare';
import {importWhisperX,toSrt} from './captions';
async function main(){
 const command=process.argv[2];
 const {values}=parseArgs({args:process.argv.slice(3),options:{input:{type:'string'},output:{type:'string'}}});
 if(command==='demo'){console.log(JSON.stringify(await renderDemo(values.output??'outputs/demo.mp4'),null,2));return;}
 if(!values.input)throw new Error('Use --input caminho/do/episode.json (ou JSON WhisperX para align)');
 if(command==='validate'){const p=await prepareEpisode(values.input);console.log(JSON.stringify({valid:true,duration:p.duration,scenes:p.props.episode.scenes.length,captions:p.props.captions.length},null,2));return;}
 if(command==='render'){
  if(!values.output)throw new Error('Use --output caminho/privado/final.mp4');
  console.log(JSON.stringify(await renderEpisode(values.input,values.output),null,2));return;
 }
 if(command==='align'){
  if(!values.output)throw new Error('Use --output caminho/captions.json');
  const captions=importWhisperX(JSON.parse(await readFile(values.input,'utf8')));
  await mkdir(path.dirname(path.resolve(values.output)),{recursive:true,mode:0o700});
  await writeFile(values.output,JSON.stringify(captions,null,2),{mode:0o600});await writeFile(`${values.output}.srt`,toSrt(captions),{mode:0o600});
  console.log('Alinhamento WhisperX importado; revise as legendas antes de renderizar.');return;
 }
 throw new Error('Comandos: demo, validate, render, align');
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
