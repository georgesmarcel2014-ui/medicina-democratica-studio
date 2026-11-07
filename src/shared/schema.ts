import {z} from 'zod';
export const FPS = 30;
export const MAX_DURATION = 179;
export const MAX_TTS_SCRIPT_CHARS = 15_000;
const timing = {start:z.number().finite().nonnegative(), end:z.number().finite().positive()};
export const wordSchema = z.object({text:z.string().trim().min(1), emphasis:z.literal(true).optional(), ...timing}).strict().refine(x=>x.end>x.start,'Intervalo de palavra inválido');
export const captionSchema = z.object({text:z.string().trim().min(1).max(95),...timing,words:z.array(wordSchema).optional()}).strict().refine(x=>x.end>x.start,'Intervalo de legenda inválido');
export const sceneSchema = z.object({id:z.string().regex(/^[a-zA-Z0-9_-]+$/),...timing,title:z.string().min(1).max(120),body:z.string().max(500).optional(),visual:z.enum(['chart','map','timeline','clinic','headline']),data:z.array(z.number().finite().nonnegative()).max(12).optional(),labels:z.array(z.string().max(80)).max(12).optional(),assetId:z.string().optional(),reconstruction:z.boolean().optional()}).strict().refine(x=>x.end>x.start,'Intervalo de cena inválido');
export const assetSchema = z.object({id:z.string().regex(/^[a-zA-Z0-9_-]+$/),path:z.string().min(1),type:z.enum(['image','video']),origin:z.string().min(1),license:z.string().min(1),redistributionAllowed:z.boolean()}).strict();
export const episodeSchema = z.object({
 title:z.string().trim().min(1).max(140),series:z.enum(['noticias','historia','na-pratica']),layout:z.literal('documental').optional(),script:z.string().trim().min(1),transcript:z.string().trim().min(1).optional(),instructions:z.string().max(10000).optional(),visualIdentity:z.literal('medicina-democratica'),
 audio:z.discriminatedUnion('source',[
  z.object({path:z.string().min(1),source:z.literal('google-ai-studio'),approved:z.literal(true)}).strict(),
  z.object({path:z.literal('narration.wav'),source:z.literal('google-tts'),scriptApproved:z.literal(true)}).strict()
 ]),
 captions:z.array(captionSchema).min(1).optional(), scenes:z.array(sceneSchema).max(100).default([]),assets:z.array(assetSchema).max(50).default([])
}).strict();
export type Caption=z.infer<typeof captionSchema>;
export type Episode=z.infer<typeof episodeSchema>;
export type EpisodeProps={episode:Omit<Episode,'audio'|'captions'>;captions:Caption[];durationInFrames:number;audioSrc?:string;assetSources:Record<string,string>};
