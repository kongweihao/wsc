# 🦞 龙虾盒子 — OpenClaw AI Agent 安全沙盒

> **核心价值主张：** 让 AI Agent 在铁笼里全力发挥，绝对碰不到宿主机的一根毛。

---

## 📋 背景：OpenClaw 的"又爱又怕"困局

OpenClaw（龙虾）作为近期热门的 AI Agent 工具，能够接管电脑执行复杂任务，深受用户追捧。然而，社区中广泛存在一个核心安全顾虑：

> **OpenClaw 权限太大，怕不安全。**

典型的用户担忧包括：

| 权限类别 | 具体风险 | 用户恐惧指数 |
|----------|----------|-------------|
| 文件系统访问 | 读取/修改/删除宿主机任意文件 | ⭐⭐⭐⭐⭐ |
| 网络操作 | 上传本地敏感数据至外部服务器 | ⭐⭐⭐⭐⭐ |
| 进程控制 | 启动后台恶意进程 | ⭐⭐⭐⭐ |
| 系统配置 | 修改系统设置、安装软件 | ⭐⭐⭐⭐ |
| 剪贴板/输入 | 捕获密码、银行卡等敏感输入 | ⭐⭐⭐⭐⭐ |
| 浏览器 Cookie | 盗取账号登录凭证 | ⭐⭐⭐⭐⭐ |

### 核心矛盾

```
用户想要：AI 能大包大揽、接管复杂操作（全部能力）
用户害怕：AI 碰到本机钱包、密码、私密文件（安全隔离）
```

**错误的解法（阉割产品法）：** 限制 AI 只能执行"无害"任务。
→ 结果：把削铁如泥的屠龙刀改成了指甲剪，没人愿意为残废版付费。

**正确的解法（物理隔离法）：** 不限制 AI 的任务，限制 AI 的运行环境。
→ 结果：用户在一个铁笼子里看着 AI 全力发挥，宿主机零风险。

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      宿主机（安全区）                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            龙虾盒子 Docker 容器（隔离区）          │  │
│  │                                                  │  │
│  │   ┌──────────┐    ┌──────────────────────────┐  │  │
│  │   │ VNC 桌面  │    │      AI Agent（OpenClaw）  │  │  │
│  │   │  (XFCE4) │◄───│  无 root、无特权提升权限  │  │  │
│  │   └──────────┘    └──────────────────────────┘  │  │
│  │         │                      │                │  │
│  │   VNC:5900                /workspace（唯一       │  │
│  │   noVNC:6080               可持久化输出目录）    │  │
│  │                                                  │  │
│  │  ✅ 允许写入：/tmp、/workspace                  │  │
│  │  ❌ 禁止写入：/ 其他所有目录（read_only）        │  │
│  │  ❌ 禁止特权：ALL caps dropped                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  宿主机文件：完全不可见，零风险                          │
└─────────────────────────────────────────────────────────┘
```

### 安全层级

```
Layer 1: Docker 命名空间隔离（PID/NET/MNT/UTS/IPC）
Layer 2: cap_drop ALL（丢弃所有 Linux Capabilities）
Layer 3: no-new-privileges（禁止 setuid 特权提升）
Layer 4: read_only 根文件系统（除 tmpfs 白名单外全部只读）
Layer 5: 非 root 用户运行（uid=1000，无 sudo）
Layer 6: 资源限制（CPU/内存硬上限）
Layer 7: 网络隔离（独立 bridge 网段，可选完全断网）
```

---

## 🚀 快速开始

### 环境要求

- Docker >= 20.10
- Docker Compose >= 2.0
- VNC 客户端（RealVNC / TigerVNC / macOS 自带"屏幕共享"）或现代浏览器（noVNC）

### 1. 克隆并构建

```bash
# 克隆仓库
git clone https://github.com/kongweihao/wsc.git
cd wsc/sandbox

# 设置 VNC 密码（必须设置，构建时验证）
cp .env.example .env
# 编辑 .env，将 VNC_PASSWORD 改为强密码（.env 不会被提交到 git）
vi .env

# 构建并启动沙盒
docker compose up -d --build
```

### 2. 连接到沙盒桌面

**方式 A：VNC 客户端（推荐）**
```
地址: localhost:5900
密码: 你在 .env 中设置的 VNC_PASSWORD
```

**方式 B：浏览器（noVNC）**
```
访问: http://localhost:6080
```

### 3. 在沙盒内运行 AI Agent

沙盒启动后，你将看到一个独立的 XFCE4 桌面。在其中：

```bash
# 打开沙盒内的终端（安全的，不影响宿主机）
# 在这里安装和运行 OpenClaw 或任何其他 AI Agent

# 示例：AI Agent 的输出结果
ls ~/workspace/  # 所有 AI 生成的文件都在这里
```

### 4. 取出结果并销毁沙盒

```bash
# 将工作成果从沙盒复制到宿主机
docker cp lobster-sandbox:/home/sandbox/workspace/. ./output/

# 一键销毁沙盒，不留任何痕迹
docker compose down -v

# 验证清理完毕
docker ps -a | grep lobster
```

---

## 🔒 安全规格

### 权限边界对比

| 能力 | 直接运行（危险）| 龙虾盒子（安全）|
|------|----------------|----------------|
| 访问 `~/Documents` | ✅ 可读写 | ❌ 完全不可见 |
| 访问 `~/.ssh` | ✅ 可读私钥 | ❌ 完全不可见 |
| 访问浏览器 Cookie | ✅ 可读 | ❌ 完全不可见 |
| 访问剪贴板 | ✅ 可读 | ❌ 完全不可见 |
| 安装系统软件 | ✅ 可执行 | ❌ 只读文件系统 |
| 创建后台服务 | ✅ 可执行 | ❌ 无特权 |
| 网络访问 | ✅ 无限制 | ⚠️ 隔离网段（可配置断网）|
| 写入宿主机文件 | ✅ 无限制 | ❌ 只有 workspace 目录 |
| 进程逃逸 | ✅ 可尝试 | ❌ 无 CAP_SYS_ADMIN 等特权 |

### Docker 安全参数说明

```yaml
# docker-compose.yml 核心安全配置解析

cap_drop:
  - ALL                    # 丢弃所有 Linux Capabilities（包括 CAP_NET_RAW、
                           # CAP_SYS_ADMIN、CAP_PTRACE 等危险能力）

security_opt:
  - no-new-privileges:true # 禁止通过 setuid/setgid 获取额外权限

read_only: true            # 根文件系统只读

tmpfs:
  - /tmp:size=512m         # 临时目录（容器销毁后自动清空）
  - /run:size=64m
  - /var/run:size=64m

deploy:
  resources:
    limits:
      cpus: "2.0"          # CPU 上限：防止挖矿等滥用
      memory: 2g           # 内存上限：防止内存炸弹攻击
```

---

## ⚙️ 高级配置

### 完全断网模式（最高安全级别）

适用于处理本地文档、代码等不需要联网的任务：

```yaml
# docker-compose.yml 修改
services:
  sandbox:
    network_mode: "none"   # 完全断网，AI Agent 无法访问任何网络
```

### 挂载特定文件/目录（只读）

如需让 AI Agent 处理宿主机上的特定文件：

```yaml
volumes:
  - sandbox_workspace:/home/sandbox/workspace
  - /path/to/your/files:/home/sandbox/input:ro  # :ro = 只读挂载
```

### 自定义分辨率

```yaml
environment:
  - VNC_RESOLUTION=1920x1080   # 调整为你需要的分辨率
```

### 一次性模式（任务完成自动销毁）

```bash
# 以临时容器模式运行（--rm 标志确保退出后自动删除）
docker run --rm \
  --cap-drop ALL \
  --cap-add SETUID --cap-add SETGID --cap-add DAC_OVERRIDE \
  --security-opt no-new-privileges \
  --read-only \
  --tmpfs /tmp:size=512m \
  --tmpfs /run:size=64m \
  -v $(pwd)/output:/home/sandbox/workspace \
  -p 127.0.0.1:5900:5900 \
  lobster-box:latest
```

---

## 🛡️ 威胁模型与局限性

### 已覆盖的威胁

- ✅ 恶意/失控 AI Agent 读取宿主机敏感文件（密钥、密码、私密文档）
- ✅ AI Agent 修改宿主机系统配置
- ✅ AI Agent 安装后门、挖矿软件
- ✅ AI Agent 通过 ptrace 等方式探测宿主机进程
- ✅ 容器内资源滥用（CPU/内存炸弹）
- ✅ 任务完成后数据残留

### 未覆盖的威胁（局限性）

- ⚠️ **容器逃逸漏洞：** 若 Docker 自身存在 0-day 漏洞，沙盒可能被突破。请保持 Docker 最新版本。
- ⚠️ **网络攻击（非断网模式）：** AI Agent 仍可访问互联网，可能泄露沙盒内的数据。敏感任务请使用完全断网模式。
- ⚠️ **用户主动暴露：** 若用户将宿主机敏感文件挂载入容器，则该文件处于风险中。请勿挂载 `~/.ssh`、`~/.aws` 等目录。
- ⚠️ **侧信道攻击：** 容器与宿主机共享内核，存在理论上的侧信道风险（Spectre/Meltdown 等）。

---

## 📊 与同类方案对比

| 方案 | 隔离强度 | 使用门槛 | 性能开销 | 适合场景 |
|------|----------|----------|----------|----------|
| 直接运行 AI Agent | ❌ 零隔离 | 极低 | 零 | 完全信任的环境 |
| 虚拟机（VirtualBox/VMware）| ✅✅✅ 最强 | 高 | 大 | 极度敏感的生产环境 |
| **龙虾盒子（本方案）** | **✅✅ 强** | **低** | **小** | **日常 AI Agent 使用** |
| macOS 沙盒（App Sandbox） | ✅ 中 | 极低 | 极小 | macOS 原生应用 |
| WSL2（Windows）| ✅ 中 | 低 | 小 | Windows 用户 |

---

## 🔧 故障排查

### VNC 无法连接

```bash
# 检查容器状态
docker ps -a | grep lobster

# 查看容器日志
docker logs lobster-sandbox

# 确认端口绑定
docker port lobster-sandbox
```

### 权限错误

```bash
# 确认以非 root 用户运行
docker exec lobster-sandbox whoami
# 期望输出: sandbox

# 确认特权已丢弃
docker exec lobster-sandbox cat /proc/self/status | grep Cap
# CapEff 应为较小值，不包含危险特权
```

### 容器内磁盘空间不足

```bash
# tmpfs 默认 512MB，如需更大可修改 docker-compose.yml
tmpfs:
  - /tmp:size=1g   # 调整为 1GB
```

---

## 📄 许可证

本项目基于 MIT 许可证开源 — 详见 [LICENSE](../LICENSE) 文件。
