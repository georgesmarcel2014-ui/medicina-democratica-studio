import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {MAX_DURATION,FPS} from '../shared/schema';
export const execute=promisify(execFile);
export type Probe={format:{duration:string;format_name:string};streams:Array<{codec_type:string;codec_name:string;width?:number;height?:number;r_frame_rate?:string;duration?:string;sample_rate?:string;channels?:number}>};
export async function probe(file:string):Promise<Probe>{
 const {stdout}=await execute('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{timeout:30000,maxBuffer:2*1024*1024});
 return JSON.parse(stdout);
}
export async function localFile(base:string,relative:string){
 if(path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..')||relative.includes('://')||relative.includes('\0')) throw new Error('Recurso deve usar caminho relativo dentro da pasta do episódio');
 const root=await realpath(base), target=await realpath(path.resolve(root,relative));
 if(!target.startsWith(root+path.sep)||!(await stat(target)).isFile())throw new Error('Recurso fora da pasta do episódio ou não é arquivo');
 return target;
}
export function validateNarration(info:Probe){
 const duration=Number(info.format.duration);
 const audio=info.streams.filter(s=>s.codec_type==='audio');
 if(info.format.format_name!=='wav'||audio.length!==1||info.streams.some(s=>s.codec_type==='video'))throw new Error('Narração deve ser WAV com uma única faixa de áudio');
 if(!Number.isFinite(duration)||duration<=0)throw new Error('Duração do WAV inválida');
 if(duration>MAX_DURATION)throw new Error('Narração excede 179 segundos. Forneça um novo WAV aprovado; o áudio não será cortado ou acelerado.');
 return duration;
}
export async function verifyOutput(file:string,expectedSeconds:number,hasAudio:boolean){
 const info=await probe(file), video=info.streams.find(s=>s.codec_type==='video');
 const duration=Number(info.format.duration);
 if(!video||video.codec_name!=='h264'||video.width!==1080||video.height!==1920||video.r_frame_rate!=='30/1')throw new Error('Saída fora do padrão H.264 1080×1920 30 FPS');
 if(!Number.isFinite(duration)||duration>MAX_DURATION||Math.abs(duration-expectedSeconds)>1/FPS+0.025)throw new Error('Duração final incompatível com o episódio');
 const audio=info.streams.find(s=>s.codec_type==='audio');
 if(hasAudio&&(!audio||audio.codec_name!=='aac'||!Number.isFinite(Number(audio.duration))||Math.abs(Number(audio.duration)-expectedSeconds)>0.1))throw new Error('Faixa de áudio final ausente ou com duração incompatível');
 await execute('ffmpeg',['-v','error','-xerror','-i',file,'-f','null','-'],{timeout:180000,maxBuffer:2*1024*1024});
 return {duration,width:video.width,height:video.height,fps:30,videoCodec:video.codec_name,audioCodec:audio?.codec_name??null,decoded:true};
}
