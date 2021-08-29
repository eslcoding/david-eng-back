const mondayService = require('./monday.service');
const initMondayClient = require('monday-sdk-js');
const nodemailer = require('nodemailer');
const { parse } = require('json2csv');
const { handleGoogleDrive } = require('../../services/googleDriveService/googleDrive.service');
const { buildTablesPDF } = require('../../services/pdf.service');
const { saveAndPrintJson } = require('../../services/printService');

var gDateFolderId;
const monday = initMondayClient()



async function getInter(req, res) {
  // return res.end()
  const body = req.body
  try {
    const { shortLivedToken } = req.session
    // const monday = initMondayClient()
    monday.setToken(shortLivedToken)
    const { boardId } = body.payload.inboundFieldValues
    const date = new Date().toDateString().replace(/ /ig, '_')
    const { folderId: dateFolderId } = await handleGoogleDrive('folder', { parentId: null, name: date })
    gDateFolderId = dateFolderId
    // return


    let query = `query 
    {
      boards (limit: 1000) {
      name
      id
      columns {
        id
        title
        type
        settings_str
        
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
    return res.end()

  }
}



async function interStage2(filteredBoards) {
  try {
    /*TEST START*/

    let draftsUsers = await getDraftsmenUsers(filteredBoards)
    await sleep()
    await interStage3(draftsUsers, filteredBoards)
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
async function interStage3(users, filteredBoards) {
  /* FOR TESTING  REMOVE LATER */
  users = users.slice(0, 1)

  try {
    // users.forEach(async user => {
    for (let user of users) {

      await sleep(1000)
      const itemsByBoards = await filterBoards(filteredBoards, user.name)
      console.log('after filterBoards', itemsByBoards, 'after filterBoards');

      const { folderId: draftsmanFolderId } = await handleGoogleDrive('folder', { name: user.name, parentId: gDateFolderId })

      await getCsvTable(itemsByBoards, user.name, gDateFolderId, draftsmanFolderId)
    }
  } catch (err) {
    console.log('err: ', err);


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








async function onUpdateColumns(req, res) {
  const body = req.body
  try {
    const { shortLivedToken } = req.session
    // const monday = initMondayClient()
    monday.setToken(shortLivedToken)
    const { boardId } = body.payload.inboundFieldValues

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
  try {

    let users = await getUsers()
    let itemsColVals = await getItems(filteredBoards)

    users = users.filter(user => {
      return itemsColVals.some(itemsPerBoard => {
        return itemsPerBoard.some(item => {
          return item.column_values.some(colVal => {
            return (colVal.type === 'multiple-person') && (colVal.title === 'שרטט') && colVal.text.includes(user.name)
          })
        })
      })
    })

    // saveAndPrintJson(users)
    return users
  } catch (err) {
    console.log('error getDraftsmenUsers', err);
    throw err
  }
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
  try {
    const itemsVals = Object.values(itemsByBoards)
    let items = itemsVals.map(mondayService.getDateFilteredItems)
    items = mondayService.getFilteredColVals(items).filter(items => items.length)

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




    for (let csvRes of csvResults) {
      console.log('CSV injecttttttt');
      await handleGoogleDrive('file', csvRes)

    }
  } catch (err) {
    console.log('err: ', err);
    throw err

  }

  // return Promise.resolve()

  // mondayService.sendEmail('anistu@gmail.com', 'test title', 'test text', csvResults)

}





async function filterBoards(filteredBoards, username) {
  console.log('filterBoards -> username', username)

  const searchTerm = {
    date: { end: '2022-08-01', start: '2019-08-01' },
    draftsman: { nameStr: username }
    /* 
    !TESTING!!! REMOVE LATER 
    */
    // draftsman: { nameStr: 'Leon Bogakovsky' }
  }


  /*
  * trying regular for loop because we want to utilize the "await" functionality and wait between every request
  */

  /*TEST START*/
  // let boardsWithItems = []
  // for (let board of filteredBoards) {
  //   var query = `query {
  //       boards(ids: ${board.id}) {
  //           items (limit: 1000) {
  //             name
  //             id
  //             board{name id}
  //             column_values {
  //                   text
  //                   id
  //                   value
  //                   type
  //                   title
  //                   additional_info
  //               }
  //           }
  //       }
  //   }`
  //   const res = await monday.api(query)
  //   boardsWithItems.push(res)


  // }
  // console.log('test33333333333333333333333333333333333333333333333333333333333333333');
  /*TEST END*/


  /*ORIGINAL START*/
  let itemsByBoards = {}

  const prmBoards = filteredBoards.map(async (board, idx) => {

    const { colsToUse } = board
    var query = `query {
      boards(ids: ${board.id}) {
          name
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

    return monday.api(query)
  })
  var boardsWithItems = await Promise.all(prmBoards)
  console.log('filterBoards -> boardsWithItems', boardsWithItems, 'filterBoards -> boardsWithItems')



  /*ORIGINAL END*/


  boardsWithItems = boardsWithItems.filter(board => !board.errors)

  // boardsWithItems.forEach(board=>console.log('boardWithItems: ', board))

  boardsWithItems = boardsWithItems.map(_board => _board.data.boards[0].items)
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
  try {

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
    var boardsWithItems = await Promise.all(prmBoards)

    // boardsWithItems.forEach(board=>console.log('boardWithItems: ', board))

    boardsWithItems = boardsWithItems.filter(_board => _board.data)

    boardsWithItems = boardsWithItems.map(_board => {
      // console.log('getItems -> _board', _board)
      return _board.data.boards[0].items
    })
    return boardsWithItems
  } catch (err) {
    console.log('error getitems');
    throw err
  }
}






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
  testMailPdf
};

