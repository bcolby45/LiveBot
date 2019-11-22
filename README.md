# How do I start up LiveBot?
0. Brody Argo
1. Download OBS (Open Broadcast Software)
2. Add a browser source and point it to localhost:7004
3. Open up powershell or cmd and navigate to the folder where you saved LiveBot
4. Type in "npm i" then press enter
5. Open up server.js in a text editor
6. Enter your Facebook app id, app secret, and access token (your token must have the following priviledges: publish_video, manage_pages)
7. Go to Facebook and start streaming.
8. When your stream has started, right click the live video and click "copy video url". You only need the number at the end (/video/numberyouneed/)
9. Open up server.js in a text editor if you haven't already, and enter this number as the postId
10. In your powershell or cmd window, type in "npm start"
11. The OBS browser source should connect to the server automatically. You are now good to go!

More info about the the Live Comments API is available here: https://developers.facebook.com/docs/graph-api/server-sent-events/endpoints/live-comments/
