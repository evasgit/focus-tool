
// ========================
// Focus Timer Script v1.9.3-video (整合按鈕收納版)
// ========================

// 已初始化變數與常數
let countdown;
let elapsedInterval;
let player;
let currentPlaylist = "";

const versionNumber = "v250508120236";
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

const Timer = {
    start20() {
        console.log('20分鐘 button clicked, custom time set to 20 minutes');
        UI.updateBackground("normal");
        document.getElementById('customTime').value = 20;
        const initialTime = this.getCustomTime() || TIMER_SETTINGS.initialTime;
        if (countdown) {
            this.recordCurrentProgressAsComplete(initialTime);
            clearInterval(countdown);
            clearInterval(elapsedInterval);
        }
        UI.toggleTodoList(false);
        this.prepareSound();
        const videoId = document.getElementById("videoId").value.trim();
        this.loadVideo(videoId);
        state.remainingTime = initialTime;
        this.resetElapsedSinceLastBreak();
        this.initializeCountdown(initialTime, this.updateTimerDisplay, this.end);
        player.unMute();
        this.updateGoal();
        UI.removeFlashEffect();
    },

    start() {
        UI.updateBackground("normal");
        const initialTime = this.getCustomTime() || TIMER_SETTINGS.initialTime;
        if (countdown) {
            this.recordCurrentProgressAsComplete(initialTime);
            clearInterval(countdown);
            clearInterval(elapsedInterval);
        }
        UI.toggleTodoList(false);
        this.prepareSound();
        this.loadPlaylist("PLzhJK6pylmas2Wa67YKOcrAx-xq4MxiQP");
        state.remainingTime = initialTime;
        this.resetElapsedSinceLastBreak();
        this.initializeCountdown(initialTime, this.updateTimerDisplay, this.end);
        player.unMute();
        this.updateGoal();
        UI.removeFlashEffect();
    },

    pause() {
        if (!countdown) return;
        player.mute();
        clearInterval(countdown);
        clearInterval(elapsedInterval);
    },

    startBreak() {
        UI.updateBackground("normal");
        UI.removeFlashEffect();
        const initialTime = this.getCustomTime() || TIMER_SETTINGS.initialTime;
        if (countdown) {
            this.recordCurrentProgressAsComplete(initialTime);
            clearInterval(countdown);
            clearInterval(elapsedInterval);
        }
        this.loadVideo("NobJD8The0Q");
        currentPlaylist = "";
        state.remainingTime = TIMER_SETTINGS.breakTime;
        const breakOption = document.querySelector('#goalOptions option#break');
        const breakValue = breakOption.value;
        const breakTime = parseInt(breakOption.dataset.time);
        document.getElementById('goalText').value = breakValue;
        document.getElementById('customTime').value = breakTime;
        console.log(`已設定目標：${breakValue}，時間：${breakTime} 分鐘`);
        UI.updateBackground("break");
        this.initializeCountdown(breakTime * 60, this.updateTimerDisplay, this.endBreak);
    },

    prepareSound() {
        notificationSound.load();
        notificationSound.play().catch(() => alert("音效預載失敗，但可以在結束時播放"));
    },

    loadPlaylist(playlistId) {
        if (currentPlaylist !== playlistId) {
            player.loadPlaylist({ list: playlistId });
            currentPlaylist = playlistId;
        }
    },

    loadVideo(videoId) {
        player.loadVideoById(videoId);
        player.unMute();
    },

    getCustomTime() {
        const customMinutes = parseInt(document.getElementById("customTime").value);
        return !isNaN(customMinutes) ? customMinutes * 60 : null;
    },

    resetElapsedSinceLastBreak() {
        clearInterval(elapsedInterval);
        state.elapsedSinceLastBreak = 0;
        UI.updateElapsedDisplay(state.elapsedSinceLastBreak);
        elapsedInterval = setInterval(() => {
            state.elapsedSinceLastBreak++;
            UI.updateElapsedDisplay(state.elapsedSinceLastBreak);
        }, 1000);
    },

    initializeCountdown(time, updateCallback, endCallback) {
        state.remainingTime = time;
        clearInterval(countdown);
        countdown = setInterval(() => {
            state.remainingTime = Math.max(0, state.remainingTime - 1);
            updateCallback();
            if (state.remainingTime <= 0) endCallback();
        }, 1000);
    },

    end() {
        History.recordGoal(state.lastGoal, TIMER_SETTINGS.initialTime);
        player.mute();
        notificationSound.play().catch(() => alert("音效播放失敗，可能受到瀏覽器限制"));
        UI.flashTimerDisplay();
    },

    endBreak() {
        UI.resetBackground();
        notificationSound.play().catch(() => alert("休息結束音效播放失敗"));
        History.updateHistoryDisplay();
    },

    updateGoal() {
        const goalText = document.getElementById("goalText").value;
        state.lastGoal = goalText;
        if (goalText && !state.goalHistory[goalText]) {
            state.goalHistory[goalText] = { count: 0, totalTime: 0 };
        }
        state.hasRecordedHistory = false;
        UI.updateGoalInput(goalText);
    },

    updateTimerDisplay() {
        const minutes = Math.floor(state.remainingTime / 60);
        const seconds = state.remainingTime % 60;
        document.getElementById("timerDisplay").textContent = `⏳ ${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
    },

    recordCurrentProgressAsComplete(initialTime) {
        const elapsedTime = initialTime - state.remainingTime;
        if (state.lastGoal && elapsedTime > 0) {
            History.recordGoal(state.lastGoal, elapsedTime);
            History.updateHistoryDisplay();
        }
    }
};

const History = {
    recordGoal(goal, time) {
        if (!goal || state.hasRecordedHistory) return;
        if (!state.goalHistory[goal]) {
            state.goalHistory[goal] = { count: 0, totalTime: 0, lastUpdated: null };
        }
        state.goalHistory[goal].count++;
        state.goalHistory[goal].totalTime += time;

        if (state.goalHistory[goal].totalTime > 1 * 60 * 60) {
            alert(`目標「${goal}」的總時間已超過 1 小時(${state.goalHistory[goal].totalTime / 60} 分鐘)！`);
        }

        const now = new Date();
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        const formattedTime = now.toLocaleTimeString('en-US', options);
        const formattedDate = `${now.getMonth() + 1}/${now.getDate()}`;
        state.goalHistory[goal].lastUpdated = `${formattedTime} (${formattedDate})`;

        state.hasRecordedHistory = true;
        this.updateHistoryDisplay();
    },

    updateHistoryDisplay() {
        const historyList = document.getElementById("goalHistory");
        historyList.innerHTML = "";
        historyList.style.display = 'none';
        historyList.offsetHeight;
        historyList.style.display = '';

        for (const [goal, data] of Object.entries(state.goalHistory)) {
            const hours = Math.floor(data.totalTime / 3600);
            const minutes = Math.floor((data.totalTime % 3600) / 60);
            const seconds = data.totalTime % 60;

            let timeDisplay = "累計 ";
            if (hours > 0) timeDisplay += `${hours} 時 `;
            if (minutes > 0) timeDisplay += `${minutes} 分 `;
            if (seconds > 0) timeDisplay += `${seconds} 秒`;

            const li = document.createElement("li");
            li.textContent = `🐣 ${goal} - ${data.count} 次，${timeDisplay.trim()}，${data.lastUpdated} 更新`;
            li.onclick = () => UI.populateGoalInput(goal);
            historyList.prepend(li);
        }
    }
};

const UI = {
    toggleTodoList(visible) {
        document.getElementById("todoList").style.display = visible ? "block" : "none";
    },

    updateGoalInput(goal) {
        document.getElementById("goalText").value = goal;
    },

    updateElapsedDisplay(elapsedTime) {
        document.getElementById("noBreakTime").textContent = `距離上次休息：${elapsedTime} 秒`;
    },

    flashTimerDisplay() {
        const timerDisplaySection = document.getElementById("timer-display-section");
        timerDisplaySection.classList.add("flash");
    },

    removeFlashEffect() {
        const timerDisplaySection = document.getElementById("timer-display-section");
        timerDisplaySection.classList.remove("flash");
    },

    resetBackground() {
        document.body.className = "background-normal";
    },

    updateBackground(type) {
        if (type === "break") {
            document.body.className = "background-break";
        } else {
            this.resetBackground();
        }
    },

    populateGoalInput(goal) {
        document.getElementById("goalText").value = goal;
    }
};

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

// 預設項目選擇時自動帶入時間
document.getElementById('goalText').addEventListener('input', function () {
    const goalText = this.value;
    const dataList = document.getElementById('goalOptions');
    const options = dataList.options;

    for (let i = 0; i < options.length; i++) {
        if (options[i].value === goalText) {
            const time = options[i].getAttribute('data-time');
            if (time) {
                document.getElementById('customTime').value = time;
            }
            break;
        }
    }
});

// 手動更新播放清單
function updatePlaylist() {
    const playlistId = document.getElementById("playlistId").value;
    const iframe = document.getElementById("player");
    iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1`;
}

let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);
