# 龙虾盒子（OpenClaw Sandbox）
# 一次性隔离沙盒 — 让 AI Agent 在铁笼中全力发挥，完全碰不到宿主机
#
# 安全设计原则：
#   1. 使用无特权的非 root 用户运行 AI Agent
#   2. 通过 --cap-drop ALL 丢弃所有 Linux 特权
#   3. 通过 --read-only + tmpfs 限制文件写入范围
#   4. 网络访问受限（可配置 --network none 完全断网）
#   5. 容器销毁即清除所有数据，零残留

FROM ubuntu:22.04

LABEL maintainer="OpenClaw Sandbox"
LABEL description="AI Agent 专用安全隔离沙盒 — 物理隔离宿主机，用完即毁"

# 防止 apt 交互式询问
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

# ── 基础系统层 ──────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # VNC 桌面环境（让用户能"看着"AI干活）
    tigervnc-standalone-server \
    tigervnc-common \
    xfce4 \
    xfce4-terminal \
    xfce4-taskmanager \
    # 基础工具
    wget \
    curl \
    git \
    python3 \
    python3-pip \
    python3-venv \
    # 进程管理
    supervisor \
    # 字体与中文支持
    fonts-noto-cjk \
    locales \
    # 轻量浏览器（供 AI Agent 使用）
    chromium-browser \
    # 安全审计工具
    auditd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 配置中文 locale
RUN locale-gen zh_CN.UTF-8
ENV LANG=zh_CN.UTF-8 \
    LANGUAGE=zh_CN:zh \
    LC_ALL=zh_CN.UTF-8

# ── 安全层：创建无特权沙盒用户 ────────────────────────────────────────────
# 明确不赋予 sudo、不加入 docker 组，严格最小权限
RUN groupadd --gid 1000 sandbox \
    && useradd --uid 1000 --gid sandbox \
       --shell /bin/bash \
       --create-home \
       --home-dir /home/sandbox \
       sandbox

# ── 工作目录：仅 sandbox 用户可写 ─────────────────────────────────────────
RUN mkdir -p /home/sandbox/workspace \
    && mkdir -p /home/sandbox/.vnc \
    && chown -R sandbox:sandbox /home/sandbox

# ── VNC 配置 ──────────────────────────────────────────────────────────────
# 必须在构建时通过 --build-arg VNC_PASSWORD=<password> 提供，不设默认值
ARG VNC_PASSWORD
RUN test -n "${VNC_PASSWORD}" || { echo "ERROR: VNC_PASSWORD build arg is required"; exit 1; } \
    && echo "${VNC_PASSWORD}" | vncpasswd -f > /home/sandbox/.vnc/passwd \
    && chmod 600 /home/sandbox/.vnc/passwd \
    && chown sandbox:sandbox /home/sandbox/.vnc/passwd

# VNC 启动脚本
COPY --chown=sandbox:sandbox config/xstartup /home/sandbox/.vnc/xstartup
RUN chmod +x /home/sandbox/.vnc/xstartup

# ── Supervisor 配置（多进程管理）──────────────────────────────────────────
COPY config/supervisord.conf /etc/supervisor/conf.d/sandbox.conf

# ── 安全资源限制配置 ───────────────────────────────────────────────────────
# 通过 /etc/security/limits.conf 限制沙盒用户资源
RUN echo "sandbox soft nproc  256"   >> /etc/security/limits.conf \
    && echo "sandbox hard nproc  512"   >> /etc/security/limits.conf \
    && echo "sandbox soft nofile 1024"  >> /etc/security/limits.conf \
    && echo "sandbox hard nofile 4096"  >> /etc/security/limits.conf

# ── 文件系统隔离：只有 workspace 目录可写 ─────────────────────────────────
# 容器启动后通过 docker run --read-only 配合 --tmpfs 实现
# 在此阶段设定 workspace 为唯一持久化输出目录
VOLUME ["/home/sandbox/workspace"]

# ── 暴露端口 ──────────────────────────────────────────────────────────────
# 5900: VNC 标准端口
# 6080: noVNC Web 界面（可选，通过 noVNC 代理）
EXPOSE 5900 6080

# ── 健康检查 ──────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD pgrep Xtigervnc > /dev/null || exit 1

# ── 以非 root 用户启动 ────────────────────────────────────────────────────
USER sandbox
WORKDIR /home/sandbox

# 使用 supervisord 统一管理 VNC 等进程
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/sandbox.conf"]
