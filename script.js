let countdown;
let remainingTime = 5; // 計時倒數的初始時間
let breakTime = 3; // 休息倒數的初始時間
let goalHistory = {}; // 記錄目標的使用次數與累計時間
let lastGoal = ""; // 記錄上一次的目標
let elapsedSinceLastBreak = 0; // 計算距離上次休息的時間
let elapsedInterval; // 用於管理「距離上次休息」的計時器

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
    player.unmute(); // 取消靜音 YouTube 播放器

    const goalText = document.getElementById("goalText").value;
    if (goalText) {
        lastGoal = goalText;
        if (!goalHistory[goalText]) {
            goalHistory[goalText] = { count: 0, totalTime: 0 };
        }
        goalHistory[goalText].count += 1;
    }

    document.body.className = "background-normal"; // 設置背景為米色
    clearInterval(countdown); // 清除之前的倒數計時器
    clearInterval(elapsedInterval); // 清除距離上次休息的計時器
    remainingTime = 5; // 重設倒數時間
    elapsedSinceLastBreak = 0; // 重設距離上次休息的時間
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

// 更新倒數顯示
function updateTimerDisplay() {
    document.getElementById("timerDisplay").textContent = `剩餘時間：${remainingTime} 秒`;
}

// 倒數結束後的處理
function endTimer() {
    player.mute(); // 靜音 YouTube 播放器
    document.body.className = "background-alert"; // 切換為警示背景（閃爍效果）
    document.getElementById("breakButton").style.display = "inline"; // 顯示休息按鈕
    updateHistory(); // 更新歷史清單
}

// 暫停計時
function pauseTimer() {
    clearInterval(countdown); // 停止倒數計時
    clearInterval(elapsedInterval); // 停止距離上次休息的計時器
}

// 進入休息狀態
function startBreak() {
    document.body.className = "background-break"; // 設置背景為米藍色
    document.getElementById("breakButton").style.display = "none"; // 隱藏休息按鈕
    document.getElementById("todoList").style.display = "block"; // 顯示待辦事項

    clearInterval(elapsedInterval); // 停止距離上次休息的計時器
    elapsedSinceLastBreak = 0; // 重設距離上次休息的時間
    updateElapsedDisplay(); // 更新距離上次休息顯示

    remainingTime = breakTime; // 設置休息時間
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
    document.body.className = "background-alert"; // 切換為警示背景
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
