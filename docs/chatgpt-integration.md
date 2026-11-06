# Acionamento pelo ChatGPT

O estúdio atende pelo formulário web ou pela [API autenticada](openapi.yaml). Para operar diretamente no ChatGPT/Work, é preciso conectar uma ferramenta autorizada ao endereço HTTPS criado na [implantação](deployment.md). O formulário pode ser usado assim que a hospedagem estiver ativa.

## Fluxo da ferramenta

1. Enviar o roteiro aprovado para `POST /v1/jobs` como JSON com `audio.source: "google-tts"`, `audio.path: "narration.wav"` e `audio.scriptApproved: true`. Para reutilizar WAV definitivo do Google ou incluir mídia local, enviar uma requisição multipart conforme o contrato.
2. Guardar o ID retornado pelo servidor. Consultar `GET /v1/jobs/{id}` até o estado terminal, respeitando os limites de tempo do conector.
3. Após a conclusão, recuperar o MP4 e o SRT pelos endpoints autenticados. Para oferecer o arquivo no ChatGPT, teste se o conector suporta o tamanho da mídia e a transferência autenticada. A URL de download exige Bearer.

A configuração do conector usa `STUDIO_API_TOKEN` no ambiente seguro da integração. `GEMINI_API_KEY` fica no painel da hospedagem. Faça o primeiro teste com roteiro sintético e verifique que as rotas de produção e download exigem autenticação.
