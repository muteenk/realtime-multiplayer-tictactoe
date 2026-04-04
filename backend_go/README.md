# Minimal Nakama Go RPC

This is a minimal Nakama Go runtime setup with one RPC: `ping`.

## Run

```bash
docker compose down -v --remove-orphans
docker compose up
```

This compose setup mounts your codebase into a `builder` container, compiles `backend.so` into a shared Docker volume, and Nakama reads that plugin from the same volume.

## After changing Go code

```bash
docker compose run --rm builder
docker compose restart nakama
```

## Test RPC

In another terminal:

```bash
# 1) Authenticate with device ID (gets a token)
TOKEN=$(curl -s -X POST "http://127.0.0.1:7350/v2/account/authenticate/device?create=true&username=tester" \
  -u "defaultkey:" \
  -H "Content-Type: application/json" \
  -d '{"id":"device-test-1"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

# 2) Call RPC
curl -s -X POST "http://127.0.0.1:7350/v2/rpc/ping" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:

```json
{"ok":"true","msg":"pong"}
```
