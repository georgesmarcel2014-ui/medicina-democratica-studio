# Google AI Studio TTS e legendas automáticas

O estúdio gera WAV mono de 24 kHz com Google Gemini TTS a partir de um roteiro aprovado. O modelo padrão é `gemini-2.5-flash-preview-tts`, voz Charon, em português brasileiro. O pipeline verifica o WAV e sua duração antes de renderizar. O limite é 179 segundos.

Configure `GEMINI_API_KEY` no ambiente do servidor conforme o [guia de implantação](deployment.md). A chave autentica a chamada HTTPS ao Google e fica no servidor. O formulário usa um token de acesso separado. O reconhecimento de fala roda localmente e recebe o WAV, com o modelo Whisper small já instalado no contêiner.

## Produzir

1. No formulário, confirme a aprovação do roteiro e selecione **Produzir vídeo**. Na API, envie `audio: {"path":"narration.wav","source":"google-tts","scriptApproved":true}` em uma especificação de episódio. Veja [o contrato](openapi.yaml).
2. Para reaproveitar um WAV aprovado, anexe-o com `audio.source: "google-ai-studio"` e `audio.approved: true`. Se tiver legendas revisadas para aquele WAV, envie o JSON de legendas junto com ele.
3. O estúdio usa tempos por palavra reconhecidos a partir da fala. Uma divergência grande em relação ao roteiro interrompe o trabalho e permite baixar o WAV para revisão. As legendas automáticas incorporam a grafia aprovada quando a sequência de palavras coincide.
4. Ao concluir, baixe o MP4 com legendas embutidas, o SRT e o WAV. Revise narração, sincronismo e termos médicos antes de publicar.

Para gerar apenas o WAV em um ambiente privado com a chave configurada:

```sh
npm run tts -- --input /caminho/privado/roteiro-aprovado.txt --output /caminho/privado/narration.wav
```

O comando verifica a duração e preserva um WAV que já esteja no caminho de saída. Consulte [a documentação da API Gemini TTS](https://ai.google.dev/gemini-api/docs/speech-generation) para modelos, vozes e limites.
