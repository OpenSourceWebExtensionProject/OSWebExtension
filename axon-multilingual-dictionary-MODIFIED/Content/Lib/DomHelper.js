/*******************************************************************************
 * Copyright (c) 2017 Ivo van Kamp
 *
 * This file is part of Axon.
 *
 * Axon is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Axon is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

"use strict";

var DomHelper = (function() {

    function emptyElement(element) {
        if (element!==null && element.firstChild !== null)
            while ( element.firstChild ) {
                element.removeChild( element.firstChild );
            }
    }

    function elementHasOrIsInsideId(el, divId) {
        while (el.parentNode!==null && el.id!==divId) {
            el=el.parentNode;
        }
        return el.parentNode!==null;
    }

    function parseHTMLAndInsertIntoElement(dataString, intoElement, mustEmptyFirst) {

        if (typeof mustEmptyFirst!=='undefined' && mustEmptyFirst)
            emptyElement(intoElement);

        var parser = new DOMParser();
        // Parse HTML template to DOM document.
        var doc = parser.parseFromString(dataString, "text/html");
        var childNodes = doc.body.childNodes;

        while(childNodes.length>0) {
            intoElement.insertBefore(childNodes[0], null);
        }
    }

    function insertTextIntoElement(text, intoElement) {

        var newTextNode = document.createTextNode(text);
        emptyElement(intoElement);
        intoElement.insertBefore(newTextNode, null);
    }

    function createAnchorElement(innerHTML, URL) {
        // New anchor: <a target="_blank" href="https://en.wikipedia.org/wiki/Special:Search/[SEARCHSTRING]">[LANGCODE].wikipedia.org</a>
        var newAnchorElement = document.createElement('a');
        newAnchorElement.setAttribute('href', URL);
        newAnchorElement.setAttribute('target', '_blank');
        parseHTMLAndInsertIntoElement(innerHTML, newAnchorElement);

        return newAnchorElement;
    }
 
    function insertAnchorIntoElement(innerHTML, url, intoElement) {
        emptyElement(intoElement);
        var newAnchorElement = createAnchorElement(innerHTML, url);
        intoElement.insertBefore(newAnchorElement, null);
    }

    function removeElementById(elementId, doc) {
        doc = doc || document;
        var element = doc.getElementById(elementId);
        if (element!=null && element.parentNode!==null)
            element.parentNode.removeChild(element);
    }

    function removeElementByClassName(className, doc) {
        doc = doc || document;
        var elements = doc.getElementsByClassName(className);
        var element = null;
        for (var i=0,len=elements.length;i<len;i++)
        {
            element = elements[0];
            if (element!=null && element.parentNode!==null)
                element.parentNode.removeChild(element);
        }
    }

    function stripHtml(html)
    {
       var tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }

    function getModifierKeyFromEvent(e) {
        var keys = Object.keys(Config.MODIFIER_KEYS);
        for (var i=0, len = keys.length; i<len; ++i) {
            if (e[Config.MODIFIER_KEYS[keys[i]]]===true) return keys[i];
        }
        return null;
    }

    function copyObjectVariables(from, to, e) {
        var keys = Object.keys(from);
        for (var i=0, len = keys.length; i<len; ++i) {
            var key = keys[i];
            to[key] = from[key];
        }
    }

    // Retrieve position from DOMRect rounded to whole pixels
    function getPosition(rect) {
        return {
            "top"            : window.scrollY + Math.round(rect.top),
            "right"          : Math.round(rect.left + rect.width),
            "bottom"         : window.scrollY + Math.round(rect.top + rect.height),
            "left"           : Math.round(rect.left),
            "leftCenter"     : Math.round(rect.left + rect.width/2)
        };
    }

    // Check for shadow root and return shadow root node,
    // or window.document if not found.
    function getRoot(node) 
    {
        for (; node; node = node.parentNode) {
            if (node.toString() === "[object ShadowRoot]") {
                return node;
            }
        }
        return document;
    }

    function isBrowserFirefox() {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    }

    return {
        "parseHTMLAndInsertIntoElement": parseHTMLAndInsertIntoElement,
        "insertTextIntoElement":         insertTextIntoElement,
        "createAnchorElement":           createAnchorElement,
        "insertAnchorIntoElement":       insertAnchorIntoElement,
        "emptyElement":                  emptyElement,
        "elementHasOrIsInsideId":        elementHasOrIsInsideId,
        "removeElementById":             removeElementById,
        "removeElementByClassName":      removeElementByClassName,
        "stripHtml":                     stripHtml,
        "getModifierKeyFromEvent":       getModifierKeyFromEvent,
        "copyObjectVariables":           copyObjectVariables,
        "getPosition":                   getPosition,
        "getRoot":                       getRoot,
        "isBrowserFirefox":              isBrowserFirefox
    }

})();
