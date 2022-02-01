const mondayService = require("./monday.service");
const utilsService = require("../../services/utils.service");
const initMondayClient = require("monday-sdk-js");
const nodemailer = require("nodemailer");
const { parse } = require("json2csv");
const {
  handleGoogleDrive,
} = require("../../services/googleDriveService/googleDrive.service");
const { buildTablesPDF } = require("../../services/pdf.service");
var gRes;
var gDateFolderId;
const monday = initMondayClient();

global.isReqOn = false;
/*TEST START*/
async function getInter(req, res) {
  if (global.isReqOn) return res.end();
  global.isReqOn = true;
  gRes = res;
  try {
    const { shortLivedToken } = req.session;

    monday.setToken(process.env.MONDAY_TOKEN);
    const date = new Date().toDateString().replace(/ /gi, "_");
    const monthAndYear = mondayService.getFormattedMonthAndYear();
    const { folderId: dateFolderId } = await handleGoogleDrive("folder", {
      parentId: null,
      name: monthAndYear,
    });
    gDateFolderId = dateFolderId;
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
      }
    }}`;
    const result = await monday.api(query);
    // utilsService.sendLog('complexity1', result.data.complexity)
    const _boards = result.data.boards;
    const filteredBoards = mondayService.getDraftsmanBoard(_boards);
    await interStage2(filteredBoards);
    console.log("done?");
  } catch (err) {
    console.log("get interrrrrr   err: ", err);
  } finally {
    console.log("is end?");
    // await onUpdateColumns(req, res); //!temp for testing!!!
    global.isReqOn = false;
  }
}
/*TEST END*/

/*ORIGINAL START*/
// async function getInter(req, res) {
//   // return res.end()
//   if (global.isReqOn) return res.end()
//   global.isReqOn = true
//   const body = req.body
//   try {
//     const { shortLivedToken } = req.session
//     // const monday = initMondayClient()
//     monday.setToken(global.token)
//     const date = new Date().toDateString().replace(/ /ig, '_')
//     const monthAndYear = mondayService.getFormattedMonthAndYear()
//     const { folderId: dateFolderId } = await handleGoogleDrive('folder', { parentId: null, name: monthAndYear })
//     gDateFolderId = dateFolderId
//     // return

//     let query = `query
//     {
//       boards (limit: 5000) {
//       workspace {
//         name
//         id
//       }
//       name
//       id
//       columns {
//         id
//         title
//         type

//       }
//     }}`

//     const result = await monday.api(query)
//     const _boards = result.data.boards
//     const filteredBoards = mondayService.getDraftsmanBoard(_boards)
//     /*TEST START*/
//     await sleep()
//     await interStage2(filteredBoards)
//     /*TEST END*/

//     /*ORIGINAL START*/
//     // await mondayService.replaceDb({ boards: filteredBoards, key: 'boards' })
//     // return await deleyFunc(interStage2, 1000 * 30 * 0.1, res)
//     /*ORIGINAL END*/

//     console.log('done?');

//   } catch (err) {
//     console.log('get interrrrrr   err: ', err);
//   } finally {
//     console.log('is end?');
//     await onUpdateColumns(req, res)
//     // return res.end()

//   }
// }
/*ORIGINAL END*/

async function getInterTest(req, res) {
  // return res.end()
  if (global.isReqOn) return res.end();
  global.isReqOn = true;
  const body = req.body;
  gRes = res;
  try {
    const { shortLivedToken } = req.session;
    // const monday = initMondayClient()
    monday.setToken(process.env.MONDAY_SIGNING_SECRET);
    const date = new Date().toDateString().replace(/ /gi, "_");
    const monthAndYear = mondayService.getFormattedMonthAndYear();
    const { folderId: dateFolderId } = await handleGoogleDrive("folder", {
      parentId: null,
      name: monthAndYear,
    });
    gDateFolderId = dateFolderId;
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
      }
    }}`;

    const result = await monday.api(query);

    // utilsService.sendLog('complexity1', result.data.complexity)
    const _boards = result.data.boards;
    const filteredBoards = mondayService.getDraftsmanBoard(_boards);
    /*TEST START*/
    await sleep();
    await interStage2(filteredBoards);
    /*TEST END*/

    /*ORIGINAL START*/
    // await mondayService.replaceDb({ boards: filteredBoards, key: 'boards' })
    // return await deleyFunc(interStage2, 1000 * 30 * 0.1, res)
    /*ORIGINAL END*/

    console.log("done?");
  } catch (err) {
    console.log("get interrrrrr   err: ", err);
  } finally {
    console.log("is end?");
    global.isReqOn = false;
    return res.end();
  }
}

function testEnd(data) {
  console.log("**test stop**");

  return gRes.end();
}

async function interStage2(filteredBoards) {
  try {
    /*TEST START*/

    let { users: draftsUsers, itemsColVals } = await getDraftsmenUsers(
      filteredBoards
    );
    await sleep();

    // await onUpdateColumns()

    await interStage3(draftsUsers, filteredBoards, itemsColVals);
    /*TEST END*/

    /*ORIGINAL START*/

    // const data = await mondayService.getDb('boards')
    // const filteredBoards = data.boards
    // let draftsUsers = await getDraftsmenUsers(filteredBoards)
    // await mondayService.replaceDb({ draftsUsers, key: 'draftsUsers' })
    // await deleyFunc(interStage3, 1000 * 30 * 0.1, draftsUsers, filteredBoards)
    /*ORIGINAL END*/
    return;
  } catch (err) {
    console.log("err on interStag2: ", err);
    throw err;
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
  try {
    // users.forEach(async user => {
    for (let user of users) {
      // await sleep(1000)
      const itemsByBoards = await filterBoards(
        filteredBoards,
        user.name,
        itemsColVals
      );
      const itemsVals = Object.values(itemsByBoards);
      let items = itemsVals.map(mondayService.getDateFilteredItems);
      items = mondayService
        .getFilteredColVals(items)
        .filter((items) => items.length);
      if (Object.keys(itemsByBoards).length) {
        console.log("INSIDE IF!!!");
        const { folderId: draftsmanFolderId } = await handleGoogleDrive(
          "folder",
          { name: user.name, parentId: gDateFolderId }
        );
        await getCsvTable(items, user.name, draftsmanFolderId);
        await getPdfTable(items, user.name, draftsmanFolderId);
      } else {
        console.log(`outside if`);
      }
    }
  } catch (err) {
    console.log("err interStage3: ", err);
  } finally {
    return;
  }
}
/*ORIGINAL END*/

function sleep(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*TEST START*/
function deleyFunc(func, time, ...args) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await func(...args);
        resolve();
      } catch (err) {
        reject(err);
        throw err;
      }
    }, time);
  });
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
  const searchTerm = {
    date: utilsService.getDateRange(),
    draftsman: { nameStr: username },
  };

  let itemsByBoards = {};

  let boardsWithItems = itemsColVals;

  boardsWithItems.forEach((items, idx) => {
    const board = filteredBoards[idx];
    const { colsToUse } = board;

    /*
     * filtering only items with specific draftsman in them.
     */
    var itemsToUse = items.filter((item) => {
      return item.column_values.some((colVal) => {
        if (colVal.value && colsToUse.draftId === colVal.id) {
          const isIncludeDraftsman = colVal.text
            .split(", ")
            .includes(searchTerm.draftsman.nameStr);

          if (isIncludeDraftsman) return true;
        }
        return false;
      });
    });

    /*
     * filtering only items in the specific date range.
     */
    itemsToUse = itemsToUse.filter((item) => {
      return item.column_values.every((colVal) => {
        let date = new Date(colVal.text);
        let start = new Date(searchTerm.date.start);
        let end = new Date(searchTerm.date.end);
        start.setHours(4, 0);
        end.setHours(23, 55);
        if (colsToUse.dateId === colVal.id) {
          start = start.getTime() || -Infinity;
          end = end.getTime() || Infinity;

          if (start || end) {
            return date.getTime() > start && date.getTime() < end;
          } else {
            return (
              (date.getTime() || Infinity) > start &&
              (date.getTime() || -Infinity) < end
            );
          }
        } else return true;
      });
    });

    if (!itemsToUse.length) return;
    itemsByBoards = {
      ...itemsByBoards,
      [board.id]: { itemsToUse, colsToUse, searchTerm },
    };
  });
  // saveAndPrintJson(boardsWithItems)

  return Promise.resolve(itemsByBoards);
}

async function getCsvTable(items, draftsmanName, draftsmanFolderId) {
  //#2 part
  try {
    const fields = ["שם תכנית", ...mondayService.getTitles(items[0])];
    const spaces = fields.map((field) => ", ").join("");
    // const fields = ['שם תכנית', ...mondayService.getTitles(items)]

    // const values = items[0].map(_items => _items.column_values)
    const boardItems = items.map((_boardItems) => {
      return _boardItems.map((_items) => {
        return [_items.column_values, _items.name, _items.board];
        // return _items.column_values
      });
    });

    const csvs = boardItems.reduce((_csvs, items) => {
      const testVals = items.map((item) =>
        [{ text: item[1] }, ...item[0], item[2]].map((colVal) => {
          if (colVal.name) return colVal;
          return mondayService.getFormattedValue(
            colVal.type,
            colVal.text,
            true
          );
        })
      );
      _csvs.push(testVals);
      return _csvs;
      // return [..._csvs, testVals]
    }, []);

    const monthAndYear = mondayService.getFormattedMonthAndYear();
    let csvResults = csvs.map((csvValues, idx) => {
      const board = csvValues[0].splice(-1, 1)[0];
      csvValues.slice(1).forEach((values) => values.splice(-1, 1));

      const spaces = fields.map((field) => ", ");
      spaces[parseInt(spaces.length / 2)] = board.name;
      let csvRes = spaces;
      csvRes += "\n" + fields.join();
      const testRes = csvValues.reduce((acc, vals) => {
        csvRes += "\n" + vals.join();
        return csvRes;
      }, csvRes);
      return {
        filename: `${draftsmanName}-${monthAndYear}-${board.name}.csv`,
        content: testRes,
        parentId: draftsmanFolderId,
        mimeType: "text/csv",
      };
    });

    let generalCsvContent = csvResults.reduce((acc, vals) => {
      acc += "\n" + vals.content + "\n";

      return acc;
    }, "");
    utilsService.sendLog("generalCsvContent", generalCsvContent);

    /*TEST START*/
    await handleGoogleDrive("file", {
      filename: `${draftsmanName}-${monthAndYear}.csv`,
      content: generalCsvContent,
      parentId: draftsmanFolderId,
      mimeType: "text/csv",
    });
    /*TEST END*/

    /*ORIGINAL START*/

    // await Promise.all(csvResults.map(csvRes => {
    //   console.log('CSV injecttttttt');
    //   return handleGoogleDrive('file', csvRes)
    // }))
    /*ORIGINAL END*/
  } catch (err) {
    console.log("err: ", err);
    throw err;
  }

  // return Promise.resolve()

  // mondayService.sendEmail('anistu@gmail.com', 'test title', 'test text', csvResults)
}

async function getPdfTable(items, draftsmanName, draftsmanFolderId) {
  try {
    console.log("printing");
    const monthAndYear = mondayService.getFormattedMonthAndYear();
    const summery = getDraftsmanSummery(items, draftsmanName);
    const boardsBodyAndHead = utilsService.getTablesBodyAndHead(items);
    const pdfContent = await buildTablesPDF(boardsBodyAndHead, summery);
    await handleGoogleDrive("file", {
      filename: `${draftsmanName}-${monthAndYear}.pdf`,
      mimeType: "application/pdf",
      content: pdfContent,
      parentId: draftsmanFolderId,
    });
  } catch (err) {
    console.log("err in getPDfTable: ", err);
    throw err;
  }

  // return Promise.resolve()

  // mondayService.sendEmail('anistu@gmail.com', 'test title', 'test text', csvResults)
}

function getDraftsmanSummery(draftsManData, draftsmanName) {
  const titles = [];
  const body = [];
  const dateRange = utilsService.getDateRange();

  titles.unshift("דוח שרטט");
  titles.unshift("מתאריך");
  titles.unshift("עד תאריך");
  titles.unshift("מספר תכניות");
  titles.unshift("סכום שעות עבודה חודש נוכחי");
  body.unshift(draftsmanName);
  body.unshift(dateRange.start.toLocaleDateString("he"));
  body.unshift(dateRange.end.toLocaleDateString("he"));
  body.unshift(mondayService.getNumOfItems(draftsManData));
  body.unshift(
    mondayService.getWorkHoursSum(draftsManData, "שעות עבודה חודש נוכחי") + ""
  );
  return { titles, body };
}

async function getDraftsmenUsers(filteredBoards) {
  try {
    let count = 0;
    let users = await getUsers();
    let itemsColVals = await getItems(filteredBoards);

    const boardsNames = itemsColVals.map((items) => items[0].board.name);

    users = users.filter((user) => {
      return itemsColVals.some((itemsPerBoard) => {
        return itemsPerBoard.some((item) => {
          return item.column_values.some((colVal) => {
            return colVal.title === "שרטט" && colVal.text.includes(user.name);
          });
        });
      });
    });
    // saveAndPrintJson(users)
    return { users, itemsColVals };
  } catch (err) {
    console.log("error getDraftsmenUsers", err);
    throw err;
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
  }`;
  let res = await monday.api(query);
  const { users } = res.data;
  return users;
}

async function getItems(filteredBoards) {
  try {
    console.log("get items");
    /*TEST START*/
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
    /*TEST END*/

    /*TEST START2*/
    // const _tasks = filteredBoards.map((board, idx) => {

    const _tasks = filteredBoards.map((board, idx) => {
      var query = `query {
        boards(ids: ${board.id}) {
            name
            items(limit: 500) {
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
    }`;
      return createQueryTask(query);
    });

    var boardsWithItems = await createQueue(_tasks, 2);

    /*TEST END2*/

    /*ORIGINAL START*/
    // const prmBoards = filteredBoards.map(async (board, idx) => {

    //   var query = `query {
    //     boards(ids: ${board.id}) {
    //         name
    //         items(limit: 500) {
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
    //   return monday.api(query)
    // })

    // var boardsWithItems = await Promise.all(prmBoards)

    /*ORIGINAL END*/
    // utilsService.sendLog('getItems_BoardsWithItems', boardsWithItems)
    // // boardsWithItems.forEach(board=>console.log('boardWithItems: ', board))
    /**
     * TODO: CHECK HERE FOR COMPLEXITY PROBLEM
     * !IMPORTANT
     */
    boardsWithItems = boardsWithItems.filter((_board) => _board.data);
    boardsWithItems = boardsWithItems.map(
      (_board) => _board.data.boards[0].items
    );
    return boardsWithItems;
  } catch (err) {
    console.log("error getitems", err);
    throw err;
  }
}

// onUpdateColumns()
/*TEST START*/
async function onUpdateColumns(req, res) {
  /*TEST START*/

  monday.setToken(process.env.MONDAY_TOKEN);
  const timeDiff = global.expTime - Date.now() / 1000;
  /*TEST END*/

  try {
    var query = `query {
      complexity {
        before
        query
        after
      }
      boards(limit:1000) {
        id
      }
    }`;

    const resBoardsIds = await monday.api(query);

    const boardsIds = resBoardsIds.data.boards.map((board) => board.id);

    // * ready to check
    /*TEST START*/
    const boards = [];
    const tasks = [];
    for (let boardId of boardsIds) {
      query = `query {
            complexity {
              before
              query
              after
            }
              boards(ids:${boardId}) {
                 items (limit: 1000) {
                    id

                    column_values {
                      id
                      title
                      text
                    }
                 }
              }
          }`;

      tasks.push(createQueryTask(query));
      // const itemsData = await monday.api(query)
      // const { items } = itemsData.data.boards[0]
      boards.push({ id: boardId });
    }
    const doneTasks = await createQueue(tasks, 2);
    for (let i = 0; i < doneTasks.length; i++) {
      const { items } = doneTasks[i].data.boards[0];
      boards[i].items = items;
    }
    /*TEST END*/

    /*ORIGINAL START*/
    // const boards = []
    // for (let boardId of boardsIds) {

    //   query = `query {

    //       boards(ids:${boardId}) {
    //          items (limit: 1000) {
    //             id
    //             column_values {
    //               id
    //               title
    //               text
    //             }
    //          }
    //       }
    //   }`

    //   const itemsData = await monday.api(query)
    //   const { items } = itemsData.data.boards[0]
    //   boards.push({ id: boardId, items })
    // }
    /*ORIGINAL END*/

    for (let board of boards) {
      const items = board.items;

      /*
       * making an map object for each item with the item's id as the key,
       * and the items mutation data object as the value
       */
      const itemsColValsMap = items.reduce((acc, item) => {
        item.column_values.forEach((colVal) => {
          if (
            colVal.title === "שעות עבודה חודש נוכחי" ||
            colVal.title === "שעות עבודה במצטבר"
          ) {
            const label =
              colVal.title === "שעות עבודה חודש נוכחי" ? "from" : "to";
            acc[item.id] = acc[item.id] || {};
            acc[item.id] = { ...acc[item.id], [label]: colVal };
            // acc[item.id] = acc[item.id] ? { ...acc[item.id], [label]: colVal } : {[label]: colVal}
          }
        });
        return acc;
      }, {});

      await updateColumns(itemsColValsMap, board.id);
    }
  } catch (err) {
    console.log("err: ", err);
    throw err;
  } finally {
    console.log("really end");
    global.isReqOn = false;
    res.end();
  }
}

async function updateColumns(itemsColValsMap, boardId) {
  /*TEST START*/
  try {
    const tasks = [];
    for (let itemId in itemsColValsMap) {
      const colVal = itemsColValsMap[itemId];
      // if (!colVal.to) colVal.to = { id: '', title: '', text: '' }
      // if (!colVal.from) colVal.from = { id: '', title: '', text: '' }
      if (!colVal.to || !colVal.from || !colVal.from.text) continue;
      const value =
        (+colVal.from?.text || "") + (+colVal?.to?.text || "") || "";
      const query = `mutation {
      change_multiple_column_values (board_id: ${boardId}, item_id: ${itemId}, column_values: ${JSON.stringify(
        JSON.stringify({ [colVal?.from?.id]: "", [colVal.to.id]: value })
      )}) {
        id
      }
    }`;

      tasks.push(createQueryTask(query));
    }
    const doneTasks = await createQueue(tasks, 2);
    return doneTasks;
  } catch (err) {
    throw err;
  }
  /*TEST END*/

  /*ORIGINAL START*/
  // try {

  //   const prmMutations = []
  //   for (let itemId in itemsColValsMap) {
  //     const colVal = itemsColValsMap[itemId]
  //     if (!colVal.to) colVal.to = { id: '', title: '', text: '' }
  //     if (!colVal.from) colVal.from = { id: '', title: '', text: '' }
  //     const value = ((+colVal.from?.text || '') + (+colVal?.to?.text || '')) || ''
  //     const query = `mutation {
  //     change_multiple_column_values (board_id: ${boardId}, item_id: ${itemId}, column_values: ${JSON.stringify(JSON.stringify({ [colVal?.from?.id]: '', [colVal.to.id]: value }))}) {
  //       id
  //     }
  //   }`
  //     const res = await monday.api(query)
  //     prmMutations.push(res)

  //   }

  //   return prmMutations
  // } catch (err) {
  //   throw err
  // }
  /*ORIGINAL END*/
}

const createQueryTask = (query) => async () => {
  return monday.api(query);
};

function createQueue(tasks, maxNumOfWorkers = 4, type = "query") {
  var numOfWorkers = 0;
  var taskIndex = 0;

  return new Promise((done) => {
    const handleResult = (index) => (result) => {
      console.log("createQueue -> index, result", index, result);
      tasks[index] = result;
      if (result.data.complexity) {
        const { before, query, after } = result.data.complexity;
        if (after < query) {
          sleep(10000);
        }
      }
      numOfWorkers--;
      getNextTask();
    };

    const getNextTask = () => {
      console.log("getNextTask numOfWorkers=" + numOfWorkers);
      if (numOfWorkers < maxNumOfWorkers && taskIndex < tasks.length) {
        tasks[taskIndex]()
          .then(handleResult(taskIndex))
          .catch(handleResult(taskIndex));
        taskIndex++;
        numOfWorkers++;
        getNextTask();
      } else if (numOfWorkers === 0 && taskIndex === tasks.length) {
        done(tasks);
      }
    };
    getNextTask();
  });
}

function getAuthToken(req, res) {
  const jwt = require("jsonwebtoken");
  console.log("req.query.token: ", req.query.token);

  const jwtRes = jwt.verify(req.query.token, process.env.MONDAY_SIGNING_SECRET);
  return res.redirect(
    "https://auth.monday.com/oauth2/authorize?client_id=422faa0ec671f8973b5c78ca0779c416?state=" +
      encodeURIComponent(jwtRes.backToUrl)
  );
}

async function trying() {
  const pdfContent = await buildTablesPDF();
  handleGoogleDrive("upload", {
    filename: "pdfTest",
    mimeType: "application/pdf",
    content: pdfContent,
  });
}

// trying()
// buildTablesPDF()

async function testMailPdf(req, res) {
  try {
    const data = {
      filename: `Mohamad_Faroje__12-2020.pdf`,
      path: __dirname + "/Mohamad_Faroje__12-2020.pdf",
      contentType: "application/pdf",
    };

    mondayService.sendEmail(undefined, undefined, undefined, data);
  } catch (err) {
    console.log("err: ", err);
  } finally {
    res.end();
  }
}

module.exports = {
  getInter,
  onUpdateColumns,
  testMailPdf,
  getInterTest,
  getAuthToken,
};
