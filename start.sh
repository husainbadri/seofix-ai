#!/usr/bin/env bash
# start.sh – Start the SEOFix AI Platform + Crawler Worker
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRAWLER_DIR="$SCRIPT_DIR/apps/crawler"
CRAWLER_PORT="${CRAWLER_PORT:-7001}"
NODE_PORT="${PORT:-3000}"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     SEOFix AI Platform – Enterprise Engine           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"

# ── Kill previous instances ──────────────────────────────────────────────────
echo -e "${YELLOW}Stopping previous instances...${NC}"
pkill -f "python3 api.py" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
sleep 1

# ── Start Scrapy Worker ──────────────────────────────────────────────────────
echo -e "${GREEN}Starting Scrapy Crawler Worker on port $CRAWLER_PORT...${NC}"
cd "$CRAWLER_DIR"
nohup python3 api.py > /tmp/scrapy-worker.log 2>&1 &
SCRAPY_PID=$!

# Wait for Scrapy worker to be ready
for i in {1..8}; do
    sleep 1
    if curl -s "http://127.0.0.1:$CRAWLER_PORT/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Scrapy Worker is ready (PID: $SCRAPY_PID)${NC}"
        break
    fi
done

# ── Start Node.js Server ─────────────────────────────────────────────────────
echo -e "${GREEN}Starting SEOFix AI Node.js Platform on port $NODE_PORT...${NC}"
cd "$SCRIPT_DIR"
nohup node server.js > /tmp/node-server.log 2>&1 &
NODE_PID=$!

sleep 2


# Verify server
if curl -s "http://localhost:$NODE_PORT/api/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ SEOFix AI Server is online (PID: $NODE_PID)${NC}"
else
    echo -e "${YELLOW}⚠️ Server starting up... check logs at /tmp/node-server.log${NC}"
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ SEOFix AI Platform:  http://localhost:$NODE_PORT${NC}"
echo -e "${GREEN}  ✓ Crawler Worker API:  http://127.0.0.1:$CRAWLER_PORT${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo ""
