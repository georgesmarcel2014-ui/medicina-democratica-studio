import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,mkdir,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execute,localFile,probe,validateNarration,type Probe} from '../src/pipeline/media';
import {prepareEpisode} from '../src/pipeline/prepare';

function wavInfo(duration:string):Probe{return {format:{duration,format_name:'wav'},streams:[{codec_type:'audio',codec_name:'pcm_s16le',sample_rate:'48000',channels:1}]};}

test('limite de WAV aceita exatamente 179 segundos e recusa excedente',()=>{
 assert.equal(validateNarration(wavInfo('179')),179);
 assert.equal(validateNarration(wavInfo('178.999')),178.999);
 assert.throws(()=>validateNarration(wavInfo('179.0001')),/novo WAV aprovado/);
});

test('rejeita formatos, canais de mídia e durações inválidos',()=>{
 assert.throws(()=>validateNarration({...wavInfo('2'),format:{duration:'2',format_name:'mp3'}}),/WAV/);
 assert.throws(()=>validateNarration({...wavInfo('2'),streams:[]}),/única faixa/);
 assert.throws(()=>validateNarration({...wavInfo('2'),streams:[...wavInfo('2').streams,{codec_type:'video',codec_name:'h264'}]}),/WAV/);
 assert.throws(()=>validateNarration({...wavInfo('2'),streams:[...wavInfo('2').streams,...wavInfo('2').streams]}),/única faixa/);
 for(const invalid of ['0','-1','NaN','Infinity',''])assert.throws(()=>validateNarration(wavInfo(invalid)),/Duração/);
});

test('caminhos privados bloqueiam traversal, URL, arquivo externo e symlink de escape',async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'md-paths-'));
 try{
  const base=path.join(temp,'episode');await mkdir(base);
  await writeFile(path.join(base,'narration.wav'),'fixture');
  await writeFile(path.join(temp,'outside.wav'),'external');
  await symlink(path.join(temp,'outside.wav'),path.join(base,'escape.wav'));
  assert.equal(await localFile(base,'narration.wav'),path.join(base,'narration.wav'));
  for(const invalid of ['../outside.wav','..\\outside.wav','https://example.com/audio.wav',path.join(temp,'outside.wav'),'escape.wav','.']){
   await assert.rejects(localFile(base,invalid));
  }
 }finally{await rm(temp,{recursive:true,force:true});}
});

test('FFmpeg e FFprobe processam WAV PCM de fixture sem modificar o áudio original',async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'md-prepare-'));
 try{
  const audio=path.join(temp,'narration.wav');
  // Silêncio sintético usado exclusivamente para teste técnico; não é narração demonstrativa.
  await execute('ffmpeg',['-v','error','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','2','-c:a','pcm_s16le',audio],{timeout:30000});
  const before=await readFile(audio);
  assert.equal(validateNarration(await probe(audio)),2);
  const episode={title:'Teste técnico',series:'noticias',script:'Roteiro aprovado.',visualIdentity:'medicina-democratica',audio:{path:'narration.wav',source:'google-ai-studio',approved:true},captions:[{text:'Legenda corrigida.',start:0,end:2}],scenes:[],assets:[]};
  const input=path.join(temp,'episode.json');await writeFile(input,JSON.stringify(episode));
  const prepared=await prepareEpisode(input);
  assert.equal(prepared.duration,2);
  assert.equal(prepared.props.durationInFrames,60);
  assert.equal(prepared.audioFile,audio);
  assert.equal(prepared.props.episode.scenes[0].end,2);
  assert.deepEqual(prepared.props.captions,episode.captions);
  assert.deepEqual(await readFile(audio),before);
  await writeFile(input,JSON.stringify({...episode,captions:undefined,transcript:'Somente texto.'}));
  await assert.rejects(prepareEpisode(input),/timestamps/);
  await writeFile(path.join(temp,'unsafe.svg'),'<svg/>');
  await writeFile(input,JSON.stringify({...episode,assets:[{id:'unsafe',path:'unsafe.svg',type:'image',origin:'Original de teste',license:'CC0-1.0',redistributionAllowed:true}]}));
  await assert.rejects(prepareEpisode(input),/Formato/);
 }finally{await rm(temp,{recursive:true,force:true});}
});
