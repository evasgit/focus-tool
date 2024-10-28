let countdown;
let remainingTime = 5; // 倒數 5 秒
let breakTime = 3; // 休息 3 秒
let goalHistory = {}; // 儲存目標的累積次數與累積時間
let lastGoal = "";

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
    remainingTime = 5;
    updateTimerDisplay();
    countdown = setInterval(timerTick, 1000);
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
    remainingTime = breakTime;
    updateTimerDisplay();
    countdown = setInterval(breakTick, 1000);
}

// 休息倒數
function breakTick() {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
        clearInterval(countdown);
        endBreak();
    }
}

// 休息結束
function endBreak() {
    document.body.className = "background-alert";
    document.getElementById("todoList").style.display = "none";
    updateHistory();
    startTimer();
}

// 更新目標歷史
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
