let countdown;
let countdownTime = 5; // 5 秒倒數時間
let remainingTime = countdownTime;
let lastGoal = "";
let goalTextInput;

// 初始化：等待使用者點選播放 YouTube Iframe
function init() {
    // 請求通知權限
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    
    goalTextInput = document.getElementById("goalText");
    document.getElementById("startButton").addEventListener("click", startTimer);
    document.getElementById("restButton").addEventListener("click", restMode);
    document.getElementById("restButton").style.display = "none"; // 隱藏休息按鈕
}

// 開始倒數計時
function startTimer() {
    document.body.style.backgroundColor = "white"; // 變成白色
    remainingTime = countdownTime;
    goalTextInput.value = goalTextInput.value; // 保持目標文字
    updateTimerDisplay();

    clearInterval(countdown);
    countdown = setInterval(timerTick, 1000);
}

// 每秒倒數
function timerTick() {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
        clearInterval(countdown);
        timeUp();
    }
}

// 倒數結束時的處理
function timeUp() {
    document.body.style.backgroundColor = "#f5deb3"; // 變成米黃色
    muteYouTubePlayer(); // 靜音 YouTube Iframe
    document.getElementById("restButton").style.display = "block"; // 顯示休息按鈕
}

// 休息模式
function restMode() {
    document.body.style.backgroundColor = "#b0c4de"; // 變成米藍色
    document.getElementById("restButton").style.display = "none"; // 隱藏休息按鈕
}

// 更新倒數計時顯示
function updateTimerDisplay() {
    document.getElementById("timerDisplay").textContent = `剩餘時間：${remainingTime} 秒`;
}

// 靜音 YouTube Iframe
function muteYouTubePlayer() {
    const player = document.getElementById("player");
    player.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
}

// 初始化事件監聽器
window.onload = init;
