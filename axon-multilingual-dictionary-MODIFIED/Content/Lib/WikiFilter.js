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

var WikiFilter = (function() {

    function isXhrResponseEmpty(obj)
    {
        var name;
        var exclude = ['axonPreferences'/* FIXME:languagecode mustSearchWikipediaOnly*/,'triggerData','error'];

        for (var name in obj ) {
            if (exclude.indexOf(name)!==-1) continue;
            return false;
        }
        return true;
    }

    function getWordnikDefinition(response)
    {
        if (isXhrResponseEmpty(response.xhrResponse)) return null;

        var xhrResponse = response.xhrResponse;
        var dictionaryData = new DictionaryData();
        dictionaryData.title = xhrResponse[0].word;
        dictionaryData.moreLinkURL = response.axonMoreLinkBaseURL + encodeURIComponent(dictionaryData.title);
        dictionaryData.definitionText = ParserFilter.filterDefinitionText(xhrResponse[0].text, Config.MAX_DEFINITION_TEXT_LENGTH);
        dictionaryData.source = "wordnik";

        switch (xhrResponse[0].sourceDictionary) {

            case "ahd-legacy":
                dictionaryData.attributionText = Config.FULL_TITLE_AHD;
                dictionaryData.attributionURL  = Config.SEARCH_URL_AHD + dictionaryData.title;
                break;

           case "wiktionary":
                dictionaryData.attributionText = Config.FULL_TITLE_WIKTIONARY;
                var wiktionaryURL = Config.SEARCH_URL_WIKTIONARY.replace(/{LANGUAGECODE}/, response.settings.runtime.languageCode);
                dictionaryData.attributionURL  = wiktionaryURL + dictionaryData.title;
                break;

            case "gcide":
                dictionaryData.attributionText = Config.FULL_TITLE_GCIDE;
                dictionaryData.attributionURL  = Config.SEARCH_URL_GCIDE + dictionaryData.title;
                break;

            case "century":
                dictionaryData.attributionText = Config.FULL_TITLE_CENTURY;
                dictionaryData.attributionURL  = Config.SEARCH_URL_CENTURY + dictionaryData.title;
                break;

            case "wordnet":
                dictionaryData.attributionText = Config.FULL_TITLE_WORDNET;
                dictionaryData.attributionURL  = Config.SEARCH_URL_WORDNET + dictionaryData.title;
                break;
        }
        return dictionaryData;
    }

    function getOpenStreetMapGeocode(response)
    {
        var xhrResponse = response.xhrResponse;
        var mapResult = null;
        var dictionaryData = new DictionaryData();

        if (isXhrResponseEmpty(xhrResponse)===false && xhrResponse.length>0) {

            for (var i=0,len=xhrResponse.length;i<len;i++)
            {
                if (xhrResponse[i].osm_type==="relation")
                {
                    mapResult = xhrResponse[i];
                    break;
                }
            }
            if (mapResult===null) return null;

            var mapLocation = [parseFloat(mapResult.lat), parseFloat(mapResult.lon)];

            return {
               "coordinates"     : mapLocation,
               "displayName"     : mapResult.display_name,
               "osmId"           : mapResult.osm_id,
               "geojson"         : mapResult.geojson,
               "zoomLevelBubble" : parseInt(response.settings.openStreetMapInExampleBubbleZoomLevel),
               "zoomLevelMap"    : parseInt(response.settings.openStreetMapOpenInNewTabZoomLevel),
               "mapWidth"        : response.settings.openStreetMapWidth,
               "mapHeight"       : response.settings.openStreetMapHeight
            }
        }
        return null;
    }

    function getWordnikExample(response)
    {
        if (isXhrResponseEmpty(response.xhrResponse)) return null;

        var xhrResponse = response.xhrResponse;
        // Pick a random example
        var randomNumber = Math.floor(Math.random()*(xhrResponse.examples.length-1));
        var randomExample = xhrResponse.examples[randomNumber];

        // Change font weight of all occurrences of searchword to bold in the random example text.
        // The searchword should not be surrounded by letters or numbers (i.e. contained in another word).
        // Example:
        //   selectedTextString = 'diagnoses'  -- the selected text
        //   dictionaryData.title = 'diagnose' or 'diagnosis' -- can be Wordnik canonical / Wikipedia redirect / Wikipedia suggestion
        var selectedWordRegExp  = new RegExp("(^|[^A-za-z0-9]+)("+response.request.searchString+")([^A-za-z0-9]+|$)","gi");
        //var canonicalWordRegExp = new RegExp("(^|[^A-za-z0-9]+)("+dictionaryData.title+")([^A-za-z0-9]+|$)","gi");

        var randomExampleText = randomExample.text;
        randomExampleText = randomExampleText.replace(selectedWordRegExp, "$1<span style='font-style:italic;font-weight:bold;'>$2</span>$3");
        //randomExampleText = randomExampleText.replace(canonicalWordRegExp, "$1<span style='font-style:italic;font-weight:bold;'>$2</span>$3");

        var dictionaryData = new DictionaryData();
        dictionaryData.exampleText = randomExampleText;
        dictionaryData.exampleTitle = randomExample.title;
        dictionaryData.exampleURL = randomExample.url;

        return dictionaryData;
    }

    function stripNonAlphaInflectionAndParentheses(str) 
    { 
        // Remove text between parentheses
        str = str.replace(/(\(.*?\))/g, '');
        return stripNonAlphaAndInflection(str);
    }

    function stripNonAlphaAndInflection(str) 
    {
        str = StringHelper.stripNonAlphaCharacters(str); // Remove interpuntion etc.
        str = str.replace(/-/g," "); // Remove hyphens
        // Try to strip off inflections (e.g. agglomeration -> agglomerat, agglomerated -> agglomera)
        if (str.length>5) str.substring(0,str.length-3);
        return str;
    }

    function doTitlesMatch(title1, title2) {
        // If the Wikipedia suggestion title occurs in searchString or vice versa
        // (e.g. singular part of plural, or root part of conjugation) then use this title.
        // AND the difference in length is lower than 5 characters.
        return (title1.indexOf(title2)!==-1 || title2.indexOf(title1)!==-1 &&
            Math.abs(title1.length - title2.length) < 5 );
    }

    function getWikipediaSuggestion(response)
    {
        var suggestedTextString="";

        if (isXhrResponseEmpty(response.xhrResponse)===false &&
            typeof(response.xhrResponse.error)==="undefined")
        {
            var xhrResponse = response.xhrResponse;
            var nrOfSuggestions = xhrResponse.query.search.length;

            // Try to find a title that closely matches the selected text
            if (nrOfSuggestions > 0)
            {
                for (var i=0, len = xhrResponse.query.search.length; i<len; ++i) 
                {
                    var searchString = stripNonAlphaAndInflection(response.request.searchString.toLowerCase());
                    var wikiTitle = stripNonAlphaInflectionAndParentheses(xhrResponse.query.search[i].title.toLowerCase());

                    if (Config.DEBUG===true) {
                        console.log(response.request.searchString.toLowerCase() + " <-> "+ xhrResponse.query.search[i].title.toLowerCase());
                        console.log(searchString + " <-> "+ wikiTitle);
                        console.log(Math.abs(wikiTitle.length - searchString.length));
                    }

                    if (doTitlesMatch(searchString, wikiTitle))
                    {
                        suggestedTextString = xhrResponse.query.search[i].title;
                        break;
                    }
                }
            }
            if (suggestedTextString==="")
            {
                // If metadata contains a suggestion
                if (typeof xhrResponse.query.searchinfo.suggestion !== "undefined")
                {
                    suggestedTextString = xhrResponse.query.searchinfo.suggestion;
                }
                // otherwise use first suggestion
                else if(nrOfSuggestions > 0)
                {
                    suggestedTextString = xhrResponse.query.search[0].title;
                }
            }
        }
        return suggestedTextString || null;
    }

    function getWiktionaryAudioFilename(response)
    {
        if (isXhrResponseEmpty(response.xhrResponse)===false) {

            var xhrResponse = response.xhrResponse;

            var resultFound = false;
            var fileNameWithPrefixFirstFound = "";
            var fileNameWithPrefixCurrentLanguage = "";
            var pageKey = xhrResponse!==null && Object.keys(xhrResponse.query.pages)[0] || -1;

            if (pageKey!=="-1") {

                var page = xhrResponse.query.pages[pageKey];

                if (typeof page.images !== 'undefined') {

                    for (var i=0, len = page.images.length; i<len; ++i) {

                        var image = page.images[i];
                        var fileName = image.title.replace(/.*:/,"");

                        if (StringHelper.hasExtension(Config.WIKTIONARY_AUDIO_EXTENSIONS, fileName)) {

                            // E.g. 'Fichier:' -> 'File:' because commons.wikimedia.org
                            // only speaks English.
                            var fileNameWithPrefix = image.title.replace(/.*:/,"File:");

                            // Check if the found file is in the current language 
                            if (fileName.toLowerCase().indexOf(response.settings.runtime.languageCode)===0) {
                                resultFound = true;
                                fileNameWithPrefixCurrentLanguage = fileNameWithPrefix;
                                break;
                            }
                            else {
                                resultFound = true;
                                if (fileNameWithPrefixFirstFound==="")
                                    fileNameWithPrefixFirstFound = fileNameWithPrefix;
                            }
                        }

                    };

                }
            }

            if (resultFound===true) {
                return fileNameWithPrefixCurrentLanguage || fileNameWithPrefixFirstFound;
            }
        }
        return null;
    }

    function getWiktionaryAudioFileUrl(response)
    {
        var xhrResponse = response.xhrResponse;
        var dictionaryData = new DictionaryData();

        if (typeof(xhrResponse.query)!=='undefined') {
            var pageKey = Object.keys(xhrResponse.query.pages)[0];

            if (pageKey!=="-1") {
                var page = xhrResponse.query.pages[pageKey];
                var fileURL = page.imageinfo[0].url;
                dictionaryData.audioFileURL = fileURL;
            }
            return dictionaryData;
        }
        return null;
    }

    function getWikipediaExtract(response)
    {
        if (isXhrResponseEmpty(response.xhrResponse)) return null;

        var xhrResponse    = response.xhrResponse;
        var dictionaryData = new DictionaryData();
        var pages          = xhrResponse.query.pages;
        var keys           = Object.keys(pages);
        var page           = null;

        if (keys[0]!=="-1") 
        {
            // Find page with an extract.
            // wgArticleId 20623 returned without an extract when multiple titles given and one of them is MPLS,
            // on 20170129, URL: https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exchars=2048&redirects=&continue=&titles=mpls|MPLS
            for (var i=0,len=keys.length; i<len; i++) 
            {
                page = pages[keys[i]];
                if (typeof page.extract !== "undefined")
                {
                    if (page.extract.length < Config.MIN_WIKIPEDIA_ARTICLE_LENGTH) return null;

                    dictionaryData.definitionText = ParserFilter.filterDefinitionText(page.extract, response.request.maxExtractLength || Config.MAX_DEFINITION_TEXT_LENGTH);
                    dictionaryData.source = "wikipedia";
                    dictionaryData.title = page.title;

                    return getWikipediaDictionaryDataWithAttributionAndMoreLink(response, dictionaryData);
                }
            }
        }
        return null;
    }

    // get Wikipedia DictionaryData With Attribution And More Link
    function getWikipediaDictionaryDataWithAttributionAndMoreLink(response, dictionaryData)
    {
        var wikipediaURL = Config.SEARCH_URL_WIKIPEDIA.replace(/{LANGUAGECODE}/, response.settings.runtime.languageCode);
        wikipediaURL += dictionaryData.title;
        dictionaryData.attributionURL  = wikipediaURL;
        dictionaryData.attributionText = wikipediaURL.replace(/https?:\/\//gi,"");
        dictionaryData.moreLinkURL = response.axonMoreLinkBaseURL + encodeURIComponent(dictionaryData.title);
        return dictionaryData;
    }

    function getWiktionaryExtract(response)
    {
        if (isXhrResponseEmpty(response.xhrResponse)) return null;

        var xhrResponse    = response.xhrResponse;
        var dictionaryData = new DictionaryData();
        var pageKeys       = Object.keys(xhrResponse.query.pages);
        var pageKey        = null;

        if (pageKeys[0]!=="-1")
        {
            // Find a page with an extract
            for (var i=0, len = pageKeys.length; i<len; ++i) {
                pageKey = pageKeys[i];
                if (typeof xhrResponse.query.pages[pageKey].extract !== "undefined") break;
            }

            var page = xhrResponse.query.pages[pageKey];
            var definitionList = ParserFilter.getDefinitionListFromWiktionaryExtract(page.extract, response.settings.runtime.languageCode);

            if (definitionList!=='') {

                dictionaryData.title = page.title;
                var wiktionaryExtract = '<div id="wiktionary-extract">'+definitionList+'</div>';
                dictionaryData.definitionText = wiktionaryExtract;
                dictionaryData.source = "wiktionary";

                var wiktionaryURL = Config.SEARCH_URL_WIKTIONARY.replace(/{LANGUAGECODE}/, response.settings.runtime.languageCode);
                wiktionaryURL += dictionaryData.title;
                dictionaryData.attributionURL  = wiktionaryURL;
                dictionaryData.attributionText = wiktionaryURL.replace(/https?:\/\//gi,"");
                dictionaryData.moreLinkURL = response.axonMoreLinkBaseURL + encodeURIComponent(dictionaryData.title);

                return dictionaryData;
            }
        }
        return null;
    }

    function getWordnikAudio(response)
    {
        if (isXhrResponseEmpty(response.xhrResponse)) return null;

        var searchString   = stripNonAlphaAndInflection(response.request.searchString.toLowerCase());
        var dictionaryData = new DictionaryData();
        var macmillan      = null;

        response.xhrResponse.forEach(function(element, index, array) {

            var wordnikWord  = stripNonAlphaAndInflection(element.word.toLowerCase());

            if (doTitlesMatch(searchString, wordnikWord))
            {
                // Skip AHD (pronunciation unclear)
                if (element.createdBy!=='ahd')
                    dictionaryData.audioFileURL = element.fileUrl;

                // Save Macmillan
                if (element.createdBy==='macmillan')
                    macmillan = element.fileUrl;
            }
        });

        // Prefer Macmillan
        if (macmillan!==null)
            dictionaryData.audioFileURL = macmillan;

        if (dictionaryData.audioFileURL === "") return null;
        return dictionaryData;
    }

    function getWikipediaDisplayTitle(response)
    {
        if (isXhrResponseEmpty(response.xhrResponse)) return null;

        var dictionaryData = new DictionaryData();
        dictionaryData.title = response.xhrResponse.parse.displaytitle;
        return dictionaryData;
    }

    function getWikipediaImage(response)
    {
        return null;
    }

    return {
        "getWordnikDefinition"       : getWordnikDefinition,
        "getWordnikAudio"            : getWordnikAudio,
        "getOpenStreetMapGeocode"    : getOpenStreetMapGeocode, 
        "getWordnikExample"          : getWordnikExample,
        "getWikipediaSuggestion"     : getWikipediaSuggestion,
        "getWiktionaryAudioFilename" : getWiktionaryAudioFilename,
        "getWiktionaryAudioFileUrl"  : getWiktionaryAudioFileUrl,
        "getWikipediaExtract"        : getWikipediaExtract,
        "getWikipediaDisplayTitle"   : getWikipediaDisplayTitle,
        "getWikipediaImage"          : getWikipediaImage,
        "getWiktionaryExtract"       : getWiktionaryExtract,
        "isXhrResponseEmpty"         : isXhrResponseEmpty,
        "getWikipediaDictionaryDataWithAttributionAndMoreLink" : getWikipediaDictionaryDataWithAttributionAndMoreLink
    }

})();
