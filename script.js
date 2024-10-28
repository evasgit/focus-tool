let countdown;
let breakCountdown;
let countdownTime = 5; // 5 秒倒數時間
let breakTime = 3; // 3 秒休息時間
let remainingTime = countdownTime;
let lastGoal = "";
let noBreakTime = 0;
let goalHistory = {}; // 儲存目標次數和累計時間

// 檢查並請求通知權限
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

function startTimer() {
    const goalText = document.getElementById("goalText").value || lastGoal || "未命名目標";
    
    if (goalText) {
        lastGoal = goalText;
        if (!goalHistory[goalText]) {
            goalHistory[goalText] = { count: 0, totalTime: 0 };
        }
        goalHistory[goalText].count += 1;
        
        updateHistory();
        document.getElementById("goalText").value = "";
    }
    
    clearInterval(countdown);
    clearInterval(breakCountdown);
    remainingTime = countdownTime;
    noBreakTime = 0;
    document.getElementById("player").style.display = "block"; // 顯示播放器
    updateTimerDisplay();
    countdown = setInterval(timerTick, 1000);
}

function timerTick() {
    remainingTime--;
    noBreakTime++;
    updateTimerDisplay();

    if (remainingTime <= 0) {
        clearInterval(countdown);
        document.getElementById("player").style.display = "none"; // 隱藏播放器，達到暫停效果
        goalHistory[lastGoal].totalTime += countdownTime;
        showNotification("目標時間到！", `目標：「${lastGoal}」時間已到。是否要繼續、休息3秒，或停止？`);
    }
}

function updateTimerDisplay() {
    document.getElementById("timerDisplay").textContent = `剩餘時間：${remainingTime}秒`;
    document.getElementById("noBreakTime").textContent = `距離上次休息：${noBreakTime}秒`;
}

function updateHistory() {
    const historyList = document.getElementById("goalHistory");
    historyList.innerHTML = "";
    for (const goal in goalHistory) {
        const li = document.createElement("li");
        li.textContent = `${goal} - 使用次數：${goalHistory[goal].count}，累計時間：${goalHistory[goal].totalTime}秒`;
        li.addEventListener("click", () => setGoal(goal));
        historyList.appendChild(li);
    }
}

function setGoal(goal) {
    document.getElementById("goalText").value = goal;
}

function showNotification(title, message) {
    // 確保通知權限已獲得
    if (Notification.permission === "granted") {
        const notification = new Notification(title, { body: message });
        
        // 播放音效
        new Audio('notification.mp3').play();
        
        // 點擊通知的處理
        notification.onclick = () => {
            window.focus();  // 可選擇使視窗聚焦
            notification.close();
        };
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showNotification(title, message);
            }
        });
    }
}

function handleAction() {
    const action = prompt("是否要繼續、休息3秒還是停止？（輸入繼續/休息/停止）");
    if (action === "繼續") {
        startTimer();
    } else if (action === "休息") {
        noBreakTime = 0;
        remainingTime = breakTime;
        breakCountdown = setInterval(breakTick, 1000);
    } else {
        alert("計時停止。");
    }
}

function breakTick() {
    remainingTime--;
    updateTimerDisplay();
    if (remainingTime <= 0) {
        clearInterval(breakCountdown);
        showNotification("休息時間到！", "是否要繼續目標？");
    }
}
