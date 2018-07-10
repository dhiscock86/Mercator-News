/**********************************************************************************************************
 * Title: definePolygon.js
 * Purpose: to initialize choropleth density map, retrieve geoJson data, convert to featureLayer,
 *          apply rendering and popups. 
 * Author: Daniel Hiscock
 * Date: May 2018
 * Disclaimer: Capstone Project for the completion of the Advanced Goegraphic Sciences Program at COGS
 **********************************************************************************************************/

define([
    // ArcGIS
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/geometry/Polygon",
    "esri/config",
    "esri/request",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleFillSymbol",
    "dojo/_base/array",

    // Widgets
    "esri/widgets/Home",
    "esri/widgets/Search",
    "esri/widgets/BasemapToggle",
    "esri/widgets/ScaleBar",
    "esri/widgets/Legend",

    // Dojo
    "dojo/dom",
    "dojo/parser",

    // Calcite Maps
    "calcite-maps/calcitemaps-v0.7",
    // Calcite Maps ArcGIS Support
    "calcite-maps/calcitemaps-arcgis-support-v0.7",

    // Boostrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",
    "bootstrap/Tab",
    "bootstrap/Carousel",
    "bootstrap/Tooltip",
    "bootstrap/Modal",

    "dojo/domReady!"
], function (Map, MapView, FeatureLayer, Polygon, esriConfig, esriRequest, SimpleRenderer, 
			 SimpleFillSymbol, arrayUtils, Home, Search, BasemapToggle, ScaleBar, Legend,
			 dom, parser, CalciteMaps, CalciteMapArcGISSupport, Collapse, Dropdown) {

        parser.parse();

        /**************************************************************************************************
         * Although this script works it is currently unable to draw all required polygon featureLayers.
         * According to ESRI, webgl will work with client-side graphics upon the next release of ArcServer
         **************************************************************************************************/
        return {
            initPolygon: initPolygon,
            removeAllLayers: removeAllLayers,
            initiateLoad: initiateLoad
        };

        var map, view, url, polygonLayer, language, legend, location, polygonFields, polygonTemplate, gdeltPolygonRenderer;

        /******************************************************************
         *
         * Create the map, view and widgets
         *
         ******************************************************************/

        function initPolygon() {

            // Define the specification for each field to create in the feature layer
            polygonFields = [
                {
                    name: "ObjectID",
                    alias: "ObjectID",
                    type: "oid"
                }, {
                    name: "gnscc",
                    alias: "country",
                    type: "string"
                }, {
                    name: "value",
                    alias: "value",
                    type: "double"
                }, {
                    name: "html",
                    alias: "count",
                    type: "string"
                }, {
                    name: "shareimage",
                    alias: "image",
                    type: "string"
                }, {
                    name: "name",
                    alias: "name",
                    type: "string"
                }, {
                    name: "name_formal",
                    alias: "name_formal",
                    type: "string"
                }];

            // Set up pop-up template for the layer
            polygonTemplate = {
                title: "{name}",
                dockOptions: {
                    buttonEnabled: false
                },
                content: [
                    {
                        type: "media",
                        mediaInfos: [{
                            type: "image",
                            value: {
                                sourceURL: "{shareimage}"
                            }
                        }]
                    },
                    {
                        type: "fields",
                        fieldInfos: [{
                            fieldName: "value",
                            label: "value",
                            visible: true
                        }, {
                            fieldName: "shareimage",
                            label: "Image",
                            visible: true
                        }, {
                            fieldName: "html",
                            label: "Article",
                            visible: true
                        }]
                    }

                ]
            };



            /*************************************************
             * Define the renderer for symbolizing news data
             *************************************************/

            // Class breaks by color for polygon data
            var colorPolygon = {
                type: "color",
                field: "value",
                stops: [
                    {
                        value: 0,
                        color: "#feedde"
                    },
                    {
                        value: 0.1,
                        color: "#fdd0a2"
                    },
                    {
                        value: 0.3,
                        color: "#fdae6b"
                    },
                    {
                        value: 0.7,
                        color: "#fd8d3c"
                    },
                    {
                        value: 1,
                        color: "#f16913"
                    },
                    {
                        value: 2,
                        color: "#d94801"
                    },
                    {
                        value: 3,
                        color: "#8c2d04"
                    }]
            };

            //apply rendering to the polygon data using class breaks
            gdeltPolygonRenderer = new SimpleRenderer({
                symbol: new SimpleFillSymbol({
                    style: "solid",
                    outline: {
                        width: 0.5,
                        color: "#252525",
                        style: "solid"
                    }
                }),
                visualVariables: [colorPolygon]
            });


            // Map
            map = new Map({
                basemap: "gray"
            });

            // View
            view = new MapView({
                container: "mapViewDiv",
                map: map,
                center: [0, 30],
                zoom: 3,
                padding: {
                    top: 50,
                    bottom: 0
                }
                //ui: { components: [] }
            });

            // Search - add to navbar
            var searchWidget = new Search({
                container: "searchWidgetDiv",
                view: view
            });
            CalciteMapArcGISSupport.setSearchExpandEvents(searchWidget);

            // Map widgets
            var home = new Home({
                view: view
            });
            view.ui.add(home, "top-right");

            var basemapToggle = new BasemapToggle({
                view: view,
                nextBasemap: "dark-gray"
            });
            view.ui.add(basemapToggle, "bottom-right");

            view.ui.move("zoom", "top-right");

            var scaleBar = new ScaleBar({
                view: view,
                unit: "metric"
            });
            view.ui.add(scaleBar, "bottom-left");

            view.ui.remove("attribution");
        }

        /************************************************************************************************
         *
         * Add the geoJSON Data and popup functionality
         *
         * Note: Functions are organized in the same order they are resolved in the promise chain
         ************************************************************************************************/

        // function to run each function asynchronously using promises
        function initiateLoad() {
            // Request the news data from GDELT when the view resolves
            removeAllLayers() // first remove any layers on the map
                .then(getLanguage) // then set the language for the news
                .then(getLocation) // then set the location for the news query
                .then(getURL) // when the language is resovled, the language is sent  to getURL()
                .then(createGraphics) // when getData() resolves, the request / response is sent to createGraphics()
                .then(createLayer) // when graphics are created, create the layer
                .then(createLegend) // then create the legend
                .catch(errback); // if something goes wrong throw an error exception
        }
		
		// remove all layers from the map
        async function removeAllLayers() {
            map.removeAll();
        }

		
        // set the language for the GDELT connection
        function getLanguage() {
            var newsLang = dom.byId("langDropdown").value.toString();

            if (newsLang === "noneSelected") {
                language = "";
            } else {
                language = "+sourcelang:" + newsLang;
            }
            console.log(language);
            return language;
        }

        // set the location of the query (if activated)
        function getLocation(language) {
            var locationVal = dom.byId("selectedCountry").value;
            console.log(locationVal);
            if (locationVal === "") {
                location = language + "";
            } else {
                location = language + "+locationcc:" + locationVal;
            }
            console.log(location);
            return location;
        }

        // set the GDELT API settings
        function getURL() {
            //var displayType = getDataStyle();
            var queryValue = dom.byId("inputQuery").value;
            if (queryValue === "") {
                url = "";
            } else {
                url = "https://api.gdeltproject.org/api/v2/geo/geo?query='" + queryValue + "'" + location + "&mode=country&format=geoJSON";
            }
            // supports Cross-Origin Resource Sharing CORS
            esriConfig.request.corsEnabledServers.push(url);
            console.log("the URL: " + url);

            // Request the gdelt data
            return esriRequest(url, {
                responseType: "json"
            });
        }

        // Create graphics with returned geojson data
        function createGraphics(response) {
            // raw GeoJSON data
            var geoJson = response.data;
            console.log("in the create graphics function");
            // Create an array of Graphics from each GeoJSON feature
            return arrayUtils.map(geoJson.features, function (feature, i) {
                return {
                    geometry: new Polygon({
                        rings: feature.geometry.coordinates
                    }),
                    // select only the attributes you care about
                    attributes: {
                        ObjectID: i,
                        name: feature.properties.name,
                        value: feature.properties.value,
                        shareimage: feature.properties.shareimage,
                        html: feature.properties.html
                    }
                };
            });
        }

        // Create a FeatureLayer with the array of graphics
        function createLayer(graphics) {

            console.log("in the create layer function");

            polygonLayer = new FeatureLayer({
                source: graphics, // autocast as an array of esri/Graphic
                // create an instance of esri/layers/support/Field for each field object
                fields: polygonFields, // This is required when creating a layer from Graphics
                objectIdField: "ObjectID", // This must be defined when creating a layer from Graphics
                renderer: gdeltPolygonRenderer, // set the visualization on the layer
                spatialReference: {
                    wkid: 4326
                },
                geometryType: "polygon", // Must be set when creating a layer from Graphics
                popupTemplate: polygonTemplate
            });
            map.add(polygonLayer);

            return polygonLayer;
        }      

        
        /******************************************************************
         * Add layer to layerInfos in the legend
         ******************************************************************/
        // function to create the legend
        function createLegend() {
            // if the legend already exists, then update it with the new layer
            if (legend) {
                legend.layerInfos = [{
                    layer: polygonLayer,
                    title: "News Polygon Density"
                }];
            } else {
                legend = new Legend({
                    view: view,
                    layerInfos: [
                        {
                            layer: polygonLayer,
                            title: "News Polygon Density"
                        }]
                }, "legendDiv");
            }
        }

        // Executes if data retrieval was unsuccessful.
        function errback(error) {
            console.error("Oops, something went wrong. ", error);
        }
    });