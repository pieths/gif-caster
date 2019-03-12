/* Copyright (c) 2019, Piet Hein Schouten. All rights reserved.
 * Licensed under the terms of the MIT license.
 */

const ScreenCastUtils = (function() {

    function createSvgElement(tagName, attributes)
    {
        var element = document.createElementNS('http://www.w3.org/2000/svg', tagName);

        attributes = attributes || {};

        for (attributeName in attributes)
        {
            element.setAttribute(attributeName, attributes[attributeName]);
        }

        return element;
    };


    const MouseCursorOverlay = (function() {

        let rootElement = null;
        let clickHighlightElement = null;

        let initialized = false;
        let zIndex = 100001;
        let mouseX = -1000;
        let mouseY = -1000;
        let cursorSize = '3em';


        function initialize()
        {
            createOverlay();
            attachEventHandlers();
        }


        function attachEventHandlers()
        {
            let bodyElement = document.getElementsByTagName('body')[0];
            bodyElement.addEventListener('mousemove', processMouseMove);
            bodyElement.addEventListener('mousedown', processMouseDown);
            bodyElement.addEventListener('mouseup', processMouseUp);
        }


        function processMouseMove(evt)
        {
            mouseX = evt.clientX;
            mouseY = evt.clientY;

            if (rootElement.style.display != 'none')
            {
                rootElement.style.left = mouseX + "px";
                rootElement.style.top = mouseY + "px";
            }
        }


        function processMouseDown(evt)
        {
            clickHighlightElement.setAttribute('visibility', 'visible');
        }


        function processMouseUp(evt)
        {
            clickHighlightElement.setAttribute('visibility', 'hidden');
        }


        function createOverlay()
        {
            rootElement = document.createElement('div');
            rootElement.style.display = 'none';
            rootElement.style.position = 'fixed';
            rootElement.style.zIndex = zIndex.toString();
            rootElement.style.width = '1px';
            rootElement.style.height = '1px';
            rootElement.style.top = '-20000px';
            rootElement.style.left = '-20000px';
            rootElement.style.backgroundColor = 'rgba(0,0,0,0)';
            rootElement.style.pointerEvents = 'none';
            document.getElementsByTagName('body')[0].appendChild(rootElement);

            let svgElement = createSvgElement('svg', {
                xmlns: "http://www.w3.org/2000/svg",
                width: cursorSize,
                height: cursorSize,
                viewBox: "0 0 50 50",
                version: "1.1",
                style: "overflow:visible",
            });

            /*
             * When replacing these graphical elements don't
             * forget to add the style pointer-events:none.
             */
            let pathElement = createSvgElement('path', {
                d: "m 15.312322,13.497816 -5.093281,0.6212 4.148176,8.6536 -5.5408059,2.7261 -4.148175,-8.6536 -3.6741746,3.5816 0.03132,-18.3235998 z",
                style: "pointer-events:none;fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:2;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:3.9000001;stroke-dasharray:none;stroke-opacity:1",
            });

            clickHighlightElement = createSvgElement('circle', {
                cx: 0, cy: 0, r: 25,
                style: "fill:#ebea4d77;pointer-events:none;",
                visibility: 'hidden',
            });

            svgElement.appendChild(clickHighlightElement);
            svgElement.appendChild(pathElement);
            rootElement.appendChild(svgElement);
        }


        function show()
        {
            if (!initialized) initialize();

            rootElement.style.display = 'block';
        }


        function hide()
        {
            rootElement.style.display = 'none';
            rootElement.style.top = '-20000px';
            rootElement.style.left = '-20000px';
        }


        return {
            show: show,
            hide: hide,
        };
    })();


    const KeyEventDisplayer = (function() {

        let rootElement = null;
        let containerElement = null;

        let zIndex = 100000;
        let showDuration = 1500;
        let keys = [];
        let timeoutId = -1;

        let style = {
            color: '#333',
            fontSize: '23px',
            backgroundColor: '#ebea4d',
            fontFamily: 'monospace',
        };


        function attachTo(element)
        {
            if (rootElement == null) createOverlay(zIndex);

            element.addEventListener('keydown', processKeyDown);

            show();
        }


        function processKeyDown(evt)
        {
            if ((evt.key == 'Control') ||
                (evt.key == 'Shift')) return;

            let key = new Key((evt.key == ' ') ? '\u23b5' : evt.key.toUpperCase(),
                              evt.ctrlKey,
                              ('~!@#$%^&*()_+{}|:"<>?'.indexOf(evt.key) >= 0) ? false : evt.shiftKey)
            keys.push(key);

            if (timeoutId != -1) clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                keys = []
                updateDisplay();
            }, showDuration);

            updateDisplay();
        }


        function Key(key, ctrl, shift)
        {
            this.key = key || '';
            this.ctrl = Boolean(ctrl);
            this.shift = Boolean(shift);

            this.isValid = function() { return this.key != ''; }

            this.toString = function()
            {
                let parts = [];

                if (this.ctrl) parts.push("CTRL");
                if (this.shift) parts.push("SHIFT");
                parts.push(this.key);

                return parts.join('-');
            }
        }


        function createOverlay(zIndex)
        {
            rootElement = document.createElement('div');
            rootElement.style.display = 'none';
            rootElement.style.position = 'fixed';
            rootElement.style.zIndex = zIndex.toString();
            rootElement.style.width = '100%';
            rootElement.style.height = '1px';
            rootElement.style.top = '-20000px';
            rootElement.style.left = '-20000px';
            rootElement.style.fontSize = style.fontSize;
            rootElement.style.backgroundColor = 'rgba(0,0,0,0)';
            document.getElementsByTagName('body')[0].appendChild(rootElement);

            containerElement = document.createElement('div');
            containerElement.id = "keyEventContainer";
            containerElement.style.position = "absolute";
            containerElement.style.left = '1em';
            containerElement.style.bottom = '1em';
            containerElement.style.width = '80%';
            containerElement.style.lineHeight = '2em';
            containerElement.style.backgroundColor = "rgba(0,0,0,0)";
            rootElement.appendChild(containerElement);
        }


        function updateDisplay()
        {
            // Remove all child nodes
            while (containerElement.hasChildNodes())
            {
                containerElement.removeChild(containerElement.lastChild);
            }

            keys.forEach(key => {
                if (key.isValid())
                {
                    let spanElement = document.createElement('span');
                    spanElement.style.fontWeight = 'bold';
                    spanElement.style.fontFamily = style.fontFamily;
                    spanElement.style.color = style.color;
                    spanElement.style.backgroundColor = style.backgroundColor;
                    spanElement.style.padding = '0.5em';
                    spanElement.style.borderRadius = '0.3em';
                    spanElement.style.textShadow = 'none';
                    spanElement.style.boxShadow = '0 0 10px rgba(0,0,0,.45)';

                    var textNode = document.createTextNode(key.toString());
                    spanElement.appendChild(textNode);

                    containerElement.appendChild(spanElement);

                    /*
                     * Add an extra space so that automatic line
                     * breaking is done in between key spans.
                     */
                    textNode = document.createTextNode(' ');
                    containerElement.appendChild(textNode);
                }
            });
        }


        function show()
        {
            rootElement.style.display = 'block';
            rootElement.style.top = 'auto';
            rootElement.style.bottom = '0px';
            rootElement.style.left = '0px';
        }


        function hide()
        {
            rootElement.style.display = 'none';
            rootElement.style.top = '-20000px';
            rootElement.style.left = '-20000px';
        }


        return {
            attachTo: attachTo
        };
    })();


    return {
        attachKeyEventListenerTo: function(element)
        {
            KeyEventDisplayer.attachTo(element);
        },
        enableMouseCursorOverlay: function(enable)
        {
            if (enable) MouseCursorOverlay.show();
            else MouseCursorOverlay.hide();
        }
    };
})();

