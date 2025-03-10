#!/bin/bash

# 変更されたファイルを取得
CHANGED_FILES=$(git diff --name-only HEAD @{push})

# en.jsonとja.jsonが変更されているか確認
EN_CHANGED=false
JA_CHANGED=false

for FILE in $CHANGED_FILES; do
    if [[ "$FILE" == "en.json" ]]; then
        EN_CHANGED=true
    elif [[ "$FILE" == "ja.json" ]]; then
        JA_CHANGED=true
    fi
done

# どちらか一方が変更されていた場合は、キーの整合性をチェック
if [[ "$EN_CHANGED" == "true" || "$JA_CHANGED" == "true" ]]; then
    echo "Checking JSON key consistency..."

    # JSONのキーを取得
    EN_KEYS=$(jq -r 'keys_unsorted | .[]' en.json | sort)
    JA_KEYS=$(jq -r 'keys_unsorted | .[]' ja.json | sort)

    # 比較
    DIFF=$(diff <(echo "$EN_KEYS") <(echo "$JA_KEYS"))

    if [[ -n "$DIFF" ]]; then
        echo "Error: JSON keys in en.json and ja.json do not match!"
        echo "$DIFF"
        echo "Please update ja.json to match en.json (or vice versa) before pushing."
        exit 1
    fi
fi

# プッシュを許可
exit 0
