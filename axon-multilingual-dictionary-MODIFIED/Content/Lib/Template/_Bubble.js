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

var _Bubble = (function() {

    var isTextBubbleAboveSelectedText = true; // whereabouts of definition speech bubble to correctly position example text
    var axonDiv = null;
 
    function setAnnotationBubbleTextAndAudio(dictionaryData) {

        var axonAnnotationContainer = axonDiv.getElementById('axon-annotation-container');
        var annotationMore          = axonDiv.getElementById('annotation-more');
        var annotationAttribution   = axonDiv.getElementById('annotation-attribution');

        if (axonAnnotationContainer===null) return;

        // Remove class displayNone
        axonAnnotationContainer.className = "";
        // Remove style display:none first time
        axonAnnotationContainer.style.display = "";

        if (dictionaryData.title==="") {
            axonDiv.getElementById('annotation-title-row').className = "displayNone";
        }
        else {
            axonDiv.getElementById('annotation-title-row').className = "";
            var annotationTitleContainer = axonDiv.getElementById('annotation-title-container');

            DomHelper.emptyElement(annotationTitleContainer);
            var newDivElement = document.createElement('div');
            newDivElement.id = "annotation-title";
            DomHelper.insertTextIntoElement(dictionaryData.title, newDivElement);
            annotationTitleContainer.appendChild(newDivElement);
        }

        var annotationDefinition = axonDiv.getElementById('annotation-definition');
        DomHelper.parseHTMLAndInsertIntoElement(dictionaryData.definitionText, annotationDefinition, true);

        if (dictionaryData.audioFileURL==="") {
            axonDiv.getElementById('annotation-audio-icon').className = "displayNone";
        }
        else {
            axonDiv.getElementById('annotation-audio-icon').className = "";
            DomHelper.insertTextIntoElement(dictionaryData.audioFileURL, axonDiv.getElementById('annotation-audio-icon').firstChild);
        }

        if (dictionaryData.attributionText!=="") {
            annotationAttribution.className = "";
            DomHelper.insertAnchorIntoElement(dictionaryData.attributionText, dictionaryData.attributionURL, annotationAttribution);
        }
        else annotationAttribution.className= "displayNone";

        if (dictionaryData.moreLinkURL!=="") {
            var annotationMore = axonDiv.getElementById('annotation-more');
            annotationMore.className = "";
            annotationMore.style.display = "";
            DomHelper.insertAnchorIntoElement(Config.MORE_LINK_TEXT, dictionaryData.moreLinkURL, annotationMore);
        }
        else annotationMore.className = "displayNone";
    }

    function setInnerOuterTailDirection(elementPrefix, from, to) {
        ["inner", "outer"].forEach(function(level) {
            var element = axonDiv.getElementById(elementPrefix+"-"+level+"-"+from);
            if (element!==null) {
                // Change classname suffix from 'left' to 'right', 'up' to 'down' or vice versa
                element.id = elementPrefix+"-"+level+"-"+to;
            }
        });
    }

    function setAnnotationBubblePosition(selectedTextPosition, forceDirectionDown) {

        var annotationMain = axonDiv.getElementById('annotation-main');
        if (annotationMain===null) return;

        var bubbleHeight = annotationMain.offsetHeight;

        if (typeof selectedTextPosition!=="undefined") {

            // Prevent positioning bubble outside of the page
            var leftOffsetMain = selectedTextPosition.leftCenter - 150;
            if (leftOffsetMain < 0) leftOffsetMain=5; // If too far left
            if (selectedTextPosition.left > window.innerWidth-320) leftOffsetMain=window.innerWidth-320; // If too far right
            var leftOffsetTail = selectedTextPosition.leftCenter-10;

            // Don't show bubble tail if not enough room
            if (leftOffsetTail < 10 || (selectedTextPosition.leftCenter +35) >= window.innerWidth) {
                axonDiv.getElementById('annotation-tail-container').className = 'displayNone';
            }
            else {
                axonDiv.getElementById('annotation-tail-container').className = '';
            }

            axonDiv.getElementById('annotation-tail-main').style.left = leftOffsetTail+"px";
            axonDiv.getElementById('annotation-main').style.left      = leftOffsetMain+"px";

            if (forceDirectionDown===false || typeof(forceDirectionDown)==='undefined' &&
                    // Check if there is enough room above the selected text for the speech bubble
                    window.scrollY < (selectedTextPosition.top - bubbleHeight - 12))
            {
                isTextBubbleAboveSelectedText = true;
                setInnerOuterTailDirection("annotation-tail", "up", "down");
                axonDiv.getElementById('annotation-tail-main').style.top = (selectedTextPosition.top-11)+"px";
                axonDiv.getElementById('annotation-main').style.top      = (selectedTextPosition.top-bubbleHeight-10)+"px";
            }
            else {
                isTextBubbleAboveSelectedText = false;
                setInnerOuterTailDirection("annotation-tail", "down", "up");
                axonDiv.getElementById('annotation-tail-main').style.top = (selectedTextPosition.bottom+2)+"px";
                axonDiv.getElementById('annotation-main').style.top      = (selectedTextPosition.bottom+10)+"px";
            }
        }
    }

    function showAnnotationBubble(dictionaryData, selectedTextPosition) {
        setAnnotationBubbleTextAndAudio(dictionaryData);
        setAnnotationBubblePosition(selectedTextPosition);
    };

    function showExampleBubble(dictionaryData, selectedTextPosition, mayTryAgain) {

        var axonExampleContainer = axonDiv.getElementById('axon-example-container');
        if (axonExampleContainer===null) return;

        // Display example block and set text in order to calculate height correctly
        axonExampleContainer.className = "";
        axonExampleContainer.style.display = "";

        // The example bubble is also used to show a geographic map instead of or
        // in addition to a word usage example.
        if (dictionaryData!==null) {
            DomHelper.parseHTMLAndInsertIntoElement(dictionaryData.exampleText, axonDiv.getElementById('example-text'), true);
            var exampleAttribution = axonDiv.getElementById('example-attribution');
            DomHelper.insertAnchorIntoElement(dictionaryData.exampleTitle, dictionaryData.exampleURL, exampleAttribution);
        }

        var canExampleFitNextToAnnotation = false;

        var annotationMain     = axonDiv.getElementById('annotation-main');
        var exampleMain        = axonDiv.getElementById('example-main');
        var annotationMainRect = annotationMain.getBoundingClientRect();
        var exampleMainRect    = exampleMain.getBoundingClientRect();

        var right  = annotationMainRect.right;
        var left   = annotationMainRect.left;
        var width  = exampleMainRect.width;

        // Check if there is room on the right
        if (window.innerWidth > right + width + 25 ) {
            canExampleFitNextToAnnotation = true;
            setInnerOuterTailDirection("example-tail", "right", "left");
            axonDiv.getElementById('example-tail-main').style.left = (right+3)+"px";
            axonDiv.getElementById('example-main').style.left      = (right+12)+"px";
        }
        else {
            // Check if there is room on the left
            if (left > width + 15 ) {
                canExampleFitNextToAnnotation = true;
                setInnerOuterTailDirection("example-tail", "left", "right");
                axonDiv.getElementById('example-tail-main').style.left = (left-12)+"px";
                axonDiv.getElementById('example-main').style.left      = (left-(width+11))+"px";
            }
        }
        if (!canExampleFitNextToAnnotation) {
            axonDiv.getElementById('axon-example-container').className = "displayNone";
        }
        else {

            var mainOffset = 0;
            var tailOffset = 0;
            var annotationBubbleHeight = axonDiv.getElementById('annotation-main').offsetHeight;
            var exampleBubbleHeight = axonDiv.getElementById('example-main').offsetHeight;

            if (isTextBubbleAboveSelectedText) {

                if (exampleBubbleHeight > annotationBubbleHeight+30) {
                    // both bubbles bottom aligned
                    mainOffset = -exampleBubbleHeight-10;
                    // 1/4 from the top of annotationBubbleHeight
                    tailOffset = -annotationBubbleHeight/2-annotationBubbleHeight/4-14;
                }
                else {
                    // center of annotationBubble
                    mainOffset = -(annotationBubbleHeight/2)-(exampleBubbleHeight/2)-14;
                    // center of exampleBubble
                    tailOffset = mainOffset+exampleBubbleHeight/2-14;
                }

                // If there is no room for the example above the selected text then try
                // to reposition the definition bubble (once).
                if ((typeof(mayTryAgain)==="undefined" || mayTryAgain===true) && 
                    window.scrollY > (selectedTextPosition.top + mainOffset))
                {
                    setAnnotationBubblePosition(selectedTextPosition, true/*force direction down*/);
                    showExampleBubble(dictionaryData, selectedTextPosition, false);
                    return;
                }

                axonDiv.getElementById('example-tail-main').style.top = (selectedTextPosition.top+tailOffset)+"px";
                axonDiv.getElementById('example-main').style.top      = (selectedTextPosition.top+mainOffset)+"px";
            }
            else {

                if (exampleBubbleHeight > annotationBubbleHeight) {
                    // aligned with annotationBubble
                    mainOffset = +10;
                    // center of annotationBubble
                    tailOffset = +annotationBubbleHeight/2;
                }
                else {
                    // align the vertical center of exampleBubble with the vertical center of annotationBubble
                    mainOffset = +(annotationBubbleHeight-exampleBubbleHeight)/2+10;
                    // center of exampleBubble
                    tailOffset = mainOffset+exampleBubbleHeight/2-10;

                }

                axonDiv.getElementById('example-tail-main').style.top = (selectedTextPosition.bottom+tailOffset)+"px";
                axonDiv.getElementById('example-main').style.top      = (selectedTextPosition.bottom+mainOffset)+"px";
            }
       }
    }

    return {
        // Speech bubble functions
        "showAnnotationBubble":            showAnnotationBubble,
        "setAnnotationBubblePosition":     setAnnotationBubblePosition,
        "setAnnotationBubbleTextAndAudio": setAnnotationBubbleTextAndAudio,
        "showExampleBubble":               showExampleBubble,
        "setInnerOuterTailDirection":      setInnerOuterTailDirection,
        set axonDiv(el)                    { axonDiv = el; }
    }

})();
