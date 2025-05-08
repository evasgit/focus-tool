// ========================
// Focus Timer Script v1.9.3-video (整合按鈕收納版)
// ========================

// 已初始化變數與常數
let countdown;
let elapsedInterval;
let player;
let currentPlaylist = "";

const versionNumber = "v250508123423";
const DEBUG_MODE = false;

document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.getElementById("version");
    if (versionElement) {
        versionElement.textContent = versionNumber;
    }
});

const videoId = document.getElementById("playlistId")?.value || "";
const targetPlaylistUrl = "https://www.youtube.com/embed/" + videoId + "?enablejsapi=1";

const notificationSound = new Audio("notification.mp3");
notificationSound.volume = 1.0;

const TIMER_SETTINGS = {
    initialTime: 1200,
    initialTimeMin: 20,
    breakTime: 600
};

const state = {
    remainingTime: TIMER_SETTINGS.initialTime,
    elapsedSinceLastBreak: 0,
    goalHistory: {},
    lastGoal: "",
    hasRecordedHistory: false,
};

function clearCustomTime() {
    document.getElementById('goalText').value = '';
    document.getElementById('customTime').value = TIMER_SETTINGS.initialTimeMin;
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', { events: { 'onReady': () => { } } });
}

function updateVideo() {
    const videoId = document.getElementById("videoId").value.trim();
    const targetUrl = "https://www.youtube.com/embed/" + videoId + "?enablejsapi=1";
    document.getElementById("player").src = targetUrl;
}

// ...其餘 Timer, History, UI 類別略（見前方內容）

// 🎯 新版按鈕整合邏輯
document.getElementById("start20Btn").addEventListener("click", () => Timer.start20());
document.getElementById("actionSelect").addEventListener("change", function () {
    const isCustom = this.value === "custom";
    document.getElementById("customTime").style.display = isCustom ? "inline-block" : "none";
});
document.getElementById("actionRunBtn").addEventListener("click", () => {
    const action = document.getElementById("actionSelect").value;
    const customMinutes = parseInt(document.getElementById("customTime").value);

    switch (action) {
        case "custom":
            if (!isNaN(customMinutes) && customMinutes > 0) {
                Timer.start();
            } else {
                alert("請輸入有效的分鐘數");
            }
            break;
        case "pause":
            Timer.pause();
            break;
        case "break":
            Timer.startBreak();
            break;
        default:
            alert("請選擇一個動作");
    }
});

// ✅ 預設項目選擇時自動帶入時間並立即啟動
let goalInputTimer;
document.getElementById('goalText').addEventListener('input', function () {
    clearTimeout(goalInputTimer);
    goalInputTimer = setTimeout(() => {
        const goalText = this.value;
        const dataList = document.getElementById('goalOptions');
        const options = dataList.options;

        for (let i = 0; i < options.length; i++) {
            if (options[i].value === goalText) {
                const time = options[i].getAttribute('data-time');
                if (time) {
                    document.getElementById('customTime').value = time;
                    document.getElementById('actionSelect').value = 'custom';
                    document.getElementById('customTime').style.display = 'inline-block';
                    Timer.start();
                }
                break;
            }
        }
    }, 200);
});

// 手動更新播放清單
function updatePlaylist() {
    const playlistId = document.getElementById("playlistId").value;
    const iframe = document.getElementById("player");
    iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1`;
}

// 載入 YouTube API
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);
