//handling states
var done = false;
var canBePlayed = true;
var notSkipped = false;
var skips = 0;
var playlist = [];
var currVideo = 0;
var nextNum = 0;
var newVideo, playVideo, videoTime, playNum, nextVideo, nextTime, lines, player, newHtml, timeoutNext;
var canBeCalled = true;
var canBeCalled2 = true;

// loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    console.log('YouTube API ready!');
    init();
}

init = () => {
    //websocket
    socket = new WebSocket("ws://" + location.host);

    // Log errors to the console for debugging.
    socket.onerror = function (error) {
        console.log(error);
    };

    // Reconnect upon disconnect.
    socket.onclose = function () {
        console.log(`Your socket has been disconnected. Attempting to reconnect...`);
        setTimeout(function () {
            init();
        }, 1000);
    };

    socket.onmessage = (message) => {
        console.log('got message');

        speakAlert = (alert) => {
            if (alert.length < 101) {
                if (alert.match(/^[0-9]*$/g) !== null && alertInfo.length > 8) {
                    return;
                }
                responsiveVoice.speak(alert);
            }
        }

        /* Inserts regular messages into DOM */
        processAlert = (alert, special) => {
            num = Math.floor(Math.random() * 7);
            num2 = Math.floor(Math.random() * 99999999 + 1);
            areaNum = `area-${num}`;
            areaDOM = document.getElementById(areaNum);
            if (special) {
                console.log(`special: ${special}`);

                if (special == `red`) {
                    alert = alert.substring(6, alert.length);
                    areaDOM.innerHTML =
                        `
                <marquee scrollamount="20"><p class="animated flash" style="color:red" id="${num2}"></p></marquee>
                        `
                    document.getElementById(num2).textContent = alert;
                    speakAlert(alert);

                } else if (special == `green`) {
                    alert = alert.substring(8, alert.length);
                    areaDOM.innerHTML =
                        `
                <marquee scrollamount="20"><p class="animated flash" style="color:#8F9749;" id="${num2}"></p></marquee>
                        `
                    document.getElementById(num2).textContent = alert;
                    speakAlert(alert);

                } else if (special = `rainbow`) {
                    alert = alert.substring(10, alert.length);
                    areaDOM.innerHTML =
                        `
                <marquee scrollamount="20"><p class="animated flash rainbow" id="${num2}"></p></marquee>
                        `
                    document.getElementById(num2).textContent = alert;
                    speakAlert(alert);
                }

            } else {
                console.log('happening')
                areaDOM.innerHTML =
                    `
        <marquee scrollamount="20"><p class="animated flash" style="color:white" id="${num2}"></p></marquee>
        `
                document.getElementById(num2).textContent = alert;
                speakAlert(alert);
            }
        }
        /* End */

        parsedData = JSON.parse(message.data);
        if (parsedData.alert) {
            alertInfo = parsedData.alert;
            console.log(alertInfo);
            /* Check for special commands */
            if (alertInfo.includes(`[red]`)) {
                special = `red`;
                processAlert(alertInfo, special);
            } else if (alertInfo.includes(`[green]`)) {
                special = `green`;
                processAlert(alertInfo, special);
            } else if (alertInfo.includes(`[rainbow]`)) {
                special = `rainbow`;
                processAlert(alertInfo, special);
            } else {
                console.log(`processAlert(alertinfo);`)
                processAlert(alertInfo);
            }
        }
        if (parsedData.html) {
            newVideo = parsedData.html;
            num3 = Math.floor(Math.random() * 99999999 + 1);
            num3 = num3.toString();
            vidNum = `player${num3}`;
            container = document.createElement('div');
            container.setAttribute("id", vidNum);
            document.getElementById('theContainer').appendChild(container);
            player = new YT.Player(vidNum, {
                height: '1',
                width: '1',
                videoId: newVideo,
                events: {
                    'onReady': onPlayerReady
                }
            });


        }

        if (parsedData.skip) {

            skipVideo();

        }

        socket.onopen = () => {
            console.log('client connected successfully');
        };
    }
}

/* ------------------------------------------------- */

onPlayerReady = () => {
    if (player) {
        videoTime = player.getDuration();
        videoTitle = player.getVideoData().title;
        //console.log('onPlayerReady:', newVideo, videoTime * 1000, 'was parsed.');
        playlist.push({
            id: newVideo,
            time: videoTime * 1000,
            title: videoTitle
        });
        document.getElementById('theContainer').innerHTML = '';
        if (canBePlayed) {
            console.log(`onPlayerReady: ${newVideo}:${videoTime * 1000} called prepareNext.`)
            prepareNext();
        }
    } else {
        return;
    }

}

prepareNext = () => {

    if (currVideo == 0) {
        playVideo = playlist[0].id;
        videoTime = playlist[0].time;
        videoTitle = playlist[0].title;
        console.log(`prepareNext: Playing first video in playlist ${playVideo}:${videoTime} by calling playNext`);
        playNext(playVideo, videoTime);
    } else if (currVideo > 0) {
        playVideo = playlist[nextNum].id;
        videoTime = playlist[nextNum].time;
        videoTitle = playlist[nextNum].title;
        console.log(`prepareNext: Playing next video in playlist ${nextNum}:${playVideo}:${videoTime} by calling playNext`);
        playNext(playVideo, videoTime);
    } else {
        console.log(`prepareNext: Something went wrong.`);
    }


}

playNext = (playVideo, videoTime) => {
    /* DOM elements for current, next, and skips */
    const info1 = document.getElementById('info1');
    const info2 = document.getElementById('info2');
    const info3 = document.getElementById('info3');

    /* Set initial current video in DOM */
    if (currVideo == 0) {
        console.log(`Setting initial current video in DOM.`);
        info1.innerHTML = `Current: ${playlist[currVideo].title}`;
    }

    /* Replay last video if the current video doesn't actually exist */
    if (!playlist[currVideo]) {
        currVideo = currVideo - 1;
        nextNum = currVideo + 1;
        playVideo = playlist[currVideo].id;
        videoTime = playlist[currVideo].time;
        videoTitle = playlist[currVideo].title;
        console.log(`Current video doesn't exist. Going back to ${currVideo}, ${videoTitle}`);
    }

    if (!playlist[nextNum]) {
        currVideo = currVideo - 1;
        nextNum = currVideo + 1;
        playVideo = playlist[currVideo].id;
        videoTime = playlist[currVideo].time;
        videoTitle = playlist[currVideo].title;
        console.log(`Next video doesn't exist. Going back to ${currVideo}, ${videoTitle}`);
    }

    /* Resets skips when new video is played */
    skips = 0;
    info3.innerHTML = ``;
    console.log(`Skips reset for new video.`);
    document.getElementById('info3').innerHTML = ``;

    /* More than one video in playlist, current video is the first video in the playlist */
    if (playlist.length !== 1 && currVideo == 0) {
        console.log(`More than one video in playlist, current video is the first video in the playlist`);

        /* Sanity check */
        console.log('Sanity check.');
        console.log(`playNext: Current video is ${currVideo} `);
        console.log('playNext:', nextNum, nextVideo, nextTime, playlist[nextNum].title, 'should now be next in the playlist.');

        /* Start playing current video */
        newHtml = `https://www.youtube.com/embed/${playVideo}?autoplay=1`;

        /* Place current video in DOM */
        document.getElementById('yt').innerHTML = `
        <iframe height="100%" width="100%" src="${newHtml}" allow="autoplay; encrypted-media" allowfullscreen />
                  `
        canBePlayed = false;
        notSkipped = true;

        /* Set up timer for next video */
        timeoutNext = setTimeout(function () {
            console.log(`timeoutNext triggered.`);
            if (notSkipped) {
                if (nextTime > 0) {
                    console.log(`timeoutNext REALLY triggered.`);
                    /*
                    currVideo = currVideo + 1;
                    nextNum = currVideo + 1;
                    nextVideo = playlist[currVideo].id;
                    nextTime = playlist[currVideo].time;

                    console.log(`notSkipped: Current video ended without being skipped, last video was ${currVideo}, next will be ${nextNum}`);
                    info1.innerHTML = `Current: ${playlist[currVideo].title}`;
                    if(playlist[nextNum]) {
                        info2.innerHTML = `Next: ${playlist[nextNum]}`;
                    }

                    playNext(nextVideo, nextTime);
                    */
                   skips = 4;
                   console.log(`timeoutNext set skips to ${skips}`);
                   skipVideo();
                }

            }
        }, videoTime);

        /* More than one video in the playlist, current video is not the first video in the playlist */
    } else if (playlist.length !== 1 && currVideo !== 0) {
        console.log(`More than one video in the playlist, current video is not the first video in the playlist`);

        /* Sanity check */
        console.log('Sanity check.');
        console.log(`playNext: Current video is ${currVideo} `);
        console.log('playNext:', nextNum, nextVideo, nextTime, playlist[nextNum].title, 'should be next in the playlist.');

        /* Start playing current video */
        newHtml = `https://www.youtube.com/embed/${playVideo}?autoplay=1`;

        /* Place current video in DOM */
        document.getElementById('yt').innerHTML = `
            <iframe height="100%" width="100%" src="${newHtml}" allow="autoplay; encrypted-media" allowfullscreen />
                      `
        canBePlayed = false;
        notSkipped = true;

        /* Set up timer for next video */
        timeoutNext = setTimeout(function () {
            console.log(`timeoutNext triggered.`)
            if (notSkipped) {
                if (nextTime > 0) {
                    console.log(`timeoutNext REALLY triggered.`)
                    /*
                    currVideo = currVideo + 1;
                    nextNum = currVideo + 1;
                    nextVideo = playlist[currVideo].id;
                    nextTime = playlist[currVideo].time;

                    console.log(`notSkipped: Current video ended without being skipped, last video was ${currVideo}, next will be ${nextNum}`);
                    document.getElementById('info1').innerHTML = `Current: ${playlist[currVideo].title}`;
                    if(playlist[nextNum]) {
                        document.getElementById('info2').innerHTML = `Next: ${playlist[nextNum].title}`;
                    }
                    playNext(nextVideo, nextTime);
                    */
                   skips = 4;
                   console.log(`timeoutNext set skips to ${skips}`);
                   skipVideo();
                }
            }
        }, videoTime);

        /* Only one video in the playlist, current video is the first in the playlist */

    } else if (playlist.length == 1 && currVideo == 0) {
        console.log(`Only one video in the playlist, current video is the first in the playlist`);

        /* Sanity check */
        console.log('Sanity check.');
        console.log(`playNext: Current video is ${currVideo}, next is ${nextNum} ${playlist[nextNum].title}`);

        /* Start playing current video */
        newHtml = `https://www.youtube.com/embed/${playVideo}?autoplay=1`;

        /* Place current video in DOM */
        document.getElementById('yt').innerHTML = `
        <iframe height="100%" width="100%" src="${newHtml}" allow="autoplay; encrypted-media" allowfullscreen />
                  `
        canBePlayed = false;
        notSkipped = true;

        /* Set up timer for next video */
        console.log(`Timer for next video should be set to ${videoTime}`);
        timeoutNext = setTimeout(function () {
            console.log(`timeoutNext triggered.`)
            if (notSkipped) {
                console.log(`timeoutNext REALLY triggered.`)
                /*
                    
                    currVideo = currVideo + 1;
                    nextNum = currVideo + 1;
                    nextVideo = playlist[currVideo].id;
                    nextTime = playlist[currVideo].time;

                    
                    console.log(`notSkipped: Current video ended without being skipped, last video was ${currVideo}, next will be ${nextNum}`);
                    document.getElementById('info1').innerHTML = `Current: ${playlist[currVideo].title}`;

                    if (playlist[nextNum]) {
                        document.getElementById('info2').innerHTML = `Next: ${playlist[currVideo + 1].title}`;
                    }

                    playNext(nextVideo, nextTime);
                    */
                   skips = 4;
                   console.log(`timeoutNext set skips to ${skips}`);
                   skipVideo();
                    
                }
        }, videoTime);

    } else {
        console.log(`playNext: Something went wrong.`);
    }


}

skipVideo = () => {
    skips = skips + 1;
    console.log(`skips:${skips}`);
    if (skips == 1) {
        console.log(`skips:${skips}`);
        document.getElementById('info3').innerHTML = `X`;
    } else if (skips == 2) {
        console.log(`skips:${skips}`);
        document.getElementById('info3').innerHTML = `XX`;
    } else if (skips == 3) {
        console.log(`skips:${skips}`);
        document.getElementById('info3').innerHTML = `XXX`;
    } else if (skips == 4) {
        console.log(`skips:${skips}`);
        document.getElementById('info3').innerHTML = `XXXX`;
    } else if (skips == 5) {

        /* Set new current video */

        currVideo = currVideo + 1;
        nextNum = currVideo + 1;

        if(!playlist[currVideo]) {
            console.log(`wsSkip: Reverting currVideo`);
            currVideo = currVideo - 1;
            console.log(playlist[currVideo].title);
        }

        if(!playlist[nextNum]) {
            console.log(`wsSkip: Reverting nextNum`);
            nextNum = currVideo;
            console.log(playlist[nextNum].title);
        }

        document.getElementById('info1').innerHTML = `Current: ${playlist[currVideo].title}`;
        console.log(`Skipping to next video. Current video is now ${currVideo}:${playlist[currVideo].title} and the next is ${nextNum}:${playlist[nextNum].title}`);

        /* Set new next video. */
        if (playlist[nextNum]) {
            document.getElementById('info2').innerHTML = `Next: ${playlist[nextNum].title}`;
        }

        /* Stop current video and play next  */
        clearTimeout(timeoutNext);
        notSkipped = false;
        nextVideo = playlist[currVideo].id;
        nextTime = playlist[currVideo].time;
        playNext(nextVideo, nextTime);

    }
}