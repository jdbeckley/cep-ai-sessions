
//  Create an instance of CSInterface.

var csInterface = new CSInterface();

// Make a reference to your HTML button and add a click handler.

var openButton = document.querySelector("#open-button");

openButton.addEventListener("click", openDoc);

/**
 * Helper function to pass instructions to the ExtendScript side.
 */
function openDoc() {
    csInterface.evalScript("openDocument()");
}
