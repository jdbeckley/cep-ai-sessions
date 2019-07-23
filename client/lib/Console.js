/**
 * Custom console redirects messages to common log file if no console exists.
 * @constructor
 */
var Console = function(){}

/**
 * @param message
 */
Console.prototype.send = function(message) {
    if (typeof message !== 'string') {
        message = '{' + typeof message + '}';
    }
    csInterface.evalScript('AiSessions.log("CLIENT : ' + message + '", "info")', function(result) {
        console.log('AiSessions.log message sent', message);
        console.log('AiSessions.log result', result);
    });
}

/**
 * @param message
 */
Console.prototype.log = function(message) {
    this.send(message);
}

/**
 * @param message
 */
Console.prototype.info =  function(message) {
    this.send(message);
}

/**
 * @param message
 */
Console.prototype.error =  function(message) {
    this.send(message);
}

if (typeof console === 'undefined') {
    var console = new Console();
}
