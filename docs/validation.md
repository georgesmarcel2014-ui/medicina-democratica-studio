# Evidências de validação

## Fluxo automático

Em 6 de novembro de 2026, `npm run test:production` exercitou a API HTTP com uma resposta PCM simulada do Google e fala sintética em português. O teste executou faster-whisper, Remotion e FFmpeg, comparou o PCM do WAV baixado com o original e decodificou o MP4 recebido pela API. A saída foi H.264 1080 × 1920 a 30 FPS, AAC, 6,03 s, com legendas e SRT. MP4, SRT e WAV responderam com HTTP 401 em pedidos sem token.

O teste local usou Chromium e uma descrição da interface de loopback para o Remotion, pois o executor impede a enumeração de interfaces. A chamada real ao Google e o teste no serviço hospedado dependem da configuração descrita no [guia de implantação](deployment.md).

## Registro da versão inicial

As verificações a seguir registram a primeira entrega do motor audiovisual, anterior à integração do Google TTS com a API e o reconhecimento automático.

## Documentação, biblioteca e workflows

- Os arquivos `ci.yml` e `render-demo.yml` foram analisados com PyYAML sem erros de sintaxe. Isso não executa os jobs nem comprova permissões ou disponibilidade dos runners GitHub.
- `library/catalog.json` foi lido pelo parser JSON do Python, sem erro. O catálogo contém somente registro de visuais procedurais originais e referências a fornecedores externos ainda não importados.
- O helper `blender/render_animation.py` passou por análise sintática Python (`ast.parse`).

## Blender opcional

Foi criada uma cena sintética temporária com cubo, câmera e luz, sem downloads ou assets externos. O helper foi executado por Blender **4.3.2** em modo background, com autoexec desativado, intervalo de um quadro e diretório de saída novo.

- O primeiro teste diagnosticou ausência de OpenImageDenoise no build local. A cena sintética foi preparada com denoising desativado; não foi necessário alterar os arquivos do usuário ou as verificações de integridade.
- A repetição renderizou `frame_00001.png` e encerrou com código **0**. `ffprobe` confirmou codec PNG e resolução **1080 × 1920**.
- Nova chamada para o mesmo diretório não vazio foi rejeitada com código **2**, preservando o resultado anterior.

O teste valida carregamento de `.blend`, configuração de saída, render de quadro e proteção contra sobrescrita. Não valida personagens médicos importados, movimentos clínicos, sincronismo de animação com narração nem uma biblioteca 3D completa. A cena temporária e seus derivados não foram incorporados ao repositório.

## Pipeline, API e renderização

- `npm ci --no-audit --no-fund` instalou as dependências a partir do lockfile final. `npm run typecheck` passou.
- `npm test`: **27 testes aprovados**, sem falhas ou testes pulados. Cobrem limite absoluto do WAV, formato/origem declarada, ausência de TTS, legendas/palavras/SRT, importação WhisperX, cobertura e planejamento automático de cenas, mídia local, traversal/symlinks, projeção 3D animada e segurança/fila/download da API.
- Smoke real HTTP/Chromium do formulário: página200, API sem autenticação401, DOM com campos esperados e screenshot inspecionado em 1280×1800. Servidor e navegador efêmeros encerrados após a verificação. Não houve envio de uma produção privada pelo navegador.
- Os oito testes de API usam render injetado para validar autorização, upload, estados, falha sanitizada, reinício, FIFO e interface web. A simulação do formulário exercita criação multipart, acompanhamento e download; não prova um render narrado pelo formulário em um navegador remoto.
- `npm run test:render`: render real de **1 segundo/30 quadros**, com WAV silencioso criado exclusivamente como fixture técnica, imagem PNG e vídeo locais, legendas por palavra. Saída H.264 1080×1920/30 FPS + AAC; áudio decodificado e medido, SHA-256 do WAV original preservado, SRT/JSON/relatório e permissões privadas conferidos. Esse teste não usa voz, TTS ou uma narração de produção e não comprova sincronismo de voz real.
- `npm run demo`: MP4 silencioso de **10 segundos**, H.264, **1080×1920, 30 FPS**, três cenas originais (gráfico, timeline, clínica 3D). Sem faixa de áudio; não substitui o WAV de produção. `ffprobe` conferiu as propriedades e FFmpeg decodificou integralmente o resultado com falha em erro (`-xerror`). Frames do gráfico e da clínica extraídos do MP4 foram inspecionados visualmente.
- O render inicial identificou profundidade incorreta na câmera 3D, corrigida antes do MP4 final. A muxagem foi separada: Remotion produz os quadros e FFmpeg adiciona apenas o WAV original em AAC, sem `-t`, `-shortest`, cortes, mudança de velocidade ou mixagem de outras vozes.
- O download público do showcase pela branch foi realizado e o SHA-256 conferido contra o arquivo local; o arquivo baixado também passou pela decodificação e verificação audiovisual.
- Auditoria de dependências de produção (`npm audit --omit=dev --audit-level=high`) após atualização: **0 vulnerabilidades reportadas**. Isso é o resultado do registro na data da execução, não uma garantia permanente.

## Pendências externas e alcance

Não foi fornecido um WAV definitivo de produção. Não foram validados voz real, alinhamento acústico automático ou precisão clínica. O comando `align` importa alinhamento externo; não executa WhisperX.

O código contém workflows CI e render demonstrativo sob demanda. A branch `feat/automated-audiovisual-studio` foi enviada ao GitHub. A criação de PR e a consulta/disparo de Actions estão bloqueadas pelo acesso à API `api.github.com` na política atual; sua liberação foi salva no rascunho. Não houve execução remota comprovada. YAML válido não é uma execução comprovada. O formulário/API foi preparado para uso em servidor configurado, sem implantação pública HTTPS, identidade multiusuário, armazenamento gerenciado ou conector ChatGPT.

As configurações reutilizáveis `install_script` e `start_skill` e a inclusão de `api.github.com` foram salvas no rascunho do ambiente. Salvar o rascunho não publica o ambiente nem ativa a nova regra de rede. A publicação/restauração em uma nova tarefa não foi testada.
