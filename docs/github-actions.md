# GitHub Actions

## CI

`.github/workflows/ci.yml` instala dependências com `npm ci`, verifica tipos e executa testes em pushes e pull requests. As permissões são de leitura do conteúdo. Instala FFmpeg para as verificações de mídia. Falhas preservam o status dos comandos e ficam nos logs.

O teste do contêiner de renderização é opcional. Use **Actions → Verificações → Run workflow** quando precisar testá-lo.

## Render demonstrativo

Na aba **Actions → Render demonstrativo → Run workflow**, selecione a branch e execute. O workflow instala FFmpeg, usa o Chrome do runner e chama `npm run demo`.

Após sucesso, abra a execução e baixe **medicina-democratica-demo** na seção **Artifacts**. O ZIP contém o MP4 e os relatórios JSON disponíveis em `outputs/`. O GitHub pode exigir login e permissão para baixar artefatos; o endereço do artefato não é um link público permanente para o MP4. A retenção é de três dias, e a exclusão da execução pode remover o arquivo antes disso.

O YAML configura a execução, mas uma execução real requer que o código chegue ao GitHub e que Actions esteja habilitado. Se isso ainda não ocorreu, o render remoto permanece não validado. Este workflow não publica vídeos em redes sociais.

## Custos e privacidade

O workflow manual é reservado ao demonstrativo sintético. Cada execução usa recursos e a franquia da conta GitHub; confirme os limites antes de operações com cobrança. Nenhum serviço pago adicional é criado pelo código.

Os episódios editoriais e seus arquivos privados seguem a [ordem PRIME+ no Work](prime-enxuto.md).
