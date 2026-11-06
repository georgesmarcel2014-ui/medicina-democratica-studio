import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import {timingSafeEqual} from 'node:crypto';
import {randomUUID} from 'node:crypto';
import {createReadStream, createWriteStream} from 'node:fs';
import {mkdir, lstat, realpath, readFile, writeFile, rename, readdir, rm} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
import {episodeSchema} from '../shared/schema';
import {studioHtml,studioScript} from './ui';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_FILE = 256 * 1024 * 1024;
const MAX_TOTAL = 512 * 1024 * 1024;
const MAX_JSON = 256 * 1024;
const MAX_BACKLOG = 10;
export type JobStatus = {id:string; status:'pending'|'rendering'|'completed'|'failed'; createdAt:string; updatedAt:string; error?:'RENDER_FAILED'|'INTERRUPTED'};
export type ServerOptions = {token:string; jobsRoot:string; render?:(inputPath:string,outputPath:string)=>Promise<unknown>};
const safeName = (name:string) => /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(name) && !name.includes('..');
const acceptableMime = (name:string, mime:string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (mime === 'application/octet-stream') return ['json','wav','png','jpg','jpeg','webp','mp4','webm'].includes(ext ?? '');
  if (name === 'episode.json') return mime === 'application/json';
  if (name === 'narration.wav') return ['audio/wav','audio/x-wav','audio/wave','audio/vnd.wave'].includes(mime);
  return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'} as Record<string,string>)[ext ?? ''] === mime;
};

export async function buildServer(options:ServerOptions) {
  if (Buffer.byteLength(options.token) < 32) throw new Error('STUDIO_API_TOKEN deve ter pelo menos 32 bytes.');
  const jobsRoot = resolve(options.jobsRoot);
  await mkdir(jobsRoot,{recursive:true,mode:0o700});
  const rootStat = await lstat(jobsRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || await realpath(jobsRoot) !== jobsRoot || (rootStat.mode & 0o077) !== 0) {
    throw new Error('STUDIO_JOBS_DIR deve ser um diretório privado (0700), sem links simbólicos.');
  }
  const app = Fastify({logger:false,bodyLimit:MAX_TOTAL,requestTimeout:120_000});
  await app.register(multipart,{limits:{files:52,fields:0,parts:52,fileSize:MAX_FILE}});
  const token = Buffer.from(options.token);
  const jobs = new Map<string,JobStatus>();
  const queue:string[] = [];
  let running:Promise<void>|undefined;
  let uploads = 0;
  const save = async (job:JobStatus) => {
    job.updatedAt = new Date().toISOString();
    const dir = join(jobsRoot,job.id);
    await writeFile(join(dir,'status.json.tmp'),JSON.stringify(job),{mode:0o600});
    await rename(join(dir,'status.json.tmp'),join(dir,'status.json'));
    jobs.set(job.id,job);
  };
  // Interrupted renders are explicit failures, never silently reported as complete.
  for (const entry of await readdir(jobsRoot,{withFileTypes:true})) {
    if (!UUID.test(entry.name) || !entry.isDirectory() || entry.isSymbolicLink()) continue;
    try {
      const path = join(jobsRoot,entry.name,'status.json');
      const st = await lstat(path);
      if (!st.isFile() || st.isSymbolicLink() || st.size > 2048) continue;
      const job:JobStatus = JSON.parse(await readFile(path,'utf8'));
      if (job.id !== entry.name || !['pending','rendering','completed','failed'].includes(job.status)) continue;
      if (job.status === 'pending' || job.status === 'rendering') {job.status='failed';job.error='INTERRUPTED';await save(job);}
      else jobs.set(job.id,job);
    } catch { /* Incomplete uploads without status are not accepted jobs. */ }
  }
  const render = options.render ?? (async (inputPath:string,outputPath:string) => {
    const module = await import('../pipeline/render');
    return module.renderEpisode(inputPath,outputPath);
  });
  const startQueue = () => {
    if (running) return;
    running = (async () => {
      while (queue.length) {
        const id = queue.shift()!;
        const job = jobs.get(id)!;
        try {
          job.status='rendering';await save(job);
          await render(join(jobsRoot,id,'episode.json'),join(jobsRoot,id,'final.mp4'));
          const outputStat = await lstat(join(jobsRoot,id,'final.mp4'));
          if (!outputStat.isFile() || outputStat.isSymbolicLink() || outputStat.size === 0) throw new Error('No output');
          job.status='completed';await save(job);
        } catch {
          job.status='failed';job.error='RENDER_FAILED';await save(job);
        }
      }
    })().finally(()=>{running=undefined;if(queue.length) startQueue();});
    // Failures persisting state are surfaced without unhandled promise rejection.
    void running.catch(()=>{});
  };
  app.addHook('onClose',async()=>{while(running) await running;});
  app.addHook('onRequest',async(request,reply)=>{
    const path=request.url.split('?')[0];
    if ((request.method==='GET' || request.method==='HEAD') && (path==='/' || path==='/ui.js')) {
      reply.header('cache-control','no-store').header('x-content-type-options','nosniff');
      reply.header('content-security-policy',"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
      reply.header('x-frame-options','DENY');
      return;
    }
    const authorization = request.headers.authorization;
    const supplied = Buffer.from(authorization?.startsWith('Bearer ') ? authorization.slice(7) : '');
    if (supplied.length !== token.length || !timingSafeEqual(supplied,token)) {
      return reply.code(401).header('www-authenticate','Bearer').send({error:'UNAUTHORIZED'});
    }
    reply.header('cache-control','no-store');
    reply.header('x-content-type-options','nosniff');
  });
  app.setErrorHandler((error,request,reply)=>{
    const code = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
    const status = typeof code === 'number' && code >= 400 && code < 500 ? code : 500;
    return reply.code(status).send({error:status === 413 ? 'UPLOAD_TOO_LARGE' : status < 500 ? 'INVALID_REQUEST' : 'INTERNAL_ERROR'});
  });
  app.get('/',async(request,reply)=>reply.type('text/html; charset=utf-8').send(studioHtml));
  app.get('/ui.js',async(request,reply)=>reply.type('application/javascript; charset=utf-8').send(studioScript));
  app.post('/v1/jobs',async(request,reply)=>{
    if (queue.length + (running ? 1 : 0) + uploads >= MAX_BACKLOG) return reply.code(429).send({error:'QUEUE_FULL'});
    if (!request.isMultipart()) return reply.code(415).send({error:'MULTIPART_REQUIRED'});
    uploads++;
    const id = randomUUID();
    const dir = join(jobsRoot,id);
    let accepted=false;
    let created=false;
    const reject = async (code:number,error:string) => {
      await rm(dir,{recursive:true,force:true});
      return reply.code(code).send({error});
    };
    try {
      await mkdir(dir,{mode:0o700});created=true;
      const names = new Set<string>();
      let total=0;
      for await (const part of request.parts()) {
        if (part.type !== 'file' || !safeName(part.filename) || !acceptableMime(part.filename,part.mimetype) || names.has(part.filename) || part.filename === 'final.mp4') {
          if (part.type === 'file') part.file.resume();
          return await reject(400,'INVALID_UPLOAD');
        }
        if (part.filename !== 'episode.json' && part.filename !== 'narration.wav' && !/\.(png|jpe?g|webp|mp4|webm)$/i.test(part.filename)) {
          part.file.resume();return await reject(400,'INVALID_UPLOAD');
        }
        names.add(part.filename);
        let fileSize=0;
        const limiter = new Transform({transform(chunk,encoding,callback){
          total+=chunk.length;fileSize+=chunk.length;
          if (total>MAX_TOTAL || (part.filename==='episode.json' && fileSize>MAX_JSON)) {
            callback(Object.assign(new Error('Upload too large'),{statusCode:413}));
          } else callback(null,chunk);
        }});
        await pipeline(part.file,limiter,createWriteStream(join(dir,part.filename),{flags:'wx',mode:0o600}));
        if (part.file.truncated) return await reject(413,'UPLOAD_TOO_LARGE');
      }
      if (!names.has('episode.json') || !names.has('narration.wav')) return await reject(400,'MISSING_INPUT');
      let document:unknown;
      try {document=JSON.parse(await readFile(join(dir,'episode.json'),'utf8'));} catch {return await reject(400,'INVALID_EPISODE');}
      const parsed = episodeSchema.safeParse(document);
      if (!parsed.success || parsed.data.audio.path !== 'narration.wav') return await reject(400,'INVALID_EPISODE');
      const expected = new Set(['episode.json','narration.wav']);
      for (const asset of parsed.data.assets) {
        if (!safeName(asset.path) || expected.has(asset.path) || !names.has(asset.path)) return await reject(400,'INVALID_ASSET');
        const image = /\.(png|jpe?g|webp)$/i.test(asset.path);
        const video = /\.(mp4|webm)$/i.test(asset.path);
        if ((asset.type==='image' && !image) || (asset.type==='video' && !video)) return await reject(400,'INVALID_ASSET');
        expected.add(asset.path);
      }
      if (names.size !== expected.size) return await reject(400,'UNDECLARED_ASSET');
      const now = new Date().toISOString();
      const job:JobStatus={id,status:'pending',createdAt:now,updatedAt:now};
      await save(job);accepted=true;queue.push(id);startQueue();
      return reply.code(202).header('location',`/v1/jobs/${id}`).send({...job,status:'pending'});
    } finally {
      uploads--;
      if (created && !accepted) await rm(dir,{recursive:true,force:true});
    }
  });
  app.get<{Params:{id:string}}>('/v1/jobs/:id',async(request,reply)=>{
    const id=request.params.id;
    const job = UUID.test(id) ? jobs.get(id) : undefined;
    if (!job) return reply.code(404).send({error:'JOB_NOT_FOUND'});
    return job;
  });
  app.get<{Params:{id:string}}>('/v1/jobs/:id/video',async(request,reply)=>{
    const id=request.params.id;
    const job = UUID.test(id) ? jobs.get(id) : undefined;
    if (!job) return reply.code(404).send({error:'JOB_NOT_FOUND'});
    if (job.status !== 'completed') return reply.code(409).send({error:'VIDEO_NOT_READY'});
    const output=join(jobsRoot,id,'final.mp4');
    const st=await lstat(output);
    if (!st.isFile() || st.isSymbolicLink()) return reply.code(404).send({error:'VIDEO_NOT_FOUND'});
    return reply.type('video/mp4').header('content-disposition',`attachment; filename="${id}.mp4"`).send(createReadStream(output));
  });
  return app;
}
