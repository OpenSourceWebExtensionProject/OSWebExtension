
//below is dictionary

var lang1 = null;
var lang2 = null;
var settings = null;
var mainMenuWidth = -1;

var setSettingTimeout = null;

function resetSearch() {
    hideSearchResults();
    //document.getElementById("search").focus();
}

function setSetting(key, value) 
{
    //console.log("settings.js::setSetting("+key+", "+value+");");
    // Prevent exceeding chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE
    clearTimeout(setSettingTimeout);
    setSettingTimeout = setTimeout(function() 
    { 
        chrome.runtime.getBackgroundPage(function(backgroundPage) 
        {
            backgroundPage.setSetting(key, value);

            switch (key) 
            {
                case "mainLanguageCode":
                    if (settings.popoverLanguageCode===settings.mainLanguageCode)
                        settings.popoverLanguageCode = value;
                    break;

                case "secondLanguageCode":
                    if (settings.popoverLanguageCode===settings.secondLanguageCode)
                        settings.popoverLanguageCode = value;
                    break;
            }

            settings[key] = value;
        });
    }, 300);
}

function onSliderMovement(el, value) 
{
    var showValueDiv = el.parentNode.previousSibling.previousSibling;
    showValueDiv.innerHTML = value;
    setSetting(el.name, value);
}

function executeOn(selectorString, callback)
{
    var elems = document.querySelectorAll(selectorString);
    for(var i=0; i < elems.length; i++) {
        callback.call(elems[i]);
    }
}

function showBubble(selectorString)
{
    document.getElementById("resultBox").classList.remove("noResults");
    document.getElementById("resultBox").classList.add("showResults");
    executeOn(selectorString, function() { this.style.display = "block"; });
}

function hideSearchResults()
{
    executeOn('.searchResult', function() { this.style.display='none'; });
    executeOn('.searchResultHeader', function() { this.style.display='none'; });
    //document.getElementById("resultBox").classList.remove("showResults");
    //document.getElementById("resultBox").classList.add("noResults");
}

function disableLanguageSwitch() {
    lang1.style.display = "none";
    lang2.style.display = "none";
}

function setLang1() {
    lang1.style.display = "block";
    lang2.style.display = "block";
    lang1.style.color = "white";
    lang1.style.backgroundColor = "#49BF69";
    lang2.style.color = "#ADADAD";
    lang2.style.backgroundColor = "#EFEFEF";
    settings.popoverLanguageCode = settings.mainLanguageCode;
    setSetting("popoverLanguageCode",settings.mainLanguageCode);
}

function setLang2() {
    lang1.style.display = "block";
    lang2.style.display = "block";
    lang2.style.color = "white";
    lang2.style.backgroundColor = "#49BF69";
    lang1.style.color = "#ADADAD";
    lang1.style.backgroundColor = "#EFEFEF";
    settings.popoverLanguageCode = settings.secondLanguageCode;
    setSetting("popoverLanguageCode",settings.secondLanguageCode);
}

function setLanguageButtons() 
{
    if (settings.popoverLanguageCode===settings.secondLanguageCode) {
        setLang2();
    }
    else {
        setLang1();
    }

    if (settings.mainLanguageCode===settings.secondLanguageCode) {
        disableLanguageSwitch();
    }

    DomHelper.insertTextIntoElement(settings.mainLanguageCode.toUpperCase(), lang1);
    DomHelper.insertTextIntoElement(settings.secondLanguageCode.toUpperCase(), lang2);
}

function sendSearchRequest(searchString) {

    var resultWikipedia  = self.document.getElementById("resultWikipedia");
    var resultWiktionary = self.document.getElementById("resultWiktionary");
    var resultWordnik    = self.document.getElementById("resultWordnik");

    hideSearchResults();

    DomHelper.emptyElement(resultWikipedia);
    DomHelper.emptyElement(resultWiktionary);
    DomHelper.emptyElement(resultWordnik);

    Config.settings.runtime.languageCode=settings.popoverLanguageCode;

    if (settings.popoverLanguageCode === Config.ENGLISH_LANGUAGE_CODE &&
        settings.wordnikDictionary !== 'disable') 
    {
        new Request().getWordnikDefinition(searchString, function(response)
        {
            if (response.xhrResponseFiltered===null) return;
            var data = response.xhrResponseFiltered;
            var annotationAttribution = document.getElementById('annotation-attribution-wordnik');
            showBubble(".wordnik");
            DomHelper.parseHTMLAndInsertIntoElement('<h3>'+data.title+'</h3>'+data.definitionText, resultWordnik, false);
            annotationAttribution.className='';
            DomHelper.insertAnchorIntoElement(data.attributionText, data.attributionURL, annotationAttribution);
        });

    }
    else {

        new Request().getWiktionaryExtract(searchString, function(response)
        { 
            if (response.xhrResponseFiltered===null) return;
            var data = response.xhrResponseFiltered;
            var annotationAttribution = document.getElementById('annotation-attribution-wiktionary');
            showBubble(".wiktionary");
            DomHelper.parseHTMLAndInsertIntoElement('<h3>'+data.title+'</h3>'+data.definitionText, resultWiktionary, false);
            annotationAttribution.className='';
            DomHelper.insertAnchorIntoElement(data.attributionText, data.attributionURL, annotationAttribution);
        });
    }

    new Request().getWikipediaExtract(searchString, 500 /*maxExtractLength*/, function(response)
    {
        if (response.xhrResponseFiltered===null) return;
        var data = response.xhrResponseFiltered;
        var annotationAttribution = document.getElementById('annotation-attribution-wikipedia');
        showBubble(".wikipedia");
        DomHelper.parseHTMLAndInsertIntoElement('<h3>'+data.title+'</h3>'+data.definitionText, resultWikipedia, false);
        annotationAttribution.className='';
        DomHelper.insertAnchorIntoElement(data.attributionText, data.attributionURL, annotationAttribution);
    });
}

function animateWidth(selector, from, to, callback)
{
    var mustIncrement = from < to;
    _animateWidth(selector, from, to, callback, mustIncrement);

    function _animateWidth(selector, from, to, callback, mustIncrement)
    {
        executeOn(selector, function() {
            this.style.width = from + "px";
        });

        if(mustIncrement ? from >= to : from <= to) {
            if (typeof callback==="function")
                callback();
            return;
        }

        setTimeout(function(){
            _animateWidth(selector, mustIncrement ? from + 25 : from - 25, to, callback, mustIncrement);
        }, 5) 
    }
}


document.addEventListener("DOMContentLoaded", function(event) {

    //mainMenuWidth = document.body.clientWidth;
    lang1 = document.getElementById("lang1");
    lang2 = document.getElementById("lang2");
    resetSearch();

    // document.getElementById("back").addEventListener('click', function() 
    // {
    //     // reload main/second language changes
    //     setLanguageButtons();

    //     animateWidth(".animateWidth", 725, mainMenuWidth, function() {
    //         document.getElementById("settingsMenu").style.display = "none";
    //         document.getElementById("mainMenu").style.display = "block";
    //         resetSearch();
    //     });
    // });

    // document.getElementById("back").addEventListener('mouseover', function() {
    //     this.style.color="#315b7d";
    // });

    // document.getElementById("back").addEventListener('mouseout', function() {
    //     this.style.color="#4682B4";
    // });


    executeOn('.clickToOpenSettings', function() {

        this.addEventListener('click', function() {

            document.getElementById("mainMenu").style.display = "none";
            document.getElementById("settingsMenu").style.display = "block";
            animateWidth(".animateWidth", mainMenuWidth, 725);

            // Powerange input fields are invisible at initialization and
            // Powerange::Horizontal::setStart() requires offsetHeights.
            executeOn('.powerange', function() {
                this.powerange.setStart(this.powerange.options.start);
            });
            return false;
        });

        // :hover hangs/persists on Chrome
        this.addEventListener('mousedown', function() {
            executeOn('.clickToOpenSettings', function() { this.style.backgroundColor = "#D9D9D9"; });
        });

        this.addEventListener('mouseout', function() {
            executeOn('.clickToOpenSettings', function() { this.style.backgroundColor = "white"; });
        });
    });

    chrome.runtime.getBackgroundPage(function(backgroundPage) {

        // reload settings
        backgroundPage.getSettings(function(response) {

            var search = document.getElementById("search");
            var resultBox = document.getElementById("resultBox");

            settings = response;

            setLanguageButtons();

            lang1.addEventListener("click", function(e) {
                setLang1();
                sendSearchRequest(search.value);
            });

            lang2.addEventListener("click", function(e) {
                setLang2();
                sendSearchRequest(search.value);
            });

            search.addEventListener("keyup", function(e) {

                e.preventDefault();

                var key = e.keyCode || e.charCode;

                if( key == 8 /*backspace*/ || key == 46 /*delete*/) {
                    if (this.value==="") {
                        hideSearchResults();
                        return true;
                    }
                }

                if( key != 13) return true;
                sendSearchRequest(this.value);

                return true;

            }, false);

            // var axonDisabledElement = document.getElementById("axonDisabled");
            // if (settings.axonDisabled===false) axonDisabledElement.setAttribute("checked","checked");
            // new Switchery(document.getElementById("axonDisabled"), { size: 'small' } );

            // axonDisabledElement.addEventListener("change", function() {
            //     setSetting(this.id, !this.checked);
            // }, false);

            /*******************************************************************/

            var keys = Object.keys(settings);

            for (var i=0, len = keys.length; i < len; ++i) {

                var key = keys[i];
                var value = settings[key];

                switch (key) {

                    // INPUT TYPE RADIO
                    case "activateAxonWhenI":
                    case "activateAxonWhileHoldingDown":
                        var elems = document.querySelectorAll('input[name="'+key+'"]');
                        for(var j=0; j < elems.length; j++) {
                            elems[j].checked = (value===elems[j].value);
                            elems[j].addEventListener("change", function() {
                                setSetting(this.name, this.value);
                            }, false);
                        }
                        break;

                    // DROPDOWN
                    case "mainLanguageCode":
                    case "secondLanguageCode":
                    case "secondLanguageHotkey":
                    case "wordnikDictionary":
                    case "searchEngine":
                        var select = document.getElementById(key);
                        select.value = value;
                        select.addEventListener("change", function() {
                            setSetting(this.id, this.options[this.selectedIndex].value);
                        });
                        break;

                    // POWERANGE SLIDER
                    case "openStreetMapInExampleBubbleZoomLevel":
                    case "openStreetMapOpenInNewTabZoomLevel":
                        var elem = document.getElementById(key);
                        // Store Powerange object in element to be able to call Powerange::setStart()
                        // again. setStart() requires a non-hidden Powerange element because of offsetHeight.
                        elem.powerange = new Powerange(elem, { callback: onSliderMovement, hideRange: true, min: 1, max: 25, start: value });
                        break;

                    // INPUT TYPE TEXT
                    case "openStreetMapWidth":
                    case "openStreetMapHeight":
                    case "axonMaximumWaitTime":
                        var elem = document.getElementById(key);
                        elem.value = value;
                        elem.addEventListener("keyup", function() {
                            setSetting(this.id, this.value);
                        }, false);
                        break;

                    // SWITCHERY ON/OFF SWITCH
                    case "isOpenStreetMapEnabled":
                    case "isRandomExampleEnabled":
                    case "axonIgnoreErrors":
                    case "wikipediaOnly":
                        var elem = document.getElementById(key);
                        if (value===true) elem.setAttribute("checked","checked");
                        new Switchery(elem, { size: 'small' } );
                        elem.addEventListener("change", function() {
                            setSetting(this.id, this.checked);
                        }, false);
                        break;
                }
            }
        });
    });
});
