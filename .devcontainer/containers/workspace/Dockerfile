FROM debian:trixie

ARG DEV_USER=dev-user
ARG NODE_VERSION=24
ARG DOCKER_GID=995

RUN apt update -qq \
  && apt upgrade -qq -y --no-install-recommends --no-install-suggests \
  && apt -qq -y install \
  --no-install-recommends --no-install-suggests \
  git \
  sudo \
  curl \
  jq \
  procps \
  iputils-ping \
  ca-certificates \
  openssh-client \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN adduser $DEV_USER \
  && adduser $DEV_USER sudo \
  && echo "$DEV_USER ALL=(ALL) NOPASSWD: ALL" >/etc/sudoers.d/$DEV_USER \
  && chmod 0440 /etc/sudoers.d/$DEV_USER \
  && sudo groupadd --gid $DOCKER_GID docker \
  && adduser $DEV_USER docker 


# Add Docker's official GPG key:
RUN apt-get update \
  && install -m 0755 -d /etc/apt/keyrings \
  && sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
  && chmod a+r /etc/apt/keyrings/docker.asc \
  # Add the repository to Apt sources:
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null \
  && apt-get update \
  && apt-get  -y install \
  --no-install-recommends --no-install-suggests \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*


# install nodejs using n
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
  && bash n $NODE_VERSION \
  && rm n \
  && npm install -g npm
