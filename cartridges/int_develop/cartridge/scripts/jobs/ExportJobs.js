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
    var {filePath, jobs} = args;

    jobs = jobs.split(',');

    var result = new ArrayList();

    var file = new File(filePath);
    var directory = new File(getDirectoryPath(filePath));

    file.unzip(directory);

    file = FileHelper.findFile(directory, 'jobs.xml');

    var fileReader = new FileReader(file, 'UTF-8');
    var xmlReader = new XMLStreamReader(fileReader);

    var resultingFile = new File(filePath.split('.').join('_processed.').replace('zip', 'xml'));

    while (xmlReader.hasNext()) {
        if (xmlReader.next() === XMLStreamConstants.START_ELEMENT) {
            handleXMLStartElement(xmlReader, jobs, result);
        }
    }

    writeResultToFile(resultingFile, result);
}

function handleXMLStartElement(xmlReader, jobs, result) {
    switch (xmlReader.getLocalName()) {
        case 'job':
            return handleJob(xmlReader, jobs, result);
        default:
            return;
    }
}

function handleJob(xmlReader, jobs, result) {
    if (empty(jobs)) return result;

    var xmlObject = xmlReader.getXMLObject();
    var jobID = xmlObject.attribute('job-id').toString();

    if (jobs.indexOf(jobID) > -1) {
        result.push(xmlObject);
    }
}

function writeResultToFile(file, resultArray) {
    var fileWriter = new FileWriter(file, 'UTF-8');
    var xsw = new XMLStreamWriter(fileWriter);

    xsw.writeStartDocument();
    xsw.writeRaw(
        '\n<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">\n'
    );

    for (var i = 0; i < resultArray.size(); i++) {
        var xmlObject = resultArray.get(i);

        xsw.writeRaw(
            '\n' + xmlObject.toXMLString()
        );
    }

    xsw.writeRaw('\n</jobs>\n');
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
