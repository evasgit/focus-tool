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

const versionNumber = "v250805112439";
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

    // 綁定按鈕
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

    // 輸入框監聽
    document.getElementById('goalText').addEventListener('input', function () {
        clearTimeout(goalInputTimer);
        goalInputTimer = setTimeout(() => {
            const goalText = this.value;
            const options = document.getElementById('goalOptions')?.options || [];
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === goalText) {
                    const time = options[i].getAttribute('data-time');
                    if (time) {
                        document.getElementById('customTime').value = time;
                        Timer.start();
                    }
                    break;
                }
            }
        }, 200);
    });

    // 初始化預設項目到 #goalHistory（以歷史格式顯示）
    const historyUl = document.getElementById('goalHistory');
    const presets = [
        { value: "💤 休息：喝水、廁所、看訊息、紀錄進度", time: 10, finishCurrent: true, start: true, pauseMedia: false },
        { value: "🍚 午餐吃完要清潔丟廚餘", time: 30, finishCurrent: true, start: true, pauseMedia: false },
        { value: "☕ 咖啡+早餐+吃藥", time: 20, finishCurrent: true, start: true, pauseMedia: false },
        { value: "🫡 早會", time: 30, finishCurrent: true, start: true, pauseMedia: true },
        { value: "🌞 CP+F5: 開今天(mention)、查看通知、查看例行、整理項目", time: 20, finishCurrent: true, start: true, pauseMedia: false },
        { value: "週報", time: 30, finishCurrent: true, start: true, pauseMedia: false }
    ];

    presets.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `🎯 ${p.value} ⌛️ 0 小時 0 分【更新 n/a】`;
        li.dataset.value = p.value;
        li.dataset.time = p.time;
        li.dataset.finishCurrent = p.finishCurrent;
        li.dataset.start = p.start;
        li.dataset.pauseMedia = p.pauseMedia;
        li.style.cursor = 'pointer';
        historyUl.appendChild(li);
    });
});

function recordElapsedTime(goal, skipHistory = false) {
    if (state.remainingTime > 0 && goal) {
        const elapsedSec = (parseInt(state.lastCustomTimeValue, 10) * 60) - state.remainingTime;
        state.lastDurationSec = Math.max(elapsedSec, 0); // 避免負數
        if (!skipHistory) {
            addGoalHistory(goal);
        } else {
            addGoalHistory(goal, false);
        }
    }
}

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

function addGoalHistory(goalText, addClick = true) {
    const durationSec = state.lastDurationSec || 0;
    const key = goalText.trim();
    const now = new Date();

    if (!state.goalHistory[key]) {
        state.goalHistory[key] = { totalSeconds: 0, lastUpdate: null };
    }

    state.goalHistory[key].totalSeconds += durationSec;
    state.goalHistory[key].lastUpdate = now;

    const total = state.goalHistory[key].totalSeconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const hhmm = now ? now.toTimeString().slice(0, 5) : "n/a";

    const displayText = `🎯 ${key} ⌛️ ${hours} 小時 ${minutes} 分【更新 ${hhmm || "n/a"}】`;

    const ul = document.getElementById('goalHistory');
    const existingItems = ul.querySelectorAll('li');
    let updated = false;

    existingItems.forEach(li => {
        if (li.dataset.value === key || li.dataset.goal === key) {
            li.textContent = displayText;
            updated = true;
        }
    });

    if (!updated) {
        const li = document.createElement('li');
        li.textContent = displayText;
        li.dataset.goal = key;
        li.dataset.value = key;
        li.dataset.time = "20";
        li.dataset.finishCurrent = "true";
        li.dataset.start = "true";
        li.dataset.pauseMedia = "false";
        li.style.cursor = 'pointer';
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
        if (state.lastGoal) {
            recordElapsedTime(state.lastGoal);
        }

        stopNotification();
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
        state.lastCustomTimeValue = customTimeValue;
        state.lastDurationSec = state.remainingTime;

        updateTimerDisplay(state.remainingTime);

        if (typeof player?.playVideo === 'function') player.playVideo();
        setBodyBackground("normal");

        countdown = setInterval(() => {
            if (state.remainingTime > 0) {
                state.remainingTime--;
                state.elapsedSinceLastBreak++;
                updateTimerDisplay(state.remainingTime);
            } else {
                player.pauseVideo();
                playNotification();
                if (!state.hasRecordedHistory) {
                    addGoalHistory(goalText);
                    state.hasRecordedHistory = true;
                }
                setBodyBackground("alert");
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

function handleGoalClick(li) {
    const value = li.dataset.value || li.dataset.goal;
    const time = parseInt(li.dataset.time || '20', 10);
    const finishCurrent = li.dataset.finishCurrent === 'true' || li.dataset.finishCurrent === true;
    const start = li.dataset.start === 'true' || li.dataset.start === true;
    const pauseMedia = li.dataset.pauseMedia === 'true' || li.dataset.pauseMedia === true;

    document.getElementById('goalText').value = value;
    document.getElementById('customTime').value = time;

    if (finishCurrent && state.lastGoal) {
        recordElapsedTime(state.lastGoal, true);
    }

    if (pauseMedia && typeof player?.pauseVideo === 'function') {
        player.pauseVideo();
    }

    if (start) {
        Timer.start();
    }
}


document.getElementById('goalHistory').addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) handleGoalClick(li);
});
