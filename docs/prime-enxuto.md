# PRIME+ ENXUTO — fluxo criativo oficial

**Decisão editorial vigente (12/11/2026): o operador gera o TTS.** Este documento prevalece sobre exemplos antigos em que o Work gerava automaticamente a voz. O objetivo é produzir um vídeo **original, dinâmico e cinematográfico**, não automatizar a estética de um template.

## Ordem de produção

1. **Alinhamento e roteiro aprovado.** Defina pauta, tese, gancho, público, duração aproximada e referências; obtenha aprovação do roteiro antes da narração. Trabalhe um episódio por vez, em pasta de produção privada. A abertura já entrega a notícia/pergunta/tese e cada bloco acrescenta informação.
2. **Charon gerado pelo operador.** O operador usa Google AI Studio, voz **Charon**, narrador masculino documental em PT-BR, escuta e aprova a tomada e envia ao ChatGPT Work o **WAV definitivo junto do roteiro**. Não gere nova locução por padrão. A [geração via CLI](automated-tts.md) é somente opção técnica se solicitada; não exija chave no chat.
3. **Edição cinematográfica pelo Work.** Analisar WAV/roteiro e construir B-roll verificável, material de arquivo, cartelas, mapas/gráficos e animações explicativas relevantes. Renovar a imagem ao ritmo dos fatos, não repetir o mesmo plano ou prolongar frases sem informação nova. Preservar estilo visual de **Igreja e Medicina**, **Semmelweis** e **Carlos Chagas**. Usar música documental licenciada, ducking sob a voz, cortes limpos, movimento contido, legendas precisas e barra de progresso quando aplicável.
4. **Entrega acessível no Android.** Exportar **MP4 vertical 1080 × 1920, 30 fps, H.264/AAC, duração máxima 179 segundos**, fornecer **link direto de download na conversa**, WAV original, SRT sincronizado e descrição com hashtags **pronta para copiar e colar** em Instagram/TikTok. Não encaminhar o usuário para artefato efêmero do GitHub em vez do MP4.
5. **Aprovação.** Conferir vídeo integral, legibilidade no celular, fontes, som e ritmo com [a lista de qualidade](quality.md). Somente após aprovação explícita considerar preparar o Metricool; publicar/agendar requer solicitação explícita separada. Nenhuma edição/integração de código autoriza publicação.

## Direção editorial

- Cinco frentes: Notícias; História da Medicina; SUS; Na Prática/POV; Curiosidades. Todas permanecem ancoradas em medicina, saúde pública ou ciência biomédica. O esquema do renderizador técnico ainda enumera menos séries: **não altere a enumeração apenas para satisfazer a documentação**.
- Notícias: manchete factual com verbo forte, FOMO legítimo, data do acontecimento já no primeiro frame e relevância médica demonstrável. Evite alarmismo, falsos contrastes ou números sem fonte.
- História: identidade documental investigativa, imagens de arquivo contextualizadas, distinção clara entre documento, ilustração e reconstrução.
- SUS: explicar funcionamento, financiamento, gestão, acesso e determinantes sociais com rigor e sem reduzir conclusões complexas a uma única causa.
- Na Prática: estilo adulto, didático e imersivo; quando houver 3D, preferir quadros low-poly claros, variedade de enquadramentos e cortes/zooms discretos.
- Curiosidades: ensinar medicina a partir de perguntas intrigantes e explicar mecanismos e diferenças individuais com precisão.
- Ritmo: não existe número fixo obrigatório de cortes; faça cada corte introduzir ou esclarecer informação. Evite imagens repetidas, pausas mortas, esticamento artificial, dramatizações e excesso de movimento decorativo.
- Narração: um único locutor Charon; preservar a tomada aprovada. Não usar outra voz automaticamente se surgir um erro: relatar o problema para decisão editorial.

## Fronteiras técnicas

`npm run produce`, `npm run render`, formulário/API, Colab e TTS por API são **instrumentos opcionais/legados** para suporte e testes. Não substituem a montagem autoral aprovada. Ver [production.md](production.md) e [mobile.md](mobile.md).

Arquivos inéditos e material protegido devem ficar fora do Git. Sem uso de serviços pagos, hospedagem obrigatória ou CI de renderização. Sem postagem automática.

## Ordem copiável para o Work

> Edite este episódio PRIME+ pelo fluxo cinematográfico original da Medicina Democrática. O roteiro aprovado e o **WAV Charon definitivo que eu anexei** são as fontes oficiais; não gere novo TTS nem modifique a voz. Crie cenas variadas e relevantes guiadas por informações novas, usando referências visuais de Igreja e Medicina, Semmelweis e Carlos Chagas. Confira fatos, fontes, direitos dos visuais, trilha documental, cortes, legendas e área segura. Entregue aqui o **MP4 1080 × 1920 com link direto de download**, WAV original, SRT e a descrição com hashtags pronta para copiar e colar. **Não publique nem agende nada.** Se houver bloqueio real, detalhe o estado e retome apenas o restante verificável.
