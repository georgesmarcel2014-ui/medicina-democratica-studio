# Medicina Democrática Studio

**PRIME+ tradicional** · Roteiro aprovado → **operador gera Charon no Google AI Studio** → envia WAV + roteiro ao **ChatGPT Work** → edição cinematográfica → **MP4 com download direto na conversa**, SRT e descrição copiável → aprovação. **Não publicar/agendar automaticamente.**

O repositório mantém recursos técnicos de voz e renderização **opcionais**. O Work conduz a edição, a trilha, o B-roll, as animações, as legendas e a revisão com o WAV já aprovado. A entrega é MP4 vertical 1080 × 1920 (máximo 179 s), WAV original, SRT e descrição para Instagram/TikTok.

## Começar pelo Work

Use a [ordem PRIME+](docs/prime-enxuto.md) com **roteiro aprovado e WAV Charon enviado pelo operador**. No Android, veja o [guia do Work](docs/mobile.md). [Regras dos agentes](AGENTS.md), [gates de qualidade](docs/quality.md), [handoff de episódio](docs/episode-handoff.template.md) e [integração seletiva do toolkit](docs/toolkit-integration.md) documentam o processo.

**Opcional, fora do fluxo padrão:** para gerar voz por CLI em um checkout autorizado, use Node.js 24 e FFmpeg/ffprobe, com credencial exclusivamente em ambiente privado. Você não precisa usar CLI para fornecer o WAV gerado no AI Studio.

```sh
npm ci
npm run tts -- --input /pasta/privada/roteiro-aprovado.txt --output /pasta/privada/narracao-charon.wav
```

O comando valida e entrega o WAV ao Work na mesma pasta de produção. O [guia de TTS](docs/automated-tts.md) explica a direção por episódio e o uso do AI Studio pelo navegador quando o ambiente está sem chave.

## Recursos opcionais

- [Renderizador, formato de episódios e validação](docs/production.md) · [demonstração silenciosa](examples/showcase/demo.mp4)
- [Formulário e API de renderização](docs/chatgpt-integration.md) · [execução local](docs/local.md) · [implantação](docs/deployment.md) · [segurança](docs/security.md)
- [Biblioteca visual](library/README.md) · [Blender](blender/README.md) · [testes e demonstração no GitHub](docs/github-actions.md) · [relatório de validação](docs/validation.md)

Para verificar mudanças no código, use `npm run typecheck` e `npm test`. O teste documental PRIME+ pode ser executado **sem dependências**: `npm run test:prime` (ou `node --test tests/prime-contract.test.mjs`). O teste do contêiner continua opcional; não renderize episódios via GitHub Actions.

## Licenças

O [MIT](LICENSE) cobre o código, a documentação e os visuais procedurais originais do repositório. Consulte as licenças das dependências e dos recursos externos separadamente, incluindo [os termos do Remotion](https://www.remotion.dev/license).
