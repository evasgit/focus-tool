#!/bin/bash
# 📦 自動 git add / commit / push 並更新 JS 中 versionNumber 為當前時間戳

set -e

JS_FILE="script.js" # 可根據實際檔名調整
NOW=$(date +"%y%m%d%H%M%S")
VERSION="v$NOW"

echo "📝 版本號更新為：$VERSION"

# 使用 sed 更新 versionNumber
sed -i '' "s/^const versionNumber = \".*\";/const versionNumber = \"$VERSION\";/" "$JS_FILE"

# 顯示 git 狀態
echo "📂 當前 git 狀態："
git status

# 自動 add / commit / push
IFS= read -r -p "📝 請輸入 commit 訊息（預設為 \"$VERSION\"）: " feature
if [ -z "$feature" ]; then
    feature="update"
fi
git add .
git commit -m "$VERSION: ${feature}"
git push

echo "✅ 推送完成，版本為 $VERSION: ${feature}"
