'use strict'

function findFile(root, fileName) {
    if (root.getName() === fileName) return root;

    var filesList = root.listFiles();

    if (filesList) {
        for (var i = 0; i < filesList.size(); i++) {
            var currentFile = findFile(filesList.get(i), fileName);

            if (currentFile) {
                return currentFile;
            }
        }
    }

    return null;
}

module.exports = {
    findFile: findFile
}
