let countdown;
let elapsedInterval;
let player;
let currentPlaylist = "";

const versionNumber = "v1.0.5"; // 或從其他來源動態獲取版本號
document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.getElementById("version");
    if (versionElement) {
        versionElement.textContent = versionNumber;
    }
});

const targetPlaylistUrl = "https://www.youtube.com/embed/videoseries?list=PLzhJK6pylmas2Wa67YKOcrAx-xq4MxiQP&enablejsapi=1";

const notificationSound = new Audio("notification.mp3");
notificationSound.volume = 1.0; // 設置音量為最大（0.0 - 1.0）

const TIMER_SETTINGS = {
    initialTime: 12, // 20 分鐘 (1200 秒)
    breakTime: 6 // 10 分鐘 (600 秒)
};

const state = {
    remainingTime: TIMER_SETTINGS.initialTime,
    elapsedSinceLastBreak: 0,
    goalHistory: {},
    lastGoal: "",
    hasRecordedHistory: false,
};

// YouTube 播放器初始化
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', { events: { 'onReady': () => {} } });
}

// 計時器管理
const Timer = {
    start() {
        // 確保音效在首次互動時被允許
        notificationSound.load();
        notificationSound.play().catch(() => {
            alert("音效預載失敗，但可以在結束時播放");
        });
        
        // 檢查並載入目標播放清單
        const playlistId = "PLzhJK6pylmas2Wa67YKOcrAx-xq4MxiQP";
        if (currentPlaylist !== playlistId) {
            player.loadPlaylist({ list: playlistId });
            currentPlaylist = playlistId; // 更新當前播放清單
        }
        
        // 移除閃現效果
        document.getElementById("timer-display-section").classList.remove("flash");

        // 累加當前目標的執行時間到歷史紀錄
        if (state.lastGoal && state.remainingTime < TIMER_SETTINGS.initialTime && state.remainingTime > 0) {
            // 計算已執行的時間
            const elapsedTime = TIMER_SETTINGS.initialTime - state.remainingTime;

            // 將已執行時間加入到歷史紀錄中
            if (!state.goalHistory[state.lastGoal]) {
                state.goalHistory[state.lastGoal] = { count: 0, totalTime: 0 };
            }
            state.goalHistory[state.lastGoal].count += 1;
            state.goalHistory[state.lastGoal].totalTime += elapsedTime;

            // 更新歷史清單顯示
            History.updateHistoryDisplay();
        }

        this.resetElapsedSinceLastBreak();
        this.initializeCountdown(TIMER_SETTINGS.initialTime, this.updateTimerDisplay, this.end);
        UI.toggleTodoList(false);
        player.unMute();
        this.updateGoal();
    },
    
    pause() {
        player.mute();
        clearInterval(countdown);
        clearInterval(elapsedInterval);
    },
    
    startBreak() {
        player.loadVideoById("NobJD8The0Q");
        player.unMute();
        currentPlaylist = ""; // 清空播放清單
        state.remainingTime = TIMER_SETTINGS.breakTime;
        UI.toggleTodoList(true);
        UI.updateBackground("break");
        this.initializeCountdown(TIMER_SETTINGS.breakTime, this.updateTimerDisplay, this.endBreak);
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
        notificationSound.play().catch(() => {
            alert("音效播放失敗，可能受到瀏覽器限制");
        });
        UI.flashTimerDisplay();
    },

    endBreak() {
        UI.resetBackground();
        UI.toggleTodoList(false);
        notificationSound.play().catch(() => {
            alert("休息結束音效播放失敗，可能受到瀏覽器限制");
        });
        History.updateHistoryDisplay(); // 更新歷史清單
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
        document.getElementById("timerDisplay").textContent = `剩餘時間：${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
    }
};

// 歷史記錄管理
const History = {
    recordGoal(goal, time) {
        if (!goal || state.hasRecordedHistory) return;
        if (!state.goalHistory[goal]) {
            state.goalHistory[goal] = { count: 0, totalTime: 0 };
        }
        state.goalHistory[goal].count++;
        state.goalHistory[goal].totalTime += time;
        state.hasRecordedHistory = true;
        this.updateHistoryDisplay();
    },

    updateHistoryDisplay() {
        const historyList = document.getElementById("goalHistory");
        historyList.innerHTML = "";
        for (const [goal, data] of Object.entries(state.goalHistory)) {
            const li = document.createElement("li");
            li.textContent = `🐣 🐣 🐣 ${goal} - 使用次數：${data.count}，累計時間：${Math.floor(data.totalTime / 60)} 分鐘 ${data.totalTime % 60} 秒`;
            li.onclick = () => UI.populateGoalInput(goal);
            historyList.prepend(li);
        }
    }
};

// UI 管理
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

// 綁定按鈕事件
document.querySelector(".primary").onclick = () => Timer.start();
document.querySelector(".pause").onclick = () => Timer.pause();
document.getElementById("breakButton").onclick = () => Timer.startBreak();

// YouTube Iframe API 加載
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);
