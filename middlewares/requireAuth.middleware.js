const logger = require('../services/logger.service')

async function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    res.status(401).end('Unauthorized!');
    return;
  }
  next();
}

// async function requireAdmin(req, res, next) {
//   const user = req.session.user;
//   if (!user.isAdmin) {
//     res.status(403).end('Unauthorized Enough..');
//     return;
//   }
//   next();
// }


// module.exports = requireAuth;

module.exports = {
  authenticationMiddleware,
  requireAuth
  // requireAdmin
}





global.expTime = ''

async function authenticationMiddleware(req, res, next) {
  console.log('req.query: ', req.query);
  const jwt = require('jsonwebtoken');
  try {
    let { authorization } = req.headers;
    global.auth = authorization
    if (!authorization && req.query) {
      authorization = req.query.token;
    }
    const jwtRes = jwt.verify(
      authorization,
      process.env.MONDAY_SIGNING_SECRET
    );
    const timeDiff = jwtRes.exp - Date.now()/1000
    if (!global.expTime) global.expTime = jwtRes.exp
    console.log('authenticationMiddleware -> timeDiff', timeDiff)

    const { accountId, userId, backToUrl, shortLivedToken } = jwtRes
    console.log('authenticationMiddleware -> shortLivedToken', shortLivedToken)
    global.token = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEyNzM4MjgxMiwidWlkIjoyMTY4NTEzNywiaWFkIjoiMjAyMS0xMC0wNVQxNDozMzowMy45MDlaIiwicGVyIjoibWU6cmVhZCxib2FyZHM6cmVhZCx3b3Jrc3BhY2VzOnJlYWQsdXNlcnM6cmVhZCxhY2NvdW50OnJlYWQsdGVhbXM6cmVhZCxhc3NldHM6cmVhZCxib2FyZHM6d3JpdGUiLCJhY3RpZCI6NjU2Njg0NywicmduIjoidXNlMSJ9.GeZhTZS0mgDwdfg0njdIaKl9mqqe1c_EjVso8y6fe1c'
    req.session = { accountId, userId, backToUrl, shortLivedToken };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'not authenticated' });
  }
}


