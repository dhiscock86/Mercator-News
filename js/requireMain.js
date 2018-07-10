/**********************************************************************************************************
 * Title: requireMain.js
 * Purpose: Add event listeners and controls for HTML / JavaScripts 
 * Author: Daniel Hiscock
 * Date: May 2018
 * Disclaimer: Capstone Project for the completion of the Advanced Goegraphic Sciences Program at COGS
 **********************************************************************************************************/

require([ 
    // Definition modules
    "js/definePoint.js",
    "js/definePolygon.js",

    // Dojo
    "dojo/on",
    "dojo/dom",
    "dojo/parser",
    "dojo/domReady!"
], function (definePoint, definePolygon, on, dom, parser) {

    parser.parse();
	
	// initialize defineMain as the point script initially
    var defineMain = definePoint;
    
    var lblDataType = dom.byId("dataMode");
    var tglDataType = dom.byId("tglDataType");
            
    lblDataType.innerHTML = "Point Density Map";
    
    // when event listener init is resolved load the define script 
    initEventListeners()    
    	.then(defineMain.initPoint);
    
    /****************************************************
     *
     * Wire user interface events
     *
     ****************************************************/ 
       
    // Event listener to reload map with other data display configuration
    tglDataType.addEventListener('change', function () {
        if (this.checked) {
            console.log("Data changer checked");
            defineMain = definePolygon;
			
             // when event listener init is resolved load the define script 
            initEventListeners()    
    			.then(defineMain.initPolygon);
                       
            lblDataType.innerHTML = "Polygon Density Map";
        } else {
            console.log("Data changer unchecked");
            defineMain = definePoint;
			
             // when event listener init is resolved load the define script 
            initEventListeners()    
    			.then(defineMain.initPoint);
    	
            lblDataType.innerHTML = "Point Density Map";
        }
    });   
    
    /***************************************************************************
    *
    * Initiatize Event Listeners - This is to connect the handle events 
    * to the script determined by the data type handler
    *
    ****************************************************************************/
    
    async function initEventListeners() {
       
		// Event Handler for the clear data button     
		var btnClearData = dom.byId("btnClear");
		if (btnClearData) {
			on(btnClearData, "click", defineMain.removeAllLayers);
		}

		// Event Handler for the apply button for the main query input
		var btnAddData = dom.byId("btnAdd");
		if (btnAddData) {
			on(btnAddData, "click", defineMain.initiateLoad);
		}

		// Event Handler for the main search / query box using the enter key
		var txtInput = dom.byId("inputQuery");
		if (txtInput) {
			on(txtInput, "keydown", function (event) {
				if (event.keyCode === 13) {
					defineMain.initiateLoad();
				}
			});
		}

		// Event Handler for the Language drop-down selector
		var selectLanguage = dom.byId("langDropdown");
		if (selectLanguage) {
			on(selectLanguage, "change", function () {
				defineMain.initiateLoad();
			});
		}
    }            
    
});


