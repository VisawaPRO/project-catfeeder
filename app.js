/* ==========================================
   Cat Feeder Dashboard
   app.js
   Part 1A / 8
==========================================*/

const MQTT_HOST = "ws://192.168.1.10:9001";

const MQTT_OPTIONS = {

    clean:true,

    connectTimeout:4000,

    clientId:
    "CatWeb_"+
    Math.random().toString(16).substr(2,8)

};

const TOPIC_STATUS="cat/status";
const TOPIC_FEED="cat/feed";
const TOPIC_WATER="cat/water";
const TOPIC_MODE="cat/mode";
const TOPIC_CAMERA="cat/camera";
const TOPIC_SCHEDULE="cat/schedule";

let client;

let autoMode=false;

let schedules=[];

let waterLevel=0;

let motorStatus="OFF";

let mqttConnected=false;

let cameraOnline=false;

/* ==========================================
DOM
==========================================*/

const feedBtn=document.getElementById("feedBtn");

const waterText=document.getElementById("waterText");

const waterFill=document.getElementById("waterFill");

const modeSwitch=document.getElementById("modeSwitch");

const camera=document.getElementById("camera");

const mqttStatus=document.getElementById("mqttStatus");

const wifiStatus=document.getElementById("wifiStatus");

const espStatus=document.getElementById("espStatus");

const clock=document.getElementById("clock");

const logBox=document.getElementById("logBox");

const toast=document.getElementById("toast");

/* ==========================================
Clock
==========================================*/

setInterval(()=>{

let now=new Date();

clock.innerHTML=

now.toLocaleDateString()

+" "

+

now.toLocaleTimeString();

},1000);

/* ==========================================
Toast
==========================================*/

function showToast(text){

toast.innerHTML=text;

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

/* ==========================================
Activity Log
==========================================*/

function addLog(msg){

let item=document.createElement("div");

item.className="log-item fade";

item.innerHTML=

new Date().toLocaleTimeString()

+

" - "

+

msg;

logBox.prepend(item);

}

/* ==========================================
MQTT
==========================================*/

function connectMQTT(){

client=mqtt.connect(

MQTT_HOST,

MQTT_OPTIONS

);

client.on("connect",()=>{

mqttConnected=true;

mqttStatus.innerHTML="Connected";

showToast("MQTT Connected");

addLog("MQTT Connected");

client.subscribe(TOPIC_STATUS);

client.subscribe(TOPIC_WATER);

client.subscribe(TOPIC_MODE);

client.subscribe(TOPIC_CAMERA);

client.subscribe(TOPIC_SCHEDULE);

});

client.on("reconnect",()=>{

mqttStatus.innerHTML="Reconnecting";

});

client.on("offline",()=>{

mqttStatus.innerHTML="Offline";

});

client.on("error",(err)=>{

console.log(err);

});

client.on(

"message",

receiveMessage

);

}

connectMQTT();

/* ==========================================
Feed
==========================================*/

feedBtn.onclick=()=>{

client.publish(

TOPIC_FEED,

"1"

);

showToast(

"Feed Command Sent"

);

addLog(

"Manual Feed"

);

};

/* ==========================================
Camera
==========================================*/

function updateCamera(url){

camera.src=url+

"?t="+

Date.now();

cameraOnline=true;

}

/* ==========================================
Status
==========================================*/

function setESP(state){

espStatus.innerHTML=state;

}

function setWifi(state){

wifiStatus.innerHTML=state;

}

function setMQTT(state){

mqttStatus.innerHTML=state;

}

/* ==========================================
   app.js
   Part 1B / 8
==========================================*/

/* ==========================================
Receive MQTT Message
==========================================*/

function receiveMessage(topic, message) {

    let payload = message.toString();

    console.log(topic + " => " + payload);

    switch (topic) {

        case TOPIC_STATUS:

            updateStatus(payload);

            break;

        case TOPIC_WATER:

            updateWater(payload);

            break;

        case TOPIC_MODE:

            updateMode(payload);

            break;

        case TOPIC_CAMERA:

            updateCamera(payload);

            break;

        case TOPIC_SCHEDULE:

            loadSchedule(payload);

            break;
    }

}

/* ==========================================
Water
==========================================*/

function updateWater(level) {

    waterLevel = Number(level);

    if (waterLevel < 0)
        waterLevel = 0;

    if (waterLevel > 100)
        waterLevel = 100;

    waterText.innerHTML = waterLevel + "%";

    waterFill.style.width = waterLevel + "%";

    if (waterLevel >= 70) {

        waterFill.style.background =
            "linear-gradient(90deg,#22c55e,#16a34a)";

    }

    else if (waterLevel >= 30) {

        waterFill.style.background =
            "linear-gradient(90deg,#f59e0b,#fb923c)";

    }

    else {

        waterFill.style.background =
            "linear-gradient(90deg,#ef4444,#dc2626)";

        showToast("Water Level Low");

    }

}

/* ==========================================
Status
==========================================*/

function updateStatus(data) {

    let status = {};

    try {

        status = JSON.parse(data);

    }

    catch (e) {

        console.log(e);

        return;

    }

    if (status.wifi) {

        wifiStatus.innerHTML = "WiFi Connected";

    }

    else {

        wifiStatus.innerHTML = "WiFi Lost";

    }

    if (status.esp) {

        espStatus.innerHTML = "ESP32 Online";

    }

    else {

        espStatus.innerHTML = "Offline";

    }

    if (status.motor) {

        motorStatus = status.motor;

    }

    let motor = document.getElementById("motorStatus");

    if (motor) {

        motor.innerHTML = motorStatus;

    }

}

/* ==========================================
Mode
==========================================*/

function updateMode(mode) {

    autoMode = mode === "AUTO";

    modeSwitch.checked = autoMode;

    let text = document.getElementById("modeText");

    if (text) {

        text.innerHTML = autoMode
            ? "Automatic"
            : "Manual";

    }

    addLog("Mode : " + mode);

}

/* ==========================================
Switch
==========================================*/

modeSwitch.addEventListener(

    "change",

    function () {

        autoMode = this.checked;

        let value = autoMode
            ? "AUTO"
            : "MANUAL";

        client.publish(

            TOPIC_MODE,

            value

        );

        showToast(

            "Mode : " + value

        );

        addLog(

            "Mode Changed : " + value

        );

    }

);

/* ==========================================
Heartbeat
==========================================*/

setInterval(() => {

    if (!client)
        return;

    if (!client.connected)
        return;

    client.publish(

        "cat/ping",

        "ping"

    );

}, 5000);

/* ==========================================
Connection Monitor
==========================================*/

setInterval(() => {

    if (client && client.connected) {

        mqttStatus.innerHTML = "Connected";

    }

    else {

        mqttStatus.innerHTML = "Disconnected";

    }

}, 1000);

/* ==========================================
   app.js
   Part 2A / 8
==========================================*/

const scheduleList = document.getElementById("scheduleList");
const addTimeBtn = document.getElementById("addTimeBtn");
const timeInput = document.getElementById("timeInput");

/* ==========================================
Create Schedule Card
==========================================*/

function createScheduleItem(time) {

    const item = document.createElement("div");
    item.className = "schedule-item fade";

    const label = document.createElement("div");
    label.className = "schedule-time";
    label.innerHTML = time;

    const del = document.createElement("button");
    del.className = "schedule-delete";
    del.innerHTML = '<i class="fa-solid fa-trash"></i>';

    del.onclick = function () {

        deleteSchedule(time);

    };

    item.appendChild(label);
    item.appendChild(del);

    return item;

}

/* ==========================================
Render Schedule
==========================================*/

function renderSchedule() {

    scheduleList.innerHTML = "";

    schedules.sort();

    schedules.forEach(function (time) {

        scheduleList.appendChild(

            createScheduleItem(time)

        );

    });

}

/* ==========================================
Check Duplicate
==========================================*/

function hasSchedule(time) {

    return schedules.includes(time);

}

/* ==========================================
Add Schedule
==========================================*/

function addSchedule() {

    const value = timeInput.value;

    if (value === "") {

        showToast("Please select time");

        return;

    }

    if (hasSchedule(value)) {

        showToast("Time already exists");

        return;

    }

    schedules.push(value);

    schedules.sort();

    renderSchedule();

    saveSchedule();

    showToast("Schedule Added");

    addLog("Add Schedule : " + value);

    timeInput.value = "";

}

/* ==========================================
Delete Schedule
==========================================*/

function deleteSchedule(time) {

    schedules = schedules.filter(

        t => t !== time

    );

    renderSchedule();

    saveSchedule();

    showToast("Schedule Deleted");

    addLog("Delete Schedule : " + time);

}

/* ==========================================
Button Event
==========================================*/

addTimeBtn.addEventListener(

    "click",

    addSchedule

);

/* ==========================================
Publish Schedule
==========================================*/

function saveSchedule() {

    const payload = JSON.stringify({

        list: schedules

    });

    if (client && client.connected) {

        client.publish(

            TOPIC_SCHEDULE,

            payload

        );

    }

    localStorage.setItem(

        "catSchedule",

        payload

    );

}

/* ==========================================
Load Local Storage
==========================================*/

function loadLocalSchedule() {

    const data = localStorage.getItem(

        "catSchedule"

    );

    if (!data)
        return;

    try {

        const json = JSON.parse(data);

        schedules = json.list || [];

        renderSchedule();

    }

    catch (e) {

        console.log(e);

    }

}

loadLocalSchedule();

/* ==========================================
   app.js
   Part 2B / 8
==========================================*/

/* ==========================================
Load Schedule From MQTT
==========================================*/

function loadSchedule(payload){

    try{

        const json=JSON.parse(payload);

        schedules=[];

        if(Array.isArray(json.list)){

            json.list.forEach(function(time){

                if(validateTime(time)){

                    schedules.push(time);

                }

            });

        }

        schedules.sort();

        renderSchedule();

        localStorage.setItem(

            "catSchedule",

            JSON.stringify({

                list:schedules

            })

        );

        updateNextFeed();

        addLog("Schedule Synced");

    }

    catch(e){

        console.log(e);

    }

}

/* ==========================================
Validate Time
==========================================*/

function validateTime(time){

    const regex=/^([01]\d|2[0-3]):([0-5]\d)$/;

    return regex.test(time);

}

/* ==========================================
Edit Schedule
==========================================*/

function editSchedule(oldTime,newTime){

    if(!validateTime(newTime)){

        showToast("Invalid Time");

        return;

    }

    let index=schedules.indexOf(oldTime);

    if(index<0)return;

    schedules[index]=newTime;

    schedules.sort();

    renderSchedule();

    saveSchedule();

    updateNextFeed();

    addLog(

        "Edit : "+oldTime+" -> "+newTime

    );

}

/* ==========================================
Clear All Schedule
==========================================*/

function clearSchedule(){

    schedules=[];

    renderSchedule();

    saveSchedule();

    updateNextFeed();

    showToast("All Schedule Removed");

    addLog("Clear Schedule");

}

/* ==========================================
Next Feed
==========================================*/

function updateNextFeed(){

    let label=document.getElementById("nextFeed");

    if(!label)return;

    if(schedules.length===0){

        label.innerHTML="--:--";

        return;

    }

    let now=new Date();

    let current=

    now.getHours()*60+

    now.getMinutes();

    let next=null;

    schedules.forEach(function(time){

        let h=parseInt(time.split(":")[0]);

        let m=parseInt(time.split(":")[1]);

        let total=h*60+m;

        if(total>=current){

            if(next===null||total<next){

                next=total;

            }

        }

    });

    if(next===null){

        let h=parseInt(

            schedules[0].split(":")[0]

        );

        let m=parseInt(

            schedules[0].split(":")[1]

        );

        next=h*60+m;

    }

    let hh=Math.floor(next/60)
        .toString()
        .padStart(2,"0");

    let mm=(next%60)
        .toString()
        .padStart(2,"0");

    label.innerHTML=

    hh+":"+mm;

}

/* ==========================================
Refresh Every Minute
==========================================*/

setInterval(function(){

    updateNextFeed();

},60000);

/* ==========================================
Double Click Edit
==========================================*/

scheduleList.addEventListener(

"dblclick",

function(e){

    const item=e.target.closest(".schedule-item");

    if(!item)return;

    const oldTime=

    item.querySelector(

        ".schedule-time"

    ).innerHTML;

    let newTime=

    prompt(

        "Edit Time",

        oldTime

    );

    if(newTime===null)return;

    editSchedule(

        oldTime,

        newTime

    );

}

);

/* ==========================================
Clear Button
==========================================*/

const clearBtn=

document.getElementById(

"clearSchedule"

);

if(clearBtn){

clearBtn.onclick=function(){

if(confirm(

"Delete all schedules?"

)){

clearSchedule();

}

};

}

updateNextFeed();


/* ==========================================
   app.js
   Part 3A / 8
==========================================*/

/* ==========================================
Dashboard Elements
==========================================*/

const motorLabel = document.getElementById("motorStatus");
const uptimeLabel = document.getElementById("uptime");
const rssiLabel = document.getElementById("wifiRSSI");
const ipLabel = document.getElementById("ipAddress");
const ramLabel = document.getElementById("freeRam");

/* ==========================================
Camera Refresh
==========================================*/

let cameraURL = "";

function setCameraURL(url) {

    cameraURL = url;

    refreshCamera();

}

function refreshCamera() {

    if (cameraURL === "")
        return;

    camera.src = cameraURL + "?t=" + Date.now();

}

setInterval(refreshCamera, 1000);

/* ==========================================
Motor Status
==========================================*/

function updateMotor(status) {

    motorStatus = status;

    if (motorLabel) {

        motorLabel.innerHTML = status;

        if (status === "RUN") {

            motorLabel.style.color = "#22c55e";

        } else {

            motorLabel.style.color = "#ef4444";

        }

    }

}

/* ==========================================
System Information
==========================================*/

function updateSystem(info) {

    try {

        let json = JSON.parse(info);

        if (uptimeLabel)
            uptimeLabel.innerHTML = json.uptime || "--";

        if (rssiLabel)
            rssiLabel.innerHTML = (json.rssi ?? "--") + " dBm";

        if (ipLabel)
            ipLabel.innerHTML = json.ip || "--";

        if (ramLabel)
            ramLabel.innerHTML = (json.ram ?? "--") + " KB";

        if (json.motor)
            updateMotor(json.motor);

        if (typeof json.water !== "undefined")
            updateWater(json.water);

        if (typeof json.camera === "string")
            setCameraURL(json.camera);

    } catch (e) {

        console.log(e);

    }

}

/* ==========================================
Water Alarm
==========================================*/

let lowWaterAlarm = false;

function checkWaterAlarm() {

    if (waterLevel <= 20) {

        if (!lowWaterAlarm) {

            lowWaterAlarm = true;

            showToast("⚠ Water level is low");

            addLog("Warning : Low Water");

        }

    } else {

        lowWaterAlarm = false;

    }

}

setInterval(checkWaterAlarm, 5000);

/* ==========================================
ESP Heartbeat
==========================================*/

let lastHeartbeat = Date.now();

function heartbeat() {

    lastHeartbeat = Date.now();

    setESP("Online");

}

setInterval(function () {

    if (Date.now() - lastHeartbeat > 15000) {

        setESP("Offline");

    }

}, 3000);

/* ==========================================
MQTT Telemetry
==========================================*/

const TOPIC_SYSTEM = "cat/system";
const TOPIC_HEARTBEAT = "cat/heartbeat";

if (client) {

    client.subscribe(TOPIC_SYSTEM);
    client.subscribe(TOPIC_HEARTBEAT);

}

const oldReceive = receiveMessage;

receiveMessage = function (topic, message) {

    oldReceive(topic, message);

    const payload = message.toString();

    switch (topic) {

        case TOPIC_SYSTEM:

            updateSystem(payload);

            break;

        case TOPIC_HEARTBEAT:

            heartbeat();

            break;

    }

};

/* ==========================================
   app.js
   Part 3B / 8
==========================================*/

/* ==========================================
Activity Log
==========================================*/

let activityLog = [];

function addLog(text) {

    const time = new Date().toLocaleTimeString();

    activityLog.unshift({

        time: time,

        text: text

    });

    if (activityLog.length > 100) {

        activityLog.pop();

    }

    renderLog();

    localStorage.setItem(

        "catLog",

        JSON.stringify(activityLog)

    );

}

function renderLog() {

    const box = document.getElementById("activityLog");

    if (!box) return;

    box.innerHTML = "";

    activityLog.forEach(function(item) {

        const div = document.createElement("div");

        div.className = "log-item";

        div.innerHTML =

            "<span>" +

            item.time +

            "</span> - " +

            item.text;

        box.appendChild(div);

    });

}

/* ==========================================
Load Log
==========================================*/

(function() {

    let save = localStorage.getItem("catLog");

    if (save) {

        activityLog = JSON.parse(save);

        renderLog();

    }

})();

/* ==========================================
Notification Queue
==========================================*/

let notifyQueue = [];

function pushNotification(msg) {

    notifyQueue.push(msg);

    processNotify();

}

let notifyBusy = false;

function processNotify() {

    if (notifyBusy) return;

    if (notifyQueue.length === 0) return;

    notifyBusy = true;

    let msg = notifyQueue.shift();

    showToast(msg);

    setTimeout(function() {

        notifyBusy = false;

        processNotify();

    }, 2500);

}

/* ==========================================
Feed Counter
==========================================*/

let feedToday = 0;

function increaseFeedCount() {

    feedToday++;

    updateFeedCounter();

    localStorage.setItem(

        "feedToday",

        feedToday

    );

}

function updateFeedCounter() {

    let obj = document.getElementById("feedCount");

    if (!obj) return;

    obj.innerHTML = feedToday;

}

/* ==========================================
Last Feed Time
==========================================*/

function updateLastFeed() {

    let now = new Date();

    let text =

        now.getHours()

        .toString()

        .padStart(2, "0")

        +

        ":"

        +

        now.getMinutes()

        .toString()

        .padStart(2, "0");

    let obj = document.getElementById("lastFeed");

    if (obj)

        obj.innerHTML = text;

    localStorage.setItem(

        "lastFeed",

        text

    );

}

/* ==========================================
Load Statistics
==========================================*/

(function() {

    feedToday = parseInt(

        localStorage.getItem(

            "feedToday"

        ) || "0"

    );

    updateFeedCounter();

    const last =

        localStorage.getItem(

            "lastFeed"

        );

    if (last) {

        let obj =

        document.getElementById(

            "lastFeed"

        );

        if (obj)

            obj.innerHTML = last;

    }

})();

/* ==========================================
Water History
==========================================*/

let waterHistory = [];

function addWaterHistory(level) {

    waterHistory.push(level);

    if (waterHistory.length > 40)

        waterHistory.shift();

    drawWaterGraph();

}

/* ==========================================
Canvas Graph
==========================================*/

function drawWaterGraph() {

    const canvas =

        document.getElementById(

            "waterGraph"

        );

    if (!canvas) return;

    const ctx =

        canvas.getContext("2d");

    ctx.clearRect(

        0,

        0,

        canvas.width,

        canvas.height

    );

    if (waterHistory.length < 2)

        return;

    const step =

        canvas.width /

        (waterHistory.length - 1);

    ctx.beginPath();

    waterHistory.forEach(function(v, i) {

        let x = i * step;

        let y =

            canvas.height -

            (v / 100) *

            canvas.height;

        if (i == 0)

            ctx.moveTo(x, y);

        else

            ctx.lineTo(x, y);

    });

    ctx.lineWidth = 2;

    ctx.strokeStyle = "#2196F3";

    ctx.stroke();

}

/* ==========================================
Hook Water Update
==========================================*/

const oldWater = updateWater;

updateWater = function(level) {

    oldWater(level);

    addWaterHistory(level);

};


/* ==========================================
   app.js
   Part 4A / 8
==========================================*/

/* ==========================================
Dark Mode
==========================================*/

let darkMode = localStorage.getItem("darkMode") === "true";

function applyTheme() {

    if (darkMode) {

        document.body.classList.add("dark");

    } else {

        document.body.classList.remove("dark");

    }

}

applyTheme();

const themeBtn = document.getElementById("themeButton");

if (themeBtn) {

    themeBtn.onclick = function () {

        darkMode = !darkMode;

        localStorage.setItem("darkMode", darkMode);

        applyTheme();

    };

}

/* ==========================================
Export Activity Log
==========================================*/

function exportLog() {

    const blob = new Blob(

        [

            JSON.stringify(

                activityLog,

                null,

                2

            )

        ],

        {

            type: "application/json"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "cat_log.json";

    a.click();

    URL.revokeObjectURL(url);

}

const exportBtn =

document.getElementById(

"exportLog"

);

if(exportBtn){

exportBtn.onclick=exportLog;

}

/* ==========================================
Import Schedule
==========================================*/

const importFile =

document.getElementById(

"importSchedule"

);

if(importFile){

importFile.onchange=function(e){

const file=e.target.files[0];

if(!file)return;

const reader=new FileReader();

reader.onload=function(){

try{

const json=

JSON.parse(reader.result);

if(json.list){

schedules=json.list;

renderSchedule();

saveSchedule();

updateNextFeed();

showToast("Schedule Imported");

}

}catch(err){

showToast("Import Error");

}

};

reader.readAsText(file);

};

}

/* ==========================================
MQTT Auto Reconnect
==========================================*/

let reconnectTimer=null;

function reconnectMQTT(){

if(client&&client.connected)

return;

if(reconnectTimer)

return;

reconnectTimer=setInterval(function(){

if(client.connected){

clearInterval(

reconnectTimer

);

reconnectTimer=null;

return;

}

try{

client.reconnect();

}catch(e){

console.log(e);

}

},5000);

}

/* ==========================================
Connection Events
==========================================*/

client.onConnectionLost=function(){

setMQTT("Offline");

reconnectMQTT();

};

client.onConnected=function(){

setMQTT("Online");

showToast("MQTT Connected");

if(reconnectTimer){

clearInterval(reconnectTimer);

reconnectTimer=null;

}

};

/* ==========================================
Browser Online Status
==========================================*/

function updateNetwork(){

const obj=

document.getElementById(

"networkStatus"

);

if(!obj)return;

if(navigator.onLine){

obj.innerHTML="Online";

obj.style.color="#22c55e";

}else{

obj.innerHTML="Offline";

obj.style.color="#ef4444";

}

}

window.addEventListener(

"online",

updateNetwork

);

window.addEventListener(

"offline",

updateNetwork

);

updateNetwork();

/* ==========================================
Settings
==========================================*/

let settings={

cameraRefresh:1000,

autoRefresh:true,

graphEnable:true

};

const saveSetting=function(){

localStorage.setItem(

"settings",

JSON.stringify(settings)

);

};

(function(){

const tmp=

localStorage.getItem(

"settings"

);

if(tmp){

settings=

JSON.parse(tmp);

}

})();

/* ==========================================
Apply Camera Refresh
==========================================*/

setInterval(function(){

if(settings.autoRefresh){

refreshCamera();

}

},settings.cameraRefresh);

/* ==========================================
Reset Settings
==========================================*/

function resetSetting(){

settings={

cameraRefresh:1000,

autoRefresh:true,

graphEnable:true

};

saveSetting();

showToast(

"Settings Reset"

);

}

/* ==========================================
   app.js
   Part 4B / 8 (FINAL)
==========================================*/

/* ==========================================
APP INIT
==========================================*/

window.onload = function () {

    console.log("Cat Feeder Starting...");

    loadLocalSchedule();

    updateFeedCounter();

    updateNetwork();

    applyTheme();

    connectMQTT();

    showToast("System Booting...");

    addLog("System Started");

    initMQTTSubscriptions();

};

/* ==========================================
MQTT Subscribe All Topics
==========================================*/

function initMQTTSubscriptions() {

    if (!client) return;

    const topics = [

        TOPIC_STATUS,
        TOPIC_WATER,
        TOPIC_MODE,
        TOPIC_CAMERA,
        TOPIC_SCHEDULE,
        "cat/system",
        "cat/heartbeat"

    ];

    topics.forEach(t => {

        client.subscribe(t);

    });

    addLog("MQTT Subscribed");

}

/* ==========================================
LOAD SAVED DATA
==========================================*/

(function loadAllData() {

    try {

        const log = localStorage.getItem("catLog");

        if (log) {

            activityLog = JSON.parse(log);

            renderLog();

        }

        const feed = localStorage.getItem("feedToday");

        if (feed) {

            feedToday = parseInt(feed);

            updateFeedCounter();

        }

        const last = localStorage.getItem("lastFeed");

        if (last) {

            const el = document.getElementById("lastFeed");

            if (el) el.innerHTML = last;

        }

        const sched = localStorage.getItem("catSchedule");

        if (sched) {

            schedules = JSON.parse(sched).list || [];

            renderSchedule();

            updateNextFeed();

        }

    } catch (e) {

        console.log(e);

    }

})();

/* ==========================================
CLEANUP BEFORE EXIT
==========================================*/

window.onbeforeunload = function () {

    if (client) {

        try {

            client.disconnect();

        } catch (e) {}

    }

};

/* ==========================================
SAFE PUBLISH WRAPPER
==========================================*/

function safePublish(topic, msg) {

    if (!client || !client.connected) {

        showToast("MQTT Disconnected");

        return;

    }

    client.publish(topic, msg);

}

/* ==========================================
FEED SAFE OVERRIDE
==========================================*/

const oldFeed = feedBtn.onclick;

feedBtn.onclick = function () {

    safePublish(TOPIC_FEED, "1");

    showToast("Feeding Started");

    addLog("Manual Feed Triggered");

    increaseFeedCount();

    updateLastFeed();

};

/* ==========================================
FINAL HEARTBEAT
==========================================*/

setInterval(function () {

    safePublish("cat/ping", "ping");

}, 10000);

/* ==========================================
DEBUG INFO
==========================================*/

console.log("Cat Feeder Dashboard Ready");

console.log("MQTT Host:", MQTT_HOST);

console.log("Auto Mode:", autoMode);

console.log("Schedules:", schedules.length);