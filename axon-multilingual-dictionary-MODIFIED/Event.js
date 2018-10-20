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

var API_URL_WORDNIK    = "http://api.wordnik.com:80/v4/word.json/";
var API_KEY_WORDNIK    = "b72a2e57762c85fc9000b0360f20186095acce621ab00f6ca";
var API_URL_WIKIMEDIA  = "https://commons.wikimedia.org/w/api.php?";
var API_URL_WIKIPEDIA  = "https://{LANGUAGECODE}.wikipedia.org/w/api.php?";
var API_URL_WIKTIONARY = "https://{LANGUAGECODE}.wiktionary.org/w/api.php?";
var API_URL_STREETMAPS = "https://nominatim.openstreetmap.org/search?";

function openSettingsInNewTab(popover) 
{
    popover.close();
    chrome.tabs.create({'url': chrome.extension.getURL('Content/Settings/settings.html')}, function(tab) {});
}

function setKeyValue(settings, key, value, defaultValue) 
{
    if (typeof value !== "undefined" && value !== null) {
        settings[key] = value;
    }
    else {
        settings[key] = defaultValue;
    }
}

function getSettings(callback) 
{
    chrome.management.getSelf(function(extensionInfo)
    {
        chrome.storage.sync.get(null, function(syncStorage) 
        {
            readSettings(callback, extensionInfo, syncStorage);
        });
    });
}

function readSettings(callback, extensionInfo, syncStorage)
{
    var settings = {};
    settings.runtime = {};
    var keys = Object.keys(Config.ALL_SETTINGS_WITH_DEFAULT_VALUES);

    for (var i=0, len = keys.length; i < len; ++i) 
    {
        var key          = keys[i];
        var defaultValue = Config.ALL_SETTINGS_WITH_DEFAULT_VALUES[key];
        var settingValue = null;
        if (syncStorage!==null) settingValue = syncStorage[key];

        //console.log("reading "+ key + ": " +settingValue+", default: "+defaultValue);

        // Keep passing runtime settings across calls
        if (key.indexOf("runtime")===0) {
            key = key.substring(7);
            key = key[0].toLowerCase()+key.substring(1);
            setKeyValue(settings.runtime, key, settingValue, defaultValue);
        }
        else
            setKeyValue(settings, key, settingValue, defaultValue);
    }
    setKeyValue(settings, "extensionId", extensionInfo.id, null);
    callback(settings);
}

function setSetting(key, value) 
{
    var data={};
    data[key]=value;
    chrome.storage.sync.set(data); 
}

function getWordnikURL(word, path, parameters)
{
    var url = "";
    url += API_URL_WORDNIK+word+path;
    url += "?"+parameters.join("&");
    url += "&api_key="+API_KEY_WORDNIK;
    return url;
}

function getWikiURL(URL, wiktionaryLanguageCode, parameters)
{
    var url="";
    url += URL.replace(/{LANGUAGECODE}/, wiktionaryLanguageCode);
    url += parameters.join("&");
    return url;
}

function getOpenStreetMapURL(name, parameters)
{
    var url="";
    url += API_URL_STREETMAPS;
    url += parameters.join("&");
    return url;
}

function handleGetRequest(request, callback)
{
    var xhrRequestData = new XhrRequestData();
    var urlSearchString = encodeURIComponent(request.searchString);

    // FIXME: Unchecked runtime.lastError while running storage.set: This request exceeds the MAX_WRITE_OPERATIONS_PER_MINUTE quota.
    if (typeof request.runtimePreferences !== 'undefined') {

        if (typeof request.runtimePreferences.languageCode !== 'undefined')
            setSetting("runtimeLanguageCode", request.runtimePreferences.languageCode);

        if (typeof request.runtimePreferences.mustSearchWikipediaOnly !== 'undefined')
            setSetting("runtimeMustSearchWikipediaOnly", request.runtimePreferences.mustSearchWikipediaOnly);
    }

    getSettings(function(settings) {

        var filterFunction = null;
        var languageCode = settings.runtime.languageCode;
        xhrRequestData.settings = settings;

        var response = {};
        response.request = request;
        response.settings = settings;

        xhrRequestData.xhrCallback = function(xhrResponse) {
            response.xhrResponse = xhrResponse;
            response.xhrResponseFiltered = filterFunction(response);
            callback(response);
        }

        switch (request.type) {

            case "wordnikDefinitions":
                xhrRequestData.commonResourceName = "Wordnik definition";
                xhrRequestData.url = getWordnikURL(urlSearchString, "/definitions",
                        ["sourceDictionaries="+settings.wordnikDictionary,
                         "limit=1",
                         "includeRelated=true",
                         "useCanonical=true",
                         "includeTags=false"]);
                xhrRequestData.settings = settings;
                filterFunction = WikiFilter.getWordnikDefinition;
                response.axonMoreLinkBaseURL = Config.SEARCH_URL_WORDNIK;
                break;

            case "wordnikAudio":
                xhrRequestData.commonResourceName = "Wordnik audio";
                xhrRequestData.url = getWordnikURL(urlSearchString, "/audio",
                        ["useCanonical=true",
                         "limit=50"]);
                filterFunction = WikiFilter.getWordnikAudio;
                break;

            case "wordnikTopExample"://unused
                xhrRequestData.commonResourceName = "Wordnik top example";
                xhrRequestData.url = getWordnikURL(urlSearchString, "/topExample",
                        ["useCanonical=true"]);
                // no filter function defined
                break;

            case "wordnikExamples":
                xhrRequestData.commonResourceName = "Wordnik example";
                xhrRequestData.url = getWordnikURL(urlSearchString, "/examples",
                        ["includeDuplicates=false",
                         "useCanonical=false",
                         "skip=0",
                         "limit=25"]);
                filterFunction = WikiFilter.getWordnikExample;
                break;

            case "wiktionaryExtract":
                xhrRequestData.commonResourceName = "Wiktionary extract";
                xhrRequestData.url = getWikiURL(API_URL_WIKTIONARY, languageCode,
                        ["action=query",
                         "prop=extracts",
                         "format=json",
                         "redirects=",
                         "continue=",
                         "titles="+urlSearchString]);
                response.axonMoreLinkBaseURL = Config.SEARCH_ENGINES[settings.searchEngine];
                filterFunction = WikiFilter.getWiktionaryExtract;
                break;

            case "wiktionaryAudioFilename":
                xhrRequestData.commonResourceName = "Wiktionary pronunciation file request";
                xhrRequestData.url = getWikiURL(API_URL_WIKTIONARY, languageCode,
                        ["action=query",
                         "prop=images",
                         "format=json",
                         "redirects=",
                         "continue=",
                         "titles="+urlSearchString]);
                filterFunction = WikiFilter.getWiktionaryAudioFilename;
                break;

            case "wiktionaryAudioFileURL":
                xhrRequestData.commonResourceName = "Wiktionary audio filename";
                xhrRequestData.url = getWikiURL(API_URL_WIKIMEDIA, languageCode,
                        ["action=query", 
                         "prop=imageinfo", 
                         "iiprop=url", 
                         "format=json", 
                         "continue=", 
                         "titles="+urlSearchString]);
                filterFunction = WikiFilter.getWiktionaryAudioFileUrl;
                break;

            case "wikipediaExtract":
                xhrRequestData.commonResourceName = "Wikipedia extract";
                xhrRequestData.url = getWikiURL(API_URL_WIKIPEDIA, languageCode,
                        ["action=query",
                         "prop=extracts",
                         "format=json",
                         "exchars=2048",
                         "redirects=",
                         "continue=",
                         "titles="+urlSearchString]);
                response.axonMoreLinkBaseURL = Config.SEARCH_ENGINES[settings.searchEngine];
                filterFunction = WikiFilter.getWikipediaExtract;
                break;

            case "wikipediaParsedPageDisplayTitle":
                xhrRequestData.commonResourceName = "Wikipedia parsed display title";
                xhrRequestData.url = getWikiURL(API_URL_WIKIPEDIA, languageCode,
                        ["action=parse",
                         "prop=displaytitle",
                         "format=json",
                         "page="+urlSearchString]);
                response.axonMoreLinkBaseURL = Config.SEARCH_ENGINES[settings.searchEngine];
                filterFunction = WikiFilter.getWikipediaDisplayTitle;
                break;

            case "wikipediaSuggestion":
                xhrRequestData.commonResourceName = "Wikipedia suggestion";
                xhrRequestData.url = getWikiURL(API_URL_WIKIPEDIA, languageCode, 
                        ["action=query",
                         "srnamespace=0",
                         "srprop=sectiontitle",
                         "list=search",
                         "format=json",
                         "srlimit="+Config.MAX_WIKIPEDIA_SUGGESTIONS,
                         "continue=",
                         "srsearch="+urlSearchString]);
                response.axonMoreLinkBaseURL = Config.SEARCH_ENGINES[settings.searchEngine];
                filterFunction = WikiFilter.getWikipediaSuggestion;
                break;

            case "wikipediaImage": // https://www.mediawiki.org/wiki/API:Query
                xhrRequestData.commonResourceName = "Wikipedia image";
                xhrRequestData.url = getWikiURL(API_URL_WIKIPEDIA, languageCode, 
                        ["action=query",
                         "format=json",
                         "prop=extracts|pageimages|revisions|info|categories|links",
                         "pllimit=50",
                         "redirects=true",
                         "exintro=false",
                         "exsentences=2",
                         "explaintext=true",
                         "piprop=thumbnail",
                         "pithumbsize=320",
                         "rvprop=timestamp",
                         "inprop=watched",
                         "indexpageids=true",
                         "titles="+urlSearchString]);
                filterFunction = WikiFilter.getWikipediaImage;
                break;

            case "openStreetMapGeocode":
            case "openStreetMapGeocodePolygon":
                xhrRequestData.commonResourceName = "Open Street Map";
                var options = ["format=json", "q="+urlSearchString];
                if (request.type==="openStreetMapGeocodePolygon") {
                    options.push("limit=5");
                    options.push("polygon_geojson=1");
                }
                else {
                    options.push("limit=10");
                }
                xhrRequestData.url = getOpenStreetMapURL(API_URL_STREETMAPS,options);
                filterFunction = WikiFilter.getOpenStreetMapGeocode;
                break;

            default:
                var error = new ErrorData();
                var axonVersion = chrome.runtime.getManifest().version;
                error.url = xhrRequestData.url;
                error.title = "Axon v" + axonVersion + " error";
                error.info  = "Unhandled exception: "+request.type+" does not exist.";
                callback({ "error" : error });
                break;
        }

        // for debugging
        response.requestUrl = xhrRequestData.url;
        response.requestResourceName = xhrRequestData.commonResourceName;
        if (Config.DEBUG===true) console.log(xhrRequestData);

        xhrRequestData.responseType = request.responseType || "json";

        sendXHRrequest(xhrRequestData);
    });
}

function sendXHRrequest(xhrRequestData)
{
    var xhr = new XMLHttpRequest();
    var axonVersion = chrome.runtime.getManifest().version;
    var shouldIgnoreErrors = xhrRequestData.settings.axonIgnoreErrors;
    var result={};

    xhr.responseType = xhrRequestData.responseType;
    xhr.timeout      = xhrRequestData.settings.axonMaximumWaitTime;
    xhr.overrideMimeType("text/plain; charset=x-user-defined");

    xhr.onload = function() {

        if (xhr.status===200)
        {
            // Add url and title to Wiki API errors
            if (xhr.response !== null && 
                typeof xhr.response.error !== "undefined")
            {
                xhr.response.error.url = xhrRequestData.url;
                xhr.response.error.title = "Axon v" + axonVersion + " error";
            }
            xhrRequestData.xhrCallback(xhr.response);
        }
        else 
        {
            if (shouldIgnoreErrors!==true)
            {
                var error = new ErrorData();
                error.url = xhrRequestData.url;
                error.title = "Axon v" + axonVersion + " error";
                error.info  = "Unhandled exception: "+xhrRequestData.commonResourceName+" XHR call "+
                                "returned with HTTP status: "+xhr.status+" "+xhr.statusText+". "+
                                "<p style='margin-top:10px'>To ignore network errors turn on <i>Ignore errors</i>.</p>";

                result.error = error;
            }
            xhrRequestData.xhrCallback(result);
        }
    }

    xhr.ontimeout = function() 
    {
        if (shouldIgnoreErrors!==true)
        {
            var error = new ErrorData();
            error.url = xhrRequestData.url;
            error.title = "Axon v" + axonVersion + " error";
            error.info  = "<p>Request for '"+xhrRequestData.commonResourceName+"' took longer than the maximum of "+xhrRequestData.settings.axonMaximumWaitTime+" milliseconds. </p>"+
                            "<p style='margin-top:10px'>Please try again later, or increase setting <i>Maximum wait time</i>. </p>"+
                            "<p style='margin-top:10px'>To ignore network errors turn on <i>Ignore errors</i>.</p>";
            result.error = error;
        }
        xhrRequestData.xhrCallback(result);
    }

    xhr.onerror = function(e) 
    {
        if (shouldIgnoreErrors!==true)
        {
            var error = new ErrorData();
            error.url = xhrRequestData.url;
            error.title = "Axon v" + axonVersion + " error";
            error.info  = "<p>Request for '"+xhrRequestData.commonResourceName+"' failed. </p>";
            result.error = error;
        }
        xhrRequestData.xhrCallback(result);
    }

    xhr.open("GET", xhrRequestData.url, true);
    xhr.send();
}

chrome.runtime.onMessage.addListener(function(request, sender, callback)
{
    switch (request.message) {

        case "sendGetRequest":
            handleGetRequest(request, callback);
            break;

        // get all settings with set or default values
        case "getSettings":
            getSettings(function(settings) {
		callback(settings);
	    });
            break;

        case "getFileUrl":
                callback(chrome.extension.getURL(request.filename));
            break;

        case "getFile":
            var xhrRequestData = new XhrRequestData();
            xhrRequestData.commonResourceName = "Extension file";
            xhrRequestData.responseType="text";
            xhrRequestData.xhrCallback = callback;
            xhrRequestData.url = chrome.extension.getURL(request.filename);

            getSettings(function(settings) {
                xhrRequestData.settings = settings;
                sendXHRrequest(xhrRequestData);
            });
            break;

        case "playAudioUrl":
            var audio = document.createElement("audio");
            audio.src = request.url;
            audio.play();
            break;
    }

    return true; // async
});
