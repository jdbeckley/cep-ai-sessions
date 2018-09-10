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

$(function() {

    // Create an instance of CSInterface.
    var csInterface = new CSInterface();

    csInterface.evalScript("getDocCount()", setDocCount);

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
        console.log("Document count : " + count);
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
        var fileName = basename(theFile)
            .replace('.json', '')
            .replace('ai-', '');

        var bits = fileName.split('-');
        var rev  = bits.length == 4 ? bits.pop() : 1;

        var yy = bits[0];
        var mm = bits[1] - 1;
        var dd = bits[2];
        var hh = 12;
        var mn = 01;
        var ss = 01;

        var dateString = new Date(yy, mm, dd, hh, mn, ss).toDateString();

        var bits = dateString.split(' ');
        dateString = []
            .concat(bits.pop())
            .concat('-')
            .concat(bits)
            .concat('(' + rev + ')')
            .join(' ');

        return dateString;
    }

    /**
     * Populates the sessions select list.
     * @param {*} result
     */
    function initUserInterface(result) {

        var $message = $("#message");
        var $select  = $("#sessions");
        var $open    = $("#open-button");
        var $save    = $("#save-button");
        var sessions = eval(result);

        clearMessage();

        if (typeof(sessions) === 'string') {
            showMessage(result);
            return;
        }

        if (! sessions.length) {
            showMessage("You have no saved sessions");
        }
        else {

            $('option', $select).remove();

            for (i=0; i < sessions.length; i++) {
                var theFile = sessions[i];
                var $option = $("<option/>");
                $option.val(basename(theFile));
                $option.text(formatSessionDate(theFile));
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

            $save.mouseup(function() {
                csxSaveSession(initUserInterface);
                $save.blur();
            });
        }
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
        csInterface.evalScript('doOpenCallback("' + filePath + '")');
    }

    /**
     * Call the csInterface to save session.
     */
    function csxSaveSession(theCallback) {
        csInterface.evalScript('doSaveCallback()', theCallback);
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

    csInterface.evalScript('getSessionsList()', initUserInterface);
});