let countdown;
let remainingTime = 5;
let breakTime = 3;
let goalHistory = {};
let lastGoal = "";
let elapsedSinceLastBreak = 0;
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
    player.mute();
    document.body.className = "background-alert";
    document.getElementById("breakButton").style.display = "inline";
    updateHistory();
}

// 更新倒數顯示
function updateTimerDisplay() {
    document.getElementById("timerDisplay").textContent = `剩餘時間：${remainingTime} 秒`;
}
