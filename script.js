let countdown;
let remainingTime = 5; // 倒數 5 秒
let breakTime = 3; // 休息 3 秒
let goalHistory = {}; // 儲存目標的累積次數與累積時間
let lastGoal = "";
let elapsedSinceLastBreak = 0; // 記錄距離上次休息的時間
let elapsedInterval; // 用於計時「距離上次休息」

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
    clearInterval(countdown);
    clearInterval(elapsedInterval);
    remainingTime = 5;
    elapsedInterval = setInterval(() => {
        elapsedSinceLastBreak++;
        updateElapsedDisplay();
    }, 1000);
    updateTimerDisplay();
    countdown = setInterval(timerTick, 1000);
}

// 更新「距離上次休息」的顯示
function updateElapsedDisplay() {
    document.getElementById("noBreakTime").textContent = `距離上次休息：${elapsedSinceLastBreak} 秒`;
}

// 計時每秒減少
function timerTick() {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
        clearInterval(countdown);
        endTimer();
    }
}

// 計時結束後處理
function endTimer() {
    player.mute(); // 靜音 YouTube
    document.body.className = "background-alert";
    document.getElementById("breakButton").style.display = "inline";
    updateHistory();
}

// 更新倒數顯示
function updateTimerDisplay() {
    document.getElementById("timerDisplay").textContent = `剩餘時間：${remainingTime} 秒`;
}

// 暫停計時
function pauseTimer() {
    clearInterval(countdown);
}

// 顯示休息畫面
function startBreak() {
    document.body.className = "background-break";
    document.getElementById("breakButton").style.display = "none";
    document.getElementById("todoList").style.display = "block";
    clearInterval(elapsedInterval); // 停止距離上次休息的計上面代碼的 `script.js` 檔案已包含完整的計時、休息、歷史記錄、顯示「距離上次休息」的功能，以及其他樣式效果。使用這些文件，您的頁面應該能夠正常運行並顯示合適的 UX/UI 設計。如果還有其他功能需求或調整樣式的要求，隨時告訴我！
