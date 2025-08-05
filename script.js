// ========================
// Focus Timer Script v1.9.4 (最佳化整合版)
// ========================

// ✅ 全域變數與設定
let countdown;
let elapsedInterval;
let player;
let currentPlaylist = "";

// ✅ 音效初始化與鈴聲狀態
let notificationSound = new Audio("data/notification.mp3");
let isRinging = false;

const versionNumber = "v250805100214";
const DEBUG_MODE = false;

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

// ✅ DOM 載入後初始化
document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.getElementById("version");
    if (versionElement) versionElement.textContent = versionNumber;

    // 綁定按鈕與選單事件
    const breakBtn = document.getElementById('breakBtn');
    breakBtn.addEventListener('click', () => {
        const min = parseInt(breakBtn.dataset.min, 10) || 10;
        Timer.startBreak(min);
    });
    document.getElementById("pause").addEventListener("click", () => Timer.pause());
    document.getElementById("start20Btn").addEventListener("click", () => Timer.start20());
    document.getElementById("startBtn").addEventListener("click", () => Timer.start());
    document.getElementById("startBtnMute").addEventListener("click", () => Timer.startAndMute());
    document.getElementById("MuteBtn").addEventListener("click", () => player.pauseVideo());
    document.getElementById("meetBtn").addEventListener("click", () => Timer.startMeet());
    // const actionSelect = document.getElementById("actionSelect");
    // if (actionSelect) {
    //     actionSelect.addEventListener("change", function () {
    //         const isCustom = this.value === "custom";
    //         document.getElementById("customTime").style.display = isCustom ? "inline-block" : "none";
    //     });
    // }
    // document.getElementById("actionRunBtn").addEventListener("click", () => {
    //     const action = document.getElementById("actionSelect").value;
    //     const customMinutes = parseInt(document.getElementById("customTime").value);
    //     switch (action) {
    //         case "custom":
    //             if (!isNaN(customMinutes) && customMinutes > 0) Timer.start();
    //             else alert("請輸入有效的分鐘數");
    //             break;
    //         case "pause":
    //             Timer.pause();
    //             break;
    //         case "break":
    //             Timer.startBreak();
    //             break;
    //         default:
    //             alert("請選擇一個動作");
    //     }
    // });

    document.getElementById('goalText').addEventListener('input', function () {
        clearTimeout(goalInputTimer);
        goalInputTimer = setTimeout(() => {
            const goalText = this.value;
            console.log("Input changed:", goalText);
            const options = document.getElementById('goalOptions').options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === goalText) {
                    const time = options[i].getAttribute('data-time');
                    console.log("Found matching option with time:", time);
                    if (time) {
                        document.getElementById('customTime').value = time;
                        // document.getElementById('actionSelect').value = 'custom';
                        document.getElementById('customTime').style.display = 'inline-block';
                        Timer.start();
                    }
                    break;
                }
            }
        }, 200);
    });
});

let goalInputTimer;

function clearCustomTime() {
    document.getElementById('goalText').value = '';
    document.getElementById('customTime').value = TIMER_SETTINGS.initialTimeMin;
}

function updateTimerDisplay(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    document.getElementById('timerDisplay').textContent = `⏳ ${min} 分 ${sec} 秒`;
}

function playNotification() {
    if (!isRinging) {
        isRinging = true;
        try {
            notificationSound.loop = true;        // ✅ 開啟循環
            notificationSound.currentTime = 0;    // 從頭開始
            notificationSound.play();
        } catch (e) {
            if (DEBUG_MODE) console.error("🔇 無法播放結束鈴聲", e);
        }
    }
}

function stopNotification() {
    if (isRinging) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        notificationSound.loop = false;
        isRinging = false;
    }
}

function showTodoList() {
    document.getElementById('todoList').style.display = 'block';
}

function addGoalHistory(goalText) {
    const durationSec = state.lastDurationSec || 0;
    const key = goalText.trim();
    const now = new Date();

    if (!state.goalHistory[key]) {
        state.goalHistory[key] = {
            totalSeconds: 0,
            lastUpdate: null,
        };
    }

    state.goalHistory[key].totalSeconds += durationSec;
    state.goalHistory[key].lastUpdate = now;

    const total = state.goalHistory[key].totalSeconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const hhmm = now.toTimeString().slice(0, 5);

    const displayText = `🎯 ${key} 累計 ${hours} 小時 ${minutes} 分（上次更新 ${hhmm}）`;

    const ul = document.getElementById('goalHistory');
    const existingItems = ul.getElementsByTagName('li');
    let updated = false;

    for (let li of existingItems) {
        if (li.dataset.goal === key) {
            li.textContent = displayText;
            updated = true;
            break;
        }
    }

    if (!updated) {
        const li = document.createElement('li');
        li.textContent = displayText;
        li.dataset.goal = key;

        // 讓歷史項目可點選
        li.style.cursor = 'pointer';
        li.title = '點選以設為當前目標';
        li.addEventListener('click', () => {
            document.getElementById('goalText').value = key;
        });

        ul.insertBefore(li, ul.firstChild);
    }

    state.hasRecordedHistory = true;
}


// ✅ Timer 物件整合

const Timer = {
    start20() {
        document.getElementById('customTime').value = TIMER_SETTINGS.initialTimeMin;
        state.remainingTime = TIMER_SETTINGS.initialTime;
        this.start();
    },
    startMeet() {
        const meetTime = document.getElementById('meetBtn').dataset.min;
        document.getElementById('customTime').value = meetTime;
        document.getElementById('goalText').value = "會議/討論";
        this.start();
        player.pauseVideo();
    },
    startAndMute() {
        this.start();
        player.pauseVideo();
    },
    start() {

        if (state.remainingTime > 0 && state.lastGoal) {
            console.info(state.lastCustomTimeValue, state.remainingTime, state.lastDurationSec);
            state.lastDurationSec = state.lastDurationSec - state.remainingTime;
            addGoalHistory(state.lastGoal);
        }

        // 🛑 停止提示音
        stopNotification();  // ⛔ 停止任何重複播放狀態
        // ▶️ 播放一次（不重複）
        try {
            notificationSound.loop = false;
            notificationSound.currentTime = 0;
            notificationSound.play();
        } catch (e) {
            if (DEBUG_MODE) console.error("🔇 無法播放啟動提示音", e);
        }
        clearInterval(countdown);
        const goalText = document.getElementById('goalText').value || '未命名目標';
        state.lastGoal = goalText;
        state.hasRecordedHistory = false;
        state.startedAt = Date.now();

        const customTimeValue = document.getElementById('customTime').value;
        const totalSeconds = parseInt(customTimeValue) * 60;
        state.remainingTime = isNaN(totalSeconds) ? TIMER_SETTINGS.initialTime : totalSeconds;
        state.lastCustomTimeValue = customTimeValue;  // ✅ 紀錄自訂時間值
        state.lastDurationSec = state.remainingTime;  // ✅ 新增這行

        updateTimerDisplay(state.remainingTime);


        // ✅ 播放影片 + 背景切換
        if (typeof player?.playVideo === 'function') player.playVideo();
        setBodyBackground("normal");

        countdown = setInterval(() => {
            if (state.remainingTime > 0) {
                state.remainingTime--;
                state.elapsedSinceLastBreak++;
                updateTimerDisplay(state.remainingTime);
            } else {
                player.pauseVideo();
                playNotification();  // 🔁 重複播放音效
                if (!state.hasRecordedHistory) {
                    addGoalHistory(goalText);
                    state.hasRecordedHistory = true;
                }
                setBodyBackground("alert");  // ⏰ 計時結束後閃爍
            }
        }, 1000);

    },
    pause() {
        clearInterval(countdown);
        setBodyBackground("normal");
        if (typeof player?.pauseVideo === 'function') player.pauseVideo();
    },
    startBreak(min = 10) {
        clearInterval(countdown);
        state.remainingTime = min * 60;
        state.elapsedSinceLastBreak = 0;
        document.getElementById('customTime').value = min;
        document.getElementById('goalText').value = "💤 休息：喝水、廁所、看訊息、紀錄進度";
        setBodyBackground("break");
        this.start();
    }
};

// ✅ YouTube 嵌入與控制
function updateVideo() {
    const videoId = document.getElementById("videoId").value.trim();
    document.getElementById("player").src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
}

function updatePlaylist() {
    const playlistId = document.getElementById("playlistId").value;
    document.getElementById("player").src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1`;
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', { events: { 'onReady': () => { } } });
}

let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);

function setBodyBackground(mode) {
    const body = document.body;
    body.classList.remove("background-normal", "background-break", "background-alert");

    switch (mode) {
        case "normal":
            body.classList.add("background-normal");
            break;
        case "break":
            body.classList.add("background-break");
            break;
        case "alert":
            body.classList.add("background-alert");
            break;
    }
}
