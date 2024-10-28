let countdown;
let initialTime = 1200; // 計時倒數的初始時間為 20 分鐘 (1200 秒)
let remainingTime = initialTime;
let breakTime = 600; // 休息倒數的初始時間為 10 分鐘 (600 秒)
let goalHistory = {}; // 記錄目標的使用次數與累計時間
let lastGoal = ""; // 記錄上一次的目標
let elapsedSinceLastBreak = 0; // 計算距離上次休息的時間
let elapsedInterval; // 用於管理「距離上次休息」的計時器
let currentPlaylist = ""; // 用來記錄當前播放清單

// 初始化 YouTube 播放器
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        events: {
            'onReady': () => { }
        }
    });
}

// 開始計時
function startTimer() {
    const playlistId = 'PLzhJK6pylmas2Wa67YKOcrAx-xq4MxiQP';

    // 如果當前播放清單不是目標清單，才載入播放清單
    if (currentPlaylist !== playlistId) {
        player.loadPlaylist({ list: playlistId });
        currentPlaylist = playlistId; // 更新當前播放清單
    }

    // 檢查是否已有倒數進行中且剩餘時間不為零
    if (lastGoal && remainingTime < initialTime && remainingTime > 0) {
        // 將目前的目標和已經執行的時間加入歷史紀錄
        if (!goalHistory[lastGoal]) {
            goalHistory[lastGoal] = { count: 0, totalTime: 0 };
        }
        const elapsedTime = initialTime - remainingTime; // 計算已執行的時間
        goalHistory[lastGoal].count += 1;
        goalHistory[lastGoal].totalTime += elapsedTime;
        updateHistory();
    }

    // 重設倒數
    document.getElementById("timer-display-section").classList.remove("flash");

    player.unMute(); // 取消靜音 YouTube 播放器

    // 更新新目標並記錄為 lastGoal
    const goalText = document.getElementById("goalText").value;
    lastGoal = goalText; // 設定新目標為 lastGoal，記錄下一次使用
    if (goalText) {
        if (!goalHistory[goalText]) {
            goalHistory[goalText] = { count: 0, totalTime: 0 };
        }
    }

    document.body.className = "background-normal"; // 設置背景為米色
    clearInterval(countdown); // 清除之前的倒數計時器
    clearInterval(elapsedInterval); // 清除距離上次休息的計時器
    remainingTime = initialTime; // 重設倒數時間為 20 分鐘
    updateElapsedDisplay(); // 更新距離上次休息顯示
    updateTimerDisplay(); // 更新倒數顯示

    // 啟動距離上次休息的計時器
    elapsedInterval = setInterval(() => {
        elapsedSinceLastBreak++;
        updateElapsedDisplay();
    }, 1000);

    // 啟動倒數計時
    countdown = setInterval(timerTick, 1000);
}

// 每秒更新倒數計時
function timerTick() {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
        clearInterval(countdown); // 停止倒數計時
        endTimer(); // 倒數結束處理
    }
}

// 更新「距離上次休息」的顯示
function updateElapsedDisplay() {
    document.getElementById("noBreakTime").textContent = `距離上次休息：${elapsedSinceLastBreak} 秒`;
}

// 更新倒數顯示，確保顯示「分鐘」和「秒」的格式
function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById("timerDisplay").textContent = `剩餘時間：${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
}

// 倒數結束後的處理
function endTimer() {
    // 倒數結束時，自動將目標加入歷史
    if (lastGoal) {
        if (!goalHistory[lastGoal]) {
            goalHistory[lastGoal] = { count: 0, totalTime: 0 };
        }
        goalHistory[lastGoal].count += 1;
        goalHistory[lastGoal].totalTime += initialTime;
        updateHistory();
    }

    player.mute(); // 靜音 YouTube 播放器
    const timerDisplaySection = document.getElementById("timer-display-section");
    timerDisplaySection.classList.add("flash"); // 添加閃爍效果
}

// 暫停計時
function pauseTimer() {
    player.mute(); // 靜音 YouTube 播放器

    clearInterval(countdown); // 停止倒數計時
    clearInterval(elapsedInterval); // 停止距離上次休息的計時器
}

// 進入休息狀態
function startBreak() {
    // 切換 YouTube 影片到指定的休息時間影片
    player.loadVideoById("NobJD8The0Q");
    player.unMute(); // 取消靜音 YouTube 播放器
    currentPlaylist = ""; // 清空當前播放清單，因為切換到單一影片

    document.getElementById("timer-display-section").classList.remove("flash"); // 移除閃爍效果
    document.body.className = "background-break"; // 設置背景為米藍色
    document.getElementById("todoList").style.display = "block"; // 顯示待辦事項

    clearInterval(elapsedInterval); // 停止距離上次休息的計時器
    elapsedSinceLastBreak = 0; // 重設距離上次休息的時間
    updateElapsedDisplay(); // 更新距離上次休息顯示

    remainingTime = breakTime; // 設置休息時間為 10 分鐘
    updateTimerDisplay(); // 更新倒數顯示
    countdown = setInterval(breakTick, 1000); // 開始休息倒數計時
}

// 每秒減少休息倒數時間
function breakTick() {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
        clearInterval(countdown); // 停止休息倒數
        endBreak(); // 結束休息
    }
}

// 結束休息
function endBreak() {
    // 添加閃爍效果來提示休息結束
    document.getElementById("timer-display-section").classList.add("flash");

    document.body.className = "background-normal"; // 回到正常背景
    document.getElementById("todoList").style.display = "none"; // 隱藏待辦事項
    updateHistory(); // 更新歷史清單

    // 不自動重新開始計時，等待使用者手動按下「開始」
}

// 更新歷史清單
function updateHistory() {
    const historyList = document.getElementById("goalHistory");
    historyList.innerHTML = "";
    for (const goal in goalHistory) {
        const li = document.createElement("li");
        li.textContent = `🐣 🐣 🐣 ${goal} - 使用次數：${goalHistory[goal].count}，累計時間：${Math.floor(goalHistory[goal].totalTime / 60)} 分鐘 ${goalHistory[goal].totalTime % 60} 秒`;
        li.onclick = () => {
            document.getElementById("goalText").value = goal; // 點選歷史項目填入輸入框
        };
        historyList.prepend(li);
    }
}

// 加載 YouTube Iframe API
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
