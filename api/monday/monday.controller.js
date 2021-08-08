const mondayService = require('./monday.service');
const initMondayClient = require('monday-sdk-js');
const nodemailer = require('nodemailer');
const { parse } = require('json2csv');
const { handleGoogleDrive } = require('../../services/googleDriveService/googleDrive.service');
const { buildTablesPDF } = require('../../services/pdf.service');

const monday = initMondayClient()




async function getInter(req, res) {
  console.log('are you hereeeeeeee');
  const body = req.body
  try {
    const { shortLivedToken } = req.session
    // const monday = initMondayClient()
    monday.setToken(shortLivedToken)
    const { boardId } = body.payload.inboundFieldValues
    console.log('getInter -> body.payload.inboundFieldValues', body.payload.inboundFieldValues)
    const date = new Date().toDateString().replace(/ /ig, '_')
    console.log('getInter -> date', date)
    const { folderId: dateFolderId } = await handleGoogleDrive('folder', { parentId: null, name: date })
    // return


    let query = `query 
    {boards (limit: 1000) {
      name
      id
      columns {
        id
        title
        type
        settings_str
        
      }
    }}`
    // const { data: { boards: _boards } } = await monday.api(query)
    const res = await monday.api(query)
    console.log('getInter -> res', res)
    const _boards = res.data.boards
    const filteredBoards = mondayService.getDraftsmanBoard(_boards)

    let users = await getDraftsmenUsers(filteredBoards)

    users.forEach(async user => {

      const itemsByBoards = await filterBoards(filteredBoards, user.name)
      /*TESTING MOVE LATER */
      const { folderId: draftsmanFolderId } = await handleGoogleDrive('folder', { name: user.name, parentId: dateFolderId })
      // await handleGoogleDrive('file', {filename: 'test.pdf', parentId: draftsmanFolderId, content: pdfRes})

      getCsvTable(itemsByBoards, user.name, dateFolderId, draftsmanFolderId)
    })

  } catch (err) {
    console.log('err: ', err);

  } finally {
    return res.end()

  }
}



async function onUpdateColumns(req, res) {
  const body = req.body
  try {
    const { shortLivedToken } = req.session
    // const monday = initMondayClient()
    monday.setToken(shortLivedToken)
    const { boardId } = body.payload.inboundFieldValues
    console.log('updateColumns -> updateColumns', body.payload.inboundFieldValues)

    var query = `query {
      boards(ids: ${boardId}) {
        items {
          id
          column_values {
            id
            title
            value
            text
          }
        }
      }
    }`

    const _res = await monday.api(query)

    const { boards } = _res.data
    const items = boards[0].items
    // making an object with keys made out of the item id and values are 'fromCol' and 'toCol' that contain the right colVal object
    const itemsColValsMap = items.reduce((acc, item) => {
      item.column_values.forEach(colVal => {
        if (colVal.title === 'שעות עבודה חודש נוכחי' || colVal.title === 'שעות עבודה במצטבר') {
          const label = colVal.title === 'שעות עבודה חודש נוכחי' ? 'from' : 'to'
          acc[item.id] = acc[item.id] || {}
          acc[item.id] = { ...acc[item.id], [label]: colVal }
          // acc[item.id] = acc[item.id] ? { ...acc[item.id], [label]: colVal } : {[label]: colVal}

        }
      })
      return acc

    }, {})

    await updateColumns(itemsColValsMap, boardId)
  } catch (err) {
    console.log('err: ', err);

  } finally {
    res.end()
  }
}



async function updateColumns(itemsColValsMap, boardId) {

  const prmMutations = []
  for (let itemId in itemsColValsMap) {
    const colVal = itemsColValsMap[itemId]
    const value = (+colVal.from.text + (+colVal.to.text)) || ''
    const query = `mutation {
      change_multiple_column_values (board_id: ${boardId}, item_id: ${itemId}, column_values: ${JSON.stringify(JSON.stringify({ [colVal.from.id]: '', [colVal.to.id]: value }))}) {
        id
      }
    }`
    const res = monday.api(query)
    prmMutations.push(res)

  }

  return Promise.all(prmMutations)
}

async function getDraftsmenUsers(filteredBoards) {
  let users = await getUsers()
  let itemsColVals = await getItems(filteredBoards)

  users = users.filter(user => {
    return itemsColVals.some(itemsPerBoard => {
      return itemsPerBoard.some(item => {
        return item.column_values.some(colVal => {
          return (colVal.type === 'multiple-person') && colVal.text.includes(user.name)
        })
      })
    })
  })

  return users
}

async function getCsvTable(itemsByBoards, draftsmanName, dateFolderId, draftsmanFolderId) {

  // var query = `query {boards (limit: 1000) {
  //   name
  //   id
  //   columns {
  //     id
  //     title
  //     type
  //     settings_str
  //   }
  // }}`
  // const { data: { boards } } = await monday.api(query)
  // const filteredBoards = mondayService.getDraftsmanBoard(boards)
  // const itemsByBoards = await filterTable(filteredBoards)

  //#2 part
  const itemsVals = Object.values(itemsByBoards)
  let items = itemsVals.map(mondayService.getDateFilteredItems)
  items = mondayService.getFilteredColVals(items).filter(items => items.length)
  console.log('getCsvTable -> items', items)

  const fields = ['שם תכנית', ...mondayService.getTitles(items[0])]
  // const fields = ['שם תכנית', ...mondayService.getTitles(items)]


  // const values = items[0].map(_items => _items.column_values)
  const boardItems = items.map(_boardItems => {

    return _boardItems.map(_items => {

      return [_items.column_values, _items.name, _items.board]
      // return _items.column_values
    })

  })

  const csvs = boardItems.reduce((_csvs, items) => {

    const testVals = items.map(item => [{ text: item[1] }, ...item[0], item[2]].map(colVal => {
      if (colVal.name) return colVal
      return mondayService.getFormattedValue(colVal.type, colVal.text, true)
    }))
    _csvs.push(testVals)
    return _csvs
  }, [])



  const csvResults = csvs.map((csvValues, idx) => {
    const board = csvValues[0].splice(-1, 1)[0]
    csvValues.slice(1).forEach(values => values.splice(-1, 1))


    let csvRes = fields.join()
    const testRes = csvValues.reduce((acc, vals) => {
      csvRes += ('\n' + vals.join())
      return csvRes
    }, csvRes)

    return { filename: `${draftsmanName}-${board.name}.csv`, content: testRes, parentId: draftsmanFolderId }
  })



  // return

  // const values = items[0].map(_items => _items.column_values)
  // const testVals = values.map(item => [{ text: 'bobo' }, ...item].map(colVal => { return mondayService.getFormattedValue(colVal.type, colVal.text, true) }))

  // let csvRes = fields.join()
  // const testRes = testVals.reduce((acc, vals) => {
  //   csvRes += ('\n' + vals.join())
  //   return csvRes
  // }, csvRes)

  csvResults.forEach(async csvRes => {
    await handleGoogleDrive('file', csvRes)


  })
  // mondayService.sendEmail('anistu@gmail.com', 'test title', 'test text', csvResults)

}




async function filterBoards(filteredBoards, username) {
  const searchTerm = {
    date: { end: '2021-07-31', start: '2021-04-01' },
    draftsman: { nameStr: username }
    // draftsman: { nameStr: 'Stav' }
  }

  let itemsByBoards = {}

  /*TEST START*/
  let boardsWithItems = []
  for (let i = 0; i < filteredBoards.length; i++) {
    const board = filteredBoards[i];
    var query = `query {
        boards(ids: ${board.id}) {
            items (limit: 1000) {
              name
              id
              board{name id}
              column_values {
                    text
                    id
                    value
                    type
                    title
                    additional_info
                }
            }
        }
    }`
    // setTimeout(() => {
      
    // }, timeout);
    const res = await monday.api(query)
    boardsWithItems.push(res)

  }
  console.log('test33333333333333333333333333333333333333333333333333333333333333333');
  /*TEST END*/


  /*ORIGINAL START*/

  // const prmBoards = filteredBoards.map(async (board, idx) => {

  //   var query = `query {
  //     boards(ids: ${board.id}) {
  //         items (limit: 1000) {
  //           name
  //           id
  //           board{name id}
  //           column_values {
  //                 text
  //                 id
  //                 value
  //                 type
  //                 title
  //                 additional_info
  //             }
  //         }
  //     }
  // }`

  //   return monday.api(query)
  // })
  // console.log('test33333333333333333333333333333333333333333333333333333333333333333');
  // var boardsWithItems = await Promise.all(prmBoards)
  // console.log('test44444444444444444444444444444444444444444444444444444444444444444');


  /*ORIGINAL END*/


  boardsWithItems = boardsWithItems.filter(board => !board.errors)

  // boardsWithItems.forEach(board=>console.log('boardWithItems: ', board))

  boardsWithItems = boardsWithItems.map(_board => _board.data.boards[0].items)
  boardsWithItems.forEach((items, idx) => {
    const board = filteredBoards[idx]
    const { colsToUse } = board

    var itemsToUse = items.filter(item => {
      return item.column_values.some(colVal => {
        if (colsToUse.draftId === colVal.id && colVal.value) {
          const parsedValue = JSON.parse(colVal.value).personsAndTeams

          // const isIncludeDraftsman = parsedValue.some(draftsman => draftsman?.id === searchTerm.draftsman.id)
          const isIncludeDraftsman = colVal.text.split(', ').includes(searchTerm.draftsman.nameStr)

          if (isIncludeDraftsman) return true

        }
        return false
      })
    })




    itemsToUse = itemsToUse.filter(item => {
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

    if (!itemsToUse.length) return
    itemsByBoards = { ...itemsByBoards, [board.id]: { itemsToUse, colsToUse, searchTerm } }
  })


  return Promise.resolve(itemsByBoards)



}





async function getUsers() {

  const query = `query {
      users  {
          id
          name
          email
          photo_thumb_small
          account {
              name
              }
          }
  }`
  let res = await monday.api(query)
  const { users } = res.data
  return users
}



async function getItems(filteredBoards) {
  const prmBoards = filteredBoards.map(async (board, idx) => {

    var query = `query {
      boards(ids: ${board.id}) {
          items (limit: 100) {
            name
            id
            board{name id}
            column_values {
                  text
                  id
                  value
                  type
                  title
                  additional_info
              }
          }
      }
  }`
    return monday.api(query)
  })
  console.log('test11111111111111111111111111111111111111111111111111111111111111111');
  var boardsWithItems = await Promise.all(prmBoards)
  console.log('test22222222222222222222222222222222222222222222222222222222222222222');

  // boardsWithItems.forEach(board=>console.log('boardWithItems: ', board))

  // boardsWithItems = boardsWithItems.filter(_board => _board.data)
  boardsWithItems = boardsWithItems.map(_board => _board.data.boards[0].items)
  return boardsWithItems
}






async function testMailPdf(req, res) {
  try {
    console.log('testMailPdf working...', 123);
    const data = {
      filename: `Mohamad_Faroje__12-2020.pdf`,
      path: __dirname + '/Mohamad_Faroje__12-2020.pdf',
      contentType: 'application/pdf'
    }

    mondayService.sendEmail(undefined, undefined, undefined, data)

  } catch (err) {
    console.log('err: ', err);

  } finally {
    res.end()
  }
}





module.exports = {
  getInter,
  onUpdateColumns,
  testMailPdf
};


