# Produção pelo Android

O modo oficial é [PRIME+ ENXUTO](prime-enxuto.md). No celular, **gere você mesmo o Charon no Google AI Studio**, escute e aprove a tomada, depois envie ao Work **o roteiro aprovado e o WAV Charon definitivo juntos**. Esse é o fluxo padrão; não solicite geração automática da voz.

> Edite este episódio pelo fluxo **original e cinematográfico do ChatGPT Work**, com título “[título]” e série “[série]”. Use o **WAV Charon definitivo enviado por mim** e o roteiro anexados, **não gere outro TTS**, sem renderizar via GitHub. Restaure trilha musical, B-roll relevante e fluidez de montagem; use apenas as novas animações gráficas que agregam valor. Compare com Semmelweis, Carlos Chagas e Igreja e Medicina. Entregue MP4 vertical 1080 × 1920 **com link direto de download nesta conversa**, WAV original, SRT e descrição com hashtags **pronta para copiar e colar**. **Não publique, agende ou envie ao Metricool** sem minha solicitação explícita.

## Fluxo oficial no Work

1. O operador gera o WAV no Google AI Studio (Charon) e o anexa com o roteiro aprovado. O Work confere e **preserva a tomada**; [TTS por CLI](automated-tts.md) é recurso opcional e não deve ser acionado por padrão.
2. O Work decide B-roll, música, transições, cortes, animações e legendas, e entrega o MP4, o WAV, o SRT e a descrição para revisão.
3. Receba o MP4 por link direto no chat e a descrição copiável. Aprove o corte final antes de **qualquer** solicitação separada de postagem ou agendamento pelo Metricool.

### Preset Charon

Dirija uma voz documental masculina, madura e encorpada, de registro médio-grave e dicção nítida em português brasileiro. Peça curiosidade contida, pulso nos fatos, pausas breves nas revelações e queda natural no fim das afirmações. No Gemini 2.5, use **Audio Profile** e **Scene**. No 3.8, use **Style** no bloco de fala (`speech_metadata.style` na API). Confirme **Charon** e mantenha o roteiro integral separado da direção. Use uma tag de pausa só quando a pontuação e a direção forem insuficientes e confira o trecho gerado. Veja a [revisão PRIME+](production.md#revisão-prime).

Para História, oriente o Work a escolher gravuras, documentos, B-roll e animações verticais verificáveis; registre os créditos. Preserve a música documental de fundo e faça ducking para manter a voz inteligível. Verifique legendas alinhadas e entregue o WAV original junto ao SRT.

## Modo técnico legado — render automático (não é o padrão PRIME+)

Os comandos abaixo são mantidos para testes/contingência. **Não usá-los como montagem padrão do Work**, pois podem substituir escolhas de B-roll, trilha e ritmo.

### Preparação do ambiente

No checkout do projeto em um ambiente Linux x86_64, prepare uma vez por sessão.

```sh
runtime="$(mktemp -d)"
bash deploy/setup-standalone.sh "$runtime"
export PATH="$runtime/node/bin:$PATH"
export STUDIO_ASR_PYTHON="$runtime/asr/bin/python"
export STUDIO_WHISPER_MODEL="$runtime/whisper"
export CHROME_PATH="$(cat "$runtime/chrome-path")"
npm run produce -- --input /pasta/privada/episode.json --output /pasta/privada/video.mp4
```

Se o executor Work retornar `uv_interface_addresses`, chame o mesmo comando com a compatibilidade de loopback do renderizador.

```sh
node --require ./deploy/work-loopback.cjs --import tsx src/pipeline/cli.ts produce \
  --input /pasta/privada/episode.json --output /pasta/privada/video.mp4
```

Para gerar voz pela API no mesmo comando, use `audio: {"path":"narration.wav","source":"google-tts","scriptApproved":true}` e acrescente `--free-tier` após confirmar que o projeto da chave está no Free Tier e com faturamento desativado. O processo lê `GEMINI_API_KEY` ou `GEMINI_API_KEY_FILE` de um ambiente privado já configurado e retira a credencial do ambiente dos subprocessos de mídia.

Os resultados são `video.mp4`, `video.mp4.srt` e um relatório de validação. A saída é H.264/AAC, 1080 × 1920, 30 fps, com duração máxima de 179 segundos. Se a narração passar do limite, a produção para para revisão do roteiro.

## Colab gratuito de reserva

[Abrir o notebook no Colab](https://colab.research.google.com/github/georgesmarcel2014-ui/medicina-democratica-studio/blob/main/notebooks/Medicina_Democratica_Studio.ipynb)

1. Crie ou selecione uma chave do projeto **Free Tier**, com faturamento desativado, no [Google AI Studio](https://aistudio.google.com/api-keys).
2. No Colab, conecte um ambiente gratuito de CPU. Em **Segredos** (🔑), adicione `GEMINI_API_KEY` e permita o acesso deste notebook.
3. Execute as duas células. Cole o roteiro, confirme a aprovação e o projeto gratuito e toque em **Produzir episódio**. Baixe o MP4 e o SRT antes de desconectar.

O Colab executa o mesmo pipeline em uma sessão temporária. A disponibilidade de CPU e as cotas de voz dependem da conta. Baixe os resultados no navegador ao concluir.
