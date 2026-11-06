import test from 'node:test';
import assert from 'node:assert/strict';
import {captionSchema,episodeSchema,type Caption,type Episode} from '../src/shared/schema';
import {importWhisperX,prepareCaptions,toSrt,validateCaptions} from '../src/pipeline/captions';
import {prepareScenes} from '../src/pipeline/prepare';

function episode(overrides:Partial<Episode>={}):Episode {
 return {title:'Teste editorial',series:'noticias',script:'Texto aprovado.',visualIdentity:'medicina-democratica',audio:{path:'narration.wav',source:'google-ai-studio',approved:true},scenes:[],assets:[],...overrides};
}
const captions:Caption[]=[{text:'Saúde para todos.',start:0,end:2,words:[{text:'Saúde',start:0,end:0.5},{text:'para',start:0.6,end:0.9},{text:'todos.',start:1,end:2}]}];

test('produção exige WAV aprovado do Google AI Studio e impede TTS alternativo',()=>{
 assert.throws(()=>episodeSchema.parse(episode({audio:{path:'narration.wav',source:'tts' as never,approved:true}})));
 assert.throws(()=>episodeSchema.parse(episode({audio:{path:'narration.wav',source:'google-ai-studio',approved:false as never}})));
});

test('não inventa alinhamento proporcional quando há apenas transcrição',()=>{
 assert.throws(()=>prepareCaptions(episode({transcript:'Saúde para todos.'}),2),/timestamps/);
});

test('preserva tempos e correções editoriais das legendas aprovadas',()=>{
 const edited=[{text:'Grafia corrigida na legenda.',start:0.2,end:1.9}];
 assert.deepEqual(prepareCaptions(episode({captions:edited}),2),edited);
 assert.equal(episode().script,'Texto aprovado.');
});

test('aceita palavras ordenadas e alinhadas dentro da narração',()=>{
 assert.deepEqual(validateCaptions(captions,2),captions);
});

test('rejeita legendas sobrepostas, fora da narração e lista vazia',()=>{
 assert.throws(()=>validateCaptions([{text:'A',start:0,end:1.5},{text:'B',start:1,end:2}],2),/sobrepostas/);
 assert.throws(()=>validateCaptions([{text:'A',start:0,end:2.2}],2),/narração/);
 assert.throws(()=>validateCaptions([],2),/obrigatórias/);
});

test('rejeita palavras sobrepostas, fora da legenda ou divergentes do texto',()=>{
 assert.throws(()=>validateCaptions([{text:'A B',start:0,end:2,words:[{text:'A',start:0,end:1.2},{text:'B',start:1,end:2}]}],2),/Palavras/);
 assert.throws(()=>validateCaptions([{text:'A',start:0.5,end:2,words:[{text:'A',start:0,end:1}]}],2),/Palavras/);
 assert.throws(()=>validateCaptions([{text:'A',start:0,end:2,words:[{text:'A',start:0,end:2.1}]}],2),/Palavras/);
 assert.throws(()=>validateCaptions([{text:'A B',start:0,end:2,words:[{text:'Outro',start:0,end:2}]}],2),/diverge/);
});

test('importa JSON WhisperX preservando pontuação e tempos por palavra',()=>{
 const imported=importWhisperX({segments:[{text:'Saúde para todos.',start:0,end:2,words:[{word:'Saúde',start:0,end:0.5},{word:'para',start:0.6,end:0.9},{word:'todos.',start:1,end:2}]}]});
 assert.deepEqual(imported,captions);
});

test('rejeita JSON WhisperX incompleto e palavra sem timestamps',()=>{
 assert.throws(()=>importWhisperX({}),/segments/);
 assert.throws(()=>importWhisperX({segments:[{text:'Texto',start:0,end:2,words:[{word:'Texto'}]}]}));
 assert.throws(()=>importWhisperX({segments:[{text:'Texto',start:0,end:2,words:[{word:'Texto',start:0}]}]}));
 assert.throws(()=>importWhisperX({segments:[{text:'Texto',start:0,end:180}]}),/narração/);
});

test('schema rejeita intervalos invertidos e timestamps não finitos',()=>{
 assert.throws(()=>captionSchema.parse({text:'A',start:2,end:1}));
 assert.throws(()=>captionSchema.parse({text:'A',start:0,end:Infinity}));
 assert.throws(()=>captionSchema.parse({text:'A',start:-1,end:1}));
});

test('exporta SRT preciso incluindo arredondamento entre minutos',()=>{
 const result=toSrt([{text:'Primeira linha.',start:0,end:1.25},{text:'Segunda linha.',start:59.9996,end:61.002}]);
 assert.equal(result,'1\n00:00:00,000 --> 00:00:01,250\nPrimeira linha.\n\n2\n00:01:00,000 --> 00:01:01,002\nSegunda linha.\n');
});

test('seleciona template padrão apropriado à série sem alterar roteiro',()=>{
 for(const [series,visual] of [['noticias','headline'],['historia','timeline'],['na-pratica','clinic']] as const){
  const source=episode({series});
  const scenes=prepareScenes(source,3.5);
  assert.equal(scenes[0].visual,visual);
  assert.equal(scenes[0].start,0);
  assert.equal(scenes[0].end,3.5);
  assert.equal(source.script,'Texto aprovado.');
 }
});

test('exige cobertura completa, ordem e IDs únicos nas cenas',()=>{
 const scenes=[{id:'a',start:0,end:1,title:'A',visual:'headline' as const},{id:'b',start:1,end:2,title:'B',visual:'chart' as const}];
 assert.deepEqual(prepareScenes(episode({scenes}),2),scenes);
 assert.throws(()=>prepareScenes(episode({scenes:[scenes[0],{...scenes[1],start:1.2}]}),2),/sequência/);
 assert.throws(()=>prepareScenes(episode({scenes:[scenes[0],{...scenes[1],start:0.8}]}),2),/sequência/);
 assert.throws(()=>prepareScenes(episode({scenes:[scenes[0]]}),2),/cobrem/);
 assert.throws(()=>prepareScenes(episode({scenes:[scenes[0],{...scenes[1],id:'a'}]}),2),/duplicados/);
});

test('exige registro do recurso visual e rótulos compatíveis nos gráficos',()=>{
 assert.throws(()=>prepareScenes(episode({scenes:[{id:'a',start:0,end:2,title:'Arquivo',visual:'headline',assetId:'missing'}]}),2),/não registrado/);
 assert.throws(()=>prepareScenes(episode({scenes:[{id:'a',start:0,end:2,title:'Dados',visual:'chart',data:[10,20],labels:['A']}]}),2),/rótulos/);
});


test('cenas automáticas seguem limites de legendas sem recortar narração',()=>{
 const source=episode({captions:[{text:'Início.',start:0,end:7},{text:'Novo tópico.',start:8,end:10},{text:'Conclusão.',start:16,end:18}]});
 const scenes=prepareScenes(source,18);
 assert.deepEqual(scenes.map(s=>[s.start,s.end]),[[0,8],[8,16],[16,18]]);
 assert.equal(scenes[1].title,'Novo tópico.');
 assert.deepEqual(source.captions?.map(c=>c.start),[0,8,16]);
 assert.throws(()=>captionSchema.parse({text:'x'.repeat(96),start:0,end:2}));
});
