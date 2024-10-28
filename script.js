let countdown;
let remainingTime = 5; // 倒數開始時間
let breakTime = 3; // 休息時間
let goalHistory = {}; // 用於記錄目標的歷史
let lastGoal = "";
let elapsedSinceLastBreak = 0; // 距離上次休息的時間
let elapsedInterval;

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
    const goalText = document.getElementById("goalText").value;
    if (goalText) {
        lastGoal = goalText;
        if (!goalHistory[goalText]) {
            goalHistory[goalText] = { count: 0, totalTime: 0 };
        }
        goalHistory[goalText].count += 1;
    }

    document.body.className = "background-normal";
    clearInterval(countdown); // 確保之前的倒數計時已清除
    clearInterval(elapsedInterval); // 清除距離上次休息的計時
    remainingTime = 5; // 重置剩餘時間
    elapsedSinceLastBreak = 0; // 重置距離上次休息時間
    updateElapsedDisplay(); // 顯示重置的距離上次休息時間
    updateTimerDisplay(); // 更新倒數顯示

    // 開始「距離上次休息」的計時
    elapsedInterval = setInterval(() => {
        elapsedSinceLastBreak++;
        updateElapsedDisplay();
    }, 1000);

    // 開始倒數計時
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

// 顯示「距離上次休息」的時間
function updateElapsedDisplay() {
    document.getElementById("noBreakTime").textContent = `距離上次休息：${elapsedSinceLastBreak} 秒`;
}

// 更新倒數顯示
function updateTimerDisplay() {
    document.getElementById("timerDisplay").textContent = `剩餘時間：${remainingTime} 秒`;
}

// 倒數結束後的處理
function endTimer() {
    player.mute(); // 靜音 YouTube 播放器
    document.body.className = "background-alert";
    document.getElementById("breakButton").style.display = "inline"; // 顯示休息按鈕
    updateHistory(); // 更新歷史清單
}

// 暫停計時
function pauseTimer() {
    clearInterval(countdown); // 停止倒數
    clearInterval(elapsedInterval); // 停止「距離上次休息」的計時
}

// 進入休息狀態
function startBreak() {
    document.body.className = "background-break";
    document.getElementById("breakButton").style.display = "none"; // 隱藏休息按鈕
    document.getElementById("todoList").style.display = "block"; // 顯示待辦事項

    clearInterval(elapsedInterval); // 停止「距離上次休息」的計時
    elapsedSinceLastBreak = 0; // 重置「距離上次休息」時間
    updateElapsedDisplay(); // 更新顯示

    remainingTime = breakTime; // 重置休息時間
    updateTimerDisplay(); // 更新顯示
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
    document.body.className = "background-alert";
    document.getElementById("todoList").style.display = "none"; // 隱藏待辦事項
    updateHistory(); // 更新歷史清單
    startTimer(); // 返回計時模式
}

// 更新歷史清單
function updateHistory() {
    const goalText = document.getElementById("goalText").value;
    if (goalText && goalHistory[goalText]) {
        goalHistory[goalText].totalTime += 5; // 累計每次倒數時間
    }
    const historyList = document.getElementById("goalHistory");
    historyList.innerHTML = "";
    for (const goal in goalHistory) {
        const li = document.createElement("li");
        li.textContent = `${goal} - 使用次數：${goalHistory[goal].count}，累計時間：${goalHistory[goal].totalTime}秒`;
        historyList.prepend(li);
    }
}

// 加載 YouTube Iframe API
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
