
function getTitlesReverse(items) {
  const item = items[0]
  // return item.column_values.map(colVal => reverseSentence(colVal.title))
  return item.column_values.map(colVal => colVal.title)
}

function isHebrew(str) {
  for (let i = 0; i < str.length; i++) {
    const letterAscii = str.charCodeAt(i);
    if (letterAscii >= 1488 && letterAscii <= 1514) {
      return true
    }
  }
  return false
}

function getDateRange() {
  const currMonth = new Date().getMonth()
  const firstDayDate = new Date(new Date().setDate(1))
  const start = new Date(firstDayDate.setMonth(currMonth - 1))
  const end = new Date(firstDayDate.setMonth(currMonth))
  return {start, end}
}



function getTablesBodyAndHead(boardsWithItems) {
  sendLog('boardsWithItems', boardsWithItems)
  const boardsItemsColVals = boardsWithItems.map(boardWithItems => {
    const head = [`שם תכנית`, ...getTitlesReverse(boardWithItems)]
    const body = boardWithItems.map(item => [{ text: item.name }, ...item.column_values].map(_formatHebEngWords))
    const boardName = boardWithItems[0].board.name
    return { body, head, boardName }
  })
  sendLog('boardsItemsColVals', boardsItemsColVals)
  return boardsItemsColVals
}


function sendLog(field, data) {
  global.log[field] = data
}

function _formatHebEngWords(colVal) {
  let text = colVal.text || ''
  var words = (colVal.text && colVal.text.split(' '))
  if (!words) words = []
  if (isHebrew(words[0] || '') && !isHebrew(words[words.length - 1] || '')) {
    text += '׳'
  }
  return getFormattedValue(colVal.type, text, false)
}

function getFormattedValue(type, value, isWeb) {
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

module.exports = {
  getTitlesReverse,
  isHebrew,
  getTablesBodyAndHead,
  getFormattedValue,
  sendLog,
  getDateRange,
  reverse
}