const mondayService = require('./monday.service');
const utilsService = require('../../services/utils.service');
const initMondayClient = require('monday-sdk-js');
const nodemailer = require('nodemailer');
const { parse } = require('json2csv');
const { handleGoogleDrive } = require('../../services/googleDriveService/googleDrive.service');
const { buildTablesPDF } = require('../../services/pdf.service');
var gRes;
var gDateFolderId;
const monday = initMondayClient()


global.isReqOn = false
async function getInter(req, res) {
  // return res.end()
  if (global.isReqOn) return res.end()
  global.isReqOn = true
  const body = req.body
  try {
    const { shortLivedToken } = req.session
    // const monday = initMondayClient()
    monday.setToken(shortLivedToken)
    const date = new Date().toDateString().replace(/ /ig, '_')
    const monthAndYear = mondayService.getFormattedMonthAndYear()
    const { folderId: dateFolderId } = await handleGoogleDrive('folder', { parentId: null, name: monthAndYear })
    gDateFolderId = dateFolderId
    // return


    let query = `query 
    {
      boards (limit: 5000) {
      workspace {
        name
        id
      }
      name
      id
      columns {
        id
        title
        type
        
      }
    }}`

    const result = await monday.api(query)
    const _boards = result.data.boards
    const filteredBoards = mondayService.getDraftsmanBoard(_boards)
    /*TEST START*/
    await sleep()
    await interStage2(filteredBoards)
    /*TEST END*/

    /*ORIGINAL START*/
    // await mondayService.replaceDb({ boards: filteredBoards, key: 'boards' })
    // return await deleyFunc(interStage2, 1000 * 30 * 0.1, res)
    /*ORIGINAL END*/

    console.log('done?');

  } catch (err) {
    console.log('get interrrrrr   err: ', err);
  } finally {
    console.log('is end?');
    await onUpdateColumns(req, res)
    // return res.end()

  }
}

async function getInterTest(req, res) {
  // return res.end()
  if (global.isReqOn) return res.end()
  global.isReqOn = true
  const body = req.body
  gRes = res
  try {
    const { shortLivedToken } = req.session
    // const monday = initMondayClient()
    monday.setToken(shortLivedToken)
    const date = new Date().toDateString().replace(/ /ig, '_')
    const monthAndYear = mondayService.getFormattedMonthAndYear()
    const { folderId: dateFolderId } = await handleGoogleDrive('folder', { parentId: null, name: monthAndYear })
    gDateFolderId = dateFolderId
    // return

    let query = `query 
    {
      complexity{
        before
        query
        after
      }
      boards (limit: 1000) {
      name
      id
      columns {
        id
        title
        type
      }
    }}`


    const result = await monday.api(query)



    // utilsService.sendLog('complexity1', result.data.complexity)
    const _boards = result.data.boards
    const filteredBoards = mondayService.getDraftsmanBoard(_boards)
    /*TEST START*/
    await sleep()
    await interStage2(filteredBoards)
    /*TEST END*/

    /*ORIGINAL START*/
    // await mondayService.replaceDb({ boards: filteredBoards, key: 'boards' })
    // return await deleyFunc(interStage2, 1000 * 30 * 0.1, res)
    /*ORIGINAL END*/

    console.log('done?');

  } catch (err) {
    console.log('get interrrrrr   err: ', err);
  } finally {
    console.log('is end?');
    global.isReqOn = false
    return res.end()

  }
}


function testEnd(data) {

  console.log('**test stop**');

  return gRes.end()
}



async function interStage2(filteredBoards) {
  try {
    /*TEST START*/

    let { users: draftsUsers, itemsColVals } = await getDraftsmenUsers(filteredBoards)
    await sleep()
    await interStage3(draftsUsers, filteredBoards, itemsColVals)
    /*TEST END*/

    /*ORIGINAL START*/

    // const data = await mondayService.getDb('boards')
    // const filteredBoards = data.boards
    // let draftsUsers = await getDraftsmenUsers(filteredBoards)
    // await mondayService.replaceDb({ draftsUsers, key: 'draftsUsers' })
    // await deleyFunc(interStage3, 1000 * 30 * 0.1, draftsUsers, filteredBoards)
    /*ORIGINAL END*/
    return

  } catch (err) {
    console.log('err on interStag2: ', err);
    throw err

  }

}


/*
* trying with recursion because of setTimeout between iterations
*/

/*TEST START*/
// async function interStage3(users, filteredBoards, userIdx = 0) {
//   if (userIdx === users.length) return
//   const user = users[userIdx]
//   const itemsByBoards = await filterBoards(filteredBoards, user.name)
//   const { folderId: draftsmanFolderId } = await handleGoogleDrive('folder', { name: user.name, parentId: gDateFolderId })
//   await getCsvTable(itemsByBoards, user.name, gDateFolderId, draftsmanFolderId)
//   setTimeout(interStage3, 1000 * 30 * 0.1, users, filteredBoards, userIdx + 1);

// }
/*TEST END*/



/*ORIGINAL START*/
async function interStage3(users, filteredBoards, itemsColVals) {
  /* 
  !FOR TESTING  REMOVE LATER 
  */
  // users = users.slice(0, 1)

  try {
    // users.forEach(async user => {
    for (let user of users) {

      // await sleep(1000)
      const itemsByBoards = await filterBoards(filteredBoards, user.name, itemsColVals)
      const itemsVals = Object.values(itemsByBoards)
      let items = itemsVals.map(mondayService.getDateFilteredItems)
      items = mondayService.getFilteredColVals(items).filter(items => items.length)
      if (Object.keys(itemsByBoards).length) {
        const { folderId: draftsmanFolderId } = await handleGoogleDrive('folder', { name: user.name, parentId: gDateFolderId })
        await getCsvTable(items, user.name, draftsmanFolderId)
        await getPdfTable(items, user.name, draftsmanFolderId)
      }

    }
  } catch (err) {
    console.log('err interStage3: ', err);

  } finally {
    return
  }
}
/*ORIGINAL END*/

function sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*TEST START*/
function deleyFunc(func, time, ...args) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await func(...args)
        resolve()
      } catch (err) {
        reject(err)
        throw (err)
      }
    }, time);
  })
}
/*TEST END*/

/*ORIGINAL START*/
// function deleyFunc(func, time, ...args) {
//   return new Promise((resolve, reject) => {
//     setTimeout(async () => {
//       await func(...args)
//       resolve()
//     }, time);
//   })
// }
/*ORIGINAL END*/



async function filterBoards(filteredBoards, username, itemsColVals) {
  console.log('filterBoards -> username', username)

  const searchTerm = {
    date: utilsService.getDateRange(),
    draftsman: { nameStr: username }

  }







  let itemsByBoards = {}
  /*ORIGINAL START*/
  // await sleep(10000)
  // const prmBoards = filteredBoards.map(async (board, idx) => {

  //   const { colsToUse } = board
  //   var query = `query {
  //     boards(ids: ${board.id}) {
  //         name
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
  // let boardsWithItems = await Promise.all(prmBoards)
  // let testBoardsWithItems = boardsWithItems.map(board => board.errors)
  // console.log('filterBoards -> testBoardsWithItems', testBoardsWithItems, 'filterBoards -> testBoardsWithItems')

  // boardsWithItems = boardsWithItems.filter(board => !board.errors)

  // boardsWithItems = boardsWithItems.map(_board => _board.data.boards[0].items)
  /*ORIGINAL END*/

  /*TEST START*/
  let boardsWithItems = itemsColVals
  /*TEST END*/

  // console.log('filterBoards -> boardsWithItems', boardsWithItems, 'filterBoards -> boardsWithItems')
  // saveAndPrintJson(boardsWithItems)

  boardsWithItems.forEach((items, idx) => {
    const board = filteredBoards[idx]
    const { colsToUse } = board

    /* 
    * filtering only items with specific draftsman in them.
    */
    var itemsToUse = items.filter(item => {

      return item.column_values.some(colVal => {

        if (colVal.value && colsToUse.draftId === colVal.id) {
          const parsedValue = JSON.parse(colVal.value).personsAndTeams

          // const isIncludeDraftsman = parsedValue.some(draftsman => draftsman?.id === searchTerm.draftsman.id)
          const isIncludeDraftsman = colVal.text.split(', ').includes(searchTerm.draftsman.nameStr)

          if (isIncludeDraftsman) return true

        }
        return false
      })
    })



    /* 
    * filtering only items in the specific date range.
    */
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
  // saveAndPrintJson(boardsWithItems)



  return Promise.resolve(itemsByBoards)



}

async function getCsvTable(items, draftsmanName, draftsmanFolderId) {



  //#2 part
  try {



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
      // return [..._csvs, testVals]
    }, [])


    const monthAndYear = mondayService.getFormattedMonthAndYear()
    const csvResults = csvs.map((csvValues, idx) => {
      const board = csvValues[0].splice(-1, 1)[0]
      csvValues.slice(1).forEach(values => values.splice(-1, 1))


      let csvRes = fields.join()
      const testRes = csvValues.reduce((acc, vals) => {
        csvRes += ('\n' + vals.join())
        return csvRes
      }, csvRes)

      return { filename: `${draftsmanName}-${monthAndYear}-${board.name}.csv`, content: testRes, parentId: draftsmanFolderId, mimeType: 'text/csv' }
    })



    await Promise.all(csvResults.map(csvRes => {
      console.log('CSV injecttttttt');
      return handleGoogleDrive('file', csvRes)
    }))


  } catch (err) {
    console.log('err: ', err);
    throw err

  }

  // return Promise.resolve()

  // mondayService.sendEmail('anistu@gmail.com', 'test title', 'test text', csvResults)

}


async function getPdfTable(items, draftsmanName, draftsmanFolderId) {

  try {
    console.log('printing');
    const monthAndYear = mondayService.getFormattedMonthAndYear()
    const summery = getDraftsmanSummery(items, draftsmanName)
    const boardsBodyAndHead = utilsService.getTablesBodyAndHead(items)
    const pdfContent = await buildTablesPDF(boardsBodyAndHead, summery)
    await handleGoogleDrive('file', { filename: `${draftsmanName}-${monthAndYear}.pdf`, mimeType: 'application/pdf', content: pdfContent, parentId: draftsmanFolderId })
  } catch (err) {
    console.log('err in getPDfTable: ', err);
    throw err

  }

  // return Promise.resolve()

  // mondayService.sendEmail('anistu@gmail.com', 'test title', 'test text', csvResults)

}


function getDraftsmanSummery(draftsManData, draftsmanName) {

  const titles = []
  const body = []
  const dateRange = utilsService.getDateRange()

  titles.unshift('דוח שרטט')
  titles.unshift('מתאריך')
  titles.unshift('עד תאריך')
  titles.unshift('מספר תכניות')
  titles.unshift('סכום שעות עבודה חודש נוכחי')
  titles.unshift('שעות עבודה במצטבר')
  body.unshift(draftsmanName)
  body.unshift(dateRange.start.toLocaleDateString('he'))
  body.unshift(dateRange.end.toLocaleDateString('he'))
  body.unshift(mondayService.getNumOfItems(draftsManData))
  body.unshift(mondayService.getWorkHoursSum(draftsManData, 'שעות עבודה חודש נוכחי') + '')
  body.unshift(mondayService.getWorkHoursSum(draftsManData, 'שעות עבודה במצטבר') + '')
  return { titles, body }

}




async function getDraftsmenUsers(filteredBoards) {
  try {
    let count = 0
    let users = await getUsers()
    utilsService.sendLog('filteredBoardsLength', filteredBoards.map(itemBoard => itemBoard.name).length)
    let itemsColVals = await getItems(filteredBoards)

    const boardsNames = itemsColVals.map(items => items[0].board.name)
    utilsService.sendLog('itemsColValsLength', itemsColVals.length)

    // const ramatEfal = itemsColVals.filter(items => items.some(item => item.board.name.includes('רמת אפעל')))
    // utilsService.sendLog('ramatEfal', ramatEfal)

    users = users.filter(user => {
      return itemsColVals.some(itemsPerBoard => {
        // if (user.name === 'Ludmila Ivaschenko') {
        //   utilsService.sendLog(`ludmilaItemBoard${count}`, itemsPerBoard)
        // }
        return itemsPerBoard.some(item => {
          return item.column_values.some(colVal => {
            return (colVal.title === 'שרטט') && colVal.text.includes(user.name)
          })
        })
      })
    })

    // saveAndPrintJson(users)
    return { users, itemsColVals }
  } catch (err) {
    console.log('error getDraftsmenUsers', err);
    throw err
  }
}




async function getUsers() {

  const query = `query {
   
      users  {
          id
          name
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
  try {
    console.log('get items');
    /*TEST START*/
    //********************
    // var boardsWithItems = []
    // for (let board of filteredBoards) {

    //   var query = `query {
    //     boards(ids: ${board.id}) {
    //         name
    //         items {
    //           name
    //           id
    //           board{name id}
    //           column_values {
    //                 text
    //                 id
    //                 value
    //                 type
    //                 title
    //             }
    //         }
    //     }
    // }`
    //   // await sleep(5 * 1000)
    //   const resBoard = await monday.api(query)
    //   boardsWithItems.push(resBoard)
    // }
    //********************


    // const boardsIds = filteredBoards.map(board => board.id)
    // var query = `query {

    //     complexity{
    //       before
    //       query
    //       after
    //     }

    //     boards(ids: [${boardsIds.slice(0, 2)}]) {

    //         name
    //         items {
    //           name
    //           id
    //           board{name id}
    //           column_values {
    //                 text
    //                 id
    //                 value
    //                 type
    //                 title
    //             }
    //         }
    //     }
    // }`
    // const result = await monday.api(query)
    // utilsService.sendLog('getItems_result', result)
    // return 
    //********************

    /*TEST END*/



    /*ORIGINAL START*/
    const prmBoards = filteredBoards.map(async (board, idx) => {

      var query = `query {
        
        boards(ids: ${board.id}) {
            name
            items(limit: 600) {
              name
              id
              board{name id}
              column_values {
                    text
                    id
                    value
                    type
                    title
                }
            }
        }
    }`
      return monday.api(query)
    })

    var boardsWithItems = await Promise.all(prmBoards)

    // console.log('boardsWithItems[boardsWithItems.length-1]: ', boardsWithItems[boardsWithItems.length-1], 'boardsWithItems[boardsWithItems.length-1]:');

    /*ORIGINAL END*/
    // utilsService.sendLog('getItems_BoardsWithItems', boardsWithItems)
    // // boardsWithItems.forEach(board=>console.log('boardWithItems: ', board))
    /**
     * TODO: CHECK HERE FOR COMPLEXITY PROBLEM
     * !IMPORTANT
     */
    boardsWithItems = boardsWithItems.filter(_board => _board.data)
    boardsWithItems = boardsWithItems.map(_board => _board.data.boards[0].items)
    return boardsWithItems
  } catch (err) {
    console.log('error getitems', err);
    throw err
  }
}


// onUpdateColumns()

/*TEST START*/
async function onUpdateColumns(req, res) {
  try {

    var query = `query {
      boards {
        id
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

    const result = await monday.api(query)

    const { boards } = result.data
    boards.forEach(async board => {
      const items = board.items

      /*
      * making an map object for each item with the item's id as the key,
      * and the items mutation data object as the value
      */
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
      await updateColumns(itemsColValsMap, board.id)
    })

  } catch (err) {
    console.log('err: ', err);

  } finally {
    console.log('really end');
    global.isReqOn = false
    res.end()
  }
}
/*TEST END*/



/*ORIGINAL START*/
// async function onUpdateColumns(req, res) {
//   const body = req.body
//   try {
//     const { shortLivedToken } = req.session
//     // const monday = initMondayClient()
//     monday.setToken(shortLivedToken)
//     const { boardId } = body.payload.inboundFieldValues

//     var query = `query {
//       boards(ids: ${boardId}) {
//         items {
//           id
//           column_values {
//             id
//             title
//             value
//             text
//           }
//         }
//       }
//     }`

//     const _res = await monday.api(query)

//     const { boards } = _res.data

//     const items = boards[0].items

//     /*
//     * making an map object for each item with the item's id as the key,
//     * and the items mutation data object as the value
//     */
//     const itemsColValsMap = items.reduce((acc, item) => {
//       item.column_values.forEach(colVal => {
//         if (colVal.title === 'שעות עבודה חודש נוכחי' || colVal.title === 'שעות עבודה במצטבר') {
//           const label = colVal.title === 'שעות עבודה חודש נוכחי' ? 'from' : 'to'
//           acc[item.id] = acc[item.id] || {}
//           acc[item.id] = { ...acc[item.id], [label]: colVal }
//           // acc[item.id] = acc[item.id] ? { ...acc[item.id], [label]: colVal } : {[label]: colVal}

//         }
//       })
//       return acc

//     }, {})
//     [{ 123123123123: { from: { text: 312, id: 33412312312 } } }]
//     await updateColumns(itemsColValsMap, boardId)
//   } catch (err) {
//     console.log('err: ', err);

//   } finally {
//     res.end()
//   }
// }
/*ORIGINAL END*/




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

async function trying() {
  const pdfContent = await buildTablesPDF()
  handleGoogleDrive('upload', { filename: 'pdfTest', mimeType: 'application/pdf', content: pdfContent })
}



// trying()
// buildTablesPDF()







async function testMailPdf(req, res) {
  try {
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
  testMailPdf,
  getInterTest
};

