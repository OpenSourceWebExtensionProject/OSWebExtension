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

var Template = (function() {

    var _isTemplateLoaded = false;
    var _isLoading = false; // prevents loading template multiple times
    var _axonDiv = null;

    function getFile(filename, callback) {
        chrome.runtime.sendMessage({
            message      : "getFile",
            filename     : filename
        }, function(response) {
            callback(response);
        });
    }

    function getFileUrl(filename, callback) {
        chrome.runtime.sendMessage({
            message      : "getFileUrl",
            filename     : filename
        }, function(response) {
            callback(response);
        });
    }

    function loadMainTemplate(callback) {

        if (_isLoading === true) return;
        _isLoading = true;

        _Bubble.axonDiv = null;

        getFile("Content/Lib/Template/template.css", function(templateCss) {

            if (typeof(templateCss.error)!=="undefined") return callback(templateCss);

            getFile("Content/Lib/Template/template.html", function(template) {

                if (typeof(template.error)!=="undefined") return callback(template);

                var mainDiv = document.createElement("div");
                mainDiv.className = "axonShadowRoot-"+Config.settings.extensionId;

                if (typeof mainDiv.createShadowRoot === "function") 
                {
                    _axonDiv = mainDiv.createShadowRoot();
                }
                else _axonDiv = mainDiv;

                document.documentElement.appendChild(mainDiv);

                var newStyleElement = document.createElement('style');
                newStyleElement.id = "axon-style-container";
                DomHelper.parseHTMLAndInsertIntoElement(templateCss, newStyleElement);
                _axonDiv.insertBefore(newStyleElement, null);

                DomHelper.parseHTMLAndInsertIntoElement(template, _axonDiv, false);

                _axonDiv.getElementById('annotation-audio-icon').addEventListener('dblclick', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });

                _axonDiv.getElementById('annotation-attribution').addEventListener("click", function(e) {
                    e.stopPropagation();
                    return false;
                });

                _axonDiv.getElementById('annotation-definition').addEventListener("click", function(e) {
                    e.stopPropagation();
                });

                _axonDiv.getElementById('annotation-main').addEventListener("click", function(e) {
                    e.stopPropagation();
                });

                _axonDiv.getElementById('example-main').addEventListener("click", function(e) {
                    e.stopPropagation();
                });

                _axonDiv.getElementById("annotation-close").addEventListener("click", function(e) {
                    if (e.which===1) { // left mouse button
                        unloadTemplate();
                    }
                });

                _axonDiv.getElementById("example-close").addEventListener("click", function(e) {
                    if (e.which===1) { // left mouse button
                        _axonDiv.getElementById('axon-example-container').className = "displayNone";
                    }
                });

                _isTemplateLoaded = true;
                _isLoading = false;
                _Bubble.axonDiv = _axonDiv;
                callback({"axonDiv":_axonDiv});
            });
        });
    }

    function loadSettingsTemplate(callback) {

        getFile("Content/Settings/settings.html", function(settingsHtml) 
        {
            var settingsDiv = null;
            var mainDiv = document.createElement("div");
            mainDiv.className = "axonSettings-"+Config.settings.extensionId;

            if (typeof mainDiv.createShadowRoot === "function") 
            {
                settingsDiv = mainDiv.createShadowRoot();
            }
            else settingsDiv = mainDiv;

            document.documentElement.appendChild(mainDiv);
            DomHelper.parseHTMLAndInsertIntoElement(settingsHtml, settingsDiv);

        });
    }

    function addOpenInNewTabLink(axonData) 
    {
        var [lat,lng] = axonData.coordinates;
        var transparentBar = document.createElement('div');
        transparentBar.id = "open-street-map-transparent-bar";

        var openStreetMapInNewTabDiv = document.createElement('div');
        openStreetMapInNewTabDiv.className = "open-street-map-in-new-tab";
        var text = document.createTextNode("Open in new tab");
        openStreetMapInNewTabDiv.appendChild(text);

        var shadow = openStreetMapInNewTabDiv.cloneNode(true);
        shadow.appendChild(transparentBar);

        openStreetMapInNewTabDiv.addEventListener("click", function() {
            window.open("https://www.openstreetmap.org/relation/"+axonData.osmId+"#map="+axonData.zoomLevelMap+"/"+lat+"/"+lng);
        });

        var elems = _axonDiv.querySelectorAll(".ol-viewport");
        elems[0].appendChild(shadow);
        elems[0].appendChild(openStreetMapInNewTabDiv);
    }

    function loadOpenStreetMapTemplate(axonData, callback) {

        getFile("Content/Lib/Template/OpenLayers/ol.css", function(olCSS) {

            var loading=0, loaded=0;
            var [lat,lng] = axonData.coordinates;
            var source = new ol.source.OSM();

            var exampleMainElement = _axonDiv.getElementById('example-main');
            var newExampleWidth = Math.max(Config.MIN_EXAMPLE_BUBBLE_WIDTH, (parseInt(Config.settings.openStreetMapWidth)+30));
            exampleMainElement.style.width = newExampleWidth+"px";

            var newStyleElement = document.createElement('style');
            newStyleElement.id = "axonGoogleMapsCss";
            DomHelper.insertTextIntoElement(olCSS, newStyleElement);
            var axonMapCanvasContainerElement = _axonDiv.getElementById('axon-map-canvas-container');
            axonMapCanvasContainerElement.appendChild(newStyleElement);

            var osmElement = _axonDiv.getElementById("open-street-map");
            DomHelper.emptyElement(osmElement);
            osmElement.style.height=axonData.mapHeight+"px";
            osmElement.style.width =axonData.mapWidth+"px";

            var raster = new ol.layer.Tile({
                "source": source 
            });

            var layers = [raster];

            if (typeof axonData.geojson !== "undefined")
            {
                var vectorSource = new ol.source.Vector({
                   "features": (new ol.format.GeoJSON()).readFeatures(
                       axonData.geojson,
                       {featureProjection: ol.proj.get('EPSG:3857')}
                   )
                });

                var vector = new ol.layer.Vector({
                    "source": vectorSource,
                    "style": new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'blue',
                                    width: 1
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(0, 0, 255, 0.05)'
                                })
                           })
                });

                layers.push(vector);
            }

            var map = new ol.Map({
                "target": _axonDiv.getElementById("open-street-map"),
                "layers": layers,
                "view": new ol.View({
                    center: ol.proj.fromLonLat([lng, lat]),
                    zoom: axonData.zoomLevelBubble
                })
            });

            map.once('postrender', function(event) 
            {
                map.updateSize();
                addOpenInNewTabLink(axonData);
            });

            map.once('postcompose', function(event) 
            {
                source.on('tileloadstart', function() {
                    ++loading;
                });

                source.on('tileloadend', function() {
                    ++loaded;
                    if (loading===loaded) {
                        this.id="openStreetMapCanvas";
                    }                   
                }, event.context.canvas);

                source.on('tileloaderror', function() {
                }, event.context.canvas);
            });

            var geocoder = new Geocoder('nominatim', {
                provider: 'osm',
                placeholder: 'Type a location to search...',
                inputText: axonData.displayName,
                lang: 'en',
                targetType: 'text-input',
                limit: 5,
                debug: false,
                autoComplete: true,
                keepOpen: false,
                preventDefault: true // handled by addresschosen
            });

            geocoder.on('addresschosen', function(evt){

                new Request().getOsmCoordinatesAndPolygon(evt.address.original.formatted, function(result)
                {
                    // ol3-geocoder.js transforms coordinates to EPSG:4326
                    map.getView().setCenter(ol.proj.transform(evt.coordinate, 'EPSG:4326', 'EPSG:4326'));
                    map.getView().setZoom(axonData.zoomLevelBubble);

                    var vectorLayer = map.getLayers().getArray()[1];
                    vectorLayer.setVisible(false);

                    if (result.xhrResponseFiltered!==null)
                    {
                        geocoder.setInputText(result.xhrResponseFiltered.displayName);

                        if (result.xhrResponseFiltered.geocoder!==null)
                        {
                            var newSource = new ol.source.Vector({
                               "features": (new ol.format.GeoJSON()).readFeatures(
                                   result.xhrResponseFiltered.geojson,
                                   {featureProjection: ol.proj.get('EPSG:3857')}
                               )
                            });
                            vectorLayer.setSource(newSource);
                            vectorLayer.setVisible(true);
                        }
                    }
                });
            });

            map.addControl(geocoder);

            callback();
        });
    }

    function unloadTemplate() 
    {
        if (_isTemplateLoaded===true) 
        {
            //DomHelper.removeElementById('axon-style-container', _axonDiv);
            //DomHelper.removeElementById('axon-annotation-container', _axonDiv);
            //DomHelper.removeElementById('axon-example-container', _axonDiv);
            DomHelper.removeElementByClassName('axonShadowRoot-'+Config.settings.extensionId);
            _isTemplateLoaded = false;
        }
    }

    return {
        "loadMainTemplate":          loadMainTemplate,
        "loadOpenStreetMapTemplate": loadOpenStreetMapTemplate,
        "unloadTemplate":            unloadTemplate,
        "loadSettingsTemplate":      loadSettingsTemplate,
        get isTemplateLoaded()       { return _isTemplateLoaded; },
        get Bubble()                 { return _isTemplateLoaded===true ? _Bubble : null; }
    }

})();
