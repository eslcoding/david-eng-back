const fs = require('fs')

// async function saveAndPrintJson(data) {
//   console.log('saveAndPrintJson -> data', data)
//   return new Promise((resolve, reject) => {
//     try {
//       fs.writeFile('../logs/print.json', JSON.stringify(data), () => {
//         console.log('het');
//         resolve()
//       })
//     } catch (err) {
//       console.log('err in print to json: ', err);

//       reject(err)
//     }

//   })
// }

function saveAndPrintJson(data) {
  console.log('printing to Json');
  fs.writeFileSync('./print.json', JSON.stringify(data, null, 2));
}

module.exports = {
  saveAndPrintJson
}
