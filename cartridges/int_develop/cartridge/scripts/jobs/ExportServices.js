'use strict'

var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var ArrayList = require('dw/util/ArrayList');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLIndentingStreamWriter');
var FileHelper = require('int_develop/cartridge/scripts/helpers/FileHelper');

function process(args) {
    var {filePath, services, includeProfiles, includeCredentials} = args;

    services = services.split(',');

    var result = new ArrayList();
    var profilesResult = new ArrayList();
    var credentialsResult = new ArrayList();

    var file = new File(filePath);
    var directory = new File(getDirectoryPath(filePath));

    file.unzip(directory);

    file = FileHelper.findFile(directory, 'services.xml');

    var fileReader = new FileReader(file, 'UTF-8');
    var xmlReader = new XMLStreamReader(fileReader);

    var resultingFile = new File(filePath.split('.').join('_processed.').replace('zip', 'xml'));

    while (xmlReader.hasNext()) {
        if (xmlReader.next() === XMLStreamConstants.START_ELEMENT) {
            handleXMLStartElement(xmlReader, services, result, credentialsResult, profilesResult);
        }
    }

    writeResultToFile(resultingFile, result, credentialsResult, profilesResult);
}

function handleXMLStartElement(xmlReader, jobs, result, credentialsResult, profilesResult) {
    switch (xmlReader.getLocalName()) {
        case 'service':
            return handleService(xmlReader, jobs, result, credentialsResult, profilesResult);
        default:
            return;
    }
}

function handleService(xmlReader, services, result, credentialsResult, profilesResult) {
    if (empty(services)) return result;

    var xmlObject = xmlReader.getXMLObject();
    var serviceID = xmlObject.attribute('service-id').toString();

    if (services.indexOf(serviceID) > -1) {
        var namespace = xmlObject.namespace('xmlns');
        var elementNameWithNamespace = namespace + ':' + 'profile-id';
        var a = xmlObject[elementNameWithNamespace];
        var b = 5;
        result.push(xmlObject);
    }
}

function writeResultToFile(file, resultArray) {
    var fileWriter = new FileWriter(file, 'UTF-8');
    var xsw = new XMLStreamWriter(fileWriter);

    xsw.writeStartDocument();
    xsw.writeRaw(
        '\n<services xmlns="http://www.demandware.com/xml/impex/services/2014-09-26">\n'
    );

    for (var i = 0; i < resultArray.size(); i++) {
        var xmlObject = resultArray.get(i);

        xsw.writeRaw(
            '\n' + xmlObject.toXMLString()
        );
    }

    xsw.writeRaw('\n</services>\n');
    xsw.writeEndDocument();

    xsw.close();
}

function getDirectoryPath(filePath) {
    var lastSlashIndex = filePath.lastIndexOf('/');
    return filePath.substring(0, lastSlashIndex);
}

function extractFileName(filePath, additionalString) {
    var fileArray = filePath.split('/');
    var fileName = fileArray[fileArray.length - 1];

    return additionalString ? fileName + additionalString : fileName;
}

module.exports.Process = process;
