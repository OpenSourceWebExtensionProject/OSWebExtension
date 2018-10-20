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

var Request = (function() {

    function Request() {
        this._searchString = "";
        this._suggestedTextString = "";
        // dictionaryData holds data fetched from external resources (Wordnik/Wiktionary/Wikipedia).
        this._dictionaryData = new DictionaryData();
        this._wasWordSearchStarted = false;
    }

    Request.prototype={ 
        get dictionaryData() { return this._dictionaryData; }
    }

    function sendMessage(options, callback) {
        try {
            chrome.runtime.sendMessage(options, callback);
        }
        catch (err) {
            var error = new ErrorData();
            error.title = "Axon error";
            error.info  = "Request for "+options.type+" failed. ";
            error.info  = err.stack;
            callback({ "xhrResponse" : { "error": error }});
            return;
        }
    }

    function hasError(response) {
        return (Config.settings.axonIgnoreErrors===false && 
                response.xhrResponse!==null &&
                typeof(response.xhrResponse.error)!=="undefined");
    }

    Request.prototype.isSearchStringCapitalized = function() {
        return StringHelper.isStringCapitalized(this._searchString);
    }

    Request.prototype.getOsmCoordinates = function(searchString, callback) 
    {
        this._searchString = this._dictionaryData.title || this._searchString || searchString;
        var _this = this;

        sendMessage({
            message            : "sendGetRequest",
            type               : "openStreetMapGeocode",
            runtimePreferences : Config.settings.runtime,
            // If Wordnik/Wiktionary/Wikipedia found a result use that result,
            // if nothing was found title will be an empty string.
            searchString : this._searchString

        },
        function(response) {
            if (response.xhrResponseFiltered!==null)
                _this.getOsmCoordinatesAndPolygon(response.xhrResponseFiltered.displayName, callback);
            else
                callback(response);
        });
    }

    Request.prototype.getOsmCoordinatesAndPolygon = function(searchString, callback) 
    {
        sendMessage({
            message            : "sendGetRequest",
            type               : "openStreetMapGeocodePolygon",
            runtimePreferences : Config.settings.runtime,
            // If Wordnik/Wiktionary/Wikipedia found a result use that result,
            // if nothing was found title will be an empty string.
            searchString       : searchString
        }, callback);
    }

    Request.prototype.getRandomExampleIfEnabled = function(searchString, callback) 
    {
        if (Config.settings.isRandomExampleEnabled===true) {

            var _this = this;

            // Selecting a single ampersand character will be translated to 'Ampersand'
            // by Wikipedia. Prevent the Wordnik API from choking on the single character.
            // FIXME: Russian words do not always contain alpha chars http://news.ifmo.ru/ru/science/photonics/news/6433/
            this._searchString = StringHelper.doesStringContainAlpha(this._searchString) ? this._searchString : this._dictionaryData.title;

            sendMessage({

                message      : "sendGetRequest",
                type         : "wordnikExamples",
                searchString : searchString || this._searchString

            },
            function(response) {
                _this.updateDictionaryData(response, callback);
            });
        }
    }

    Request.prototype.getPronunciation = function(searchString, callback) 
    {
        searchString = searchString || this._dictionaryData.title || this._searchString;

        if (Config.settings.runtime.languageCode === Config.ENGLISH_LANGUAGE_CODE && 
            !DomHelper.isBrowserFirefox())
            /* 20170213
             * Firefox: "Cannot play media. No decoders for requested formats: audio/mpeg"
             * Wordnik: Currently only audio pronunciations from the American Heritage Dictionary in mp3 format are supported.
             */
        {
            this.getWordnikAudio(searchString, callback);
        }
        else { 
            this.getWiktionaryAudio(searchString, callback);
        }
    }

    Request.prototype.getWordnikAudio = function(searchString, callback) 
    {
        //console.log("requestWordnikAudio for: '"+searchString+"'");
        searchString = searchString || this._dictionaryData.title || this._searchString;

        var _this = this;

        sendMessage({
            message            : "sendGetRequest",
            type               : "wordnikAudio",
            runtimePreferences : Config.settings.runtime,
            searchString       : this._searchString
        },
        function(response) {
            if (response.xhrResponseFiltered===null)
                _this.getWiktionaryAudio(searchString, callback)
            else
                _this.updateDictionaryData(response, callback);
        });
    }

    Request.prototype.getWiktionaryAudio = function(searchString, callback)
    {
        var _this=this;

        // All Wikipedia articles are capitalized, but Wiktionary definitions
        // are in lower case, but not always e.g. German nouns are capitalized.
        // Try both.
        searchString = getWikiSearchString(searchString);

        this.getWiktionaryAudioFilename(searchString, function(response)
        {
            if (response.xhrResponseFiltered!==null)
            {
                _this.getWiktionaryAudioFileURL(response.xhrResponseFiltered, function(response){
                    _this.updateDictionaryData(response, callback);
                });
            }
        });
    }

    Request.prototype.getWiktionaryAudioFilename = function(searchString, callback) 
    {
        searchString = searchString || this._dictionaryData.title || this._searchString;
        var _this = this;

	sendMessage({
	    message            : "sendGetRequest",
            type               : "wiktionaryAudioFilename",
            runtimePreferences : Config.settings.runtime,
            searchString       : searchString
        },
        function(response) {
            _this.updateDictionaryData(response, callback);
        });
    }

    Request.prototype.getWiktionaryAudioFileURL = function(fileName, callback) 
    {
	sendMessage({
	    message      : "sendGetRequest",
            type         : "wiktionaryAudioFileURL",
            searchString : fileName,
	}, callback);
    }

    Request.prototype.getWikipediaSuggestion = function(searchString, callback) 
    {
        this._searchString = this._dictionaryData.title || this._searchString || searchString;
        var _this = this;

	sendMessage({

	    message      : "sendGetRequest",
            type         : "wikipediaSuggestion",
            searchString : this._searchString
	},
        function(response) {
            if (hasError(response)) { callback(response); return; }
            _this.updateDictionaryData(response, callback);
        });
    }

    Request.prototype.getWikipediaParsedPageDisplayTitle = function(title, callback) 
    {
        var _this = this;

	sendMessage({
	    message      : "sendGetRequest",
            type         : "wikipediaParsedPageDisplayTitle",
            searchString : title,
	}, 
        function(response) {
            // Fix title, e.g. IPad -> iPad, and title in links
            WikiFilter.getWikipediaDictionaryDataWithAttributionAndMoreLink(response, response.xhrResponseFiltered);
            _this.updateDictionaryData(response, callback);
        });
    }

    function getNoDefinitionData(searchString, response) 
    {
        var dictionaryData = new DictionaryData();

        var wikipediaURL = Config.SEARCH_URL_SPECIAL_WIKIPEDIA.replace(/{LANGUAGECODE}/, response.settings.runtime.languageCode);
        wikipediaURL += encodeURIComponent(searchString);
        var wikipediaDomain = response.settings.runtime.languageCode + Config.NO_MATCH_FOUND_WIKI_ZONE;

        var dictionaryData             = new DictionaryData();
        dictionaryData.definitionText  = Config.NO_MATCH_FOUND_TEXT;
        dictionaryData.attributionText = wikipediaDomain;
        dictionaryData.attributionURL  = wikipediaURL;
        dictionaryData.moreLinkURL     = response.axonMoreLinkBaseURL + encodeURIComponent(searchString);

        return dictionaryData;
    }

    /* Selected words at the start of a sentence can't be found on Wiktionary
     * unless the spelling of the word requires capitalization.
     * Try both lower and upper case.
     */
    function getWikiSearchString(searchString) 
    {
        return searchString + "|" + 
            // remove possible start of sentence capitalization
            searchString.toLowerCase() + "|" +
            // try possible abbreviation
            searchString.toUpperCase();
    }
    
    Request.prototype.getWikipediaExtract = function(searchString, maxExtractLength, callback) 
    {
        this._searchString   = searchString ||  this._searchString || this._dictionaryData.title;
        var wikiSearchString = getWikiSearchString(this._searchString);

        if (typeof callback==="undefined" && typeof maxExtractLength==="function")
        {
            callback = maxExtractLength;
            maxExtractLength = null;
        }

        var _this = this;

        sendMessage({
            message            : "sendGetRequest",
            type               : "wikipediaExtract",
            runtimePreferences : Config.settings.runtime,
            searchString       : wikiSearchString,
            maxExtractLength   : maxExtractLength
        },
        function(response)
        {
            if (hasError(response)) { callback(response); return; }

            if (response.xhrResponseFiltered===null)
            {
                if (_this._suggestedTextString==="") 
                {
                    _this.getWikipediaSuggestion(_this._searchString, function(response)
                    {
                        if (response.xhrResponseFiltered===null) {
                            response.xhrResponseFiltered = getNoDefinitionData(_this._searchString, response);
                            _this.updateDictionaryData(response, callback);
                        }
                        else {
                           _this._suggestedTextString = response.xhrResponseFiltered;
                           _this.startWordSearch(_this._suggestedTextString, callback);
                        }
                    });
                }
                else {
                    response.xhrResponseFiltered = getNoDefinitionData(_this._searchString, response);
                    _this.updateDictionaryData(response, callback);
                }
            }
            else
            {
                var title = response.xhrResponseFiltered.title;
                // Fix title capitalization: e.g. IPad -> iPad, but IPsec -> IPsec
                // See also Wikipedia tag: {{lowercase title}} 
                if (title.length>2 && StringHelper.areFirstTwoLettersUppercase(title))
                {
                    _this.getWikipediaParsedPageDisplayTitle(title, function(data)
                    {
                        // Update dictionaryData with Wikipedia response
                        DomHelper.copyObjectVariables(response.xhrResponseFiltered, _this._dictionaryData);

                        // Update dictionaryData with Wikipedia parsed page display title response
                        _this.updateDictionaryData(data, callback);
                    });
                }
                else
                    _this.updateDictionaryData(response, callback);
            }
        });
    }

    Request.prototype.getWiktionaryExtract = function(searchString, callback) {

        //console.log("1. Request.js:: requestWiktionaryExtract() mustCancelOperations: "+Request.mustCancelOperations);
        this._searchString = this._dictionaryData.title || this._searchString || searchString;
        var _this = this;

        var wikiSearchString = getWikiSearchString(this._searchString);

	sendMessage({
	    message            : "sendGetRequest",
            type               : "wiktionaryExtract",
            runtimePreferences : Config.settings.runtime,
            searchString       : wikiSearchString
	},
        function(wiktionaryData) {

            if (hasError(wiktionaryData)) { callback(wiktionaryData); return; }

            if (_this._wasWordSearchStarted===true) {

                _this._wasWordSearchStarted = false;

                // If no match try Wikipedia
                if (wiktionaryData.xhrResponseFiltered===null) {
                    _this.getWikipediaExtract(_this._searchString, callback);
                }
                else {
                    // If no exact Wiktionary match found, see if Wikipedia has an exact match,
                    // otherwise fallback to inexact Wiktionary match.
                    findExactWikiMatchOrFallback(_this, wiktionaryData, _this._searchString, wiktionaryData, callback);
                }
            }
            else _this.updateDictionaryData(wiktionaryData, callback);

        });
    }

    function areWordsEqual(a, b) {
        a=StringHelper.stripNonAlphaCharacters(a.toLowerCase());
        b=StringHelper.stripNonAlphaCharacters(b.toLowerCase());
        return (a===b);
    }


    function isWikiTitleEqualToString(wikiData, searchString) 
    {
        return (wikiData.xhrResponseFiltered!==null &&
            areWordsEqual(wikiData.xhrResponseFiltered.title, searchString));
    }

    function findExactWikiMatchOrFallback(_this, fallbackData, searchString, wiktionaryData, callback)
    {
        if (!isWikiTitleEqualToString(wiktionaryData, searchString)) 
        {
            _this.getWikipediaExtract(searchString, function(wikipediaData)
            {
                if (!isWikiTitleEqualToString(wikipediaData, searchString)) {
                    // fallbackData (Wordnik or Wiktionary)
                    _this.updateDictionaryData(fallbackData, callback);
                }
                else _this.updateDictionaryData(wikipediaData, callback);
            });
        }
        else _this.updateDictionaryData(wiktionaryData, callback);
    }

    Request.prototype.getWordnikDefinition = function(searchString, callback) {

        this._searchString = this._dictionaryData.title || this._searchString || searchString;
        var _this = this;

        sendMessage({
            message            : "sendGetRequest",
            type               : "wordnikDefinitions",
            runtimePreferences : Config.settings.runtime,
            searchString       : this._searchString
        },
        function(response) {

            if (hasError(response)) { callback(response); return; }

            if (_this._wasWordSearchStarted===true)
            {
                // If no match try Wiktionary
                if (response.xhrResponseFiltered===null)
                {
                    _this.getWiktionaryExtract(_this._searchString, callback);
                }
                else
                {
                    _this._wasWordSearchStarted=false;

                    // If Wordnik match doesn't match the searchString exactly, then
                    // try to find an exact Wiktionary or Wikipedia match, otherwise
                    // fallback to found Wordnik match.
                    // E.g. 'DKIM' is spell-corrected to 'skim', but Wiktionary and
                    // Wikipedia have an exact title match for 'DKIM'.
                    if (!isWikiTitleEqualToString(response, _this._searchString))
                    {
                        _this.getWiktionaryExtract(_this._searchString, function(wiktionaryData)
                        {
                            findExactWikiMatchOrFallback(_this, response, _this._searchString, wiktionaryData, callback)
                        });
                    }
                    else _this.updateDictionaryData(response, callback);
                }
            }
            else _this.updateDictionaryData(response, callback);
        });
    }

    Request.prototype.getStringToSearch = function() {
        if (this._suggestedTextString!=="") return this._suggestedTextString;
        return this._searchString;
    }
 
    Request.prototype.updateDictionaryData = function(response, callback) {

        if (Config.DEBUG===true) {
            console.log("------------------------------");
            //if (typeof response.request === "undefined") debugger;
            console.log("%c" + response.request.type, "font-weight:bold;");
            console.log("\t"+response.requestUrl);
            //console.log(new Error().stack);
            console.log(response);
            console.log("------------------------------");
        }

        if (response.xhrResponseFiltered!==null) {
            DomHelper.copyObjectVariables(response.xhrResponseFiltered, this._dictionaryData);
        }
        response.updatedDictionaryData = this._dictionaryData;
        callback(response);
    }

    Request.prototype.getSettings = function(callback) {

        sendMessage({
            message     : "getSettings"
        }, 
        function(response) {
            callback(response);
        });
    }

    Request.prototype.startWordSearch = function(searchString, callback) {

        if (searchString==="") return false;
        this._wasWordSearchStarted = true;
        this._searchString = searchString;

        // If not set to true by second language hotkey
        // then use Wikipedia only setting.
        if (Config.settings.runtime.mustSearchWikipediaOnly !== true)
            Config.settings.runtime.mustSearchWikipediaOnly = Config.settings.wikipediaOnly;

        if (Config.settings.runtime.mustSearchWikipediaOnly) {
            this.getWikipediaExtract(this._searchString, callback);
        }
        else {
            if (Config.settings.runtime.languageCode === Config.ENGLISH_LANGUAGE_CODE &&
		Config.settings.wordnikDictionary !== 'disable') 
	    {
                this.getWordnikDefinition(this._searchString, callback);
            }
            else {
                this.getWiktionaryExtract(this._searchString, callback);
            }
        }
    }

    return Request;

})();
