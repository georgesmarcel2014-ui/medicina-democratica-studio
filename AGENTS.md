# Medicina Democrática Studio — instruções para agentes

Este repositório é a base técnica da **Medicina Democrática**, não um serviço de publicação automática. Consulte `README.md` e os documentos canônicos antes de modificar qualquer fluxo.

## Contrato editorial e operacional (prioridade máxima)

1. Preserve o fluxo **PRIME+ tradicional**: roteiro aprovado → o operador gera a narração **Charon** no Google AI Studio e fornece o **WAV definitivo** → edição cinematográfica no **ChatGPT Work** → **MP4 9:16 para download direto na conversa**, SRT, WAV original e descrição copiável → revisão e aprovação do operador.
2. Não regenere nem substitua o WAV recebido, não altere pitch, não corte trechos para caber no tempo e não faça render automático genérico em lugar da edição do Work. O TTS por CLI e o motor Remotion são ferramentas opcionais de suporte/contingência, não o padrão artístico.
3. Preserve **1080 × 1920**, **30 fps**, H.264/AAC, duração de **até 179 s**, legendas centralizadas na área segura, barra de progresso quando fizer parte da identidade aprovada, um narrador, trilha documental discreta e variedade de planos guiada por novas informações.
4. O roteiro deve ter abertura com a manchete/tese, progressão densa e verificável, sem repetição ou suspense artificial. Para notícias, a data do evento deve aparecer no primeiro frame quando aplicável; jamais invente fato, estatística, fonte ou data. As cinco frentes editoriais são Notícias, História, SUS, Na Prática/POV e Curiosidades; nem todas estão representadas na enumeração do renderizador legado.
5. **Não publique, agende ou envie posts ao Metricool sem aprovação e pedido explícitos.** Preparar texto para copiar/colar não é autorização para postar.
6. Operação prioritária no Android; sem depender de PC, Docker, hospedagem paga ou render em GitHub Actions. Não crie custos nem ative faturamento. Nunca peça ou versione credenciais; não inclua dados de pacientes ou materiais privados no repositório.
7. Não altere `main` sem autorização específica; mantenha mudanças experimentais isoladas. Não faça migrações de stack, deploy, mudanças destrutivas ou instalação de ferramentas globais sem aprovação.

## Fontes de verdade

- Produção e fluxo aprovado: [docs/prime-enxuto.md](docs/prime-enxuto.md)
- Operação no Android e prompt de edição: [docs/mobile.md](docs/mobile.md)
- Testes técnicos e inspeção editorial: [docs/quality.md](docs/quality.md)
- Recuperação entre sessões: [docs/episode-handoff.template.md](docs/episode-handoff.template.md)
- Método de avaliação de agentes: [docs/harness-evaluation.md](docs/harness-evaluation.md)
- Integração seletiva do toolkit: [docs/toolkit-integration.md](docs/toolkit-integration.md)
- Segurança e isolamento: [docs/security.md](docs/security.md)
- Documentação técnica opcional: [docs/production.md](docs/production.md), [docs/automated-tts.md](docs/automated-tts.md)

## Comandos reais existentes

- Dependências: `npm ci` (Node.js 24; apenas em ambiente autorizado).
- Tipos: `npm run typecheck`.
- Testes unitários existentes + contrato PRIME+: `npm test`.
- Teste de contrato isolado, sem dependências nem serviços: `npm run test:prime` (ou `node --test tests/prime-contract.test.mjs`).
- Testes de renderização são **opt-in**: `npm run test:render` e `npm run test:production`. Dependem de recursos locais e não provam qualidade criativa.

## Acordos de trabalho

Leia o escopo, os arquivos atingidos e testes antes de editar. Prefira a menor mudança reversível, sem duplicar documentação ou dependências. Para bugs, registre reprodução, alteração e verificação. Para mudanças criativas, anote evidências técnicas **e** itens que ainda exigem revisão visual, médica e editorial humana. Não apresente documentação, presença de ferramenta ou teste sintético como prova de um MP4 PRIME+ aprovado.

Se a sessão falhar ou for interrompida, registre um handoff **privado** com estado verificado, arquivos produzidos, bloqueadores, testes rodados e a próxima ação. Ao retomar, confira os arquivos e o ambiente, não confie apenas no relato anterior. Nunca insira WAV, roteiro inédito, MP4, tokens ou links assinados no Git.
