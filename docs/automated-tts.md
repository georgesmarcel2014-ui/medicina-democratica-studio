# TTS automatizado — Google AI Studio / Gemini API

O Google AI Studio possui API de geração de fala. O módulo inicial em src/pipeline/google-tts.ts executa TTS de um roteiro aprovado usando **somente** o endpoint de áudio do Google Gemini, sem Runway, e encapsula PCM 24 kHz mono em WAV. A entrada é um texto; nenhum WAV precisa ser criado manualmente para esta etapa.

## Configuração segura

1. Crie uma chave da API Gemini na sua conta em https://aistudio.google.com/apikey e confira os limites/preços da conta antes de utilizar.
2. Configure GEMINI_API_KEY como **segredo no ambiente do servidor/worker**, não no navegador, no Git, em .env versionado, em issue, no chat nem em parâmetros de GitHub Actions.
3. Garanta Node.js 24, FFmpeg/ffprobe e conectividade HTTPS de saída com generativelanguage.googleapis.com.

Para uso administrativo isolado, em um computador/servidor que já tenha a variável de ambiente configurada:

    npm run tts -- --input /caminho/privado/roteiro-aprovado.txt --output /caminho/privado/narration.wav

O comando usa o modelo gemini-2.5-flash-preview-tts e a voz Charon por padrão, com pt-BR. Opcionalmente, --voice Kore ou --model gemini-2.5-pro-preview-tts.

O WAV é validado com ffprobe, possui duração máxima de 179 segundos e é salvo fora do repositório. Texto e credenciais não são mostrados em logs de sucesso. O Google pode variar a pronúncia, omitir ou repetir palavras; revise o áudio antes da publicação.

## O que já está implementado

- Requisição HTTPS autenticada ao Google Gemini TTS.
- Conversão da resposta PCM para um WAV utilizável no pipeline existente.
- Restrição de duração, validação do arquivo, erros sem corpo da resposta externa, testes com respostas simuladas.
- CLI administrativo executável por processo isolado com chave privada.

**Não está implementado nesta entrega:** criação de jobs só com texto pelo formulário/API, alinhamento acústico real de legendas, conexão ChatGPT/Work autenticada, hospedagem HTTPS e entrega automática do MP4 a partir de uma única mensagem. Não declarar o sistema fim a fim concluído até testar tudo isso.

## Contrato para integração final no Work

1. Receber a ordem editorial e gerar/validar **roteiro final**. Não inventar alegações médicas; usar fontes verificáveis e revisão editorial.
2. Se houver WAV do Google fornecido e aprovado, reutilizá-lo sem novo TTS. Caso contrário, chamar a função Google TTS **no servidor**, usando um segredo, após aprovação editorial do texto.
3. Criar WAV **uma única vez por versão aprovada** e reutilizar exatamente o mesmo áudio em eventuais correções de legendas/visuais. Não fazer TTS de novo ao renderizar.
4. Executar alinhamento forçado ou ASR real com tempos **por palavra** (ex.: WhisperX no worker privado), comparar transcrição reconhecida com roteiro, revisar termos médicos e rejeitar alinhamentos suspeitos. Nunca estimar timestamps apenas pelo número de caracteres.
5. Usar cenas licenciadas ou originais com distinção entre Notícias, História e Na Prática. Manter 1080×1920, 30 FPS, 9:16, legendas em área segura e barra de progresso, máx. 179 s.
6. Renderizar, validar por FFprobe e inspeção audiovisual, salvar insumos/saídas de forma privada e devolver link autenticado do MP4.
7. Implantar autenticação, TLS, fila persistente, isolamento dos workers, política de retenção e cobrança limitada. Integrar conector ChatGPT somente após testes reais de upload/status/download; não presumir que um OpenAPI ou URL local instala a integração.
8. Fazer teste com material sintético, incluindo falhas de cota, áudio mais longo que 179 s, erros do alinhador, falha de render, mau uso da API e revogação de acesso. Registrar resultados verificáveis.

**Nota de segurança:** os workflows públicos do GitHub ficam restritos à demonstração sintética. Não colocar WAVs ou roteiros de produção em GitHub Actions nem converter o runner público em fila de produção.
