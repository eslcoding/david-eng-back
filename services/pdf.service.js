const pdfDocument = require('pdfkit')
const fs = require('fs')

module.exports = {
  buildTablesPDF,
}

function buildTablesPDF(filename = 'SaveTheAnimals.pdf') {
  const doc = new pdfDocument();
  doc.pipe(fs.createWriteStream(filename));
  // animals.forEach((animal, idx) => {
  doc
    .fontSize(25)
    .text(`The tiger`, 200, 100);

  // animal.urls.forEach((url, idx) => {


  doc
    .fontSize(25)
    .text(`Only 4 Left In The World!`, 200, 600);

  // if (idx + 1 !== animals.length) doc.addPage();

  doc.end();
  // })
}

