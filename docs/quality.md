# Controle de qualidade PRIME+ — gates verificáveis e revisão humana

Esta é a referência de **qualidade e liberação**, sem substituir a direção criativa do Work ou a aprovação do operador. Separar sempre **checado por ferramenta**, **checado por pessoa** e **não verificado**.

## Gate A — contrato de código (reproduzível sem mídia)

- `npm run test:prime`: confirma que as instruções canônicas preservam o WAV fornecido pelo operador, a proibição de publicação automática e os invariantes declarados no esquema técnico.
- `npm run typecheck` e `npm test`: validam os tipos, código e testes existentes, quando houver Node/depêndencias instalados em ambiente autorizado.
- `npm run test:render` e `npm run test:production`: opcionais, exigem ferramentas de renderização; usam fixtures sintéticas, não são etapas de produção editorial.
- **Não ativar GitHub Actions de render nem serviços pagos** para executar este gate. Tests declarados e documentação não provam que a execução aconteceu.

## Gate B — arquivo real (somente com MP4/WAV fornecidos)

- Conferir duração integral <= **179 s** (não truncar o WAV), MP4 com **1080 × 1920, 30 fps, H.264 e AAC** e integridade de decodificação.
- Conferir se o WAV original foi preservado e se a fala completa está audível; avaliar mixagem da trilha e clipping. Validar início/fim e precisão de sincronismo do SRT contra a fala.
- A inspeção técnica pode usar `ffprobe -v error -show_format -show_streams -of json video.mp4` e `ffmpeg -v error -xerror -i video.mp4 -f null -` **em ambiente isolado e autorizado**, sem enviar material privado a terceiros.
- **Não declarar Gate B aprovado** apenas por conferir um arquivo de demonstração silenciosa.

## Gate C — revisão editorial humana (sempre obrigatória)

- **Primeiros segundos**: manchete/pergunta/tese inequívoca; em Notícias, data correta do fato no primeiro frame.
- **Progresso narrativo**: cada passagem entrega informação nova; sem repetição inútil, suspense artificial ou contexto alongado.
- **Variedade visual**: mudanças e recursos visuais sustentam fatos, referências e explicações; evitar planos repetidos e cartelas genéricas em sequência.
- **Correção médica**: fatos, números, denominadores, datas, unidades, recomendações e incertezas confirmados; não inventar fontes, estatísticas ou conclusões causais.
- **Ética visual**: licença/origem conferida; arquivo versus reconstrução identificado; nada de imagem enganosa.
- **Acabamento**: música documental discreta, voz Charon natural e inteligível, legendas centrais legíveis e em área segura, transições contidas e observação do vídeo inteiro no formato de celular.
- **Entrega**: MP4 diretamente baixável, WAV original, SRT, legenda/descrição copiável e identificação da versão revisada.
- **Publicação**: não executar. Aprovação do corte e pedido explícito de publicar/agendar são decisões distintas.

## Registro mínimo por episódio (fora do Git para materiais privados)

`episodio | versao | roteiro_aprovado | WAV_recebido | Gate_A (pass/fail/not-run) | Gate_B (pass/fail/not-run) | Gate_C (aprovado/pendente) | evidencias | pendencias | proxima_acao`

Anote ferramentas, comandos efetivamente usados e limitações. Gate técnico aprovado **não** implica nota PRIME+ nem aprovação clínica. Não fixe contagem de cortes por minuto como substituto de julgamento editorial.

Consulte [prime-enxuto.md](prime-enxuto.md), [production.md](production.md) e [harness-evaluation.md](harness-evaluation.md).
