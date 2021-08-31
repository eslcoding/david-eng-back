const initMondayClient = require('monday-sdk-js');
const nodemailer = require('nodemailer');
const dbService = require('../../services/db.service');
const { isHebrew } = require('../../services/utils.service');


const titles = ["סטטוס שרטוט", "שרטט", "גרסה", "תאריך תכנית", "סטטוס תכנית", "ראש צוות", "בקר", "מהנדס", "תאריך שרטוט", "שעות עבודה במצטבר", "שעות עבודה חודש נוכחי"]

function getDraftsmanBoard(boards) {
  return boards.filter((board) => {
    if (board.name.includes('סידור שבועי')) return false

    let isIncludeBoardDraft = false
    let isIncludeBoardDate = false
    board.columns.forEach(col => {

      if (col.title === 'שרטט') {
        board.colsToUse = { ...board.colsToUse, draftId: col.id }
        isIncludeBoardDraft = true
      }

      if (col.title === 'סטטוס שרטוט') {
        board.colsToUse = { ...board.colsToUse, statusId: col.id }
      }

      if (col.title === 'תאריך תכנית') {
        board.colsToUse = { ...board.colsToUse, dateId: col.id }
        isIncludeBoardDate = true
      }

    })
    return isIncludeBoardDraft && isIncludeBoardDate
  })
}


function getDateFilteredItems({ itemsToUse, colsToUse, searchTerm }) {
  return itemsToUse.filter(item => {
    return item.column_values.every(colVal => {
      let date = new Date(colVal.text)
      let start = new Date(searchTerm.date.start)
      let end = new Date(searchTerm.date.end)
      start.setHours(0, 0)
      end.setHours(23, 59)
      if (colsToUse.dateId === colVal.id) {
        start = start.getTime() || -Infinity
        end = end.getTime() || Infinity
        if (start || end) {
          return ((date.getTime() > start) && (date.getTime() < end))
        } else {
          return (((date.getTime() || Infinity) > start) && ((date.getTime() || -Infinity) < end))
        }
      } else return true
    })
  })
}

function getFilteredColVals(itemsByBoard) {
  let _itemsByBoard = JSON.parse(JSON.stringify(itemsByBoard))
  _itemsByBoard.forEach(items => {
    items.forEach(item => {
      item.column_values = item.column_values.filter(colVal => {

        return titles.includes(colVal.title)
      })
    })
  })
  return _itemsByBoard
}

function getTitles(items) {
  if (!items) return []
  const item = items[0]
  return item.column_values.map(colVal => colVal.title)
}


function getFormattedValue(type, value, isWeb) {
  if (value) {
    value = value.replace(/, /ig, '__')
  }
  if (type === 'date' && value) {
    return formatDate(value, isWeb)
  }

  if (type === 'text') {
    if (isHebrew(value)) {
      return value
    }
    return reverse(value)
  }
  return value
}



function formatDate(value, isWeb) {
  value = new Date(value)
  let day = value.getDate()
  let month = value.getMonth() + 1
  const year = value.getFullYear()
  day = day < 10 ? '0' + day : day;
  month = month < 10 ? '0' + month : month;
  const dateValue = `${day}/${month}/${year}`
  return isWeb ? dateValue : reverse(dateValue)

}

function reverse(str) {
  return str.split('').reverse().join('')
}


// function isHebrew(str) {
//   for (let i = 0; i < str.length; i++) {
//     const letterAscii = str.charCodeAt(i);
//     if (letterAscii >= 1488 && letterAscii <= 1514) {
//       return true
//     }
//   }
//   return false
// }

/*
* replaceDb and getDb ar both for trying to solve the to many request per time error
*/
async function replaceDb(data) {
  // console.log('replaceDb -> data', data)
  console.log('replace db');
  const collection = await dbService.getCollection('monday_data')
  try {
    const testRes = await collection.replaceOne({ "key": data.key }, data)
    if (!testRes.matchedCount) {
      await collection.insertOne(data)
    }
    return
  } catch (err) {
    console.log('ERROR: fill db', err)
    throw err;
  }

}

async function getDb(key) {
  const collection = await dbService.getCollection('monday_data')
  try {
    return await collection.findOne({ key })
  } catch (err) {
    console.log('ERROR: fill db', err)
    throw err;
  }

}


// async function mappingScript() {
//   const collection = await dbService.getCollection('prefix')
//   try {
//     const prefixs = await collection.find({ srcColId: { $regex: /project_prefix/i } }).toArray();
//     // const prefixs = await collection.find().toArray();
//     const prefixMap = prefixs.reduce((_prefixMap, prefixObj) => {
//       for (let key in prefixObj.map) {
//         _prefixMap[key] ??= 0
//         _prefixMap[key] += prefixObj.map[key]
//       }
//       return _prefixMap
//     }, {})


//     const mapCollection = await dbService.getCollection('prefixMap')
//     mapCollection.insertOne(prefixMap)

//     return prefixs
//   } catch (err) {
//     console.log('ERROR: cannot find prefix', err)
//     throw err;
//   }
// }



function sendEmail(to = 'anistu@gmail.com', subject = 'thank you', text = "hey", data) {

  var transporter = nodemailer.createTransport({
    service: 'outlook',

    auth: {
      user: 'noreply@eswlab.com',
      pass: 'esl@1010'
    }
  });

  var mailOptions = {
    from: 'noreply@eswlab.com',
    to,
    subject,
    text,
    // attachments: [
    //     {
    //         filename: "users.csv",
    //         content: csv,
    //     },
    // ],
    attachments: data,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

// const data = {
//   filename: `Mohamad_Faroje__12-2020.pdf`,
//   path: __dirname + '/Mohamad_Faroje__12-2020.pdf',
//   contentType: 'application/pdf'
// }

// sendEmail(undefined, undefined, undefined, data)



module.exports = {
  getDraftsmanBoard,
  getDateFilteredItems,
  getFilteredColVals,
  getTitles,
  getFormattedValue,
  sendEmail,
  replaceDb,
  getDb
}