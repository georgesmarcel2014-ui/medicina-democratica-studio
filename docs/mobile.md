# Produção pelo Android

Envie no ChatGPT Work uma ordem com título, série e roteiro integral aprovado. O Work gera a voz no Google AI Studio, sincroniza as legendas, renderiza um episódio por vez e devolve MP4, WAV e SRT para download na conversa, com a descrição do Instagram em um bloco para copiar. As séries disponíveis são Na Prática, Notícias e História.

> Produza um episódio da Medicina Democrática com o título “[título]”, na série “[série]”. Use o roteiro aprovado abaixo e os insumos anexados. Entregue o MP4 vertical, o WAV Charon, o SRT e a descrição do Instagram em bloco.

## Fluxo no Work

1. Selecione Gemini 2.5 Flash Preview TTS e confirme **Charon** no Google AI Studio. Use a cota gratuita. Uma sessão Google autorizada pode usar o playground com nenhuma chave selecionada. Se o Google exigir uma chave paga, encerre a geração.
2. Baixe o WAV gerado e mantenha o texto aprovado no campo `script` do episódio. Para uma narração já aprovada, use o WAV original. Em ambos os casos, declare `audio: {"path":"narration.wav","source":"google-ai-studio","approved":true}` no JSON e mantenha o WAV ao lado dele. Use uma pasta privada por ordem.
3. Execute `produce` e revise as legendas contra o texto e a fala. O alinhador mede a fala no WAV. Defina os cortes a partir dessas marcas e do significado de cada trecho. Se o texto da fala divergir do roteiro, revise o WAV antes de entregar.

### Preset Charon

No compositor, preencha **Audio Profile** com um narrador masculino maduro, natural em português brasileiro, seguro e caloroso, com pronúncia clara de nomes e termos médicos. Em **Scene**, dirija a abertura com curiosidade e urgência contida, acelere durante a investigação, faça pausas nas revelações e fale a última frase diretamente ao ouvinte. Use o bloco de fala para o roteiro aprovado e confirme **Charon** na ficha do locutor antes de rodar. O preset da API mantém as instruções fora da seção `Transcript`.

Para História com gravuras, B-roll ou animações verticais, use `"layout": "documental"` no manifesto. Cada plano pode receber seu crédito no recurso de mídia. Nas legendas alinhadas, marque `"emphasis": true` apenas nos termos que merecem destaque. Mantenha a fala à frente da trilha e dos efeitos, valide o MP4 completo e entregue o WAV do Google junto ao SRT.

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
