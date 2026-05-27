#!/usr/bin/env bash
# In link đăng nhập Supabase CLI (mở URL trong trình duyệt → Authorize)
set -euo pipefail

export PATH="${HOME}/.local/share/supabase:${PATH}"

python3 <<'PY'
import os, pty, select, subprocess, sys, time

master, slave = pty.openpty()
env = os.environ.copy()
env["PATH"] = os.path.expanduser("~/.local/share/supabase") + ":" + env.get("PATH", "")
p = subprocess.Popen(
    ["supabase", "login", "--no-browser"],
    stdin=master, stdout=slave, stderr=slave,
    env=env,
)
os.close(slave)

print("Đang chờ bạn mở link và bấm Authorize trong trình duyệt...\n", flush=True)

deadline = time.time() + 300
while time.time() < deadline:
    r, _, _ = select.select([master], [], [], 1.0)
    if r:
        chunk = os.read(master, 4096)
        if not chunk:
            break
        text = chunk.decode(errors="replace")
        sys.stdout.write(text)
        sys.stdout.flush()
        if "You are now logged in" in text or "Finished supabase login" in text:
            break
    if p.poll() is not None:
        break

p.wait()
print("\nKiểm tra: supabase projects list", flush=True)
PY
