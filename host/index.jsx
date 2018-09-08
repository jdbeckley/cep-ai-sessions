
var fileList = {"files":[
    "~/Dropbox%20(Personal)/Diversity%20Avatars/03%20-%20Work/03%20-%20Scott/volume-4/volume-4-scott.ai",
    "~/Dropbox%20(Personal)/012-projects/articles/avatars-tutorial/avatar-creation-process.ai",
    "~/Dropbox%20(Personal)/012-projects/in-the-moment/in-the-moment-illustrations.ai",
    "~/Dropbox%20(Personal)/010-icons/work/scenic.ai",
    "~/Dropbox%20(Personal)/Diversity%20Avatars/03%20-%20Work/03%20-%20Scott/batch-3-scott.ai"
]};


/**
 * The CSX handler for client callback.
 */
function openDocument() {
    var fileRef = new File( fileList.files[1] );
    var docRef = app.open(fileRef);
}