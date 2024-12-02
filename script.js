let countdown;
let elapsedInterval;
let player;
let currentPlaylist = "";

const versionNumber = "v1.6.3-休息直用"; // 或從其他來源動態獲取版本號
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
    initialTime: 1200, // 20 分鐘 (1200 秒)
    initialTimeMin: 20, // 20 分鐘 (1200 秒)
    breakTime: 600 // 10 分鐘 (600 秒)
};

const state = {
    remainingTime: TIMER_SETTINGS.initialTime,
    elapsedSinceLastBreak: 0,
    goalHistory: {},
    lastGoal: "",
    hasRecordedHistory: false,
};

// 目標文字清空
function clearCustomTime() {
    document.getElementById('goalText').value = '';
    document.getElementById('customTime').value = TIMER_SETTINGS.initialTimeMin;
}

// YouTube 播放器初始化
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', { events: { 'onReady': () => {} } });
}

const Timer = {
    start() {
        // 設置初始時間（讀取用戶自定義的時間）
        const initialTime = this.getCustomTime() || TIMER_SETTINGS.initialTime;

        // 若已在計時中，先將已執行時間加入歷史紀錄
        if (countdown) {
            this.recordCurrentProgressAsComplete(initialTime); // 使用用戶自定義時間計算已經過時間
            clearInterval(countdown); // 清除現有計時器
            clearInterval(elapsedInterval); // 清除累積時間計時器
        }

        UI.toggleTodoList(false);
        this.prepareSound();

        // 設置播放清單
        this.loadPlaylist("PLzhJK6pylmas2Wa67YKOcrAx-xq4MxiQP");

        // 設置剩餘時間為初始時間
        state.remainingTime = initialTime;

        // 啟動倒數計時
        this.resetElapsedSinceLastBreak();
        this.initializeCountdown(initialTime, this.updateTimerDisplay, this.end);
        player.unMute();
        this.updateGoal();

        // 關閉 flash 效果
        UI.removeFlashEffect();
    },
    
    recordCurrentProgressAsComplete(initialTime) {
        // 若有正在進行的計時器，將其累積的時間記錄至歷史紀錄
        const elapsedTime = initialTime - state.remainingTime; // 已經過的時間，使用自定義的初始時間計算
        if (state.lastGoal && elapsedTime > 0) {
            History.recordGoal(state.lastGoal, elapsedTime);
            History.updateHistoryDisplay();
        }
    },

    pause() {
        if (!countdown) return;
        player.mute();
        clearInterval(countdown);
        clearInterval(elapsedInterval);
    },

    startBreak() {
        this.recordGoalProgress();
        this.loadVideo("NobJD8The0Q");
        currentPlaylist = "";
        state.remainingTime = TIMER_SETTINGS.breakTime;
        // 取得 <option id="break">
        const breakOption = document.querySelector('#goalOptions option#break');
        // 取得相關屬性值
        const breakValue = breakOption.value; // "休息：喝水、廁所、看訊息、紀錄進度"
        const breakTime = parseInt(breakOption.dataset.time); // 10
        // 更新目標輸入框和時間輸入框的值
        document.getElementById('goalText').value = breakValue;
        document.getElementById('customTime').value = breakTime;
        // 顯示操作訊息（可選）
        console.log(`已設定目標：${breakValue}，時間：${breakTime} 分鐘`);
        UI.toggleTodoList(true);
        UI.updateBackground("break");
        this.initializeCountdown(breakTime, this.updateTimerDisplay, this.endBreak);
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
        notificationSound.play().catch(() => alert("休息結束音效播放失敗，可能受到瀏覽器限制"));
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
        document.getElementById("timerDisplay").textContent = `剩餘時間：${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
    }
};



// 更新目標的記錄，包括使用次數、累計時間和儲存時間
const History = {
    recordGoal(goal, time) {
        if (!goal || state.hasRecordedHistory) return;
        
        // 若沒有該目標的歷史紀錄，則初始化
        if (!state.goalHistory[goal]) {
            state.goalHistory[goal] = { count: 0, totalTime: 0, lastUpdated: null };
        }

        // 更新使用次數和累計時間
        state.goalHistory[goal].count++;
        state.goalHistory[goal].totalTime += time;

        // 設置更新日期時間（格式為 10:41 PM (11/13)）
        const now = new Date();
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        const formattedTime = now.toLocaleTimeString('en-US', options);
        const formattedDate = `${now.getMonth() + 1}/${now.getDate()}`;
        state.goalHistory[goal].lastUpdated = `${formattedTime} (${formattedDate})`;

        state.hasRecordedHistory = true;
        this.updateHistoryDisplay(); // 更新歷史顯示
    },

    updateHistoryDisplay() {
        const historyList = document.getElementById("goalHistory");
        historyList.innerHTML = "";

        // 強制 DOM 重繪：暫時隱藏並顯示列表
        historyList.style.display = 'none';
        historyList.offsetHeight; // 觸發重繪
        historyList.style.display = '';

        // 顯示每個目標的詳細資訊
        for (const [goal, data] of Object.entries(state.goalHistory)) {
            const hours = Math.floor(data.totalTime / 3600);
            const minutes = Math.floor((data.totalTime % 3600) / 60);
            const seconds = data.totalTime % 60;

            // 構建時間顯示字串，僅顯示非零的部分
            let timeDisplay = "累計 ";
            if (hours > 0) timeDisplay += `${hours} 時 `;
            if (minutes > 0) timeDisplay += `${minutes} 分 `;
            if (seconds > 0) timeDisplay += `${seconds} 秒`;

            const li = document.createElement("li");
            li.textContent = `🐣 🐣 🐣 ${goal} - ${data.count} 次，${timeDisplay.trim()}，${data.lastUpdated} 更新`;
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

// 綁定按鈕事件
document.querySelector(".primary").onclick = () => Timer.start();
document.querySelector(".pause").onclick = () => Timer.pause();
document.getElementById("breakButton").onclick = () => Timer.startBreak();

// YouTube Iframe API 加載
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);

// 預設項目時間
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
