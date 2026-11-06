# Medicina Democrática Studio

Pipeline para produzir vídeos científicos verticais com **Google AI Studio, faster-whisper, Remotion e FFmpeg**. A partir do roteiro aprovado, o estúdio gera o WAV, sincroniza as legendas pela fala e entrega MP4 e SRT. Um WAV definitivo do Google AI Studio também pode ser enviado para reutilizar a narração.

O estúdio monta as cenas, valida e renderiza MP4 H.264 em 1080 × 1920 a 30 FPS. A duração máxima é **179 segundos**. A demonstração silenciosa apresenta os elementos visuais originais.

[Baixar demonstração MP4 silenciosa (10 segundos)](examples/showcase/demo.mp4) · [Relatório de validação](docs/validation.md)

## Começar

Requisitos: Node.js 24, npm, FFmpeg/ffprobe no `PATH` e Chromium/Chrome. Não é necessário Blender para o primeiro render.

Esta seção é para quem administra o ambiente. O operador pode usar o formulário web do serviço após a instalação; não precisa executar os comandos de render manualmente. A conexão direta pelo ChatGPT ainda depende da implantação e do conector descritos adiante.

```sh
npm ci
npm run typecheck
npm test
npm run demo
```

Os testes usam o executor do Node.js 24 com `--test-isolation=none`; o comando continua executando as asserções dos testes.

O demonstrativo é gravado em `outputs/demo.mp4`. Para renderizar um episódio aprovado:

```sh
npm run render -- --input /caminho/privado/episode.json --output /caminho/privado/final.mp4
```

Em servidores sem navegador descoberto automaticamente, configure `CHROME_PATH` para o executável do Chromium/Chrome. Arquivos de produção devem ficar fora do checkout ou em diretórios ignorados. Os caminhos de mídia do episódio são resolvidos a partir do diretório do JSON de entrada.

## Hospedagem e segredos

Para operar no próprio computador, o [guia de execução local](docs/local.md) inicia o estúdio no Windows com Docker Desktop, mantém os arquivos em um volume local e guarda a chave do Google no perfil do Windows. O Google Flash TTS pode usar um projeto **Free Tier** dentro da cota da conta.

O [guia de implantação](docs/deployment.md) usa o `Dockerfile` e o Blueprint `render.yaml` para executar um serviço HTTPS de operador único, com disco persistente. Configure `GEMINI_API_KEY` no painel **Environment** do serviço. O Blueprint gera um `STUDIO_API_TOKEN` separado para acessar o estúdio.

Veja [Google TTS e legendas automáticas](docs/automated-tts.md) para o comando de WAV isolado e o comportamento de cada modo.

## Formulário de produção

O administrador configura `STUDIO_API_TOKEN` (pelo menos 32 caracteres) e `STUDIO_JOBS_DIR` para uma pasta privada e inicia o serviço com `npm run api`. O serviço usa a porta 8787 e escuta em loopback por padrão. Configure hospedagem HTTPS protegida antes de oferecer acesso remoto.

Abra o serviço no navegador, informe o token do estúdio, título, série e roteiro, confirme a aprovação e selecione **Produzir vídeo**. Para reutilizar uma narração, anexe o WAV definitivo. Legendas revisadas em JSON são opcionais e devem corresponder ao WAV anexado. O formulário usa cenas automáticas e acompanha a fila pelo ID do trabalho. Depois do render, oferece download autenticado do MP4, SRT e WAV. Recursos visuais personalizados podem ser enviados pela [API](docs/openapi.yaml).

## Linhas editoriais

| Série | Recursos iniciais |
| --- | --- |
| `noticias` | Composição jornalística, gráficos, mapas esquemáticos e destaques animados. |
| `historia` | Documentos, linha do tempo e linguagem de minidocumentário; reconstituições devem ser identificadas. |
| `na-pratica` | Clínica e personagens procedurais low-poly com movimento; imagens esquemáticas são educativas e não uma validação clínica de procedimentos. |

As três linhas compartilham marca, legendas em área segura e barra de progresso. As peças originais constituem uma biblioteca inicial; personagens e ambientes importados de terceiros não estão incluídos.

## Operação e limites

- [Produção, validação e formato do episódio](docs/production.md).
- [Segurança e armazenamento privado](docs/security.md).
- [GitHub Actions e downloads](docs/github-actions.md).
- [Plano de integração com ChatGPT](docs/chatgpt-integration.md).
- [Biblioteca, licenças e atribuições](library/README.md).
- [Módulo Blender opcional](blender/README.md).
- [Evidências de validação](docs/validation.md).

O workflow manual gera um demonstrativo sintético no GitHub Actions. A integração direta com ChatGPT/Work depende de um conector autorizado, descrito em [Acionamento pelo ChatGPT](docs/chatgpt-integration.md). Reserve o GitHub para código e fixtures sintéticas.

## Licenças

O código, a documentação e os visuais procedurais originais deste repositório usam [MIT](LICENSE). Essa licença não altera os termos de dependências ou recursos externos. O registro dos visuais fica em `library/`. Não foram incorporados pacotes Quaternius, Kenney ou Poly Haven. Cada recurso futuro precisa de origem, licença e permissão de redistribuição verificadas antes de inclusão.

O Remotion tem termos próprios: consulte a licença da versão instalada e [a página oficial de licenças](https://www.remotion.dev/license) antes de operação comercial, especialmente automação como serviço. Não se presume gratuidade para todos os cenários comerciais. As versões fixadas no lockfile incluem Remotion 4.0.541, Fastify 5.12.8 e Zod 4.6.7; consulte o relatório de validação para os resultados da auditoria executada nesta entrega.
