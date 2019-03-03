const express = require('express');
const app = express().enable('trust proxy');
const http = require('http');
const https = require('https');
const webServer = http.createServer(app);
const cors = require('cors');
const webSocketServer = require('ws').Server;
const WebSocketClient = require('websocket').client;
const EventSource = require("eventsource");
const fbsdk = require('facebook-sdk');
const tmi = require('tmi.js');
const ws = new webSocketServer({
    server: webServer
});

process.on('uncaughtException', function(err) { // I don't like killing the process when one of my libraries fucks up.
    console.log("UNCAUGHT EXCEPTION\n" + err);
});
let canBeCalled = true;
let canBeCalled2 = true;
let canBeCalled3 = true;
let appID = ``;
let appSecret = ``;
let postId = ``;
let accessToken = ``;

var facebook = new fbsdk.Facebook({
    appId: appID,
    secret: appSecret
});
const clients = new Map();
videos = new Map();
facebook.api(appID, function (data) {
    console.log(data);
});

/*https.get(`https://streaming-graph.facebook.com/${postId}/live_comments?access_token=${accessToken}&comment_rate=ten_per_second&fields=from{name,id},message`, res => {
    console.log('statusCode:', res.statusCode);
    res.on('data', (d) => {
        data = data + d;
    });
    res.on('end', () => {

            console.log(data)


    })
});*/

/*setTimeout(function() {
    wsHtml(`https://youtu.be/n0U5DrzD2Wo`);
}, 2000);

setTimeout(function() {
    wsHtml(`https://www.youtube.com/watch?v=eEa3vDXatXg`);
}, 4000);

setTimeout(function() {
    wsHtml(`https://www.youtube.com/watch?v=RLphoP6APkg`);
}, 6000);
*/

var source = new EventSource(`https://streaming-graph.facebook.com/${postId}/live_comments?access_token=${accessToken}&comment_rate=one_hundred_per_second&fields=from{name,id},message`);
source.onopen = function(event) {
    console.log(event);
    console.log('connected');
    source.onerror = function(err){
        console.log(err);
    };
    source.onmessage = function(event) {
    let info = JSON.parse(event.data);
    console.log('got a message');
      check = info.message.toString();
      httpCheck = check.slice(0, 4);
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
	  }	 else {
		console.log(`wsAlert: ${info.message}`);
        wsAlert(info.message);
      }
    };
}

ws.on('connection', function connection(ws, req) {
    const clientIP = req.connection.remoteAddress;
    const iden = Math.floor(Math.random() * 999999);
    clients.set(iden, {
        socket: ws,
        IP: clientIP
    });

    console.log(`${clientIP} just connected.`);
    console.log(`readyState: ${ws.readyState}`);
    ws.on('message', function incoming(message) {
        console.log(`websocket: ${message}`);
        console.log(`readyState: ${ws.readyState}`);
        wsAlert(message);
    });
});


wsBroadcast = (data) => {

    clients.forEach(function (client) {
        console.log(client.socket.readyState);
        if(client.socket.readyState == 1) {
            client.socket.send(data);
        }
    });
};

wsAlert = (alertStr) => {
    /*if(canBeCalled) {
        canBeCalled = false; */
		
        newAlert = JSON.stringify({
            alert: alertStr
        });
        wsBroadcast(newAlert);
		
        /* setTimeout(function() {
            canBeCalled = true;
        }, 1000)
    } else {
        console.log('wsAlert: Rate limited.');
    } */

}

wsHtml = (link) => {
	let data;
    if(canBeCalled2) {
        canBeCalled2 = false;
        setTimeout(function() {
            canBeCalled2 = true;
        }, 1000);
        html = link;
        videoId = html.slice(html.length - 11, html.length);
        html = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(html);
        if(videos.has(videoId)) {
            console.log(`Video has already been played.`);
            return;
        } else {
            videos.set(videoId);
        }
        https.get(html, res => {
            console.log('statusCode:', res.statusCode);
            res.on('data', (d) => {
                data = data + d;
            });
            res.on('end', () => {
                    data = data.toString();
                    subCheck = `Licensed to YouTube by`;
                    console.log('end');
                    if(data.includes(subCheck)) {
                        console.log(`There is copyrighted music in this video.`);
                        return;
                    }
                    console.log(videoId);
                    newData = JSON.stringify({
                        html: videoId
                    });
                    wsBroadcast(newData);
    
            })
        });
    } else {
        console.log('wsHtml: Rate limited.');
    }

}

wsSkip = () => {
    if(canBeCalled3) {
        canBeCalled3 = false;
        setTimeout(function() {
            canBeCalled3 = true;
        }, 500); 
        console.log(`sending skip`);
        newData = JSON.stringify({
            skip: 'skip'
        });
        wsBroadcast(newData);
    } else {
        console.log('wsSkip: Rate limited.');
    }

}


/*setInterval(function() {
    videos.clear();
}, 600000);*/
app.use(cors());
app.use("/", express.static(__dirname + '/public/'));
webServer.listen(7004, function listening() {
    console.log('Listening on %d', webServer.address().port);
});