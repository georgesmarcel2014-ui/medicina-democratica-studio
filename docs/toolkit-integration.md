# Integração seletiva do Vibe Coding Toolkit

**Em 12/11/2026**, o projeto avaliou o [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) na revisão `7ef68dd7b00ddfc5cd464458855e4ab66dd2128f`, com destaque para `templates/AGENTS.md.template`, `templates/task-handoff.md.template`, `docs/07-harness-evaluation.md` e `docs/prompts/12-existing-project-setup.md`.

**Não é uma instalação integral**. As ideias foram adaptadas manualmente ao projeto existente, sem copiar scripts executáveis, migrar stack ou conferir permissões adicionais. Um documento criado não prova que outro cliente já o carregou.

## Cobertura das quatro fases

| Fase / componente | Decisão e escopo | Evidência e limite |
|---|---|---|
| 1. Instruções portáveis / AGENTS.md | Adotado: regra curta apontando para fontes canônicas e comandos reais | Ver arquivo; novo agente ainda precisa comprovar leitura |
| 1. Fluxo oficial documentado | Adotado: README, PRIME+ e Android especificam WAV Charon enviado pelo operador | Revisão documental; não valida MP4 |
| 2. Quality gates | Adotado: checklist de revisão + teste de contrato sem serviços | `npm run test:prime`; qualidade audiovisual real continua humana |
| 3. Recuperação de contexto | Adotado: modelo de handoff **privado** por episódio | Modelo pronto; não há sessão real recuperada neste setup |
| 4. Harness e segurança | Adotado: casos de teste comportamental e proteção de segredos; manter testes e CI existentes sem expandi-los | Testes comportamentais exigem observação, não presumir execução |

## Decisões de exclusão e adiamento

- **Superpowers, Ponytail, Caveman, Context7 e subagentes**: opcionais por cliente; não instalar ou configurar globalmente neste escopo. Podem ser úteis no futuro quando houver uma tarefa comprovada que justifique sua adoção.
- **RTK, Graphify, Obsidian e memória externa**: não necessários para o fluxo atual; arquivos versionados + handoff privado bastam por ora.
- **Next.js, banco PostgreSQL/Drizzle, shadcn, Next dev loop, Sentry e Vercel**: não aplicáveis à arquitetura atual sem demanda concreta. O código existente usa TypeScript/Remotion/React/Fastify; preservar contratos.
- **GitHub Actions render, deploy, servidores ou serviços pagos**: excluídos por decisão operacional; não publicar, agendar, automatizar postagem ou ativar faturamento.
- **CLI opcional do Harness2 e benchmarks remotos**: não autorizados; usar apenas metodologia nativa de avaliação descrita em [harness-evaluation.md](harness-evaluation.md).
- **Revisão de segurança ampla e auditorias externas**: não executadas nesta adoção; usar [security.md](security.md) e revisão por escopo quando surgirem mudanças sensíveis.

## Evidências e retorno seguro

As alterações propostas são de instruções, documentação e teste leve de contrato. **Nenhuma alteração ao mecanismo de renderização, TTS, armazenamento ou envio às redes.** Qualquer execução de `npm ci`, `npm test`, render real ou teste de agente deve ser registrada com resultado, ambiente e data; sem execução, marcar `not-run`. Validar a branch separada antes de considerar merge; aprovação editorial e publicação continuam gates externos distintos.
