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

var Listener = (function() {

    function startDomEventListeners(callback, axonDiv)
    {
        if (typeof axonDiv==="undefined")
        {
            axonDiv = document;
            // clicking outside of speech bubble
            document.addEventListener("click", function(e) {
                if (Config.DEBUG===true) console.log(">>Listener.js click "+e.target.id);
                callback(e);
            });
        }

        // To catch escape key down
        var htmlElement = document.getElementsByTagName('html')[0];
        if (typeof htmlElement!=="undefined") 
        {
            htmlElement.addEventListener("keydown", function(e) {
                if (Config.DEBUG===true) console.log(">>Listener.js keydown "+e.target.id);
                callback(e);
            });
        }

        // Left mouse button up i.e. finished selecting text
        axonDiv.addEventListener("mouseup", function(e) {
            if (Config.DEBUG===true) console.log(">>Listener.js mouseup "+e.target.id);
            callback(e);
        }, true);

        axonDiv.addEventListener("dblclick", function(e) {
            if (Config.DEBUG===true) console.log(">>Listener.js dblclick "+e.target.id);
            callback(e);
        }, true);
    }

    return {
        "startDomEventListeners": startDomEventListeners
    }

})();
