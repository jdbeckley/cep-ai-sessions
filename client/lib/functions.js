/**
 * Read folder contents.
 * @param   {string}    path
 * @returns {*}
 */
function readFolder(path, ext) {

    var file, files, read;

    read  = window.cep.fs.readdir(path);

    if (read.err !== 0) {
        throw new Error(path + ' could not be read');
    }

    files = read.data;

    if (ext !== undefined) {
        files = [];
        for (var i = 0; i < read.data.length; i++) {
            file = read.data[i];
            if (file.split('.').pop().toUpperCase() === ext.toUpperCase()) {
                files.push(file);
            }
        }
    }

    return files;
}

/**
 * Read a file.
 * @param   {string}    path
 * @returns {*}
 */
function readFile(path) {

    var result = window.cep.fs.readFile(path, cep.encoding.UTF8);

    if (result.err) {
        throw new Error('File `' + path + '` could not be read');
    }

    return result.data;
}
