# Produção de episódios

## Contrato editorial

Cada produção parte de título, série e roteiro aprovado. O formulário define a especificação do episódio e monta as cenas. A API estruturada também recebe cenas e recursos visuais. A aprovação médico-editorial do roteiro é responsabilidade do operador.

Para gerar a voz no servidor, declare `audio.source: "google-tts"`, `audio.scriptApproved: true` e `audio.path: "narration.wav"`. Para reutilizar um WAV definitivo, declare `audio.source: "google-ai-studio"` e `audio.approved: true` e envie o arquivo. O áudio é usado integralmente. Se passar de 179 segundos, envie um roteiro mais curto ou um WAV definitivo dentro do limite.

## Exemplo estrutural

```json
{
  "title": "Como interpretar um gráfico de saúde",
  "series": "noticias",
  "script": "Texto integral do roteiro aprovado.",
  "transcript": "Transcrição revisada do WAV definitivo.",
  "visualIdentity": "medicina-democratica",
  "audio": {
    "path": "narracao-final.wav",
    "source": "google-ai-studio",
    "approved": true
  },
  "captions": [
    {
      "text": "Texto integral do roteiro aprovado.",
      "start": 0,
      "end": 3,
      "words": [
        {"text": "Texto", "start": 0, "end": 0.4},
        {"text": "integral", "start": 0.4, "end": 0.9},
        {"text": "do", "start": 0.9, "end": 1.2},
        {"text": "roteiro", "start": 1.2, "end": 1.9},
        {"text": "aprovado.", "start": 1.9, "end": 3}
      ]
    }
  ],
  "scenes": [
    {
      "id": "abertura",
      "start": 0,
      "end": 3,
      "title": "Exemplo ilustrativo",
      "body": "Dados fictícios: não utilizar como informação epidemiológica.",
      "visual": "chart",
      "data": [20, 40, 60],
      "labels": ["A", "B", "C"]
    }
  ],
  "assets": [],
  "instructions": "Identificar todos os dados como ilustrativos."
}
```

Este exemplo mostra o formato, não inclui áudio e não constitui um episódio renderizável pronto. Ajuste os tempos à duração real do WAV. Cenas usam segundos e sequência explícita. Para inserir mídia licenciada, registre `id`, `path`, `type` (`image` ou `video`), `origin`, `license` e `redistributionAllowed`, e use seu identificador em `scene.assetId`.

## Legendas e alinhamento

Quando o trabalho não inclui legendas prontas, o servidor reconhece a fala em português no WAV com faster-whisper e usa os intervalos de cada palavra para o destaque sincronizado. O alinhamento roda localmente. Você também pode corrigir grafia e pontuação em legendas revisadas e renderizar com o mesmo WAV.

Cada bloco de legenda aceita no máximo **95 caracteres**. Blocos maiores são rejeitados para preservar legibilidade e área segura. Divida-os em blocos com tempos revisados, sem alterar a narração nem gerar tempos artificiais. O limite é por bloco, não por roteiro.

O comando abaixo importa um JSON de palavras produzido externamente por WhisperX para o formato do estúdio, gerando JSON e SRT:

```sh
npm run align -- --input /caminho/privado/whisperx.json --output /caminho/privado/captions.json
```

A entrada segue o formato `{"segments":[{"text":"Texto aprovado.","start":0,"end":1,"words":[{"word":"Texto","start":0,"end":0.5},{"word":"aprovado.","start":0.5,"end":1}]}]}`. Incorpore o array JSON resultante em `episode.captions`.

O importador preserva os tempos calculados no WhisperX. Para legendas automáticas no estúdio, o contêiner já inclui o modelo usado pelo servidor. Revise transcrição, tempos e termos médicos antes de publicar.

## Conferência do resultado

Verifique os relatórios do pipeline, além da imagem final. Os critérios técnicos incluem MP4/H.264, 1080 × 1920, 30 FPS, duração dentro do limite e trilha de áudio para episódios narrados. A validação técnica não substitui escuta integral, revisão do sincronismo, legibilidade em celular, direitos autorais e revisão médico-editorial.

A duração do contêiner pode ser arredondada ao quadro seguinte (até aproximadamente 33 ms). Isso não autoriza ultrapassar o limite absoluto de 179 segundos nem cortar o WAV para encurtar a fala. A demonstração é deliberadamente sem narração e não valida alinhamento acústico de uma voz fornecida pelo usuário.

## Revisão PRIME+

1. Confirme modelo, Charon predefinida, um locutor e português brasileiro. Antes de mudar o modelo ou a direção, gere a mesma passagem com ambas as configurações. Compare em volume semelhante e registre a decisão por timbre, prosódia, inteligibilidade e expressão. Preserve a configuração vencedora se a versão nova regredir.
2. Confira a narração integral contra o roteiro aprovado. Ouça a abertura, os nomes e as revelações e revise a cadência até a última frase. Registre aprovação e mantenha o WAV original sem alteração de pitch.
3. Compare o episódio com Semmelweis, Carlos Chagas e Igreja e Medicina. Use cortes e câmera para revelar informação, documentos legíveis e animações para relações que o acervo não mostra. Use os momentos de pausa para deixar a evidência aparecer.
4. Revise a coerência histórica e científica, a procedência de cada plano e a identificação de reconstruções. Corrija repetições de imagens, continuidade fraca e explicações que dependam de efeitos decorativos.
5. Confira legibilidade em tela pequena, centralização, área segura, até duas linhas por bloco e sincronismo de início a fim. Confira também o ganho da voz, o recuo da trilha e o pico final.
6. Só libere o episódio após validar o arquivo completo e registrar onde a edição supera as referências, sem regressão na voz, imagem ou legendas. Entregue MP4, WAV, SRT e a descrição copiável do Instagram.
