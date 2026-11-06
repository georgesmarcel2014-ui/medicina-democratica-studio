/** Teste opt-in: exige Chromium, FFmpeg e permissão para servidor local do Remotion.
 * Silêncio de fixture é usado apenas para validar transporte, nunca como narração demonstrativa.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile,stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {renderEpisode} from '../src/pipeline/render';
import {execute,probe,verifyOutput} from '../src/pipeline/media';

const sha256=(data:Uint8Array)=>createHash('sha256').update(data).digest('hex');

test('render real importa PNG/vídeo, sincroniza legendas e preserva WAV integral de fixture', {timeout:240000}, async()=>{
 const folder=await mkdtemp(path.join(os.tmpdir(),'md-render-integration-'));
 try{
  const wav=path.join(folder,'narration.wav');
  await execute('ffmpeg',['-v','error','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','1','-c:a','pcm_s16le',wav],{timeout:30000});
  await execute('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x30d6bc:s=320x480','-frames:v','1','-threads','1',path.join(folder,'image.png')],{timeout:30000});
  await execute('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=s=320x480:r=30','-t','1','-c:v','libx264','-pix_fmt','yuv420p','-threads','1',path.join(folder,'clip.mp4')],{timeout:30000});
  const original=await readFile(wav);
  const captions=[{text:'Teste técnico.',start:0,end:1,words:[{text:'Teste',start:0,end:0.5},{text:'técnico.',start:0.5,end:1}]}];
  const input=path.join(folder,'episode.json');
  const output=path.join(folder,'result.mp4');
  await writeFile(input,JSON.stringify({
   title:'Teste técnico de integração',series:'noticias',script:'Fixture técnica de áudio silencioso. Não é narração.',visualIdentity:'medicina-democratica',
   audio:{path:'narration.wav',source:'google-ai-studio',approved:true},captions,
   scenes:[{id:'raster',start:0,end:0.5,title:'Imagem raster local',visual:'headline',assetId:'raster'},{id:'video',start:0.5,end:1,title:'Vídeo local',visual:'headline',assetId:'video'}],
   assets:[{id:'raster',path:'image.png',type:'image',origin:'Fixture original gerada por FFmpeg',license:'CC0-1.0',redistributionAllowed:true},{id:'video',path:'clip.mp4',type:'video',origin:'Fixture original gerada por FFmpeg',license:'CC0-1.0',redistributionAllowed:true}]
  }));
  const report=await renderEpisode(input,output);
  assert.equal(report.mode,'production');
  assert.equal(report.sourceAudioSha256,sha256(original));
  assert.equal(sha256(await readFile(wav)),sha256(original));
  assert.ok((await stat(output)).size>1000);
  assert.equal((await stat(output)).mode&0o777,0o600);
  const info=await probe(output);
  const video=info.streams.find(s=>s.codec_type==='video');
  const audio=info.streams.find(s=>s.codec_type==='audio');
  assert.equal(video?.width,1080);assert.equal(video?.height,1920);
  assert.equal(video?.codec_name,'h264');assert.equal(video?.r_frame_rate,'30/1');
  assert.equal(audio?.codec_name,'aac');
  assert.ok(Math.abs(Number(info.format.duration)-1)<0.034);
  assert.ok(Math.abs(Number(audio?.duration)-1)<0.034);
  assert.equal((await verifyOutput(output,1,true)).decoded,true);
  const {stderr}=await execute('ffmpeg',['-hide_banner','-i',output,'-map','0:a:0','-af','volumedetect','-f','null','-'],{timeout:30000});
  const measured=stderr.match(/max_volume:\s*(-?[\d.]+) dB/);
  assert.ok(measured,'A faixa AAC deve ser efetivamente decodificada e medida');
  assert.ok(Number(measured[1])<=-90,'Fixture silenciosa não pode ganhar áudio espúrio na montagem');
  assert.deepEqual(JSON.parse(await readFile(`${output}.captions.json`,'utf8')),captions);
  assert.match(await readFile(`${output}.srt`,'utf8'),/00:00:00,000 --> 00:00:01,000/);
  const savedReport=JSON.parse(await readFile(`${output}.report.json`,'utf8'));
  assert.equal(savedReport.sourceAudioSha256,sha256(original));
  console.log('Integração real: 30 frames, H.264 1080×1920/30 FPS, AAC 1s, PCM original preservado, PNG/vídeo e legendas por palavra.');
 }finally{await rm(folder,{recursive:true,force:true});}
});
