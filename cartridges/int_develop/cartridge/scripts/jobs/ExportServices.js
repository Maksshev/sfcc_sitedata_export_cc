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
            handleXMLStartElement(xmlReader, services, result, credentialsResult, profilesResult, file, includeCredentials, includeProfiles);
        }
    }

    writeResultToFile(resultingFile, result, credentialsResult, profilesResult);
}

function handleXMLStartElement(xmlReader, jobs, result, credentialsResult, profilesResult, file) {
    switch (xmlReader.getLocalName()) {
        case 'service':
            return handleService(xmlReader, jobs, result, credentialsResult, profilesResult, file);
        default:
            return;
    }
}

function handleService(xmlReader, services, result, credentialsResult, profilesResult, file) {
    if (empty(services)) return result;

    var xmlObject = xmlReader.getXMLObject();
    var serviceID = xmlObject.attribute('service-id').toString();

    if (services.indexOf(serviceID) > -1) {
        var namespace = xmlObject.namespace();
        var profileID = xmlObject.namespace::['profile-id'].toString();
        var credentialID = xmlObject.namespace::['credential-id'].toString();
        credentialsResult.push(findServiceCredential(file, credentialID));
        profilesResult.push(findServiceProfile(file, profileID));

        result.push(xmlObject);
    }
}

function findServiceCredential(file, credentialID) {
  var fileReader = new FileReader(file, 'UTF-8');
  var xmlReader = new XMLStreamReader(fileReader);

  while (xmlReader.hasNext()) {
    if (xmlReader.next() === XMLStreamConstants.START_ELEMENT) {
      if (xmlReader.getLocalName() === 'service-credential') {
        var xmlObject = xmlReader.getXMLObject();

        if (xmlObject.attribute('service-credential-id').toString() === credentialID) {
          xmlReader.close();
          return xmlObject;
        }
      }
    }
  }
}

function findServiceProfile(file, profileID) {
  var fileReader = new FileReader(file, 'UTF-8');
  var xmlReader = new XMLStreamReader(fileReader);

  while (xmlReader.hasNext()) {
    if (xmlReader.next() === XMLStreamConstants.START_ELEMENT) {
      if (xmlReader.getLocalName() === 'service-profile') {
        var xmlObject = xmlReader.getXMLObject();

        if (xmlObject.attribute('service-profile-id').toString() === profileID) {
          xmlReader.close();
          return xmlObject;
        }
      }
    }
  }
}

function writeResultToFile(file, resultArray, credentialsArray, profilesArray) {
    var fileWriter = new FileWriter(file, 'UTF-8');
    var xsw = new XMLStreamWriter(fileWriter);

    xsw.writeStartDocument();
    xsw.writeRaw(
        '\n<services xmlns="http://www.demandware.com/xml/impex/services/2014-09-26">\n'
    );

    [credentialsArray, profilesArray, resultArray].forEach(array => {
      for (var i = 0; i < array.size(); i++) {
        var xmlObject = array.get(i);

        xsw.writeRaw(
          '\n' + xmlObject.toXMLString()
        );
      }
    })

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
