# Blender opcional

O primeiro render não depende de Blender. Este adaptador complementa o pipeline quando houver um `.blend` aprovado com câmera, cenário, personagens e animação prontos. Não baixa modelos, não cria movimentos clínicos automaticamente e não comprova que um procedimento está correto.

```sh
blender --background --disable-autoexec --python blender/render_animation.py -- \
  --input /caminho/privado/cena-aprovada.blend \
  --output /caminho/privado/quadros \
  --start 1 --end 90

ffmpeg -framerate 30 -i /caminho/privado/quadros/frame_%05d.png \
  -c:v libx264 -pix_fmt yuv420p /caminho/privado/animacao.mp4
```

O helper carrega o arquivo com `use_scripts=False`, exige câmera ativa e renderiza quadros PNG 1080 × 1920 a 30 FPS. Nenhum script embutido deve ser habilitado. Não executa `.blend` não confiável em processo com acesso a credenciais ou dados privados. A biblioteca Python `bpy` pertence ao próprio Blender; não instale uma dependência Python paralela para usar o helper.

O caminho de saída deve ser uma pasta nova ou vazia. O adaptador evita sobrescrever produções anteriores. Não fornece assets 3D de terceiros; registre as licenças de cada modelo, textura e movimento usado. Antes de usar um vídeo exportado, confira resolução, duração e transparência/cores e registre-o no episódio como recurso `video`.

O adaptador foi exercitado localmente com Blender 4.3.2: uma cena sintética mínima com cubo, câmera e luz produziu um PNG 1080 × 1920; uma segunda chamada recusou a pasta não vazia. Isso valida exportação, não personagens médicos importados nem animações clínicas. O build local não oferece OpenImageDenoise: a cena de teste foi preparada com denoising desativado. Em outra máquina, preserve configurações de qualidade compatíveis com o Blender instalado e valide o resultado.
