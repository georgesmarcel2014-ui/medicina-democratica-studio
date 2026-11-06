# Segurança de insumos e resultados

O código e os templates genéricos podem ficar públicos. Roteiros inéditos, WAVs, imagens proprietárias, dados de pacientes e MP4s de produção devem ficar em armazenamento privado separado. Nunca versionar `.env`, chaves, tokens, URLs assinadas ou credenciais. Use dados sintéticos em testes e demonstrações.

## Execução

- Execute o renderizador com uma conta sem privilégios administrativos e sem acesso a arquivos alheios ao trabalho.
- Aceite somente mídia e JSON validados. Um recurso audiovisual e um arquivo `.blend` são insumos não confiáveis: não execute scripts neles.
- Mantenha diretórios isolados por produção e limites de tamanho, duração, CPU, memória e tempo.
- Não use título, caminho arbitrário ou URL fornecida pelo solicitante como comando de shell.
- Um identificador de produção não é autenticação. Downloads exigem autorização ou URL de curta validade.
- Não registre roteiro, áudio, tokens ou URLs assinadas nos logs. Use identificadores opacos, estado e códigos sanitizados.
- Defina retenção e exclusão de mídia, derivados, logs e backups.

## GitHub Actions

Os workflows recebem somente demonstrativos sintéticos. Não passe URLs privadas, roteiros ou WAVs por `workflow_dispatch`: entradas e logs podem ser visíveis a colaboradores e persistir no histórico. O artefato demonstrativo não contém produção privada e usa retenção curta.

CI roda com `contents: read`, sem segredos, sem publicação automática e sem `pull_request_target`. Não exponha um runner self-hosted com mídia privada a pull requests de forks. Uma futura produção privada exige executor isolado e confiável, ambiente protegido e nenhum código externo não revisado na fila.

## Hospedagem

Antes de expor a API, coloque TLS, autorização por usuário/produção, controle de acesso ao armazenamento, limitação de requisições e fila, isolamento do worker e monitoramento. A API inicial com token compartilhado não constitui uma aplicação multiusuário: todos os detentores do token devem pertencer ao mesmo domínio de confiança. O servidor de desenvolvimento não deve ser tratado automaticamente como serviço de produção na Internet. Não envie dados reais de pacientes a um endpoint experimental.
