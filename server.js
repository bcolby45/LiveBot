'use strict'
const express = require('express');
const app = express().enable('trust proxy');
const http = require('http');
const https = require('https');
const webServer = http.createServer(app);
const cors = require('cors');
const WebSocketServer = require('ws').Server;
const EventSource = require('eventsource');
const fbsdk = require('facebook-sdk');
const ws = new WebSocketServer({
  server: webServer,
});
let limited = false;
const appID = ``;
const appSecret = ``;
const postId = ``;
const accessToken = ``;
process.on('uncaughtException', function(err) { // I don't like killing the process when one of my libraries fucks up.
  console.log('UNCAUGHT EXCEPTION\n' + err)
});
const facebook = new fbsdk.Facebook({
  appId: appID,
  secret: appSecret,
});
const source = new EventSource(`https://streaming-graph.facebook.com/${postId}/live_comments?access_token=${accessToken}&comment_rate=one_hundred_per_second&fields=from{name,id},message`);
const clients = new Map();
const videos = new Map();
facebook.api(appID, function(data) {
  console.log(data);
});
source.onopen = (event) => {
  console.log(event);
  console.log('connected');
  source.onerror = (err) => {
    console.log(err);
  };
  source.onmessage = (event) => {
    const info = JSON.parse(event.data);
    const check = info.message;
    const httpCheck = check.slice(0, 4);
    if (httpCheck == 'http') {
      wsHtml(check);
    } else if (httpCheck == 'www.') {
      wsHtml(check);
    } else if (httpCheck == 'Skip') {
      wsSkip();
    } else if (httpCheck == 'skip') {
      wsSkip();
    } else if (httpCheck == 'SKIP') {
      wsSkip();
    } else {
      wsAlert(info.message);
    }
  };
};
ws.on('connection', function connection(ws, req) {
  const clientIP = req.connection.remoteAddress;
  const iden = Math.floor(Math.random() * 999999);
  clients.set(iden, {
    socket: ws,
    IP: clientIP,
  });
  ws.on('message', function incoming(message) {
    wsAlert(message);
  });
});
const wsBroadcast = (data) => {
  clients.forEach(function(client) {
    if (client.socket.readyState == 1) {
      client.socket.send(data);
    }
  });
};
const wsAlert = (alertStr) => {
  const newAlert = JSON.stringify({
    alert: alertStr,
  });
  wsBroadcast(newAlert);
};
const wsHtml = (link) => {
    let data;
    let html = link;
    const videoId = html.slice(html.length - 11, html.length);
    html = `https://www.youtube.com/watch?v=${videoId}`;
    if (videos.has(videoId)) {return;} else {videos.set(videoId);}
    https.get(html, (res) => {
      res.on('data', (d) => {
        data = data + d;
      });
      res.on('end', () => {
        data = data.toString();
        if (data.includes(`Licensed to YouTube by`)) {return;}
        if (data.includes('Unlisted')) {return;}
        if (data.includes('Age-restricted')) {return;}
        const newData = JSON.stringify({
          html: videoId,
        });
        wsBroadcast(newData);
      });
    });

};
const wsSkip = () => {
  if(!limited) {
  limited = true;
  setTimeout(function() {
    limited = false;
  }, 5000);
    const newData = JSON.stringify({
      skip: 'skip',
    });
    wsBroadcast(newData);
  }
};
app.use(cors());
app.use('/', express.static(__dirname + '/public/'));
webServer.listen(7004, function listening() {
  console.log('Listening on %d', webServer.address().port);
});