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

var DEFAULT_LIST_SIZE = 17;

window.docCount = 0;
window.docList  = [];

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
    ABOUT         : "about"
};

$(function() {

    // Create an instance of CSInterface.
    var csInterface = new CSInterface();

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
            $select.attr('size', DEFAULT_LIST_SIZE - rows);
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
     * Callback to pass to CSInterface to set global client variable
     * to number of open documents.
     * @param {*} result
     */
    function setDocCount(result) {
        var count = parseInt(result);
        if (! isNaN(count)) {
            window.docCount = count;
        }
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

        console.log(ts);
        console.log(new Date(ts).toString());
        console.log(new Date(ts).toTimeString());
        console.log(time);

        console.log("TS : " + ts);
        console.log("TIME : " + time);


        var yy = date[0];
        var mm = date[1] - 1;
        var dd = date[2];
        var hh = 12;
        var mn = 01;
        var ss = 01;

        var dateString = (new Date(yy, mm, dd, hh, mn, ss)).toDateString();

        console.log( dateString );

        var bits = dateString.split(' ');

        return []
            .concat(bits.pop())
            .concat(':')
            .concat(bits.slice(1, 3))
            .concat(['@', time])
            .join(' ');;
    }

    /**
     * Populates the sessions select list.
     * @param {*} result
     */
    function initUserInterface(result) {

        var $select  = $("#sessions");
        var $open    = $("#open-button");
        var $save    = $("#save-button");

        console.log( result );

        var sessions = eval(result);

        clearMessage();

        if (typeof(sessions) === 'string') {
            showMessage(result);
            return;
        }

        if (isEmpty(sessions)) {
            showMessage("You have no saved sessions");
        }
        else {

            $('option', $select).remove();

            for (i=0; i < sessions.length; i++) {
                var theFile       = sessions[i];
                var optionText    = decodeURI(theFile.replace(".json", ""));
                var formattedDate = formatSessionDate(theFile);
                if (formattedDate.indexOf("Invalid") == -1) {
                    optionText = formattedDate;
                }

                var $option = $("<option/>");
                $option.val(basename(theFile));
                $option.text(optionText);
                $select.append($option);
            }

            if (window.docCount > 0) {
                $save.removeAttr('disabled');
            }

            $select.change(function() {
                $open.removeAttr('disabled');
            });

            $open.mouseup(function() {
                csxOpenSession($select.val());
                $open.blur();
            });

            $('option', $select).dblclick(function() {
                csxOpenSession($select.val());
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
        }
    };

    function contextMenuHandler(menuId) {

        var $select  = $("#sessions");
        var sessionFileName = decodeURI($select.val());

        switch (menuId) {
            case "copySessionDocs" :
                csInterface.evalScript("AiSessions.doCopySessionDocs('" + sessionFileName + "')",  refresh);
                break;

            case "deleteSession" :
                csInterface.evalScript("AiSessions.doDeleteSession('" + sessionFileName + "')",  refresh);
                break;

            case "renameSession" :
                csInterface.evalScript("AiSessions.doRenameSession('" + sessionFileName + "')",  refresh);
                break;

            case "openSession" :
                csInterface.evalScript("AiSessions.doOpenSessionFile('" + sessionFileName + "')", refresh);
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
                openWebAddress('https://paypal.me/iconify/5');
                break;

            case MENU_ITEMS.ABOUT :
                openWebAddress('https://atomiclotus.net/services/');
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
        csInterface.evalScript('AiSessions.openWebAddress("' + address + '")');
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
        csInterface.evalScript('AiSessions.doOpenCallback("' + filePath + '")');
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
     * Get basename of file path.
     * @param path
     * @returns {*}
     */
    function basename(path) {
        var basename = null;
        try {
            basename = path.split('/').pop();
        }
        catch(e) {
            logError(e.message);
        }
        return basename;
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
        csInterface.evalScript('AiSessions.initSessionsList()', initUserInterface);
    }

    refresh();
});