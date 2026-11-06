# Acionamento futuro pelo ChatGPT

O motor pode ser chamado por software, mas **não há uma conexão ChatGPT/Work validada**. Um arquivo OpenAPI, uma URL local ou um workflow não estabelece essa conexão. Entrega direta do MP4 nesta conversa exige integração real autorizada e não é uma capacidade presumida deste projeto.

## Fluxo de produção proposto

1. O usuário entrega a ordem editorial aprovada, direitos dos recursos e WAV final do Google AI Studio.
2. Uma ferramenta autenticada transfere arquivos diretamente para armazenamento privado, sem publicá-los no GitHub.
3. A ferramenta cria um trabalho validado e recebe um identificador opaco.
4. Um worker isolado executa validação, alinhamento aprovado, composição Remotion, render e inspeção audiovisual.
5. A ferramenta consulta estado e recupera erro sanitizado ou download autorizado.
6. O ChatGPT apresenta o link. Anexar o MP4 na conversa só deve ser anunciado depois de testar um conector com essa função.

## API inicial

O contrato implementado fica em [openapi.yaml](openapi.yaml). A API recebe um trabalho multipart com episódio, WAV e recursos locais, exige token Bearer e oferece consulta e download autenticados. Consulte o contrato e os testes para os nomes exatos dos endpoints. O token deve ser configurado por `STUDIO_API_TOKEN` com pelo menos 32 caracteres, fora do Git; o diretório de trabalhos é definido por `STUDIO_JOBS_DIR`. O serviço inicia em loopback por padrão.

Também há um formulário web em `GET /`, servido com `GET /ui.js`. O operador informa chave, título, série e roteiro, seleciona WAV e JSON de legendas temporizadas e confirma a aprovação do áudio. A interface monta o episódio com cenas automáticas, consulta o estado, baixa o resultado autenticado e permite retomar por ID. A chave não é gravada em armazenamento do navegador. A interface inicial não prepara o alinhamento acústico nem recebe assets personalizados; o JSON de legendas precisa ser obtido antes. O formulário é uma interface própria do estúdio, sem conexão implementada com o ChatGPT.

Essa API fornece uma base de integração, sem hospedagem, OAuth, identidade multiusuário, fila distribuída ou conector do ChatGPT implantados. Um conector deve respeitar as limitações reais de upload, tempo e tamanho de arquivo da plataforma. Renders longos exigem consulta assíncrona; não mantenha uma chamada do ChatGPT aberta durante todo o render.

## Requisitos externos

- Hospedagem HTTPS e worker com Chromium, FFmpeg, CPU/RAM e armazenamento suficientes.
- Armazenamento privado com retenção e exclusão.
- Autenticação e autorização do serviço/conector configuradas fora do código.
- Conector/Action/MCP permitido na conta e testes de transferência real, acompanhamento e download.
- Monitoramento, fila persistente e recuperação após reinício para operação contínua.

Não coloque credenciais no repositório nem em mensagens. Use o gerenciador de segredos da hospedagem. Antes de aceitar conteúdo real, teste ponta a ponta com material sintético e confirme que um solicitante não autorizado não consegue consultar nem baixar o trabalho.
