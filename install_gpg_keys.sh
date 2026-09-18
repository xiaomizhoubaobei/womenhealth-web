#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GPG 密钥安装脚本
#
# 说明：分发 API 地址与私钥解锁短语（passphrase）均从环境变量读取，
#      严禁在脚本中硬编码，避免密钥分发链路与口令泄露。
#
# 环境变量：
#   GPG_API / PLUGIN_GPG_API   密钥分发 API 地址（必填）
#   GPG_KEY / PLUGIN_GPG_KEY   私钥解锁短语 passphrase（必填，私钥为加密存储）
# ==============================================================================

# 从环境变量读取分发 API 地址（优先 PLUGIN_ 前缀，兼容 CNB 注入规范）
API_URL="${PLUGIN_GPG_API:-${GPG_API:-}}"
# 从环境变量读取私钥解锁短语（passphrase）
GPG_KEY_VALUE="${PLUGIN_GPG_KEY:-${GPG_KEY:-}}"

# 0. 环境变量校验
if [ -z "$API_URL" ]; then
    echo "❌ 未设置密钥分发 API 环境变量（GPG_API / PLUGIN_GPG_API）"
    exit 1
fi

if [ -z "$GPG_KEY_VALUE" ]; then
    echo "❌ 未设置私钥解锁短语环境变量（GPG_KEY / PLUGIN_GPG_KEY）"
    exit 1
fi

# 1. 安装必要工具（若未安装）
if ! command -v gpg &>/dev/null; then
    echo "==> 安装 GPG..."
    sudo apt-get update -qq
    sudo apt-get install -y gnupg wget jq
fi

# 2. 从 API 获取密钥下载地址
echo "==> 获取密钥地址..."
API_RESPONSE=$(curl -s --connect-timeout 10 --max-time 30 "$API_URL")
if [ -z "$API_RESPONSE" ]; then
    echo "❌ API调用失败，无法获取响应"
    exit 1
fi
PRIVATE_KEY_URL=$(echo "$API_RESPONSE" | jq -r '.private_key_url // empty')
PUBLIC_KEY_URL=$(echo "$API_RESPONSE" | jq -r '.public_key_url // empty')

if [ -z "$PRIVATE_KEY_URL" ] || [ -z "$PUBLIC_KEY_URL" ]; then
    echo "❌ 无法从API响应中解析密钥URL"
    exit 1
fi
PRIVATE_KEY_FILE="private_key.asc"
PUBLIC_KEY_FILE="public_key.asc"

# 3. 下载密钥
echo "==> 下载密钥..."
wget -q -O "$PRIVATE_KEY_FILE" "$PRIVATE_KEY_URL"
wget -q -O "$PUBLIC_KEY_FILE" "$PUBLIC_KEY_URL"

# 4. 导入密钥（私钥为加密存储，须用环境变量中的 passphrase 解锁导入）
echo "==> 导入密钥..."
gpg --batch --pinentry-mode loopback --passphrase "$GPG_KEY_VALUE" --import "$PRIVATE_KEY_FILE"
gpg --batch --import "$PUBLIC_KEY_FILE"

# 5. 获取密钥 ID 并设为终极信任
KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | awk '/sec/{print $2; exit}' | cut -d/ -f2)
echo "==> 设置密钥 $KEY_ID 为终极信任..."
echo -e "trust\n5\ny\nquit" | gpg --batch --command-fd 0 --edit-key "$KEY_ID" >/dev/null

# 6. 配置 Git
git config --global user.signingkey "$KEY_ID"
git config --global commit.gpgsign true
git config --global gpg.program "$(command -v gpg)"

# 7. 持久化 GPG_TTY
grep -qxF 'export GPG_TTY=$(tty)' ~/.bashrc || echo 'export GPG_TTY=$(tty)' >>~/.bashrc
export GPG_TTY=$(tty)

# 8. 启动 gpg-agent
gpgconf --launch gpg-agent 2>/dev/null || true

# 9. 清理临时文件
rm -f "$PRIVATE_KEY_FILE" "$PUBLIC_KEY_FILE"

# 10. 非交互签名测试
echo "==> 测试 GPG 签名..."
TEST_RESULT=$(echo "hello GPG" | gpg --clearsign 2>/dev/null)
if grep -q "BEGIN PGP SIGNED MESSAGE" <<<"$TEST_RESULT"; then
    echo "✅ 签名测试通过，GPG 已就绪。"
else
    echo "❌ 签名测试失败，请检查密钥及配置。"
    exit 1
fi
