# Medicina Democrática Studio

**PRIME+ ENXUTO** · Roteiro aprovado → Google AI Studio / Charon → WAV no ChatGPT Work → edição e MP4 → aprovação → Metricool.

O repositório mantém a integração de voz. O Work conduz a edição, a trilha, o B-roll, as animações, as legendas e a revisão. A entrega é MP4 vertical de 1080 × 1920 até 2min59s, WAV original, SRT e descrição.

## Começar pelo Work

Use a [ordem PRIME+](docs/prime-enxuto.md) com o roteiro aprovado. No Android, veja o [guia do Work](docs/mobile.md).

Para gerar a voz no checkout, use Node.js 24 e FFmpeg/ffprobe. Configure a chave de um projeto gratuito no ambiente privado do Work.

```sh
npm ci
npm run tts -- --input /pasta/privada/roteiro-aprovado.txt --output /pasta/privada/narracao-charon.wav
```

O comando valida e entrega o WAV ao Work na mesma pasta de produção. O [guia de TTS](docs/automated-tts.md) explica a direção por episódio e o uso do AI Studio pelo navegador quando o ambiente está sem chave.

## Recursos opcionais

- [Renderizador, formato de episódios e validação](docs/production.md) · [demonstração silenciosa](examples/showcase/demo.mp4)
- [Formulário e API de renderização](docs/chatgpt-integration.md) · [execução local](docs/local.md) · [implantação](docs/deployment.md) · [segurança](docs/security.md)
- [Biblioteca visual](library/README.md) · [Blender](blender/README.md) · [testes e demonstração no GitHub](docs/github-actions.md) · [relatório de validação](docs/validation.md)

Para verificar mudanças no código, use `npm run typecheck` e `npm test`. O teste do contêiner é opcional e pode ser executado manualmente pelo workflow **Verificações**.

## Licenças

O [MIT](LICENSE) cobre o código, a documentação e os visuais procedurais originais do repositório. Consulte as licenças das dependências e dos recursos externos separadamente, incluindo [os termos do Remotion](https://www.remotion.dev/license).
