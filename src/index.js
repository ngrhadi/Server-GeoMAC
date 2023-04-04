
require('dotenv').config()
const OS = require('os')
process.env.UV_TREADPOOL_SIZE = OS.cpus().length

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const bodyParser = require('body-parser');
const ngrok = require('ngrok');
const compression = require('compression')
const path = require('path');
const { generateToken } = require('./utils/cxrf');
const ViteExpress = require("vite-express");
const KnexSessionStore = require('connect-session-knex')(session);
const knex = require('../config')

const { errorMiddleware } = require('./middleware/errorMiddleware');
const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
const COOKIES_SECRET = process.env.COOKIES_SECRET || "cookie-secret";

// routing api
const users = require('./routers/users')
const projectInfo = require('./routers/geotechInfo')

const app = express();
ViteExpress.config({ mode: process.env.NODE_ENV })
const host = process.env.HOST_SERVER;
const port = process.env.PORT;
app.set('trust proxy', 1)


app.use(express.json());


app.use(cors({
  origin: [
    `http://${host}:${port}`,
    'http://localhost:3003',
    '*'
  ]
}))

const store = new KnexSessionStore({
  knex,
  tablename: 'sessions', // optional. Defaults to 'sessions'
});

app.use(session({
  store,
  name: 'geomad',
  secret: COOKIES_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production' ? true : false,
    httpOnly: true,
    maxAge: 6000,
    domain: [`http://${host}:${port}`],
    expires: expiryDate
  }
}))


app.use(cookieParser(COOKIES_SECRET));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'))
app.use(compression({
  level: 6,
  threshold: 100 * 1000,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return true
  }
}))

app.use('/', express.static(path.join(__dirname, '../dist')));
app.get('/ip', (request, response) => response.send(request.ip))

// // helper to get token session
app.get("/csrf-token", (req, res) => {
  return res.json({
    token: generateToken(res, req),
  });
});

app.use(errorMiddleware)
app.use('/doc', express.static(path.join(__dirname, '../documents')));

app.use('/user', users)
app.use('/add-project', projectInfo)

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    data: {
      statusCode: 404,
      message: 'You reached a route that is not defined on this server',
    },
  });
});


if (process.env.NODE_ENV === 'production') {

  //after all other route definitions:
  app.get('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Page not found',
      data: {
        statusCode: 404,
        message: 'You reached a route that is not defined on this server',
      },
    });
  });
}

var serverApps = ViteExpress.listen(app, port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:4044`);
});
// ViteExpress.build();
//   app.listen(port, () => {
//   (async () => {
//     const url = await ngrok.connect({
//       proto: 'http', // http|tcp|tls, defaults to http
//       addr: port,
//       authtoken: process.env.TOKEN_NGROK,
//       region: 'ap',
//     });
//     return url
//   })
//   console.log(`⚡️[server]: Server is running at http://${host}:${port}`);
// });

serverApps.keepAlive = true;
