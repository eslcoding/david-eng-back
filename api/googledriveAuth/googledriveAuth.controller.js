const logger = require('../../services/logger.service');
const mondayService = require('../monday/monday.service');
const config = require('../../config')



async function authorization(req, res) {
    const body = req.body
    console.log('authorization -> body', body)

    


}


async function callback(req, res) {
   
}


module.exports = {

    authorization,
    callback
}



// async function login(req, res) {
//     const { email, password } = req.body
//     try {
//         const user = await authService.login(email, password)
//         req.session.user = user;
//         req.session.save();
//         res.json(user)
//     } catch (err) {
//         res.status(401).send({ error: 'could not login, please try later' })
//     }
// }

// async function signup(req, res) {
//     try {
//         const { firstName, lastName, email, password, username } = req.body
//         logger.debug(firstName + "," + lastName + "," + email + ", " + username + ', ' + password)
//         const account = await authService.signup(firstName, lastName, email, password, username)
//         logger.debug(`auth.route - new account created: ` + JSON.stringify(account))
//         const user = await authService.login(email, password)
//         req.session.user = user
//         req.session.save();
//         res.json(user)
//     } catch (err) {
//         logger.error('[SIGNUP] ' + err)
//         res.status(500).send({ error: 'could not signup, please try later' })
//     }
// }

// async function logout(req, res) {
//     try {
//         req.session.destroy()
//         res.send({ message: 'logged out successfully' })
//     } catch (err) {
//         res.status(500).send({ error: 'could not signout, please try later' })
//     }
// }

// async function getLoggedInUser(req, res) {
//     try {
//         if (req.session.user) {
//             req.session.save();
//             res.json(req.session.user);
//         } else {
//             res.json({});
//         }
//     } catch (err) {
//         logger.error('no signedin users', err);
//         res.status(500).send({ error: 'no signedin users' });
//     }
// }


