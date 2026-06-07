FROM python:3.13-slim-bookworm

# System packages for git operations, pre-commit, and Ruby native gem compilation.
# build-essential + libffi-dev + zlib1g-dev: needed to compile native gems (e.g. prism)
# pulled in via github-pages → activesupport → minitest → prism.
# git: clone/commit; gnupg2: signed commits; openssh-client: git over SSH;
# locales: avoid pre-commit/locale warnings
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        zlib1g-dev \
        git \
        gnupg2 \
        openssh-client \
        locales && \
    rm -rf /var/lib/apt/lists/*

# uv: copy the prebuilt binaries from the official image (faster than pip install)
COPY --from=ghcr.io/astral-sh/uv:0.11.19 /uv /uvx /bin/

# gitleaks: static binary for the pre-commit secret-scanning hook
COPY --from=ghcr.io/gitleaks/gitleaks:v8.30.1 /usr/bin/gitleaks /usr/local/bin/gitleaks

# pre-commit: install into the system Python so the git hook finds it on PATH
RUN uv pip install --system pre-commit

# Set locale to avoid pre-commit hook errors
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8
