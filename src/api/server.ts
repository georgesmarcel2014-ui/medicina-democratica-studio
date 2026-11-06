import {readFile} from 'node:fs/promises';
import {buildServer} from './app';

async function readSecret(name: 'STUDIO_API_TOKEN' | 'GEMINI_API_KEY') {
  const file=process.env[`${name}_FILE`];
  return file ? (await readFile(file,'utf8')).trim() : process.env[name];
}

const [token,geminiApiKey]=await Promise.all([readSecret('STUDIO_API_TOKEN'),readSecret('GEMINI_API_KEY')]);
const jobsRoot=process.env.STUDIO_JOBS_DIR;
if (!token || !jobsRoot) throw new Error('Defina STUDIO_API_TOKEN ou STUDIO_API_TOKEN_FILE (mínimo 32 bytes) e STUDIO_JOBS_DIR privado.');
const modelPath=process.env.STUDIO_WHISPER_MODEL;
const alignment=modelPath ? {modelPath,python:process.env.STUDIO_ASR_PYTHON ?? 'python3'} : undefined;
// Keep credentials in the API process, out of the environment inherited by media tools.
delete process.env.GEMINI_API_KEY;
delete process.env.STUDIO_API_TOKEN;
delete process.env.GEMINI_API_KEY_FILE;
delete process.env.STUDIO_API_TOKEN_FILE;
const app=await buildServer({token,jobsRoot,automation:{geminiApiKey,alignment}});
const port=Number(process.env.PORT ?? 8787);
if (!Number.isInteger(port) || port<1 || port>65535) throw new Error('PORT inválida');
await app.listen({host:process.env.STUDIO_HOST ?? '127.0.0.1',port});
console.log('API do estúdio iniciada; autenticação obrigatória. Publique apenas atrás de HTTPS autenticado.');
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>{void app.close();});
