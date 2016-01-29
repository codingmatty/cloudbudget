import fs from 'fs';
// import path from 'path';
import https from 'https';
import logger from 'morgan';
import express from 'express';
import passport from 'passport';
// import favicon from 'serve-favicon';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import api from './api';
import setupPassport from './auth/auth';

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

if (app.get('env') === 'development') {
  app.use(logger('dev'));
}
// app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use(passport.session());
setupPassport();

app.use('/api/v1', api);
if (app.get('env') === 'production') {
  app.use('/static', express.static(__dirname + '/public/static'));
  app.get('/*', (req, res) => {
    res.sendFile('/public/index.html', { root: __dirname + '/' });
  });
} else {
  app.use('/static', express.static(__dirname + '/../public/dist/static'));
  app.get('/*', (req, res) => {
    res.sendFile('/public/dist/index.html', { root: __dirname + '/../' });
  });
}

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

const port = process.env.PORT || 8090;
if (app.get('env') === 'production') {
  const options = {
    key: fs.readFileSync('private.cloudbudget.pem'),
    cert: fs.readFileSync('0001_chain.pem')
  };
  const server = https.createServer(options, app);
  server.listen(port, () => {
    const host = server.address().address;
    /* eslint-disable no-console */
    console.log('Example app listening at %s:%s', host, port);
  });
} else {
  const server = app.listen(port, () => {
    const host = server.address().address;
    /* eslint-disable no-console */
    console.log('Example app listening at %s:%s', host, port);
  });
}

export default app;
