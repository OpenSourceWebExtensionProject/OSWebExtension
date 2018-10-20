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

var Selection = (function() {

    function getSelection(doc) {

        var selectedTextPosition = null; // bounds of selected text
        var selectedTextString   = "";   // filtered selected text

        var Selection = doc.getSelection();
        if (Selection===null || Selection.rangeCount===0) return null;

        var Range = null;
        if (Selection.rangeCount>1)
           // If multiple words selected use the last one
           Range = Selection.getRangeAt(Selection.rangeCount-1);
        else
           Range = Selection.getRangeAt(0);

        if (Range===null) return null;
        selectedTextString = Range.toString();
        selectedTextString = StringHelper.stripNonAlphaCharacters(selectedTextString);

        if (Config.DEBUG===true) console.log("selectedTextString:"+selectedTextString + ", from: "+doc.toString());

        if (selectedTextString.length > Config.MAX_SELECTED_TEXT_LENGTH) return null;
        if (selectedTextString.length===0) return null;

        selectedTextPosition = getSelectedTextPosition(doc, Range);
        if (selectedTextPosition===null) return null;

        var result = function() {}
        result.prototype = {
            get selectedTextString() { return selectedTextString; },
            get selectedTextPosition() { return selectedTextPosition; }
        }
        return new result();
    }

    function getSelectedTextPosition(doc, Range) {

        var rectSelection = Range.getBoundingClientRect();
        var selectionPosition = DomHelper.getPosition(rectSelection);

        selectionPosition.equals = function(objectB) {
            var _this = this;
            var keys = Object.keys(this);
            for (var i=0, len = keys.length; i<len; ++i) {
                var key = keys[i];
                if (typeof(_this[key])!=='function')
                    if (_this[key]!==objectB[key]) return false;
            }
            return true;
        }
        return selectionPosition;
    }

    return {
        "getSelection" : getSelection
    }
 
})();
