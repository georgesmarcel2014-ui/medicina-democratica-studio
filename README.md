# Medicina Democrática Studio

Pipeline modular para produzir vídeos científicos verticais com **Remotion + FFmpeg**, preservando a narração WAV definitiva e permitindo revisão de legendas sem refazer o áudio.

O projeto recebe uma especificação estruturada de episódio, valida os insumos, monta cenas e legendas, renderiza MP4 H.264 em 1080 × 1920 a 30 FPS e verifica o resultado. A duração máxima é **179 segundos**. Uma demonstração sem narração exercita os elementos visuais originais; ela não substitui o WAV exigido para episódios de produção.

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

## Formulário de produção

O administrador configura `STUDIO_API_TOKEN` (pelo menos 32 caracteres) e `STUDIO_JOBS_DIR` para uma pasta privada e inicia o serviço com `npm run api`. O serviço usa a porta 8787 e escuta em loopback por padrão. Configure hospedagem HTTPS protegida antes de oferecer acesso remoto.

Com o serviço aberto no navegador, o operador informa sua chave de acesso, título, série e roteiro aprovado; seleciona o WAV e um JSON com o array de legendas já alinhadas; confirma que o WAV final do Google AI Studio está aprovado; e solicita o render. O formulário cria a especificação e as cenas automáticas, acompanha o estado e oferece download autenticado do MP4. A chave fica somente na memória da página. É possível retomar o acompanhamento por identificador de produção.

O formulário inicial ainda exige legendas temporizadas preparadas previamente. Não executa WhisperX nem transcrição automática e não oferece upload de recursos visuais personalizados; esses recursos são suportados pela API estruturada. Ele elimina os comandos de render do trabalho do operador, mas não constitui ainda a experiência completa de enviar apenas uma ordem no ChatGPT e um WAV.

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

O workflow manual gera um demonstrativo público e o entrega como artefato do GitHub Actions. **A existência do YAML não comprova uma execução remota:** consulte os logs da execução. O fluxo com ChatGPT necessita de um conector autorizado, hospedagem e autenticação; o repositório não estabelece por si só essa conexão nem entrega arquivos diretamente na conversa.

O render local pode ser automatizado por um servidor, mas hospedagem pública, armazenamento de produção e integração com contas externas não são provisionados automaticamente. Não armazene dados identificáveis de pacientes neste repositório.

## Licenças

O código, a documentação e os visuais procedurais originais deste repositório usam [MIT](LICENSE). Essa licença não altera os termos de dependências ou recursos externos. O registro dos visuais fica em `library/`. Não foram incorporados pacotes Quaternius, Kenney ou Poly Haven. Cada recurso futuro precisa de origem, licença e permissão de redistribuição verificadas antes de inclusão.

O Remotion tem termos próprios: consulte a licença da versão instalada e [a página oficial de licenças](https://www.remotion.dev/license) antes de operação comercial, especialmente automação como serviço. Não se presume gratuidade para todos os cenários comerciais. As versões fixadas no lockfile incluem Remotion 4.0.541, Fastify 5.12.8 e Zod 4.6.7; consulte o relatório de validação para os resultados da auditoria executada nesta entrega.
