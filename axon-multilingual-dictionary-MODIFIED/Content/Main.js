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

var Main = (function() {

    var mustCancelOperations = false;
    var selectedTextPosition = null;
    var previousSelectedTextPosition = null;
    var request = null;

    Listener.startDomEventListeners(domEventsCallback);

    function domEventsCallback(e)
    {
        switch (e.type)
        {
            case "keydown":
                // The prefix 'is' should be used for boolean variables and methods. 
                // (Java Programming Style Guidelines - http://geosoft.no/development/javastyle.html)
                if (Template.isTemplateLoaded) {

                    e.stopPropagation();

                    if (e.keyCode === 27 /*ESC*/) {
                        mustCancelOperations = true;
                        Template.unloadTemplate();
                    }
                }
                break;

            case "click":
                if (e.which===1 && // left mouse button
                    Template.isTemplateLoaded)
                {
                    mustCancelOperations = true;
                    Template.unloadTemplate();
                }
                break;

            case "mouseup":

                if (e.which!==1) return; // if not left mouse button
                if (DomHelper.elementHasOrIsInsideId(e.target, "open-street-map")) return;

                // Shadow DOM requires its own event listeners.
                // The main window mouseup listener is triggered to indicate
                // that an event occurred inside the shadow DOM. Ignore this.
                if (e.target.className==="axonShadowRoot-"+Config.settings.extensionId) return;

                switch (e.target.id) 
                {
                    // Clicking on the title inside the speech bubble returns Wikipedia article
                    case "annotation-title":

                        var searchString = e.target.innerText;
                        var dictionaryData = new DictionaryData;

                        DomHelper.getRoot(e.target).getElementById('axon-example-container').className='displayNone';
                        dictionaryData.definitionText = Config.START_OF_SEARCH_TEXT;
                        Template.Bubble.showAnnotationBubble(dictionaryData, selectedTextPosition);

                        request.getSettings(function(response)
                        {
                            checkForError(response, function()
                            {
                                Config.loadSettings(response);
                                Config.settings.runtime.mustSearchWikipediaOnly = true;
                                request.startWordSearch(searchString, function(responseData) {
                                    wordSearchHandler(responseData);
                                });
                            });
                        });
                        break;

                    // Play audio file through Event page to prevent error:
                    // Refused to load media from '[url]' because it violates the following Content Security Policy directive: "media-src 'none'".
                    case "annotation-audio-icon":
                        var audioFilename = e.target.firstChild.innerHTML;
                        chrome.runtime.sendMessage({ 
                            'message' : "playAudioUrl",
                            'url'     : audioFilename
                        });
                        return false;
                        break;

                    default:
                        loadConfigurationAndHandleSelection(e);
                }
                break;

            case "dblclick":
                loadConfigurationAndHandleSelection(e);
                break;
        }
    }

    function loadConfigurationAndHandleSelection(e)
    {
        var triggerData = {};
        triggerData.modifierKeyPressedString = DomHelper.getModifierKeyFromEvent(e);
        triggerData.eventType = e.type;
        var targetRoot = DomHelper.getRoot(e.target);
        triggerData.isInsideShadowRoot = targetRoot.toString() === "[object ShadowRoot]";
        triggerData.root = DomHelper.isBrowserFirefox()===true ? document : targetRoot;

        new Request().getSettings(function(response)
        {
            checkForError(response, function()
            {
                Config.loadSettings(response);
                handleSelection(triggerData);
            });
        });
    }

    function wasHotkeyPressed(modifierKeyPressedString) {
        // return whether the modifier key was held down during select (see Config.js::MODIFIER_KEYS)
        return (wasMainLanguageHotkeyPressed(modifierKeyPressedString) || wasSecondLanguageHotkeyPressed(modifierKeyPressedString))
    }

    function wasMainLanguageHotkeyPressed(modifierKeyPressedString) {
        return modifierKeyPressedString === Config.settings.activateAxonWhileHoldingDown;
    }

    function wasSecondLanguageHotkeyPressed(modifierKeyPressedString) {
        return modifierKeyPressedString === Config.settings.secondLanguageHotkey;
    }

    function wasConfiguredActivationEventTriggered(eventType) {
        return eventType === Config.settings.activateAxonWhenI;
    }

    // Event.js::sendXHRrequest() errors or Wiki API errors
    function errorHandler(error)
    {
        mustCancelOperations = true;
        Template.unloadTemplate();

        // Unable to send message to event page (which sets the url),
        // or failed fetching local file (url == chrome://).
        if (typeof error.url!=="undefined" && 
            error.url==="" || 
            error.url.indexOf("chrome")===0)  // 20170214 Axon 2.6.21 FIXME-----------> Error in event handler for (unknown): TypeError: Cannot read property 'indexOf' of undefined
        {                                                                         //      at errorHandler (chrome-extension://ncclemcnoahbhleaeplejkppaelipfmk/Content/Main.js:155:22)
            error.info = DomHelper.stripHtml(error.info);                         //     at checkForError (chrome-extension://ncclemcnoahbhleaeplejkppaelipfmk/Content/Main.js:242:27)
            var msg = error.title + "\n\n" + error.info;                          //     at wordSearchHandler (chrome-extension://ncclemcnoahbhleaeplejkppaelipfmk/Content/Main.js:326:9)
            if (error.url!=="")                                                   //     at chrome-extension://ncclemcnoahbhleaeplejkppaelipfmk/Content/Main.js:318:21
                msg += "\n\nRequested URL: " + error.url;                         //     at Request.updateDictionaryData (chrome-extension://ncclemcnoahbhleaeplejkppaelipfmk/Content/Lib/Request.js:449:9)
            console.log(msg);                                                     //     at chrome-extension://ncclemcnoahbhleaeplejkppaelipfmk/Content/Lib/Request.js:282:35
        }                                                                         //     at chrome-extension://ncclemcnoahbhleaeplejkppaelipfmk/Content/Lib/Request.js:156:39
        else
        {
            Template.loadMainTemplate(function() {
                var dictionaryData = new DictionaryData();
                dictionaryData.definitionText = "<b>"+error.title+"</b><div style='margin:5px 0;'></div>";
                dictionaryData.definitionText += error.info;
                // Wiki API error structure: see https://www.mediawiki.org/wiki/API:Errors_and_warnings
                if (typeof error["*"] !== "undefined") dictionaryData.definitionText += " "+error["*"];
                Template.Bubble.showAnnotationBubble(dictionaryData, selectedTextPosition);
            });
        }
    }

    function openStreetMapIfEnabled()
    {
        if (Config.settings.isOpenStreetMapEnabled===true)
            request.getOsmCoordinates("", function(data)
            {
                checkForError(data, function()
                {
                    if (data.xhrResponseFiltered!==null)
                    {
                        Template.loadOpenStreetMapTemplate(data.xhrResponseFiltered, function() {
                            if (mustCancelOperations===true) return;
                            Template.Bubble.showExampleBubble(null, selectedTextPosition);
                        });
                    }
                });
            });
    }

    function showSpeakerSymbol()
    {
        request.getPronunciation("", function(data)
        {
            checkForError(data, function()
            {
                if (data.xhrResponseFiltered!==null)
                {
                    if (mustCancelOperations===true) return;
                    Template.Bubble.setAnnotationBubbleTextAndAudio(data.updatedDictionaryData, selectedTextPosition);
                }
            });
        });
    }

    function showExample()
    {
        request.getRandomExampleIfEnabled("", function(data)
        {
            checkForError(data, function()
            {
                if (mustCancelOperations===true) return;
                if (data.xhrResponseFiltered!==null)
                {
                    Template.Bubble.showExampleBubble(data.xhrResponseFiltered, selectedTextPosition);
                }
            });
        });
    }

    function checkForError(response, callback)
    {
        var error = null;

        if (typeof(response)!=="undefined")
        {
            if (typeof(response.error)!=="undefined") 
                error = response.error;
            else
            {
                if (typeof(response.xhrResponse)!=="undefined" && 
                    typeof(response.xhrResponse.error)!=="undefined")
                {
                    error = response.xhrResponse.error;
                }
            }
        }

        if (error!==null) errorHandler(error);
        else callback();
    }

    function wordSearchHandler(data)
    {
        checkForError(data, function()
        {
            if (mustCancelOperations===true) return;
            if (Template.Bubble!==null)
            {
                Template.Bubble.showAnnotationBubble(data.updatedDictionaryData, selectedTextPosition);
                openStreetMapIfEnabled();
                showSpeakerSymbol();
                showExample();
            }
        });
    }

    function handleSelection(triggerData)
    {
        //if (Config.settings.axonDisabled===true) return;

        // Reset definition title click event flag
        Config.settings.runtime.mustSearchWikipediaOnly = false;

        // Either Dblclick or Mouseup
        if (!wasConfiguredActivationEventTriggered(triggerData.eventType)) return;

        // Either 'Disable hotkey' was selected or a hotkey
        // has to have been pressed, otherwise return.
        if ('disable' !== Config.settings.activateAxonWhileHoldingDown)
        {
            if (!wasHotkeyPressed(triggerData.modifierKeyPressedString))
                return;
        }

        var selection = Selection.getSelection(triggerData.root);
        if (selection===null) return; // no or invalid selection

        selectedTextPosition = selection.selectedTextPosition;

        // If the same text is selected again and the template is still active
        // then close bubbles.
        if (selectedTextPosition!==null && 
            Template.isTemplateLoaded && 
            selectedTextPosition.equals(previousSelectedTextPosition))
        {
            Template.unloadTemplate();
            return;
        }

        // If a text inside a dictionary bubble was selected then
        // keep the old selected text position.
        if (triggerData.isInsideShadowRoot===true)
            selectedTextPosition = previousSelectedTextPosition;
        else
            previousSelectedTextPosition = selectedTextPosition;

        // If present close the speech bubbles from previous selection
        Template.unloadTemplate();

        mustCancelOperations = false;

        // Insert template.html and template.css into body of document.
        // Request data from the Wordnik API and other external
        // resources. Bubble inserts the data into the speech bubble
        // template, and together with Box calculates dimensions and
        // positions the template.
        
        Template.loadMainTemplate(function(response)
        {
            checkForError(response, function() 
            {
                Listener.startDomEventListeners(domEventsCallback, response.axonDiv);

                var dictionaryData            = new DictionaryData();
                dictionaryData.title          = "";
                dictionaryData.definitionText = Config.START_OF_SEARCH_TEXT;
                dictionaryData.moreLinkURL    = "";

                Template.Bubble.showAnnotationBubble(dictionaryData, selectedTextPosition);

                Config.settings.runtime.languageCode = Config.settings.mainLanguageCode;

                if (wasSecondLanguageHotkeyPressed(triggerData.modifierKeyPressedString))
                    Config.settings.runtime.languageCode = Config.settings.secondLanguageCode;

                request = new Request();
                // Request -> Request.wordnikDefinition etc -> Event.handleGetRequest: WikiFilter and callback
                request.startWordSearch(selection.selectedTextString, function(responseData)
                {
                    wordSearchHandler(responseData);
                });
            });
	});
    }

})();
