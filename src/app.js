import 'source-map-support/register';
import express from 'express';
import path from 'path';
// import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import connectMongo from 'connect-mongo';
import api from './api';

const MongoStore = connectMongo(session);
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
// app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'this is a big long secret. sshhhh!',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    url: 'mongodb://localhost/cloudbudget_dev',
    ttl: 7 * 24 * 60 * 60 // 1 week
  })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1', api);

// catch 404 and forwarding to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// no stacktraces leaked to user if in production mode
app.use((err, req, res) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;

  console.log('Example app listening at %s:%s', host, port);
});
