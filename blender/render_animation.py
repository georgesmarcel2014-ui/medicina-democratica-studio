"""Export an approved .blend animation without running embedded scripts.

Run with Blender, not the system Python interpreter. See README.md.
"""

import argparse
import sys
from pathlib import Path


def parse_arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, required=True)
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    args = parser.parse_args(arguments)
    if args.start < 1 or args.end < args.start:
        parser.error("Use 1 <= start <= end.")
    if args.end - args.start + 1 > 179 * 30:
        parser.error("A animação não pode exceder 179 segundos a 30 FPS.")
    if not args.input.is_file() or args.input.suffix.lower() != ".blend":
        parser.error("Forneça um arquivo .blend existente e aprovado.")
    if args.output.exists() and (not args.output.is_dir() or any(args.output.iterdir())):
        parser.error("A pasta de saída deve ser nova ou vazia.")
    return args


def main():
    args = parse_arguments()
    import bpy

    # Keep Blender's auto-execution disabled both at process and load boundaries.
    bpy.context.preferences.filepaths.use_scripts_auto_execute = False
    bpy.ops.wm.open_mainfile(filepath=str(args.input.resolve()), use_scripts=False)
    scene = bpy.context.scene
    if scene.camera is None:
        raise RuntimeError("A cena aprovada precisa de câmera ativa.")
    args.output.mkdir(parents=True, exist_ok=True)
    scene.frame_start = args.start
    scene.frame_end = args.end
    scene.render.fps = 30
    scene.render.fps_base = 1.0
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(args.output.resolve() / "frame_#####")
    scene.render.use_file_extension = True
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
