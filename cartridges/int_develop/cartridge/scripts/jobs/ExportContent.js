'use strict'

var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var ArrayList = require('dw/util/ArrayList');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLIndentingStreamWriter');

function exportContent(args) {
    var {filePath, libraries, content} = args;

    var result = new ArrayList();

    var libArray = libraries && libraries.split(',').map(item => item.trim());
    var contentArray = content.split(',').map(item => item.trim());

    var file = new File(filePath);
    var fileReader = new FileReader(file, 'UTF-8');
    var xmlReader = new XMLStreamReader(fileReader);

    var resultingFile = new File(filePath.split('.').join('_processed.'));

    while (xmlReader.hasNext()) {
        if (xmlReader.next() === XMLStreamConstants.START_ELEMENT) {
            handleXMLStartElement(xmlReader, libArray, contentArray, result);
        }
    }

    writeResultToFile(resultingFile, result);
}

function handleXMLStartElement(xmlReader, libArray, contentArray, result) {
    switch (xmlReader.getLocalName()) {
        case 'folder':
            return handleFolder(xmlReader, libArray, result);
        case 'content':
            return handleContent(xmlReader, contentArray, result);
        default:
            return;
    }
}

function handleFolder(xmlReader, libArray, result) {
    if (empty(libArray)) return;

    var xmlObject = xmlReader.getXMLObject();
    var folderID = xmlObject.attribute('folder-id').toString();

    if (libArray.indexOf(folderID) > -1) {
        result.push(xmlObject);
    }
}

function handleContent(xmlReader, contentArray, result) {
    if (empty(contentArray)) return;

    var xmlObject = xmlReader.getXMLObject();
    var contentID = xmlObject.attribute('content-id').toString();

    if (contentArray.indexOf(contentID) > -1) {
        result.push(xmlObject);
    }
}

function writeResultToFile(file, resultArray) {
    var fileWriter = new FileWriter(file, 'UTF-8');
    var xsw = new XMLStreamWriter(fileWriter);

    xsw.writeStartDocument();
    xsw.writeRaw(
        '\n<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31">\n'
    );

    for (var i = 0; i < resultArray.size(); i++) {
        var xmlObject = resultArray.get(i);

        xsw.writeRaw(
            xmlObject.toXMLString()
        );
    }

    xsw.writeRaw('\n</library>\n');
    xsw.writeEndDocument();

    xsw.close();
}

module.exports.exportContent = exportContent;
