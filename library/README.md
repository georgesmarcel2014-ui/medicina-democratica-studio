# Biblioteca audiovisual

Esta estrutura reserva áreas para recursos reutilizáveis. Diretórios vazios não representam bibliotecas já adquiridas. O registro [catalog.json](catalog.json) distingue os elementos originais implementados dos catálogos externos ainda não importados.

| Diretório | Conteúdo previsto |
| --- | --- |
| `characters` | Médicos e pacientes adultos estilizados. |
| `environments` | Clínicas, hospitais e ambientes históricos. |
| `equipment` | Equipamentos e instrumentos. |
| `motions` | Movimentos e demonstrações revisadas. |
| `maps` | Mapas esquemáticos, cartografia licenciada. |
| `charts` | Gráficos e diagramas científicos. |
| `icons` | Símbolos de interface. |
| `transitions` | Transições e elementos gráficos. |
| `captions` | Temas de legenda e áreas seguras. |
| `historical` | Documentos e imagens históricas com procedência. |

Os recursos procedurais originais estão no código de `src/video/`, são disponibilizados sob a licença [MIT do projeto](../LICENSE) e não dependem de arquivos de mídia de terceiros. Os termos de bibliotecas de software continuam independentes. Mapas são esquemáticos e não devem ser usados como referência geográfica. Gráficos demonstrativos usam valores fictícios. Representações médicas precisam de revisão específica antes de uso clínico ou editorial.

## Adicionar um recurso

1. Obtenha o arquivo de uma origem confiável. Verifique a licença aplicável àquele arquivo/versão, não apenas a página geral do fornecedor.
2. Registre URL de origem, autor, data de obtenção, nome/versão da licença, atribuição exigida e permissão de redistribuição. Guarde a evidência da licença.
3. Recursos privados ficam fora do Git. No episódio, use caminho local e metadados; a licença informada não publica nem concede direitos por si só.
4. Examine arquivos baixados e execute a importação em ambiente isolado. Não habilite scripts embutidos em `.blend`.
5. Publique no repositório somente se a redistribuição estiver explicitamente autorizada e as atribuições forem cumpridas.

## Fontes candidatas

Quaternius, Kenney e Poly Haven são referências para pesquisa, não dependências baixadas automaticamente. Nenhum arquivo desses fornecedores está incluído. As licenças variam conforme recurso e versão; não se presume autorização por estar listado aqui. Fotografias históricas exigem verificação de direitos patrimoniais, retrato e restrições do acervo.
