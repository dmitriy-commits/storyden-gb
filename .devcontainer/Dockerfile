FROM golang:1.26.4-bookworm

ARG TZ=UTC
ARG TMUX_VERSION=3.6b
ARG NVIM_VERSION=v0.12.2
ENV TZ="$TZ"
ENV DEBIAN_FRONTEND=noninteractive
ENV DEVCONTAINER=true

# Base packages and editor/terminal tooling.
RUN apt-get update \
  && apt-get -y dist-upgrade \
  && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  fd-find \
  git \
  gh \
  jq \
  less \
  man-db \
  openssh-client \
  procps \
  ripgrep \
  sudo \
  unzip \
  xclip \
  xsel \
  xz-utils \
  zsh \
  fzf \
  build-essential \
  pkg-config \
  python3 \
  python3-pip \
  python3-venv \
  shellcheck \
  sqlite3 \
  luarocks \
  libevent-dev \
  libncurses-dev \
  libssl-dev \
  libreadline-dev \
  bison \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js 22.x.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get update \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

# Install Task.
RUN sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Install tmux.
RUN curl -fsSL "https://github.com/tmux/tmux/releases/download/${TMUX_VERSION}/tmux-${TMUX_VERSION}.tar.gz" -o /tmp/tmux.tar.gz \
  && tar -xzf /tmp/tmux.tar.gz -C /tmp \
  && cd /tmp/tmux-${TMUX_VERSION} \
  && ./configure \
  && make -j"$(nproc)" \
  && make install \
  && rm -rf /tmp/tmux-${TMUX_VERSION} /tmp/tmux.tar.gz

# Install Neovim.
RUN ARCH=$(dpkg --print-architecture) && \
  case "$ARCH" in \
    amd64) NVIM_ARCH=x86_64 ;; \
    arm64) NVIM_ARCH=arm64 ;; \
    *) echo "Unsupported arch: $ARCH"; exit 1 ;; \
  esac && \
  curl -fsSL "https://github.com/neovim/neovim/releases/download/${NVIM_VERSION}/nvim-linux-${NVIM_ARCH}.tar.gz" -o /tmp/nvim.tar.gz && \
  rm -rf /opt/nvim && \
  mkdir -p /opt && \
  tar -xzf /tmp/nvim.tar.gz -C /opt && \
  mv "/opt/nvim-linux-${NVIM_ARCH}" /opt/nvim && \
  ln -sf /opt/nvim/bin/nvim /usr/local/bin/nvim && \
  rm -f /tmp/nvim.tar.gz

# Install git-delta.
ARG GIT_DELTA_VERSION=0.18.2
RUN ARCH=$(dpkg --print-architecture) && \
  case "$ARCH" in \
    amd64) DELTA_ARCH=amd64 ;; \
    arm64) DELTA_ARCH=arm64 ;; \
    *) echo "Unsupported arch: $ARCH"; exit 1 ;; \
  esac && \
  curl -fsSLo /tmp/git-delta.deb "https://github.com/dandavison/delta/releases/download/${GIT_DELTA_VERSION}/git-delta_${GIT_DELTA_VERSION}_${DELTA_ARCH}.deb" && \
  dpkg -i /tmp/git-delta.deb && \
  rm /tmp/git-delta.deb

# Install pnpm, language servers, formatters, and Pi globally.
RUN npm install -g \
  pnpm@11 \
  @earendil-works/pi-coding-agent@latest \
  bash-language-server \
  dockerfile-language-server-nodejs \
  prettier \
  typescript \
  typescript-language-server \
  vscode-langservers-extracted \
  yaml-language-server \
  --ignore-scripts

# Install Go tools commonly used by editors.
RUN go install golang.org/x/tools/gopls@latest \
  && go install github.com/go-delve/delve/cmd/dlv@latest \
  && go install mvdan.cc/gofumpt@latest \
  && go install github.com/nametake/golangci-lint-langserver@latest

# Create non-root dev user.
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
  && useradd --uid $USER_UID --gid $USER_GID -m -s /bin/zsh $USERNAME \
  && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME

# Persist shell history and create config dirs.
RUN mkdir -p /commandhistory /workspace /home/$USERNAME/.pi/agent /home/$USERNAME/.config/nvim /home/$USERNAME/.ssh \
  && touch /commandhistory/.zsh_history \
  && chown -R $USERNAME:$USERNAME /commandhistory /workspace /home/$USERNAME

COPY setup-git.sh /usr/local/bin/setup-git.sh
RUN chmod +x /usr/local/bin/setup-git.sh

USER $USERNAME
WORKDIR /workspace

ENV SHELL=/bin/zsh
ENV EDITOR=nvim
ENV VISUAL=nvim
ENV GOPATH=/home/$USERNAME/go
ENV GOMODCACHE=/home/$USERNAME/go/pkg/mod
ENV GOCACHE=/home/$USERNAME/.cache/go-build
ENV PNPM_HOME=/home/$USERNAME/.local/share/pnpm
ENV PATH=$PATH:/home/$USERNAME/.local/share/pnpm:/home/$USERNAME/go/bin

RUN mkdir -p /home/$USERNAME/.local/share/pnpm /home/$USERNAME/.config/tmux /home/$USERNAME/.local/bin /home/$USERNAME/go/pkg/mod /home/$USERNAME/.cache/go-build \
  && echo 'export HISTFILE=/commandhistory/.zsh_history' >> /home/$USERNAME/.zshrc \
  && echo 'export PROMPT_COMMAND="history -a"' >> /home/$USERNAME/.zshrc \
  && echo 'export EDITOR=nvim VISUAL=nvim' >> /home/$USERNAME/.zshrc \
  && echo 'export PNPM_HOME=$HOME/.local/share/pnpm' >> /home/$USERNAME/.zshrc \
  && echo 'export PATH=$HOME/go/bin:$HOME/.local/bin:$PNPM_HOME:$PATH' >> /home/$USERNAME/.zshrc \
  && echo 'alias vim=nvim' >> /home/$USERNAME/.zshrc \
  && echo 'alias ll="ls -lah"' >> /home/$USERNAME/.zshrc \
  && echo 'alias fd=fdfind' >> /home/$USERNAME/.zshrc \
  && echo '[ -f ~/.config/tmux/tmux.conf ] && tmux source-file ~/.config/tmux/tmux.conf >/dev/null 2>&1' >> /home/$USERNAME/.zshrc
