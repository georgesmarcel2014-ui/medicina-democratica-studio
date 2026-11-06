import {buildServer} from './app';

const token=process.env.STUDIO_API_TOKEN;
const jobsRoot=process.env.STUDIO_JOBS_DIR;
if (!token || !jobsRoot) throw new Error('Defina STUDIO_API_TOKEN (mínimo 32 bytes) e STUDIO_JOBS_DIR privado.');
const app=await buildServer({token,jobsRoot});
const port=Number(process.env.PORT ?? 8787);
if (!Number.isInteger(port) || port<1 || port>65535) throw new Error('PORT inválida');
await app.listen({host:process.env.STUDIO_HOST ?? '127.0.0.1',port});
console.log('API do estúdio iniciada; autenticação obrigatória. Publique apenas atrás de HTTPS autenticado.');
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>{void app.close();});
