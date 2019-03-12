#!/usr/bin/env python

# Copyright (c) 2019, Piet Hein Schouten. All rights reserved.
# Licensed under the terms of the MIT license.

# GIMP Python plug-in

import re

from gimpfu import *

def adjust_layers_duration(image, multiplier):
    gimp.progress_init("Adjustng layer duration values...")

    regex = re.compile('^(.*)\((\d+)ms\)(.*)$')

    # Set up an undo group, so the operation will be undone in one step.
    pdb.gimp_undo_push_group_start(image)

    # Image layers are reversed to start at the bottom.
    for layer in reversed(image.layers):
        match = regex.match(layer.name)
        if match:
            new_duration = float(match.group(2)) * multiplier
            new_duration = int(new_duration)
            layer.name = '{0}({1}ms){2}'.format(match.group(1), str(new_duration), match.group(3))

    # Close the undo group.
    pdb.gimp_undo_push_group_end(image)


register(
    "python_fu_adjust_layers_anim_duration",
    "Adjust Layers Animation Duration",
    "Multiplies the layer animation duration by a specified value.",
    "User1",
    "User1",
    "2019",
    "Adjust Layers Duration (Py)...",
    "*",      # Allow all images.
    [
        (PF_IMAGE, "image", "Input image", None),
        (PF_FLOAT, "multiplier", "Duration Multiplier", 2.0),
    ],
    [],
    adjust_layers_duration, menu="<Image>/Filters/Animation")


main()
