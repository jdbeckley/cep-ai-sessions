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

/**
 * Declare the target app.
 */
#target illustrator

$.localize = true;

#include "Logger.jsx"
#include "JSON.jsx"
#include "Utils.jsx"

/**
 * Set some global variables.
 */
var DATE_STRING      = Utils.dateFormat(new Date().getTime());
var SESSION_FILENAME = "ai-" + DATE_STRING + "-r1.json";

/**
 * @type {{
 *    SRCFOLDER: string,
 *    LOGFOLDER: string,
 *    LOGFILE: string,
 *    NO_OPEN_DOCS: *,
 *    NO_DOC_SELECTED: *,
 *    SESSION_SAVED: *,
 *    ENTER_FILENAME: *,
 *    JSON_EXT: string,
 *    TEXT_EXT: string
 * }}
 */
var CONFIG = {
    APP_NAME         : "ai-sessions",
    USER             : $.getenv('USER'),
    HOME             : $.getenv('HOME'),
    DOCUMENTS        : Folder.myDocuments,
    SRCFOLDER        : Folder.myDocuments + '/ai-sessions',
    LOGFOLDER        : Folder.myDocuments + '/ai-sessions/logs',
    LOGFILE          : Folder.myDocuments + '/ai-sessions/logs/ai-log-'  + DATE_STRING  + '-r1.log',
    NO_OPEN_DOCS     : localize({en_US: 'There are no open docs to save for this session'}),
    NO_DOC_SELECTED  : localize({en_US: 'You have not selected a session to open'}),
    SESSION_SAVED    : localize({en_US: 'Your Session Was Saved!'}),
    JSON_EXT         : ".json",
    TEXT_EXT         : ".txt"
};

/**
 * Run the script using the Module patter.
 */
var AiSessions = (function(CONFIG) {

    /**
     * The local scope logger object.
     * @type {Logger}
     */
    var logger = new Logger(CONFIG.APP_NAME, CONFIG.LOGFOLDER);

    /**
     * Populates the sessions select list.
     */
   function doGetSessionsList() {

        var files = new Folder(CONFIG.SRCFOLDER).getFiles("*.json");
        var sessions = [];
        for (i=0; i<files.length; i++) {
            sessions.push(files[i].name);
        }

        if (sessions.length) {
            /**
             * Let's show the newest sessions at the top.
             */
            try {
                sessions.sort(function(a, b) {
                    var nameA = Utils.slugger(a.toUpperCase());
                    var nameB = Utils.slugger(b.toUpperCase());
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    // names must be equal
                    return 0;
                });
                sessions.reverse();
            }
            catch(e) {
                logger.error(e.message);
            }
        }

        return JSON.stringify(sessions);
    };

    /**
     * Callback to open the selected session.
     * @param filepath
     */
   function doOpenCallback(filepath) {

        filepath = CONFIG.SRCFOLDER + "/" + filepath;

        var theFile = new File(decodeURI(filepath));

        if (theFile.exists) {
            try {
                var session = Utils.read_json_file(theFile);

                if (typeof(session) == 'object') {

                    if (session.files) {
                        for(i=0; i<session.files.length; i++) {
                            var ai_file_path = decodeURIComponent(session.files[i]);
                            var thisFile = new File(ai_file_path);
                            if (thisFile.exists) {
                                doc = app.open(thisFile);
                                app.executeMenuCommand('fitall');
                            }
                        }
                    }
                }
            }
            catch(ex) {
                return ex.message;
            }
        }
        else {
            logger.error(
                localize({en_US: "%1 - %2 - File `%3` does not exist."}, $.line, $.fileName, filepath)
            );
        }
    };

    /**
     * Saves the current session.
     */
    function doSaveCallback() {

        if (app.documents.length == 0) {
            alert(CONFIG.NO_OPEN_DOCS);
        }
        else {

            try {
                var openDocs = [];
                for (x=0; x<app.documents.length; x++) {
                    openDocs.push(
                        '"' + app.documents[x].path + "/" + app.documents[x].name + '"'
                    );
                }

                var testFile = new File(CONFIG.SRCFOLDER + "/" + SESSION_FILENAME);

                var n = 1;
                var max = 100;
                while (testFile.exists && n < max) {
                    SESSION_FILENAME = "ai-" + DATE_STRING + "-r" + n + CONFIG.JSON_EXT;
                    testFile = new File(CONFIG.SRCFOLDER + "/" + SESSION_FILENAME);
                    n++;
                }

                Utils.write_file(
                    CONFIG.SRCFOLDER + "/" + SESSION_FILENAME,
                    '{"files":[\r' + '    ' + openDocs.join(',\r    ') + '\r]}',
                    true
                );

                return doGetSessionsList();
            }
            catch(ex) {
                logger.error(ex.message);
            }
        }
    };

    /**
     * Callback for sorting the file list.
     * @param   {File}  a
     * @param   {File}  b
     * @returns {number}
     */
    var comparator = function(a, b) {
        var nameA = Utils.slugger(a.name.toUpperCase());
        var nameB = Utils.slugger(b.name.toUpperCase());
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        // names must be equal
        return 0;
    }

    /**
     * Returns the public module object.
     */
    return {
        doSaveCallback: function() {
            return doSaveCallback();
        },

        doOpenCallback: function(filePath) {
            doOpenCallback(filePath);
        },

        initSessionsList: function() {
            return doGetSessionsList();
        }
    }

})(CONFIG);

/**
 * Get number of open documents.
 * @returns {*}
 */
function getDocCount() {
    if (typeof(app.documents) != 'undefined') {
        return app.documents.length;
    }
    return 0;
}

/**
 * Callback to open the selected session.
 * @param filepath
 */
function doOpenCallback(filepath) {
    AiSessions.doOpenCallback(filepath);
};

/**
 * Callback to save session.
 */
function doSaveCallback() {
   return AiSessions.doSaveCallback();
   // return getSessionsList();
};

/**
 * Use this to interface from client side.
 * Example: csxScript('log("some text", "info")')
 * @param message
 * @param type
 */
function csxLogger(message, type) {
    var logger = new Logger(CONFIG.APP_NAME, CONFIG.LOGFOLDER);
    logger.log( message, type );
}

/**
 * Gets a list of available session files.
 * @returns {*}
 */
function getSessionsList() {
    return AiSessions.initSessionsList();
}

