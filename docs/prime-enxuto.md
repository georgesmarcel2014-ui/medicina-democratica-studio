# PRIME+ ENXUTO — Work primeiro (fluxo oficial)

**Decisão editorial:** menos código em produção, mais direção cinematográfica. O GitHub é infraestrutura de **TTS Google AI Studio/Gemini (voz Charon)** e transporte seguro de insumos; ele **não** dirige, monta nem renderiza o vídeo final do fluxo principal.

## Fluxo único

1. **Roteiro aprovado** — pesquisa, fontes e direção editorial.
2. **TTS isolado** — executar apenas a narração com Charon, guardar o WAV definitivo e o roteiro correspondente. Conferir timbre, naturalidade, ritmo e pausas antes de entregar ao Work. Se necessário, incluir SRT alinhado já revisado; não é pré-requisito para editar.
3. **ChatGPT Work original** — recebe roteiro + WAV (e SRT, quando disponível) e assume integralmente o trabalho criativo: pesquisa de B-roll e direitos, seleção de planos, documentos, montagem, motion graphics, cortes, legendas, música de fundo e mixagem. É o Work que exporta o MP4 vertical 1080×1920 (até 2:59). Não executar `produce`, `render` ou gerador de cenas como etapa padrão.
4. **Revisão e Metricool** — entregar MP4/WAV/SRT/descrição. Enviar ao Metricool para agendamento/publicação em Instagram e TikTok **somente depois da aprovação explícita do responsável**. O Metricool fica fora do motor de vídeo e não deve alterar o arquivo final.

## Comando mínimo de TTS

Com a chave Google protegida no ambiente e roteiro aprovado em arquivo privado:

```bash
npm run tts -- --input /pasta/privada/roteiro-aprovado.txt --output /pasta/privada/narracao-charon.wav --voice Charon
```

O comando já existe no repositório, fixa Charon por padrão, não renderiza o vídeo e não sobrescreve WAV aprovado. O modelo padrão atual é `gemini-2.5-flash-preview-tts`. Não mudar modelo, voz ou direção sem comparação de áudio com as narrações aprovadas. Nunca incluir tokens/chaves ou arquivos confidenciais no repositório público.

## Critérios editoriais inegociáveis

- **B-roll intencional:** nenhum plano automático genérico, incoerente, repetido, esticado ou com defeito visual. Rever cada plano e recorrer a documentos/imagens verificáveis.
- **Música de volta:** trilha documental adequada, licenciada, contínua quando artisticamente necessária, com ducking para preservar a fala. Não substituir a música por silêncio sem decisão editorial.
- **Narração:** Charon masculina, médio-grave, natural; evitar pausas excessivamente longas entre blocos. Sem alterar pitch artificialmente ou mascarar cortes com longos vazios.
- **Work como diretor:** preservar os acertos de Semmelweis, Carlos Chagas e Igreja e Medicina. Reaproveitar seletivamente as animações gráficas novas que realmente melhoraram a explicação, sem adotar sua montagem automática.
- **QC final:** conferir termos médicos, fatos, ritmo, trilha, B-roll, legendas e reprodução integral em celular. Só publicar após revisão e aprovação.

## O que fazer com o motor antigo

**Não apagar nem reconstruir por impulso.** Manter código de renderização automática, Remotion, FFmpeg, Blender e demonstrações apenas como ferramentas legadas/opcionais de apoio visual, fora do caminho principal. Remover complexidade adicional só após verificar dependências e assegurar reversibilidade. A prioridade é **não chamar** o motor automático ao produzir episódios PRIME+.

## Comando para o Work

> Produza o episódio no **fluxo original de edição do ChatGPT Work**. Use o WAV Charon e o roteiro aprovado como insumos intocáveis; não use o renderizador automático do GitHub. Restaure trilha musical documental com mixagem equilibrada, B-roll editorial verificável, fluidez cinematográfica, cortes ágeis e pausas naturais. Preserve as boas novas animações gráficas apenas quando servirem à narrativa. Compare a qualidade com Semmelweis, Carlos Chagas e Igreja e Medicina. Entregue MP4 1080×1920 (até 2:59), WAV, SRT e descrição. Deixe a publicação via Metricool preparada, **mas só publique após minha aprovação**.
