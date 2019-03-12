#!/usr/bin/env python

# Copyright (c) 2019, Piet Hein Schouten. All rights reserved.
# Licensed under the terms of the MIT license.

# GIMP Python plug-in

from gimpfu import *

import gtk
import textwrap
import tempfile
import subprocess
import time
import shutil
import os


class WindowRecorder():
    def __init__(self):
        self.tmp_dir = tempfile.mkdtemp()
        self.method = 'xwd'
        self.window_id = self.get_window_id()
        self.image_index = 0
        self.file_paths = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        shutil.rmtree(self.tmp_dir)

    def get_window_id(self):
        window_id = ""
        process = subprocess.Popen(["xwininfo"], stdout=subprocess.PIPE)
        result = process.communicate()

        for line in result[0].split('\n'):
            if line.startswith('xwininfo: Window id:'):
                window_id = line.split()[3]

        return window_id

    def capture(self):
        if self.method == 'xwd':
            filename = self.tmp_dir + "/image" + str(self.image_index).rjust(5, "0")
            self.file_paths.append(filename)

            with open(filename, 'w') as output_file:
                process = subprocess.Popen(['xwd', '-silent', '-id', self.window_id], stdout=output_file)
                process.wait()

        elif self.method == 'import':
            filename = self.tmp_dir + "/image" + str(self.image_index).rjust(5, "0") + ".png"
            self.file_paths.append(filename)

            process = subprocess.Popen(['import', '-window', self.window_id, filename])
            process.wait()

        self.image_index += 1

    def get_file_list(self):
        return self.file_paths


class PluginWindow(gtk.Window):
    def __init__(self, *args):
        win = super(PluginWindow, self).__init__(*args)

        self.running = False

        self.set_border_width(10)
        self.connect("destroy", gtk.main_quit)

        message = """\
        Click on the Start Capture button to begin capturing window contents.
        The cursor will change to a crosshair which will allow you to select the
        window to capture. Click Exit when you are finished capturing.
        """

        vbox = gtk.VBox(spacing=10)
        self.add(vbox)
        label = gtk.Label(textwrap.dedent(message))
        vbox.add(label)
        label.show()

        hbox = gtk.HBox(spacing=10)

        startCaptureButton = gtk.Button("Start Capture")
        hbox.add(startCaptureButton)
        startCaptureButton.show()
        startCaptureButton.connect("clicked", self.start_capture)

        exitButton = gtk.Button("Exit")
        hbox.add(exitButton)
        exitButton.show()
        exitButton.connect("clicked", self.process_exit_button_clicked)

        hbox.show()
        vbox.add(hbox)
        vbox.show()
        return win

    def process_exit_button_clicked(self, widget):
        if self.running:
            self.running = False

        else:
            gtk.main_quit()

    def start_capture(self, widget):
        self.running = True

        with WindowRecorder() as recorder:
            while self.running:
                recorder.capture()
                time.sleep(0.125)

                while gtk.events_pending():
                    gtk.main_iteration()

            import_images_as_layers(recorder.get_file_list())

        gtk.main_quit()


def import_images_as_layers(file_paths):
    if len(file_paths) > 0:
        image = pdb.gimp_file_load(file_paths[0], os.path.basename(file_paths[0]))

        gimp.Display(image)
        gimp.displays_flush()

        file_paths = file_paths[1:]

        for file_path in file_paths:
            layer = pdb.gimp_file_load_layer(image, file_path)
            pdb.gimp_image_insert_layer(image, layer, None, 0)


def start_plugin():
    window = PluginWindow()
    window.set_position(gtk.WIN_POS_CENTER_ALWAYS)
    window.show()

    gtk.main()


register(
    "python_fu_create_layers_from_window_capture",
    "Create Layers From Window Capture",
    "Captures window screenshots and imports them as layers for creating animated gifs.",
    "User1",
    "User1",
    "2019",
    "From Window Capture...",
    "", # No image types. This will create a new image
    [
    ],
    [],
    start_plugin, menu="<Image>/File/Create")


main()

