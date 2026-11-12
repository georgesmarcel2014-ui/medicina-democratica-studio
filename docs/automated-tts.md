# Google AI Studio TTS

> **Recurso técnico opcional:** no fluxo PRIME+ aprovado, o **operador gera o WAV Charon no AI Studio e envia ao Work**. Não ative TTS por CLI automaticamente, não peça chaves no chat e não substitua a narração aprovada. Veja [prime-enxuto.md](prime-enxuto.md).

## Gerar o WAV

Guarde o roteiro aprovado em uma pasta privada da sessão do Work. Configure `GEMINI_API_KEY` como segredo de um projeto Free Tier com faturamento desativado.

```sh
npm run tts -- --input /pasta/privada/roteiro-aprovado.txt --output /pasta/privada/narracao-charon.wav
```

Para dirigir ritmo, pronúncia ou ênfase do episódio, acrescente `--direction-file /pasta/privada/direcao.txt`. O texto da direção fica separado do roteiro. O padrão é `gemini-2.5-flash-preview-tts`, um locutor, voz **Charon**, português brasileiro.

O comando valida o WAV e o limite de 179 segundos antes de disponibilizar a saída, preserva WAVs existentes e informa o caminho do arquivo. O Work usa o WAV e o roteiro na mesma sessão para escuta, legendagem e edição.

Se a chave estiver indisponível, o Work pode usar o [Google AI Studio no navegador](https://aistudio.google.com/generate-speech?model=gemini-2.5-flash-preview-tts) em uma sessão autorizada e dentro da cota gratuita. Use **Audio Profile** para o perfil documental em PT-BR, **Scene** para direção de cena e um bloco com o roteiro. Confirme **Charon** no único locutor. Baixe o WAV e use-o junto ao roteiro. Se o Google exigir faturamento ou bloquear a geração, aguarde uma configuração autorizada ou reaproveite um WAV Charon já conferido para o roteiro.

Para comparar com o Gemini 3.8 Flash TTS, use `--model gemini-3.8-flash-tts` com um trecho idêntico, dentro da cota gratuita. No 3.8 a direção vai em `speech_metadata.style`. Compare timbre, pausas e inteligibilidade antes de trocar o padrão. [Documentação da API Gemini TTS](https://ai.google.dev/gemini-api/docs/speech-generation).

## Integração técnica opcional

O [formulário e a API](openapi.yaml) aceitam `audio.source: "google-tts"` com `scriptApproved: true` ou um WAV definitivo com `audio.source: "google-ai-studio"` e `approved: true`. O [guia técnico](production.md) descreve renderização, legendas alinhadas pelo Whisper e os formatos de saída. A edição PRIME+ segue a [ordem do Work](prime-enxuto.md).
