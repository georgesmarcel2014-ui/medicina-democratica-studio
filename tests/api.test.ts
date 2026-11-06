import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readdir,symlink,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {buildServer} from '../src/api/app';

const token='test-only-token-32-characters-minimum';
const auth={authorization:`Bearer ${token}`};
const episode={title:'Teste privado',series:'noticias',script:'Roteiro aprovado.',visualIdentity:'medicina-democratica',audio:{path:'narration.wav',source:'google-ai-studio',approved:true},captions:[{text:'Roteiro aprovado.',start:0,end:1}],scenes:[],assets:[]};
const automatic={...episode,captions:undefined,audio:{path:'narration.wav',source:'google-tts',scriptApproved:true}};
function multipart(files:{name:string;filename:string;type:string;data:string|Buffer}[]) {
  const boundary='studio-test-boundary';
  const pieces:Buffer[]=[];
  for (const file of files) pieces.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.type}\r\n\r\n`),Buffer.from(file.data),Buffer.from('\r\n'));
  pieces.push(Buffer.from(`--${boundary}--\r\n`));
  return {payload:Buffer.concat(pieces),headers:{...auth,'content-type':`multipart/form-data; boundary=${boundary}`}};
}
const upload=(doc:unknown=episode,wav=Buffer.from('RIFFtestWAVE'))=>multipart([{name:'episode',filename:'episode.json',type:'application/json',data:JSON.stringify(doc)},{name:'audio',filename:'narration.wav',type:'audio/wav',data:wav}]);

test('API exige autenticação e não expõe arquivos ou estado a visitantes',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  const app=await buildServer({token,jobsRoot:root,render:async()=>{}});
  try {
    const response=await app.inject({url:'/v1/jobs/unknown'});
    assert.equal(response.statusCode,401);
    assert.deepEqual(response.json(),{error:'UNAUTHORIZED'});
    assert.equal((await app.inject({url:'/v1/jobs/unknown',headers:auth})).statusCode,404);
    assert.equal((await app.inject({method:'POST',url:'/v1/jobs',headers:auth,payload:{}})).statusCode,400);
    assert.equal((await app.inject({method:'POST',url:'/v1/jobs',headers:{...auth,'content-type':'text/plain'},payload:'teste'})).statusCode,415);
    assert.deepEqual((await app.inject({url:'/healthz'})).json(),{ok:true});
  } finally {await app.close();await rm(root,{recursive:true,force:true});}
});

test('job automático exige roteiro aprovado e configuração do servidor',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  const app=await buildServer({token,jobsRoot:root});
  try {
    const create=(payload:unknown)=>app.inject({method:'POST',url:'/v1/jobs',headers:auth,payload:JSON.stringify(payload)});
    const headers={...auth,'content-type':'application/json'};
    const rejected=await app.inject({method:'POST',url:'/v1/jobs',headers,payload:{...automatic,audio:{...automatic.audio,scriptApproved:false}}});
    assert.equal(rejected.statusCode,400);
    const duplicate=await app.inject({method:'POST',url:'/v1/jobs',...upload(automatic)});
    assert.equal(duplicate.statusCode,400);
    const unconfigured=await app.inject({method:'POST',url:'/v1/jobs',headers,payload:automatic});
    assert.equal(unconfigured.statusCode,503);
    assert.deepEqual(unconfigured.json(),{error:'TTS_UNCONFIGURED'});
    const noAligner=await app.inject({method:'POST',url:'/v1/jobs',...upload({...episode,captions:undefined})});
    assert.equal(noAligner.statusCode,503);
    assert.deepEqual(noAligner.json(),{error:'CAPTIONS_UNCONFIGURED'});
    assert.equal((await create(automatic)).statusCode,415);
    assert.deepEqual(await readdir(root),[]);
  } finally {await app.close();await rm(root,{recursive:true,force:true});}
});

test('job automático relata cota do Google e protege detalhes da resposta',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  const app=await buildServer({token,jobsRoot:root,automation:{
    geminiApiKey:'segredo-sintetico',alignment:{python:'unused',modelPath:'unused'},
    googleFetch:async()=>new Response('Roteiro e segredo-sintetico',{status:429})
  }});
  try {
    const response=await app.inject({method:'POST',url:'/v1/jobs',headers:auth,payload:automatic});
    assert.equal(response.statusCode,202,response.body);
    const url=response.headers.location! as string;
    let state=await app.inject({url,headers:auth});
    for(let i=0;i<100 && state.json().status!=='failed';i++) {
      await new Promise(resolve=>setTimeout(resolve,5));
      state=await app.inject({url,headers:auth});
    }
    assert.equal(state.json().error,'TTS_RATE_LIMITED');
    assert.doesNotMatch(state.body,/segredo-sintetico|Roteiro/);
    assert.equal((await app.inject({url:`${url}/narration`,headers:auth})).statusCode,404);
  } finally {await app.close();await rm(root,{recursive:true,force:true});}
});

test('upload privado, fila, estado e download autenticado usam o render injetado',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  let release!:()=>void;
  const hold=new Promise<void>(resolve=>{release=resolve;});
  const app=await buildServer({token,jobsRoot:root,render:async(input,output)=>{
    const doc=JSON.parse(await readFile(input,'utf8'));
    assert.equal(doc.title,episode.title);
    await hold;await writeFile(output,Buffer.from('test-mp4-output'));
  }});
  try {
    const response=await app.inject({method:'POST',url:'/v1/jobs',...upload(episode,Buffer.alloc(300*1024))});
    assert.equal(response.statusCode,202,response.body);
    const id=response.json().id;
    assert.match(id,/^[0-9a-f-]{36}$/);
    assert.equal((await app.inject({url:`/v1/jobs/${id}/video`,headers:auth})).statusCode,409);
    release();
    let state='pending';
    for(let i=0;i<100 && state!=='completed';i++) {
      await new Promise(resolve=>setTimeout(resolve,5));
      state=(await app.inject({url:`/v1/jobs/${id}`,headers:auth})).json().status;
    }
    assert.equal(state,'completed');
    assert.equal((await app.inject({url:`/v1/jobs/${id}/video`})).statusCode,401);
    const video=await app.inject({url:`/v1/jobs/${id}/video`,headers:auth});
    assert.equal(video.statusCode,200);
    assert.equal(video.headers['content-type'],'video/mp4');
    assert.equal(video.body,'test-mp4-output');
    assert.equal(video.headers['cache-control'],'no-store');
  } finally {release();await app.close();await rm(root,{recursive:true,force:true});}
});

test('rejeita caminhos fora do job, arquivos duplicados e mídias não declaradas',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  let calls=0;
  const app=await buildServer({token,jobsRoot:root,render:async()=>{calls++;}});
  try {
    for(const path of ['/tmp/private.wav','../narration.wav','https://example.com/audio.wav']) {
      const response=await app.inject({method:'POST',url:'/v1/jobs',...upload({...episode,audio:{...episode.audio,path}})});
      assert.equal(response.statusCode,400,response.body);
    }
    const duplicate=multipart([{name:'episode',filename:'episode.json',type:'application/json',data:JSON.stringify(episode)},{name:'episode2',filename:'episode.json',type:'application/json',data:JSON.stringify(episode)}]);
    assert.equal((await app.inject({method:'POST',url:'/v1/jobs',...duplicate})).statusCode,400);
    const undeclared=multipart([{name:'episode',filename:'episode.json',type:'application/json',data:JSON.stringify(episode)},{name:'audio',filename:'narration.wav',type:'audio/wav',data:'RIFF'},{name:'asset',filename:'photo.png',type:'image/png',data:'image'}]);
    assert.equal((await app.inject({method:'POST',url:'/v1/jobs',...undeclared})).statusCode,400);
    const reserved=multipart([{name:'asset',filename:'final.mp4',type:'video/mp4',data:'video'}]);
    assert.equal((await app.inject({method:'POST',url:'/v1/jobs',...reserved})).statusCode,400);
    assert.equal(calls,0);
    assert.deepEqual(await readdir(root),[]);
  } finally {await app.close();await rm(root,{recursive:true,force:true});}
});

test('falha de render é registrada sem revelar segredos e sobrevive reinício',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  let app=await buildServer({token,jobsRoot:root,render:async()=>{throw new Error('SECRET /private/patient.wav');}});
  try {
    const response=await app.inject({method:'POST',url:'/v1/jobs',...upload()});
    const id=response.json().id;
    await app.close();
    app=await buildServer({token,jobsRoot:root,render:async()=>{}});
    const state=await app.inject({url:`/v1/jobs/${id}`,headers:auth});
    assert.equal(state.json().status,'failed');
    assert.equal(state.json().error,'RENDER_FAILED');
    assert.doesNotMatch(state.body,/SECRET|patient/);
    assert.equal((await app.inject({url:`/v1/jobs/${id}/video`,headers:auth})).statusCode,409);
  } finally {await app.close();await rm(root,{recursive:true,force:true});}
});

test('configuração rejeita token curto e root simbólico',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  const link=`${root}-link`;
  try {
    await assert.rejects(buildServer({token:'short',jobsRoot:root}),/32 bytes/);
    await symlink(root,link);
    await assert.rejects(buildServer({token,jobsRoot:link}),/sem links simbólicos/);
  } finally {await rm(link,{force:true});await rm(root,{recursive:true,force:true});}
});

test('fila executa um render por vez e preserva a ordem de submissão',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  const started:string[]=[];
  let active=0,maxActive=0;
  const app=await buildServer({token,jobsRoot:root,render:async(input,output)=>{
    active++;maxActive=Math.max(active,maxActive);
    started.push(JSON.parse(await readFile(input,'utf8')).title);
    await new Promise(resolve=>setTimeout(resolve,20));
    await writeFile(output,'mp4');active--;
  }});
  try {
    for(const title of ['Primeiro','Segundo','Terceiro']) {
      const response=await app.inject({method:'POST',url:'/v1/jobs',...upload({...episode,title})});
      assert.equal(response.statusCode,202,response.body);
    }
    await app.close();
    assert.equal(maxActive,1);
    assert.deepEqual(started,['Primeiro','Segundo','Terceiro']);
  } finally {await app.close();await rm(root,{recursive:true,force:true});}
});

test('interface pública entrega apenas formulário estático; APIs continuam autenticadas',async()=>{
  const root=await mkdtemp(join(tmpdir(),'studio-api-'));
  const app=await buildServer({token,jobsRoot:root,render:async()=>{}});
  try {
    const page=await app.inject({url:'/'});
    assert.equal(page.statusCode,200);
    assert.match(page.headers['content-type']!,/text\/html/);
    assert.match(page.headers['content-security-policy']!,/frame-ancestors 'none'/);
    assert.match(page.body,/Narração definitiva/);
    assert.match(page.body,/type="password"/);
    assert.doesNotMatch(page.body,new RegExp(token));
    const script=await app.inject({url:'/ui.js'});
    assert.equal(script.statusCode,200);
    assert.doesNotMatch(script.body,/localStorage|innerHTML/);
    const vm=await import('node:vm');
    assert.doesNotThrow(()=>new vm.Script(script.body));
    assert.equal((await app.inject({url:'/v1/jobs/does-not-exist'})).statusCode,401);
  } finally {await app.close();await rm(root,{recursive:true,force:true});}
});

test('interface cria formulário multipart com WAV e legendas, consulta e oferece download',async()=>{
  const {studioScript}=await import('../src/api/ui');
  const {runInNewContext}=await import('node:vm');
  const nodes:Record<string,any>={};
  const make=(value='')=>({value,files:[],hidden:true,disabled:false,textContent:'',events:{} as Record<string,Function>,addEventListener(name:string,callback:Function){this.events[name]=callback;},reportValidity(){return true;},getAttribute(){},setAttribute(){},removeAttribute(){},click(){}});
  for(const id of ['production-form','status','produce','download','download-captions','download-narration','token','title','series','script','audio','captions','resume','job-id']) nodes[id]=make();
  nodes.token.value=token;nodes.title.value='Título';nodes.series.value='noticias';nodes.script.value='Texto aprovado';
  nodes.audio.files=[new File(['WAV'],'definitivo.wav',{type:'audio/wav'})];
  nodes.captions.files=[new File([JSON.stringify(episode.captions)],'legendas.json',{type:'application/json'})];
  const paths:string[]=[];
  let submitted:RequestInit|undefined;
  const id='11111111-1111-4111-8111-111111111111';
  runInNewContext(studioScript,{
    document:{getElementById:(id:string)=>nodes[id]},window:{addEventListener(){}},
    Blob,FormData,URL,setTimeout,clearTimeout,
    fetch:async(path:string,options:RequestInit)=>{
      paths.push(path);assert.equal((options.headers as any).Authorization,`Bearer ${token}`);
      if(options.method==='POST') {submitted=options;return {ok:true,json:async()=>({id})};}
      if(path.endsWith('/video')) return {ok:true,blob:async()=>new Blob(['mp4'],{type:'video/mp4'})};
      return {ok:true,json:async()=>({id,status:'completed'})};
    }
  });
  await nodes['production-form'].events.submit({preventDefault(){}});
  assert.deepEqual(paths,['/v1/jobs',`/v1/jobs/${id}`]);
  const payload=submitted?.body as FormData;
  const data=JSON.parse(await (payload.get('episode') as Blob).text());
  assert.equal(data.audio.path,'narration.wav');assert.equal(data.audio.approved,true);
  assert.equal((payload.get('narration') as File).name,'narration.wav');
  assert.equal(nodes['download-captions'].href,`/v1/jobs/${id}/captions`);
  await nodes.download.events.click({preventDefault(){}});
  assert.equal(paths.at(-1),`/v1/jobs/${id}/video`);
  assert.equal(nodes.download.hidden,false);assert.match(nodes.download.href,/^blob:/);
  nodes.audio.files=[];nodes.captions.files=[];
  await nodes['production-form'].events.submit({preventDefault(){}});
  assert.equal(new Headers(submitted?.headers).get('content-type'),'application/json');
  const generated=JSON.parse(submitted?.body as string);
  assert.deepEqual(generated.audio,{path:'narration.wav',source:'google-tts',scriptApproved:true});
  assert.equal(generated.captions,undefined);
});
