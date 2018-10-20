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

// Configuration container
var Config = (function() {
 
    var DEBUG                          = false; // console.log debugging output
    var settings                       = {}; // container for add-on configuration parameters
    settings.runtime                   = {}; // runtime configuration parameters
 
    // Wordnik dictionary titles
    var FULL_TITLE_AHD                 = "The American Heritage Dictionary 4E";
    var FULL_TITLE_WIKTIONARY          = "Wiktionary";
    var FULL_TITLE_GCIDE               = "GNU Collaborative International Dictionary of English";
    var FULL_TITLE_CENTURY             = "The Century Dictionary and Cyclopedia";
    var FULL_TITLE_WORDNET             = "WordNet 3.0 by Princeton University";
 
    // Wordnik dictionaries online
    var SEARCH_URL_AHD                 = "https://www.ahdictionary.com/word/search.html?q=";
    var SEARCH_URL_GCIDE               = "http://gcide.gnu.org.ua/?db=gcide&define=1&q=";
    var SEARCH_URL_CENTURY             = "http://www.micmap.org/dicfro/search/century-dictionary/";
    var SEARCH_URL_WORDNET             = "http://wordnetweb.princeton.edu/perl/webwn?s=";
 
    // Wordnik, Wiktionary, Wikipedia URLs
    var SEARCH_URL_WORDNIK             = "https://www.wordnik.com/words/";
    var SEARCH_URL_WIKTIONARY          = "https://{LANGUAGECODE}.wiktionary.org/wiki/";
    var SEARCH_URL_WIKIPEDIA           = "https://{LANGUAGECODE}.wikipedia.org/wiki/";
    var SEARCH_URL_SPECIAL_WIKIPEDIA   = "https://{LANGUAGECODE}.wikipedia.org/wiki/Special:Search/";

    // Miscellaneous
    var START_OF_SEARCH_TEXT           = "Searching...";
    var MORE_LINK_TEXT                 = "More";
    var NO_MATCH_FOUND_TEXT            = "No match found.";
    var NO_MATCH_FOUND_WIKI_ZONE       = ".wikipedia.org";
    var ENGLISH_LANGUAGE_CODE          = "en";
    var MODIFIER_KEYS                  = {"ctrl": "ctrlKey", "shift": "shiftKey", "alt": "altKey", "cmd": "metaKey"};
    var MAX_SELECTED_TEXT_LENGTH       = 500;
    var MIN_EXAMPLE_BUBBLE_WIDTH       = 270;
    var MAX_DEFINITION_TEXT_LENGTH     = 300;
    var MAX_WIKIPEDIA_SUGGESTIONS      = 50;  // Max number of article suggestions to find a matching title
    var MIN_WIKIPEDIA_ARTICLE_LENGTH   = 10;
    var WIKTIONARY_AUDIO_EXTENSIONS    = ['flac','wav','ogg'];

    var ALL_SETTINGS_WITH_DEFAULT_VALUES =
    {
        //"axonDisabled"                          : false,
        "activateAxonWhenI"                     : "mouseup",
        "activateAxonWhileHoldingDown"          : "disable",
        "mainLanguageCode"                      : "en",
        "secondLanguageCode"                    : "zh",
        "popoverLanguageCode"                   : "en",
        "secondLanguageHotkey"                  : "disable",
        "wordnikDictionary"                     : "all",
        "isOpenStreetMapEnabled"                : true,
        "openStreetMapInExampleBubbleZoomLevel" : 5,
        "openStreetMapOpenInNewTabZoomLevel"    : 7,
        "openStreetMapWidth"                    : 470,
        "openStreetMapHeight"                   : 264,
        "isRandomExampleEnabled"                : true,
        "axonIgnoreErrors"                      : false,
        "axonMaximumWaitTime"                   : 5000,
        "searchEngine"                          : "duckduckgo",
        "wikipediaOnly"                         : false,
        "runtimeLanguageCode"                   : "en",
        "runtimeMustSearchWikipediaOnly"        : false,
    }

    var SEARCH_ENGINES =
    {
        "google"     : "https://www.google.nl/search?q=",
        "yahoo"      : "https://search.yahoo.com/search;?p=",
        "ask"        : "http://nl.ask.com/web?q=",
        "bing"       : "http://www.bing.com/search?q=",
        "duckduckgo" : "https://duckduckgo.com/?q=",
        "baidu"      : "http://www.baidu.com/s?ie=utf-8&wd=",
        "yandex"     : "https://www.yandex.com/search/?text=",
        "reddit"     : "http://www.reddit.com/search?q=",
        "twitter"    : "https://twitter.com/search?q="
    }

    function loadSettings(settings) {
        // Restore configuration preferences
        DomHelper.copyObjectVariables(settings, Config.settings);
    }

    return {
        "DEBUG":                            DEBUG,
        "loadSettings":                     loadSettings,
        "settings":                         settings,
        "FULL_TITLE_AHD":                   FULL_TITLE_AHD,
        "FULL_TITLE_WIKTIONARY":            FULL_TITLE_WIKTIONARY,
        "FULL_TITLE_GCIDE":                 FULL_TITLE_GCIDE,
        "FULL_TITLE_CENTURY":               FULL_TITLE_CENTURY,
        "FULL_TITLE_WORDNET":               FULL_TITLE_WORDNET,
        "SEARCH_URL_AHD":                   SEARCH_URL_AHD,
        "SEARCH_URL_GCIDE":                 SEARCH_URL_GCIDE,
        "SEARCH_URL_CENTURY":               SEARCH_URL_CENTURY,
        "SEARCH_URL_WORDNET":               SEARCH_URL_WORDNET,
        "SEARCH_URL_WORDNIK":               SEARCH_URL_WORDNIK,
        "SEARCH_URL_WIKTIONARY":            SEARCH_URL_WIKTIONARY,
        "SEARCH_URL_WIKIPEDIA":             SEARCH_URL_WIKIPEDIA,
        "SEARCH_URL_SPECIAL_WIKIPEDIA":     SEARCH_URL_SPECIAL_WIKIPEDIA,
        "START_OF_SEARCH_TEXT":             START_OF_SEARCH_TEXT,
        "MORE_LINK_TEXT":                   MORE_LINK_TEXT,
        "NO_MATCH_FOUND_TEXT":              NO_MATCH_FOUND_TEXT,
        "NO_MATCH_FOUND_WIKI_ZONE":         NO_MATCH_FOUND_WIKI_ZONE,
        "ENGLISH_LANGUAGE_CODE":            ENGLISH_LANGUAGE_CODE,
        "MODIFIER_KEYS":                    MODIFIER_KEYS,
        "MAX_SELECTED_TEXT_LENGTH":         MAX_SELECTED_TEXT_LENGTH,
        "MIN_EXAMPLE_BUBBLE_WIDTH":         MIN_EXAMPLE_BUBBLE_WIDTH,
        "MAX_DEFINITION_TEXT_LENGTH":       MAX_DEFINITION_TEXT_LENGTH,
        "MAX_WIKIPEDIA_SUGGESTIONS":        MAX_WIKIPEDIA_SUGGESTIONS,
        "MIN_WIKIPEDIA_ARTICLE_LENGTH":     MIN_WIKIPEDIA_ARTICLE_LENGTH,
        "WIKTIONARY_AUDIO_EXTENSIONS":      WIKTIONARY_AUDIO_EXTENSIONS,
        "ALL_SETTINGS_WITH_DEFAULT_VALUES": ALL_SETTINGS_WITH_DEFAULT_VALUES,
        "SEARCH_ENGINES":                   SEARCH_ENGINES
    }

})();
