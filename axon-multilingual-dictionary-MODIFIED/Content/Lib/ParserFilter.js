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

var ParserFilter = (function(){

    // Count characters not part of HTML tags and truncate
    // after maxNrOfCharacters.
    function htmlTruncate(str, maxNrOfCharacters) {
        var inTag = false;
        var isSpace = false;
        var c='', i=0, count=0;
        var currentTag = '';

        while (c=str[i++]) {
            if (c==="<") inTag=true;
            if (inTag) currentTag+=c;

            // Prevent overflow-y of a few pixels
            // caused by headers or list elements.
            if (currentTag==="<h") maxNrOfCharacters-=10;
            if (currentTag==="<li") maxNrOfCharacters-=25;
            if (!inTag) ++count;

            if (c===">") inTag=false;
            isSpace = (c===" ");

            if (count >= maxNrOfCharacters) 
            {
                if (c===">") {
                    // Strip opening tag
                    if (currentTag.substr(0,2)!=="</") i-=currentTag.length;
                    // Truncate
                    return str.substring(0, i);
                }

                // Truncate and add ellipsis if in between words
                if (!inTag && isSpace) return str.substring(0, i)+" ...";
            }

            if (c===">") currentTag='';
        }
        return str.substring(0, i);
    }

    // Parse Wiktionary extract and return complete <ol></ol> or <dl></dl> whichever is found first
    function getDefinitionListFromWiktionaryExtract(str, countryCode) {

        // French, Chinese, Basque and Vietnamese Wiktionaries use OL for definitions, but
        // sometimes have a DL before the definition list.
        var forceList = { "fr": "ol", 
                          "zh": "ol", 
                          "eu": "ol",
                          "vi": "ol" };

        var inTag = false;
        var c='', i=0;
        var currentTag = '',
            lastTag = '';

        var inDL = 0,
            inOL = 0,
            inLI = 0,
            inUL = 0;

        var dlString = '';
        var olString = '';
        var liString = '';
        var nrOfBaseOLTags = 0; // Count of OL tags not part of other OL tags
        var dlCharCount = 0;
        var olCharCount = 0;
        var liCharCount = 0;
        var firstListFound = '';

        while (c=str[i++]) {

            /* If &nbsp; then use normal space to prevent overflow-x, e.g. estimada (Fri, 13 Mar 2015)
             * See also: http://www.w3.org/TR/xml-entity-names/bycodes.html, http://www.unicode.org/charts/, http://www.ietf.org/rfc/rfc4627.txt
             */
            if (c.charCodeAt(0)===160) c=" ";

            if (c==="<") inTag=true;
            if (inTag) currentTag+=c;
            if (currentTag==="<ul") ++inUL; /* UL's contain examples/quotations */
            if (currentTag==="<dl") ++inDL; /* Possible word definition list */
            if (currentTag==="<ol") ++inOL; /* Possible word definition list */
            if (currentTag==="<li") ++inLI; /* Possible word definition */

            /* Spanish and German Wiktionary use a separate DL for each definition, so accumulate all of them */
            if (inDL===1 && inLI===0 && inUL===0 /* drop UL's */) {
                if (!inTag) {
                    dlString += c;
                    ++dlCharCount;
                }
                else if (c===">") { /* tag is finished and we're not inUL */
                    dlString+=currentTag;
                }
            }

            if (inOL===1 && inLI===0 && inUL===0 && nrOfBaseOLTags===0 /* keep only first OL */) {
                if (!inTag) {
                    olString += c;
                    ++olCharCount;
                }
                else if (c===">") {
                    olString+=currentTag;
                }
            }

            // FIXME: Keep track of LI's to prevent empty ones
            if (inLI===1 && (inDL===1 || inOL===1) && inUL===0) {
                if (!inTag) {
                    liString += c;
                    ++liCharCount;
                }
                else if (c===">") {
                    liString+=currentTag;
                }
            }

            if (currentTag==="</ul>") {
                if (lastTag==="<li>") --inLI;
                --inUL;
            }

            // FIXME: Prevent empty LI's
            if (currentTag==="</li>") {
                --inLI;
                if (liString.length!==0 && liCharCount < 5) {
                    liCharCount=0;
                    liString = '';
                }
                else {
                    if (inUL===0)
                    {
                        // Transfer LI to DL or OL
                        if (inDL===1) {
                            dlString+=liString;
                            dlCharCount+=liCharCount;
                        }
                        if (inOL===1 && nrOfBaseOLTags===0) {
                            olString+=liString;
                            olCharCount+=liCharCount;
                        }
                        liCharCount=0;
                        liString = '';
                    }
                }
            }

            if (currentTag==="</dl>") {
                --inDL;
                // Ignore tags without content
                if (dlString.length!==0 && dlCharCount < 5) {
                    dlCharCount=0;
                    dlString = '';
                }
                // If inOL then firstListFound = 'ol' because dlCharCount >= 5
                else if (firstListFound==='' && !inOL) firstListFound='dl';
            }

            if (currentTag==="</ol>") {
                --inOL;
                // Ignore tags without content
                if (olString.length!==0 && olCharCount < 5) {
                    olCharCount=0;
                    olString = '';
                }
                else {
                    if (inOL===0)
                        ++nrOfBaseOLTags;
                    // If inDL then firstListFound = 'dl' because olCharCount >= 5
                    if (firstListFound==='' && !inDL) firstListFound='ol';
                }
            }

            if (c===">") {
                inTag=false;
                lastTag=currentTag;
                currentTag='';
            }
        }

        // Return the first DL or OL found
        var listToReturn = firstListFound;

        // Overwrite listToReturn if forceList contains the current language
        if (typeof(forceList[countryCode])!=='undefined')
            listToReturn = forceList[countryCode];

        switch (listToReturn) {
            case 'dl':
                return dlString;
            case 'ol':
                return olString;
        }
        return '';
    }

    function filterDefinitionText(text, maxCharacters) {

        // Truncate text
        text = htmlTruncate(text, maxCharacters);

        // Definition not allowed to end in ', especially:'
        text = text.replace(/^(.*),\sespecially:$/g, "$1.");

        // Wikipedia definitions start with bold. Remove bold tags
        // because the title above is already bold.
        text = text.replace(/(<b>)([^]*?)(<\/b>)/gi, "$2");

        // Wikipedia extracts sometimes return with empty paragraphs
        // probably left over after removal of hatnotes.
        text = text.replace(/<p><br \/><\/p>/gi, "");

        // Remove ending <p><br clear="all"></p>
        text = text.replace(/<p><br.*><\/p>\.\.\.$/gi, "");

        // Swedish Wikipedia sometimes starts with <p><br>
        text = text.replace(/^<p><br \/>/gi, "<p>");

        return text;
    }

    return {
        "getDefinitionListFromWiktionaryExtract": getDefinitionListFromWiktionaryExtract,
        "filterDefinitionText":                   filterDefinitionText,
    }

})();
