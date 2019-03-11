// handling states
let canBePlayed = true;
let notSkipped = false;
let playlist = [];
let currVideo = 0;
let nextNum = 0;
let skips = 0;
let playVideo;
let videoTime;
let videoTitle;
/* DOM elements for current, next, and skips */
const info1 = document.getElementById('info1');
const info3 = document.getElementById('info3');
const tag = document.createElement('script');
// load youtube api
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
function onYouTubeIframeAPIReady() {
  console.log('YouTube API ready!');
  init();
}
const init = () => {
  // websocket
  const socket = new WebSocket('ws://' + location.host);
  // Log errors to the console for debugging.
  socket.onerror = function(error) {
    console.log(error);
  };
  // Reconnect upon disconnect.
  socket.onclose = function() {
    console.log(`Your socket has been disconnected. Attempting to reconnect...`);
    setTimeout(function() {
      init();
    }, 1000);
  };
  socket.onmessage = (message) => {
    // TTS
    const speakAlert = (alert) => {
      if (alert.length < 101) {
        if (alert.match(/^[0-9]*$/g) !== null && alert.length > 8) {
          return;
        }
        responsiveVoice.speak(alert);
      }
    }
    /* Inserts regular messages into DOM */
    const processAlert = (alert, special) => {
      const num = Math.floor(Math.random() * 7);
      const num2 = Math.floor(Math.random() * 99999999 + 1);
      const areaNum = `area-${num}`;
      const areaDOM = document.getElementById(areaNum);
      if (special) {
        if (special == `red`) {
          const alert = alert.substring(6, alert.length);
          areaDOM.innerHTML =
                        `
                <marquee scrollamount="20"><p style="color:red" id="${num2}"></p></marquee>
                        `
          document.getElementById(num2).textContent = alert;
          speakAlert(alert);
        } else if (special == `green`) {
          const alert = alert.substring(8, alert.length);
          areaDOM.innerHTML =
                        `
                <marquee scrollamount="20"><p style="color:#8F9749;" id="${num2}"></p></marquee>
                        `
          document.getElementById(num2).textContent = alert;
          speakAlert(alert);
        } else if (special = `rainbow`) {
          const alert = alert.substring(10, alert.length);
          areaDOM.innerHTML =
                        `
                <marquee scrollamount="20"><p class="rainbow" id="${num2}"></p></marquee>
                        `
          document.getElementById(num2).textContent = alert;
          speakAlert(alert);
        }
      } else {
        areaDOM.innerHTML =
                    `
        <marquee scrollamount="20"><p style="color:white" id="${num2}"></p></marquee>
        `
        document.getElementById(num2).textContent = alert;
        speakAlert(alert);
      }
    }
    /* End */
    const parsedData = JSON.parse(message.data);
    if (parsedData.alert) {
      const alertInfo = parsedData.alert;
      /* Check for special commands */
      if (alertInfo.includes(`[red]`)) {
        const special = `red`;
        processAlert(alertInfo, special);
      } else if (alertInfo.includes(`[green]`)) {
        const special = `green`;
        processAlert(alertInfo, special);
      } else if (alertInfo.includes(`[rainbow]`)) {
        const special = `rainbow`;
        processAlert(alertInfo, special);
      } else {
        processAlert(alertInfo);
      }
    }
    if (parsedData.html) {
      newVideo = parsedData.html;
      let num3 = Math.floor(Math.random() * 99999999 + 1);
      num3 = num3.toString();
      const vidNum = `player${num3}`;
      const container = document.createElement('div');
      container.setAttribute('id', vidNum);
      document.getElementById('theContainer').appendChild(container);
      player = new YT.Player(vidNum, {
        height: '1',
        width: '1',
        videoId: newVideo,
        events: {
          'onReady': onPlayerReady,
        },
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
    videoTime = videoTime * 1000;
    console.log(videoTime);
    videoTitle = player.getVideoData().title;
    if(videoTime < 1000) {return;}
    playlist.push({
      id: newVideo,
      time: videoTime,
      title: videoTitle,
    });
    document.getElementById('theContainer').innerHTML = '';
    if (canBePlayed) {
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
    playNext(playVideo, videoTime, videoTitle);
  } else if (currVideo > 0) {
    playVideo = playlist[nextNum].id;
    videoTime = playlist[nextNum].time;
    videoTitle = playlist[nextNum].title;
    playNext(playVideo, videoTime);
  } else {
    console.log(`prepareNext: Something went wrong.`);
  }
}

playNext = (playVideo, videoTime) => {
  /* Set initial current video in DOM */
  if (currVideo == 0) {
    info1.innerHTML = `Current: ${playlist[currVideo].title}`;
  }
  /* Replay last video if the current video doesn't actually exist */
  if (!playlist[currVideo]) {
    currVideo = currVideo - 1;
    nextNum = currVideo + 1;
    playVideo = playlist[currVideo].id;
    videoTime = playlist[currVideo].time;
    videoTitle = playlist[currVideo].title;
  }
  if (!playlist[nextNum]) {
    currVideo = currVideo - 1;
    nextNum = currVideo + 1;
    playVideo = playlist[currVideo].id;
    videoTime = playlist[currVideo].time;
    videoTitle = playlist[currVideo].title;
  }
  /* Resets skips when new video is played */
  skips = 0;
  info3.innerHTML = ``;
  document.getElementById('info3').innerHTML = ``;
  /* More than one video in playlist, current video is the first video in the playlist */
  if (playlist.length !== 1 && currVideo == 0) {
    /* Start playing current video */
    newHtml = `https://www.youtube.com/embed/${playVideo}?autoplay=1`;
    /* Place current video in DOM */
    document.getElementById('yt').innerHTML = `
        <iframe height="100%" width="100%" src="${newHtml}" allow="autoplay; encrypted-media" allowfullscreen />
                  `
    canBePlayed = false;
    notSkipped = true;
    /* Set up timer for next video */
    timeoutNext = setTimeout(function() {
      if (notSkipped) {
        if (nextTime > 0) {
          skips = 4;
          skipVideo();
        }
      }
    }, videoTime);
    /* More than one video in the playlist, current video is not the first video in the playlist */
  } else if (playlist.length !== 1 && currVideo !== 0) {
    /* Start playing current video */
    newHtml = `https://www.youtube.com/embed/${playVideo}?autoplay=1`;
    /* Place current video in DOM */
    document.getElementById('yt').innerHTML = `
            <iframe height="100%" width="100%" src="${newHtml}" allow="autoplay; encrypted-media" allowfullscreen />
                      `
    canBePlayed = false;
    notSkipped = true;
    /* Set up timer for next video */
    timeoutNext = setTimeout(function() {
      if (notSkipped) {
        if (nextTime > 0) {
          skips = 4;
          skipVideo();
        }
      }
    }, videoTime);
    /* Only one video in the playlist, current video is the first in the playlist */
  } else if (playlist.length == 1 && currVideo == 0) {
    /* Start playing current video */
    newHtml = `https://www.youtube.com/embed/${playVideo}?autoplay=1`;
    /* Place current video in DOM */
    document.getElementById('yt').innerHTML = `
        <iframe height="100%" width="100%" src="${newHtml}" allow="autoplay; encrypted-media" allowfullscreen />
                  `
    canBePlayed = false;
    notSkipped = true;
    /* Set up timer for next video */
    timeoutNext = setTimeout(function() {
      if (notSkipped) {
        skips = 4;
        skipVideo();
      }
    }, videoTime);
  } else {
    console.log(`playNext: Something went wrong.`);
  }
}
skipVideo = () => {
  skips = skips + 1;
  if (skips == 1) {
    document.getElementById('info3').innerHTML = `X`;
  } else if (skips == 2) {
    document.getElementById('info3').innerHTML = `XX`;
  } else if (skips == 3) {
    document.getElementById('info3').innerHTML = `XXX`;
  } else if (skips == 4) {
    document.getElementById('info3').innerHTML = `XXXX`;
  } else if (skips == 5) {
    /* Set new current video */
    currVideo = currVideo + 1;
    nextNum = currVideo + 1;
    if (!playlist[currVideo]) {
      currVideo = currVideo - 1;
    }
    if (!playlist[nextNum]) {
      nextNum = currVideo;
    }
    document.getElementById('info1').innerHTML = `Current: ${playlist[currVideo].title}`;
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
if(void 0!==responsiveVoice)console.log("ResponsiveVoice already loaded"),console.log(responsiveVoice);else var ResponsiveVoice=function(){var e=this;e.version=3,console.log("ResponsiveVoice r"+e.version);var a=[{name:"UK English Female",voiceIDs:[3,5,1,6,7,8]},{name:"UK English Male",voiceIDs:[0,4,2,6,7,8]},{name:"US English Female",voiceIDs:[39,40,41,42,43,44]},{name:"Spanish Female",voiceIDs:[19,16,17,18,20,15]},{name:"French Female",voiceIDs:[21,22,23,26]},{name:"Deutsch Female",voiceIDs:[27,28,29,30,31,32]},{name:"Italian Female",voiceIDs:[33,34,35,36,37,38]},{name:"Greek Female",voiceIDs:[62,63,64]},{name:"Hungarian Female",voiceIDs:[9,10,11]},{name:"Russian Female",voiceIDs:[47,48,49]},{name:"Dutch Female",voiceIDs:[45]},{name:"Swedish Female",voiceIDs:[65]},{name:"Japanese Female",voiceIDs:[50,51,52,53]},{name:"Korean Female",voiceIDs:[54,55,56,57]},{name:"Chinese Female",voiceIDs:[58,59,60,61]},{name:"Hindi Female",voiceIDs:[66,67]},{name:"Serbian Male",voiceIDs:[12]},{name:"Croatian Male",voiceIDs:[13]},{name:"Bosnian Male",voiceIDs:[14]},{name:"Romanian Male",voiceIDs:[46]},{name:"Fallback UK Female",voiceIDs:[8]}],n=[{name:"Google UK English Male"},{name:"Agnes"},{name:"Daniel Compact"},{name:"Google UK English Female"},{name:"en-GB",rate:.25,pitch:1},{name:"en-AU",rate:.25,pitch:1},{name:"inglés Reino Unido"},{name:"English United Kingdom"},{name:"Fallback en-GB Female",lang:"en-GB",fallbackvoice:!0},{name:"Eszter Compact"},{name:"hu-HU",rate:.4},{name:"Fallback Hungarian",lang:"hu",fallbackvoice:!0},{name:"Fallback Serbian",lang:"sr",fallbackvoice:!0},{name:"Fallback Croatian",lang:"hr",fallbackvoice:!0},{name:"Fallback Bosnian",lang:"bs",fallbackvoice:!0},{name:"Fallback Spanish",lang:"es",fallbackvoice:!0},{name:"Spanish Spain"},{name:"español España"},{name:"Diego Compact",rate:.3},{name:"Google Español"},{name:"es-ES",rate:.2},{name:"Google Français"},{name:"French France"},{name:"francés Francia"},{name:"Virginie Compact",rate:.5},{name:"fr-FR",rate:.25},{name:"Fallback French",lang:"fr",fallbackvoice:!0},{name:"Google Deutsch"},{name:"German Germany"},{name:"alemán Alemania"},{name:"Yannick Compact",rate:.5},{name:"de-DE",rate:.25},{name:"Fallback Deutsch",lang:"de",fallbackvoice:!0},{name:"Google Italiano"},{name:"Italian Italy"},{name:"italiano Italia"},{name:"Paolo Compact",rate:.5},{name:"it-IT",rate:.25},{name:"Fallback Italian",lang:"it",fallbackvoice:!0},{name:"Google US English",timerSpeed:1},{name:"English United States"},{name:"inglés Estados Unidos"},{name:"Vicki"},{name:"en-US",rate:.2,pitch:1,timerSpeed:1.3},{name:"Fallback English",lang:"en-US",fallbackvoice:!0,timerSpeed:0},{name:"Fallback Dutch",lang:"nl",fallbackvoice:!0,timerSpeed:0},{name:"Fallback Romanian",lang:"ro",fallbackvoice:!0},{name:"Milena Compact"},{name:"ru-RU",rate:.25},{name:"Fallback Russian",lang:"ru",fallbackvoice:!0},{name:"Google 日本人",timerSpeed:1},{name:"Kyoko Compact"},{name:"ja-JP",rate:.25},{name:"Fallback Japanese",lang:"ja",fallbackvoice:!0},{name:"Google 한국의",timerSpeed:1},{name:"Narae Compact"},{name:"ko-KR",rate:.25},{name:"Fallback Korean",lang:"ko",fallbackvoice:!0},{name:"Google 中国的",timerSpeed:1},{name:"Ting-Ting Compact"},{name:"zh-CN",rate:.25},{name:"Fallback Chinese",lang:"zh-CN",fallbackvoice:!0},{name:"Alexandros Compact"},{name:"el-GR",rate:.25},{name:"Fallback Greek",lang:"el",fallbackvoice:!0},{name:"Fallback Swedish",lang:"sv",fallbackvoice:!0},{name:"hi-IN",rate:.25},{name:"Fallback Hindi",lang:"hi",fallbackvoice:!0}];e.iOS=/(iPad|iPhone|iPod)/g.test(navigator.userAgent);var l,o=[{name:"he-IL",voiceURI:"he-IL",lang:"he-IL"},{name:"th-TH",voiceURI:"th-TH",lang:"th-TH"},{name:"pt-BR",voiceURI:"pt-BR",lang:"pt-BR"},{name:"sk-SK",voiceURI:"sk-SK",lang:"sk-SK"},{name:"fr-CA",voiceURI:"fr-CA",lang:"fr-CA"},{name:"ro-RO",voiceURI:"ro-RO",lang:"ro-RO"},{name:"no-NO",voiceURI:"no-NO",lang:"no-NO"},{name:"fi-FI",voiceURI:"fi-FI",lang:"fi-FI"},{name:"pl-PL",voiceURI:"pl-PL",lang:"pl-PL"},{name:"de-DE",voiceURI:"de-DE",lang:"de-DE"},{name:"nl-NL",voiceURI:"nl-NL",lang:"nl-NL"},{name:"id-ID",voiceURI:"id-ID",lang:"id-ID"},{name:"tr-TR",voiceURI:"tr-TR",lang:"tr-TR"},{name:"it-IT",voiceURI:"it-IT",lang:"it-IT"},{name:"pt-PT",voiceURI:"pt-PT",lang:"pt-PT"},{name:"fr-FR",voiceURI:"fr-FR",lang:"fr-FR"},{name:"ru-RU",voiceURI:"ru-RU",lang:"ru-RU"},{name:"es-MX",voiceURI:"es-MX",lang:"es-MX"},{name:"zh-HK",voiceURI:"zh-HK",lang:"zh-HK"},{name:"sv-SE",voiceURI:"sv-SE",lang:"sv-SE"},{name:"hu-HU",voiceURI:"hu-HU",lang:"hu-HU"},{name:"zh-TW",voiceURI:"zh-TW",lang:"zh-TW"},{name:"es-ES",voiceURI:"es-ES",lang:"es-ES"},{name:"zh-CN",voiceURI:"zh-CN",lang:"zh-CN"},{name:"nl-BE",voiceURI:"nl-BE",lang:"nl-BE"},{name:"en-GB",voiceURI:"en-GB",lang:"en-GB"},{name:"ar-SA",voiceURI:"ar-SA",lang:"ar-SA"},{name:"ko-KR",voiceURI:"ko-KR",lang:"ko-KR"},{name:"cs-CZ",voiceURI:"cs-CZ",lang:"cs-CZ"},{name:"en-ZA",voiceURI:"en-ZA",lang:"en-ZA"},{name:"en-AU",voiceURI:"en-AU",lang:"en-AU"},{name:"da-DK",voiceURI:"da-DK",lang:"da-DK"},{name:"en-US",voiceURI:"en-US",lang:"en-US"},{name:"en-IE",voiceURI:"en-IE",lang:"en-IE"},{name:"hi-IN",voiceURI:"hi-IN",lang:"hi-IN"},{name:"el-GR",voiceURI:"el-GR",lang:"el-GR"},{name:"ja-JP",voiceURI:"ja-JP",lang:"ja-JP"}],c=0,i=!1;e.fallback_playing=!1,e.fallback_parts=null,e.fallback_part_index=0,e.fallback_audio=null,e.msgparameters=null,e.timeoutId=null,e.OnLoad_callbacks=[],"undefined"!=typeof speechSynthesis&&(speechSynthesis.onvoiceschanged=function(){l=window.speechSynthesis.getVoices(),null!=e.OnVoiceReady&&e.OnVoiceReady.call()}),e.default_rv=a[0],e.OnVoiceReady=null,e.init=function(){"undefined"==typeof speechSynthesis?(console.log("RV: Voice synthesis not supported"),e.enableFallbackMode()):setTimeout(function(){var a=setInterval(function(){var n=window.speechSynthesis.getVoices();0!=n.length||null!=l&&0!=l.length?(console.log("RV: Voice support ready"),e.systemVoicesReady(n),clearInterval(a)):++c>5&&(clearInterval(a),null!=window.speechSynthesis?e.iOS?(console.log("RV: Voice support ready (cached)"),e.systemVoicesReady(o)):(console.log("RV: speechSynthesis present but no system voices found"),e.enableFallbackMode()):e.enableFallbackMode())},100)},100),e.Dispatch("OnLoad")},e.systemVoicesReady=function(a){l=a,e.mapRVs(),null!=e.OnVoiceReady&&e.OnVoiceReady.call()},e.enableFallbackMode=function(){i=!0,console.log("RV: Enabling fallback mode"),e.mapRVs(),null!=e.OnVoiceReady&&e.OnVoiceReady.call()},e.getVoices=function(){for(var e=[],n=0;n<a.length;n++)e.push({name:a[n].name});return e},e.speak=function(a,n,l){e.msgparameters=l||{},e.msgtext=a,e.msgvoicename=n;var o,c=[];if(a.length>100){for(var t=a;t.length>100;){var s=t.search(/[:!?.;]+/),m="";if((-1==s||s>=100)&&(s=t.search(/[,]+/)),-1==s||s>=100)for(var r=t.split(" "),v=0;v<r.length&&!(m.length+r[v].length+1>100);v++)m+=(0!=v?" ":"")+r[v];else m=t.substr(0,s+1);t=t.substr(m.length,t.length-m.length),c.push(m)}t.length>0&&c.push(t)}else c.push(a);var g={};if(null!=(o=null==n?e.default_rv:e.getResponsiveVoice(n)).mappedProfile)g=o.mappedProfile;else if(g.systemvoice=e.getMatchedVoice(o),g.collectionvoice={},null==g.systemvoice)return void console.log("RV: ERROR: No voice found for: "+n);1==g.collectionvoice.fallbackvoice?(i=!0,e.fallback_parts=[]):i=!1,e.msgprofile=g;for(v=0;v<c.length;v++)if(i){var d="http://responsivevoice.org/responsivevoice/getvoice.php?t="+c[v]+"&tl="+g.collectionvoice.lang||g.systemvoice.lang||"en-US",u=document.createElement("AUDIO");u.src=d,u.playbackRate=1,u.preload="auto",u.volume=g.collectionvoice.volume||g.systemvoice.volume||1,e.fallback_parts.push(u)}else{var p=new SpeechSynthesisUtterance;p.voice=g.systemvoice,p.voiceURI=g.systemvoice.voiceURI,p.volume=g.collectionvoice.volume||g.systemvoice.volume||1,p.rate=g.collectionvoice.rate||g.systemvoice.rate||1,p.pitch=g.collectionvoice.pitch||g.systemvoice.pitch||1,p.text=c[v],p.lang=g.collectionvoice.lang||g.systemvoice.lang,p.rvIndex=v,p.rvTotal=c.length,0==v&&(p.onstart=e.speech_onstart),e.msgparameters.onendcalled=!1,null!=l?(v<c.length-1&&c.length>1?(p.onend=l.onchunkend,p.addEventListener("end",l.onchuckend)):(p.onend=e.speech_onend,p.addEventListener("end",e.speech_onend)),p.onerror=l.onerror||function(e){console.log("RV: Error"),console.log(e)},p.onpause=l.onpause,p.onresume=l.onresume,p.onmark=l.onmark,p.onboundary=l.onboundary):(p.onend=e.speech_onend,p.onerror=function(e){console.log("RV: Error"),console.log(e)}),speechSynthesis.speak(p)}i&&(e.fallback_part_index=0,e.fallback_startPart())},e.startTimeout=function(a,n){var l=e.msgprofile.collectionvoice.timerSpeed;null==e.msgprofile.collectionvoice.timerSpeed&&(l=1),l<=0||(e.timeoutId=setTimeout(n,1e3*l*(60/140)*a.split(/\s+/).length))},e.checkAndCancelTimeout=function(){null!=e.timeoutId&&(clearTimeout(e.timeoutId),e.timeoutId=null)},e.speech_timedout=function(){e.cancel(),e.speech_onend()},e.speech_onend=function(){e.checkAndCancelTimeout(),!0!==e.cancelled?null!=e.msgparameters&&null!=e.msgparameters.onend&&1!=e.msgparameters.onendcalled&&(e.msgparameters.onendcalled=!0,e.msgparameters.onend()):e.cancelled=!1},e.speech_onstart=function(){e.iOS&&e.startTimeout(e.msgtext,e.speech_timedout),e.msgparameters.onendcalled=!1,null!=e.msgparameters&&null!=e.msgparameters.onstart&&e.msgparameters.onstart()},e.fallback_startPart=function(){0==e.fallback_part_index&&e.speech_onstart(),e.fallback_audio=e.fallback_parts[e.fallback_part_index],null==e.fallback_audio?console.log("RV: Fallback Audio is not available"):(e.fallback_audio.play(),e.fallback_audio.addEventListener("ended",e.fallback_finishPart))},e.fallback_finishPart=function(a){e.checkAndCancelTimeout(),e.fallback_part_index<e.fallback_parts.length-1?(e.fallback_part_index++,e.fallback_startPart()):e.speech_onend()},e.cancel=function(){e.checkAndCancelTimeout(),i?null!=e.fallback_audio&&e.fallback_audio.pause():(e.cancelled=!0,speechSynthesis.cancel())},e.voiceSupport=function(){return"speechSynthesis"in window},e.OnFinishedPlaying=function(a){null!=e.msgparameters&&null!=e.msgparameters.onend&&e.msgparameters.onend()},e.setDefaultVoice=function(a){var n=e.getResponsiveVoice(a);null!=n&&(e.default_vr=n)},e.mapRVs=function(){for(var l=0;l<a.length;l++)for(var o=a[l],c=0;c<o.voiceIDs.length;c++){var i=n[o.voiceIDs[c]];if(1==i.fallbackvoice){o.mappedProfile={systemvoice:{},collectionvoice:i};break}var t=e.getSystemVoice(i.name);if(null!=t){o.mappedProfile={systemvoice:t,collectionvoice:i};break}}},e.getMatchedVoice=function(a){for(var l=0;l<a.voiceIDs.length;l++){var o=e.getSystemVoice(n[a.voiceIDs[l]].name);if(null!=o)return o}return null},e.getSystemVoice=function(e){if(void 0===l)return null;for(var a=0;a<l.length;a++)if(l[a].name==e)return l[a];return null},e.getResponsiveVoice=function(e){for(var n=0;n<a.length;n++)if(a[n].name==e)return a[n];return null},e.Dispatch=function(a){if(e.hasOwnProperty(a+"_callbacks")&&e[a+"_callbacks"].length>0)for(var n=e[a+"_callbacks"],l=0;l<n.length;l++)n[l]()},e.AddEventListener=function(a,n){e.hasOwnProperty(a+"_callbacks")?e[a+"_callbacks"].push(n):console.log("RV: Event listener not found: "+a)},"undefined"==typeof $?document.addEventListener("DOMContentLoaded",function(){e.init()}):$(document).ready(function(){e.init()})},responsiveVoice=new ResponsiveVoice;