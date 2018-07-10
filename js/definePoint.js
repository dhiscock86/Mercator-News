/**********************************************************************************************************
 * Title: definePoint.js
 * Purpose: to initialize point density map, retrieve geoJson data, convert to featureLayer,
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
	"esri/renderers/smartMapping/creators/size",
    "esri/geometry/Point",
    "esri/config",
    "esri/request",

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
], function (Map, MapView, FeatureLayer, sizeRendererCreator, Point, esriConfig, esriRequest, Home, Search, BasemapToggle, ScaleBar, Legend,
    dom, parser, Collapse, CalciteMapArcGISSupport, Dropdown, CalciteMaps) {

        parser.parse();

        // Cross-Origin Resource Sharing (CORS)
        /***************************************************************************************************************
         * Cross-Origin Resource Sharing (CORS) is a mechanism that uses additional HTTP headers to let a user agent
         * gain permission to access selected resources from a server on a different origin (domain) than the site
         * currently in use. A user agent makes a cross-origin HTTP request when it requests a resource from a different
         * domain, protocol, or port than the one from which the current document originated.
         ****************************************************************************************************************/
        return {
            initPoint: initPoint,
            removeAllLayers: removeAllLayers,
            initiateLoad: initiateLoad
        };

        var map, view, legend, url, pointLayer, language, legend, location, pointFields, pointTemplate, gdeltPointRenderer;

        /******************************************************************
         *
         * Create the map, view and widgets
         *
         ******************************************************************/

        function initPoint() {

            // Define the specification for each field to create in the feature layer
            pointFields = [
                {
                    name: "ObjectID",
                    alias: "ObjectID",
                    type: "oid"
                }, {
                    name: "name",
                    alias: "title",
                    type: "string"
                }, {
                    name: "count",
                    alias: "count",
                    type: "double"
                }, {
                    name: "shareimage",
                    alias: "image",
                    type: "string"
                }, {
                    name: "html",
                    alias: "html",
                    type: "string"
                }];

            // Set up popup template for the layer
            pointTemplate = {
                title: "{html}",
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
                            fieldName: "count",
                            label: "count",
                            visible: true
                        }, {
                            fieldName: "shareimage",
                            label: "Image",
                            visible: true
                        }, {
                            fieldName: "name",
                            label: "Mention Location",
                            visible: true
                        }]
                    }

                ]
            };       

        /*************************************************
         * Define the renderer for symbolizing news data
         *************************************************/

            // Class breaks by color for point data
            var colorVisVar = {
                type: "color",
                field: "count",
                stops: [
                    {
                        value: 1,
                        color: "#fee391"
                    },
					{
                        value: 15,
                        color: "#fec44f"
                    },
                    {
                        value: 50,
                        color: "#fe9929"
                    },
                    { 
                        value: 150,
                        color: "#ec7014"
                    },
                    {
                        value: 1000,
                        color: "#cc4c02"
                    },
                    {
                        value: 5000,
                        color: "#8c2d04"
                    }]
            };

            // Class breaks by size for point data
            var sizeVisVar = {
                type: "size",
                field: "count",
                valueUnit: "unknown",
                stops: [
                    {
                        value: 1,
                        size: 4
                    },
                    {
                        value: 15,
                        size: 7
                    },
					{
                        value: 50,
                        size: 9
                    },
                    {
                        value: 200,
                        size: 12
                    },
                    {
                        value: 500,
                        size: 15
                    },
                    {
                        value: 5000,
                        size: 20
                    }]
            };

            //apply rendering to the point data using class breaks
            gdeltPointRenderer = {
                type: "simple", // autocasts as new SimpleRenderer()
                symbol: {
                    type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                    outline: {
                        width: 1,
                        color: "#000000",
                        style: "solid"
                    }
                },
                visualVariables: [sizeVisVar, colorVisVar]
            };
			


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
                .then(updateExtent) // then update the extent based on the bounds of the feature layer
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
                url = "https://api.gdeltproject.org/api/v2/geo/geo?query='" + queryValue + "'" + location + "&format=geoJSON";
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
            return geoJson.features.map(function (feature, i) {
                return {
                    geometry: new Point({
                        x: feature.geometry.coordinates[0],
                        y: feature.geometry.coordinates[1]
                    }),
                    // select only the attributes you care about
                    attributes: {
                        ObjectID: i,
                        name: feature.properties.name,
                        count: feature.properties.count,
                        shareimage: feature.properties.shareimage,
                        html: feature.properties.html
                    }
                };
            });
        }

        // Create a FeatureLayer with the array of graphics
        function createLayer(graphics) {

            console.log("in the create layer function");

            pointLayer = new FeatureLayer({
                source: graphics, // autocast as an array of esri/Graphic
                fields: pointFields, // This is required when creating a layer from Graphics
                objectIdField: "ObjectID", // This must be defined when creating a layer from Graphics
                renderer: gdeltPointRenderer, 
                spatialReference: {
                    wkid: 4326
                },
                geometryType: "point", // Must be set when creating a layer from Graphics
                popupTemplate: pointTemplate
            });
			
            // add featureLayer to map
            map.add(pointLayer);

            return pointLayer;
        }

        /******************************************************************
         * Update the extent based on the bounds of the feature layer
         ******************************************************************/

        function updateExtent() {
            // adjusts the extent to the bounds of the features created by the query
            view.whenLayerView(pointLayer).then(function (layerView) {
            	// when the point layer resolves then update the layer
                layerView.watch("updating", function (val) {
                    // wait for the layer view to finish updating
                    if (!val) {
                        layerView.queryExtent().then(function (response) {
                            // go to the extent of all the graphics in the layer view
                            view.goTo(response.extent);
                        });
                    }
                });
            });
        }

        /******************************************************************
         * Add layer to layerInfos in the legend
         ******************************************************************/

        function createLegend() {
            // if the legend already exists, then update it with the new layer
            if (legend) {
                legend.layerInfos = [{
                    layer: pointLayer,
                    title: "News Point Density"
                }];
            } else {
                legend = new Legend({
                    view: view,
                    layerInfos: [
                        {
                            layer: pointLayer,
                            title: "News Point Density"
                        }]
                }, "legendDiv");
            }
        }

        // Execute errback if data retrieval was unsuccessful.
        function errback(error) {
            console.error("Oops, something went wrong. ", error);
        }
    });