/**
 * @author Scott Lewis <scott@atomiclotus.net>
 * @copyright 2018 Scott Lewis
 * @version 1.0.0
 * @url http://github.com/iconifyit
 * @url https://atomiclotus.net
 *
 * ABOUT:
 *
 *    This script saves a list of open Illustrator documents for you to easily
 *    return to this work 'session' at a later time without searching for all
 *    of your open documents.
 *
 * NO WARRANTIES:
 *
 *   You are free to use, modify, and distribute this script as you see fit.
 *   No credit is required but would be greatly appreciated.
 *
 *   THIS SCRIPT IS OFFERED AS-IS WITHOUT ANY WARRANTY OR GUARANTEES OF ANY KIND.
 *   YOU USE THIS SCRIPT COMPLETELY AT YOUR OWN RISK AND UNDER NO CIRCUMSTANCES WILL
 *   THE DEVELOPER AND/OR DISTRIBUTOR OF THIS SCRIPT BE HELD LIABLE FOR DAMAGES OF
 *   ANY KIND INCLUDING LOSS OF DATA OR DAMAGE TO HARDWARE OR SOFTWARE. IF YOU DO
 *   NOT AGREE TO THESE TERMS, DO NOT USE THIS SCRIPT.
 */

// Create an instance of CSInterface.
var csInterface = new CSInterface();
var fs = window.cep.fs;

window.defaultListSize = 13;
window.docCount        = 0;
window.docList         = [];

/**
 * Flyout Menu items.
 * @type {{
 *    GET_TOKEN: string,
 *    ABOUT_PAGE: string,
 *    HOME_PAGE: string,
 *    SHOP_PLUGINS: string,
 *    ENTER_TOKEN: string
 * }}
 */
var MENU_ITEMS = {
    COLLECT_DOCS  : "collect_open_docs",
    DOCUMENTATION : "documentation",
    OPEN_LOG_FILE : "open_log_file",
    DONATE        : "donate",
    ABOUT         : "about",
    RELOAD        : "reload"
};

var CONFIG = {};
csInterface.evalScript("AiSessions.getConfig()", function(result) {
    try {
        CONFIG = JSON.parse(result);

        csInterface.evalScript('AiSessions.initSessionsList()', function(result) {
            console.log('result', result);
            console.log('typeof result', typeof result);
            console.log('AiSessions.initSessionsList() returned successfully');
            initUserInterface(result);
        });
    }
    catch(e) {
        console.error(e);
    }
});

/**
 * Initialize the UI with stored session data.
 * @param result
 */
function initUserInterface(result) {

    var $select  = $("#sessions"),
        $open    = $("#open-button"),
        $save    = $("#save-button"),
        $message = $("#message");

    var sessions = [];

    try {
        var test = eval(result);
        if (typeof test === 'object') {
            if (typeof test.length !== 'undefined' && test.length > 0) {
                sessions = test;
            }
        }
    }
    catch(e) {
        console.error(e);
    }

    console.log('initUserInterface with ' + sessions.length + ' sessions');

    clearMessage();

    if (typeof(sessions) === 'string') {
        showMessage(result);
        return;
    }

    if (isEmpty(sessions)) {
        showMessage("You have no saved sessions");
        setTimeout(function() {
            $message.fadeOut(200);
        }, 4000);
    }

    $('option', $select).remove();

    for (var i=0; i < sessions.length; i++) {

        var description, $option;

        var theFile       = decodeURI(sessions[i]),
            optionText    = decodeURI(theFile.replace(".json", "")),
            formattedDate = formatSessionDate(theFile);

        if (formattedDate.indexOf("Invalid") == -1) {
            optionText = formattedDate;
        }

        description = optionText;

        try {
            console.log('CONFIG.SRCFOLDER : ' + CONFIG.SRCFOLDER);
            console.log('filepath : ' + CONFIG.SRCFOLDER + '/' + theFile);

            result = readJsonFile(path(CONFIG.SRCFOLDER, theFile));

            if (result.err === undefined) {
                if (result.description !== undefined) {
                    description = result.description;
                }
            }
            else {
                console.error(str('fs.readFile resturned error code {0}', result.err));
            }
        }
        catch(e) {
            console.error(e);
            // console.info('Session description could not be read. Skipping')
        }

        $option = $("<option/>")
            .val(basename(theFile))
            .text(optionText)
            .attr('title', description);
        $select.append($option);
    }

    if (window.docCount > 0) {
        $save.removeAttr('disabled');
    }

    $select.change(function() {
        $open.removeAttr('disabled');
    });

    $open.on('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // csxOpenSession($select.val());
        csInterface.evalScript('AiSessions.doOpenCallback("' + $select.val() + '")', function(result) {
            console.log('AiSessions.doOpenCallback called', result);
        });
        $open.blur();
    });

    $('option', $select).on('dblclick', function(e) {
        // csxOpenSession($select.val());
        csInterface.evalScript('AiSessions.doOpenCallback("' + $select.val() + '")');
    });

    $('option').on('contextmenu', function(e) {

        $(this).attr("selected", true);

        try {
            csInterface.setContextMenu($("#contextMenu").text(), contextMenuHandler);
        }
        catch(ex) {
            console.error(ex);
        }
        csInterface.addEventListener("com.adobe.csxs.events.contextMenuClicked", contextMenuHandler);
    });

    $save.off('mouseup').on('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
        csxSaveSession(initUserInterface);
        $save.blur();
    });

    initFlyoutMenu();

};

/**
 * Shows a message in the palette.
 * @param text
 */
function showMessage(text) {
    var $message = $("#message");
    var $select  = $("#sessions");
    var chars    = text.length;
    var text     = $.trim(text);
    var oldText  = $.trim($message.text());

    if (text == "") return;
    if (strcmp(oldText, text)) return;

    var rows = Math.round(chars / 30);

    $message.text(text);
    if (rows > 0) {
        $select.attr('size', window.defaultListSize - rows);
    }

    $message.show();
}

/**
 * Clears and hides the palette message block.
 */
function clearMessage() {
    var $message = $("#message");
    $message.text("");
    $message.hide();
}

/**
 * Parse date string from session file name.
 * @param   {string} theFile
 * @returns {string}
 */
function formatSessionDate(theFile) {

    var fileName = basename(theFile).replace('.json', '');

    var date = fileName.split('@').shift().split('-');
    var ts   = parseInt(fileName.split('@').pop());

    time = new Date(ts).toTimeString().split(" ").shift();

    var yy = date[0],
        mm = date[1] - 1,
        dd = date[2],
        hh = 12,
        mn = 1,
        ss = 1;

    var dateString = (new Date(yy, mm, dd, hh, mn, ss)).toDateString();

    // console.log( dateString );

    var bits = dateString.split(' ');

    return []
        .concat(bits.pop())
        .concat(':')
        .concat(bits.slice(1, 3))
        .concat(['@', time])
        .join(' ');;
}

/**
 * Callback for handling context menu events.
 * @param menuId
 */
function contextMenuHandler(menuId) {

    var $select  = $("#sessions");
    var sessionFileName = decodeURI($select.val());

    switch (menuId) {
        case "copySessionDocs" :
            csInterface.evalScript("AiSessions.doCopySessionDocs('" + sessionFileName + "')",  function(result) {
                console.log(result);
                refresh();
            });
            break;

        case "deleteSession" :
            csInterface.evalScript("AiSessions.doDeleteSession('" + sessionFileName + "')",  function(result) {
                console.log(result);
                refresh();
            });
            break;

        case "renameSession" :
            csInterface.evalScript("AiSessions.doRenameSession('" + sessionFileName + "')",  function(result) {
                console.log(result);
                refresh();
            });
            break;

        case "openSession" :
            csInterface.evalScript("AiSessions.doOpenSessionFile('" + sessionFileName + "')", function(result) {
                console.log(result);
                refresh();
            });
            break;

        case "addDescription":
            csInterface.evalScript("AiSessions.doAddDescription('" + sessionFileName + "')", function(result) {
                console.log(result);
                refresh();
            });
            break;

        default:
            break;
    }
}

/**
 * Flyout menu builder.
 */
function initFlyoutMenu() {
    var Menu = new FlyoutMenu();
    Menu.add( MENU_ITEMS.COLLECT_DOCS,  'Collect Open Files', true, false, false );
    Menu.add( MENU_ITEMS.OPEN_LOG_FILE, 'Open Log File',      true, false, false );
    Menu.add( MENU_ITEMS.DOCUMENTATION, 'Documentation',      true, false, false );
    Menu.divider();
    Menu.add( MENU_ITEMS.ABOUT,         'About Atomic Lotus', true, false, false, false);
    Menu.add( MENU_ITEMS.DONATE,        'Buy me a coffee',    true, false, false, false);
    Menu.divider();
    Menu.add( MENU_ITEMS.RELOAD,        'Reload Extension',   true, false, false, false);
    Menu.setHandler( flyoutMenuClickedHandler );
    Menu.build();
}

/**
 * Flyout menu click handler.
 * @param event
 */
function flyoutMenuClickedHandler(event) {
    switch (event.data.menuId) {
        case MENU_ITEMS.COLLECT_DOCS :
            csInterface.evalScript("AiSessions.doCollectOpenDocs()", feedback);
            break;

        case MENU_ITEMS.DOCUMENTATION :
            openWebAddress('https://github.com/iconifyit/cep-ai-sessions');
            break;

        case MENU_ITEMS.OPEN_LOG_FILE :
            csInterface.evalScript("AiSessions.openLogFile()", feedback);
            break;

        case MENU_ITEMS.DONATE :
            openWebAddress('https://paypal.me/iconify/10');
            break;

        case MENU_ITEMS.ABOUT :
            openWebAddress('https://atomiclotus.net/services/');
            break;

        case MENU_ITEMS.RELOAD :
            reloadExtension();
            break;

        default:
            break;
    }
}

/**
 * Interface to Host to open a web page in the default browser.
 * @param address
 */
function openWebAddress(address) {
    csInterface.openURLInDefaultBrowser(address);
};

/**
 * Shortcut to `console.log()`
 * @param {*} result
 */
function feedback(result) {
    console.log(result);
}

/**
 * Case-insensitive string comparison.
 * @param aText
 * @param bText
 * @returns {boolean}
 */
function strcmp(aText, bText) {
    return aText.toLowerCase() == bText.toLowerCase();
}

/**
 * Call the csInterface to open session.
 * @param filePath
 */
function csxOpenSession(filePath) {
    try {
        csInterface.evalScript('AiSessions.doOpenCallback("' + filePath + '")');
    }
    catch(e) {
        alert(e);
    }
}

/**
 * Call the csInterface to save session.
 */
function csxSaveSession(theCallback) {
    csInterface.evalScript('AiSessions.doSaveCallback()', theCallback);
}

/**
 * Wrapper for csInterface.evalScript
 * @param theScript
 * @param theCallback
 */
function csEvalScript(theScript, theCallback) {
    csInterface.evalScript(theScript, theCallback)
}

/**
 * DEV ONLY
 * Reloads the extension front-end.
 */
function reloadExtension() {
    try {
        window.cep.process.removeAllListeners();
        window.location.href = "index.html";
    }
    catch (e) {
        window.location.href = "index.html";
    }
}

/**
 * Send error message to log via CSInterface.
 * @param message
 */
function logError(message) {
    logMessage(message, 'error');
}

/**
 * Send info message to log via CSInterface.
 * @param message
 */
function logInfo(message) {
    logMessage(message, 'info');
}

/**
 * Send success message to log via CSInterface.
 * @param message
 */
function logSuccess(message) {
    logMessage(message, 'success');
}

/**
 * Send message to log via CSInterface.
 * @param message
 */
function logMessage(message, type) {
    csInterface.evalScript('csxLogger("' + message + '", "' + type + '")');
}

// Run now

function refresh() {
    csInterface.evalScript('AiSessions.initSessionsList()', function(result) {
        console.log('AiSessions.initSessionsList() returned successfully');
        initUserInterface(result);
    });
}
