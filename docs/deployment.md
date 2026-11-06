# Implantação no Render

O Blueprint usa um serviço Docker HTTPS de uma instância (`1c-2g`) e um disco de 10 GB. O contêiner inclui Chromium, FFmpeg e Whisper small. O Render exibe o custo de computação e disco antes da confirmação. Confira [os planos](https://render.com/pricing) e [o funcionamento do disco](https://render.com/docs/disks).

## Ativar

1. Abra [Deploy no Render](https://render.com/deploy?repo=https://github.com/georgesmarcel2014-ui/medicina-democratica-studio), entre na sua conta e conecte o repositório. Selecione a branch `main` e revise o serviço descrito em `render.yaml`.
2. Gere uma chave em [Google AI Studio](https://aistudio.google.com/apikey). Preencha `GEMINI_API_KEY` no campo secreto do Blueprint. Para cadastrar ou trocar a chave depois, abra **Render Dashboard → medicina-democratica-studio → Environment** e salve com redeploy. Consulte [variáveis e segredos do Render](https://render.com/docs/configure-environment-variables).
3. Aprove a criação no painel. Quando o serviço estiver ativo, abra sua URL HTTPS e use o `STUDIO_API_TOKEN` gerado pelo Render como chave de acesso no formulário. `GET /healthz` confirma que o processo iniciou.
4. Faça a primeira produção com um roteiro sintético, baixe o MP4 e o SRT e confira narração e sincronismo. Isso confirma o acesso real ao Google TTS, que depende da chave, do modelo e da cota da conta.

## Operar

O serviço inicia com um usuário sem privilégios de administrador. Os insumos e resultados ficam em `/var/data/jobs` em pastas privadas. O token autoriza todos os trabalhos desse estúdio de operador único. Monitore o espaço no disco. Em uma janela sem trabalhos ativos, o administrador pode remover pelo Shell os diretórios dos trabalhos encerrados e reiniciar o serviço para atualizar o índice. Considere a retenção dos snapshots do Render.

A fila executa um trabalho de cada vez. Após reinício, trabalhos pendentes ou ativos recebem `INTERRUPTED`. Se o WAV já estiver disponível, baixe-o pela interface e reenvie com o roteiro aprovado para reaproveitar a voz. O Blueprint usa deploy manual, o que permite atualizar o serviço entre produções.

## Verificar localmente

Rode `npm run typecheck`, `npm test` e `npm run test:render`. Para `npm run test:production`, use Chromium/Chrome, FFmpeg, `espeak-ng`, o ambiente Python com `deploy/requirements-asr.txt`, `STUDIO_ASR_PYTHON` apontando para seu Python e `STUDIO_WHISPER_MODEL` apontando para o diretório local do modelo Whisper small. O `Dockerfile` fixa a revisão e verifica os pesos usados na hospedagem. O teste gera uma fala sintética e usa a resposta Google simulada para validar HTTP, WAV, reconhecimento da fala, legendas, render e download autenticado.
