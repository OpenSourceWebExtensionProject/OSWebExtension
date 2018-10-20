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

var StringHelper = (function() {

    // Check if Wikipedia tag {{Lowercase title}} might be present.
    // Required for: eBay, iPhone, etc.
    function areFirstTwoLettersUppercase(title) {

        if (title.length<3) return false;

        // If the first and second character of the Wikipedia title are in
        // uppercase, and all the others are in lowercase, then the first
        // letter could be lowercase (e.g. eBay, iPhone, etc).
        // This is not allowed on Wikipedia but corrected with the tag
        // {{Lowercase title}}. A Wikipedia extract API call includes the
        // title of the page but doesn't take this tag into account.
        // See also: http://www.adherecreative.com/blog/bid/181249/The-Case-for-Lower-Case-A-Rebranding-Conundrum
        var c='', i=0;
        while (c=title[i++]) {

            if ( i>3 && c===" " ) return true;

            // IP<3 hone>=3
            if ( c!==( i<3 ? c.toUpperCase() : c.toLowerCase() ) || !isAlphaCharacter(c) )
                return false;
        }
        return true;
    }


    function isStringCapitalized(string) {
        return (isAlphaCharacter(string[0]) && /* only Latin alphabet has upper-case */
                string[0]===string[0].toUpperCase());
    }

    function doesStringContainAlpha(str) {
        var c='', i=0;
        while (c=str[i++]) {
            if (isAlphaCharacter(c)) return true;
        }
        return false;
    }

    function isAlphaCharacter(character) {
        var code = character.charCodeAt(0);
        // A-Z or a-z
        return (code >=65 && code <= 90) || (code >=97 && code <= 122);
    }

    function stripNonAlphaCharacters(str) {

        // Remove heading and trailing spaces
        str = str.replace(/^\s+|\s+$/g, "");

        // Remove punctuation etc.
        str = str.replace(/[!"#$%\\()\*+,\.\/:;<=>?@\[\\\]\^_`{|}~]/g,"");

        // Replace newlines with spaces
        str = str.replace(/(?:\r\n|\r|\n)/g, " ");

        return str;
    }

    function getFileExtension(filename) {
        var a = filename.trim().split(".");
        if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
            return "";
        }
        return a.pop().toLowerCase();
    }

    function hasExtension(extensionsArray, fileName) {
        var extension = getFileExtension(fileName);
        if (extensionsArray.indexOf(extension)!==-1) {
            return true;
        }
        return false;
    }

    return {
        "areFirstTwoLettersUppercase": areFirstTwoLettersUppercase,
        "isStringCapitalized":         isStringCapitalized,
        "doesStringContainAlpha":      doesStringContainAlpha,
        "stripNonAlphaCharacters":     stripNonAlphaCharacters,
        "hasExtension":                hasExtension
    }

})();
