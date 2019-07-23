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

#include "Logger.jsx"
#include "JSON.jsx"
#include "Utils.jsx"
#include "Helpers.jsx"

var HOME         = $.getenv('HOME'),
    SESSION_NAME = getSessionName(),
    myDocuments  = Folder.myDocuments.absoluteURI;

try {
    myDocuments = unmac(myDocuments);
}
catch(e) {
    /* Nothing to do for now */
}

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
    DOCUMENTS        : myDocuments,
    SRCFOLDER        : myDocuments + '/ai-sessions',
    LOGFOLDER        : myDocuments + '/ai-sessions/logs',
    LOGFILE          : myDocuments + '/ai-sessions/logs/' + SESSION_NAME  + '.log',
    NO_OPEN_DOCS     : 'There are no open docs to save for this session',
    NO_DOC_SELECTED  : 'You have not selected a session to open',
    NO_DOCS_TO_COPY  : 'There are no open documents to copy',
    SESSION_SAVED    : 'Your Session Was Saved!',
    JSON_EXT         : ".json",
    TEXT_EXT         : ".txt"
};


/**
 * The local scope logger object.
 * @type {Logger}
 */
var logger = new Logger(CONFIG.APP_NAME, CONFIG.LOGFOLDER);

logger.info("init " + SESSION_NAME);
logger.info(JSON.stringify(CONFIG));

/**
 * Run the script using the Module patter.
 */
var AiSessions = (function(CONFIG) {

    /**
     * Populates the sessions select list.
     */
   function doGetSessionsList() {

        var files = new Folder(CONFIG.SRCFOLDER).getFiles("*.json");
        var sessions = [];
        for (var i = 0; i < files.length; i++) {
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

        filepath = CONFIG.SRCFOLDER + "/" +  filepath;

        logger.info('FILEPATH : ' + filepath);

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
            logger.error(filepath + " does not exist");
        }
    };

    /**
     * Saves the current session.
     */
    function doSaveCallback() {

        var openDocs,
            sessionName,
            description;

        if (app.documents.length == 0) {
            alert(CONFIG.NO_OPEN_DOCS);
        }
        else {

            try {
                openDocs    = getOpenDocPathsQuoted();
                sessionName = getSessionName();

                CONFIG.LOGFILE = sessionName + ".log";

                description = getDescriptionFromUser(sessionName);

                var json = str(
                    '{\n"files":[\n\t{0}\n], \n"description" : "{1}"\n}',
                    openDocs.join(',\n\t'),
                    description
                );

                logger.info(json);

                Utils.write_file(
                    CONFIG.SRCFOLDER + "/" + sessionName + ".json",
                    '{"files":[' + '    ' + openDocs.join(', ') + '], "description" : "' + description + '"}',
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
     * Get full paths of all open documents.
     * @returns {Array}
     */
    function getOpenDocPaths() {
        var openDocs = [];
        for (x=0; x<app.documents.length; x++) {
            openDocs.push(app.documents[x].path + "/" + app.documents[x].name);
        }
        return openDocs;
    }

    /**
     * Get full paths of all open documents.
     * @returns {Array}
     */
    function getOpenDocPathsQuoted() {
        var openDocs = getOpenDocPaths();
        for (x=0; x<openDocs.length; x++) {
            openDocs[x] = '"' + openDocs[x] + '"';
        }
        return openDocs;
    }

    /**
     * Creates a web shortcut then opens it in the default browser.
     * @param address
     * @private
     */
    function doOpenWebAddress( address ) {
        try {
            Utils.write_exec(
                Folder.temp + '/' + now() + '-shortcut.url',
                '[InternetShortcut]' + '\r' + 'URL=' + encodeURI(address) + '\r'
            );
        }
        catch(e) {
            logger.error(e);
            prompt(
                "The web address could not be automatically opened but " +
                "you can copy & paste the address below to your browser.",
                address
            );
        }
    };

    /**
     * Collection the open documents into the specified folder.
     * @private
     */
    function _doCollectOpenDocs() {

        var fileList;

        if (! app.documents.length) {
            alert(CONFIG.NO_DOCS_TO_COPY);
            return;
        }

        fileList = getOpenDocPaths();

        logger.info(fileList);

        if (! isEmpty(fileList)) {
            logger.info("fileList is not empty. Try to copy.");
            return _doCopyFiles(fileList);
        }
        else {
            return "Cannot collect open docs. File list is empty";
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
     * Private function to delete a session file.
     * @param sessionFileName
     * @private
     */
    function _doDeleteSession(sessionFileName) {
        var result = false;

        var dialogPrompt = "Are you sure you want to delete the session `" + sessionFileName + "`";

        if ( confirm(dialogPrompt, sessionFileName) ) {
            if (sessionFile = getSessionFile(sessionFileName)) {
                result = sessionFile.remove() ?
                    "Session file was deleted" :
                    "Session file could not be deleted";
            }
        }
        else {
            result = "NOOO! Don't delete it!";
        }
        return JSON.stringify({result: result});
    }

    /**
     * Private function to rename a session file.
     * @param sessionFileName
     * @private
     */
    function _doRenameSession(sessionFileName) {
        var result = false;

        var dialogPrompt ="Enter a new name for the session `" + sessionFileName + "`";

        if ( newName = prompt(dialogPrompt, sessionFileName) ) {
            if (newName.toLowerCase().split(".").pop() != "json") {
                newName += ".json";
            }
            if (sessionFile = getSessionFile(sessionFileName)) {
                result = sessionFile.rename(newName) ?
                    "Session file was renamed" :
                    "Session file could not be renamed" ;
            }
        }
        return JSON.stringify({result: result });
    }

    /**
     * Prompts user for description.
     * @param defaultText
     * @returns {string}
     */
    function getDescriptionFromUser(defaultText) {

        var description = prompt(
            "Enter a description for session",
            defaultText
        );

        return isEmpty(description) ? defaultText : description;
    }

    /**
     * Add description to session file JSON.
     * @param sessionFileName
     * @returns {string}
     * @private
     */
    function _doAddDescription(sessionFileName) {

        var session, result, sessionFilePath;

        sessionFilePath = CONFIG.SRCFOLDER + "/" + sessionFileName;

        session = Utils.read_json_file(sessionFilePath);

        session.description = getDescriptionFromUser(session.description || sessionFileName);

        result = Utils.write_file(sessionFilePath, JSON.stringify(session), true);

        return JSON.stringify({"result": result});
    }

    /**
     * Private function to open a session file.
     * @param sessionFileName
     * @private
     */
    function _doOpenSessionFile(sessionFileName) {
        if (sessionFile = getSessionFile(sessionFileName)) {
            sessionFile.execute();
        }
    }

    /**
     * Collect the files in the session to a new location.
     * @param sessionFileName
     * @private
     */
    function _doCopySessionDocs(sessionFileName) {
        if (sessionFile = getSessionFile(sessionFileName)) {
            var json = Utils.read_json_file(sessionFile);
            if (isDefined(json.files)) {
                _doCopyFiles(json.files);
            }
        }
    }

    /**
     * Private function to copy a list of files to a selected folder.
     * @param fileList
     * @private
     */
    function _doCopyFiles(fileList) {

        var destination, targetFolderPath, dialogPrompt;

        dialogPrompt     = "Choose a folder to copy the documents to";
        destination      = Folder.selectDialog(dialogPrompt, Folder.myDocuments)
        targetFolderPath = new Folder(destination).absoluteURI;

        logger.info(targetFolderPath);

        try {

            for (i=0; i < fileList.length; i++) {

                theDoc = new File(fileList[i]);

                if (theDoc.exists) {
                    try {
                        theDoc.copy(Utils.getUniqueFileName(targetFolderPath, theDoc.name));
                    }
                    catch(ex) {
                        logger.error(ex.message);
                    }
                }
            }

            new Folder(destination).execute();
        }
        catch(ex) {
            logger.error(ex);
            return ex;
        }
        return "Files copied successfully";
    }

    /**
     * Private function get a File object from the session filename.
     * @param sessionFileName
     * @returns {*}
     */
    function getSessionFile(sessionFileName) {
        var sessionFile = new File(CONFIG.SRCFOLDER + "/" + sessionFileName);
        return sessionFile.exists ? sessionFile : false ;
    }

    /**
     * Private method to open the log file.
     * @private
     */
    function _doOpenLogFile() {
        try {
            logger.info("LOG FILE : " + logger.file.absoluteURI);
            return logger.open();
        }
        catch(ex) {
            logger.error(ex);
            return ex;
        }
    }

    /**
     * Returns the public module object.
     */
    return {
        doSaveCallback: function() {
            return doSaveCallback();
        },

        doOpenCallback: function(filepath) {
            return doOpenCallback(filepath);
        },

        initSessionsList: function() {
            return doGetSessionsList();
        },

        getOpenDocs : function() {
            return getOpenDocPaths();
        },

        openWebAddress : function(address) {
            return doOpenWebAddress(address);
        },

        doCollectOpenDocs : function() {
            return _doCollectOpenDocs();
        },

        doDeleteSession : function(sessionFileName) {
            return _doDeleteSession(sessionFileName);
        },

        doAddDescription : function(sessionFileName) {
            _doAddDescription(sessionFileName)
        },

        doRenameSession : function(sessionFileName) {
            return _doRenameSession(sessionFileName);
        },

        doOpenSessionFile : function(sessionFileName) {
            _doOpenSessionFile(sessionFileName);
        },

        doCopySessionDocs : function(sessionFileName) {
            return _doCopySessionDocs(sessionFileName);
        },

        getConfig : function() {
            return JSON.stringify(CONFIG);
        },

        openLogFile : function() {
            return _doOpenLogFile();
        },

        log : function(message, type) {
            try {
                logger.info( message );
                return 'ok';
            }
            catch(e) {
                return e;
            }
        }
    }

})(CONFIG);



/**
 * Create a unique session name.
 * @returns {string}
 */
function getSessionName() {
    return Utils.dateFormat(new Date().getTime()) + '@' + new Date().getTime();
}

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
 * Use this to interface from client side.
 * Example: csxScript('log("some text", "info")')
 * @param message
 * @param type
 */
function csxLogger(message, type) {
    try {
        logger.info( message );
        return 'ok';
    }
    catch(e) {
        return e;
    }
}
