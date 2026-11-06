# Produção de episódios

## Contrato editorial

Cada produção usa um JSON com título, série, roteiro aprovado, WAV definitivo, legendas ou transcrição, cenas e recursos visuais. O roteiro é material editorial fornecido pelo usuário: não existe geração automática de alegações médicas, verificação de fatos ou aprovação clínica neste pipeline.

O WAV deve ser o áudio final aprovado do Google AI Studio. Declare `audio.source: "google-ai-studio"` e `audio.approved: true`. Essa declaração registra a confirmação do responsável; o software não consegue provar a origem do arquivo. O render não faz TTS, aceleração, reordenação ou corte de narração. Acima de 179 segundos, entregue um novo WAV aprovado. Não tente adequar o áudio automaticamente ao limite.

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

As legendas temporizadas são independentes do áudio. É possível corrigir grafia e pontuação no JSON e renderizar novamente, mantendo o WAV original. Intervalos por palavra fornecem destaque sincronizado; divisão uniforme de texto não é alinhamento acústico.

Cada bloco de legenda aceita no máximo **95 caracteres**. Blocos maiores são rejeitados para preservar legibilidade e área segura. Divida-os em blocos com tempos revisados, sem alterar a narração nem gerar tempos artificiais. O limite é por bloco, não por roteiro.

O comando abaixo importa um JSON de palavras produzido externamente por WhisperX para o formato do estúdio, gerando JSON e SRT:

```sh
npm run align -- --input /caminho/privado/whisperx.json --output /caminho/privado/captions.json
```

A entrada segue o formato `{"segments":[{"text":"Texto aprovado.","start":0,"end":1,"words":[{"word":"Texto","start":0,"end":0.5},{"word":"aprovado.","start":0.5,"end":1}]}]}`. Incorpore o array JSON resultante em `episode.captions`.

O importador não executa um modelo acústico nem comprova que as palavras correspondem ao WAV. Gerar esse alinhamento requer instalação e execução separada do modelo, ou marcação temporal aprovada pelo responsável. Essa separação evita tornar GPU, modelos e downloads obrigatórios para renderizar legendas já temporizadas.

Não envie áudio privado a serviços externos por padrão. Revise transcrição, tempos e termos médicos antes de publicar. Consulte o relatório de validação para distinguir importação testada e reconhecimento de voz não executado.

## Conferência do resultado

Verifique os relatórios do pipeline, além da imagem final. Os critérios técnicos incluem MP4/H.264, 1080 × 1920, 30 FPS, duração dentro do limite e trilha de áudio para episódios narrados. A validação técnica não substitui escuta integral, revisão do sincronismo, legibilidade em celular, direitos autorais e revisão médico-editorial.

A duração do contêiner pode ser arredondada ao quadro seguinte (até aproximadamente 33 ms). Isso não autoriza ultrapassar o limite absoluto de 179 segundos nem cortar o WAV para encurtar a fala. A demonstração é deliberadamente sem narração e não valida alinhamento acústico de uma voz fornecida pelo usuário.
