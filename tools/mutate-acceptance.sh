#!/bin/bash
# Acceptance script for the six law mutations (Evaluation 2026-10-13 engineering §1).
# Usage: tools-mutate.sh <label>   (label = before|after)
# Applies each mutation, runs the targeted suite, records RED/GREEN, reverts.
set -u
LABEL="$1"
cd "$(dirname "$0")/.."
LOG="mutation-$LABEL.log"
git update-index -q --refresh || true
if ! git diff --quiet || ! git diff --cached --quiet; then echo "TREE DIRTY — abort"; exit 1; fi
revert() { git checkout -- src tests 2>/dev/null; }
log() { echo "$@" | tee -a "$LOG"; }

log "== mutation ledger ($LABEL) $(git rev-parse --short HEAD) $(date) =="

run_unit() { # $1 name, $2 test file
  local out
  out=$(npx vitest run "$2" 2>&1)
  local fails
  fails=$(echo "$out" | grep -oE '[0-9]+ failed' | head -1)
  local filefails
  filefails=$(echo "$out" | grep -E 'Test Files' | head -1)
  log "M$1: ${fails:-'0 failed'} | $filefails"
}

# --- M1 THE INPUT LAW (wind never resolves) ---
revert
python3 - <<'EOF'
import re
p='src/world/world.ts'; s=open(p).read()
s=s.replace("level.inputs && level.inputs.windEvery && level.inputs.windDeltaV",
            "level.inputs && level.inputs.windEvery && level.inputs.windDeltaV && false",1)
open(p,'w').write(s)
EOF
log "-- M1 input law: wind never resolves (world.ts ctor) --"
run_unit 1 tests/unit/house-levels.test.ts
revert

# --- M2 tally hash-on-read (state() also folds the hash) ---
python3 - <<'EOF'
p='src/world/world.ts'; s=open(p).read()
s=s.replace("  state(): WorldState {\n    return this.current;",
            "  state(): WorldState {\n    this.hashValue = (this.hashValue + 1) >>> 0; // MUTATION\n    return this.current;",1)
open(p,'w').write(s)
EOF
log "-- M2 tally hash-on-read (state() folds hash) --"
run_unit 2 tests/unit/tally.test.ts
revert

# --- M3 v1 writer retired (writer always stamps v:2) ---
python3 - <<'EOF'
p='src/share/share.ts'; s=open(p).read()
s=s.replace("const version = v2 || payload.v === 2 ? 2 : 1;",
            "const version = 2; // MUTATION",1)
open(p,'w').write(s)
EOF
log "-- M3 v1 link writer always v:2 --"
run_unit 3 tests/unit/share-v1.test.ts
revert

# --- M4 seating law (drop sim free+rebuild from reset()) ---
python3 - <<'EOF'
p='src/world/world.ts'; s=open(p).read()
old="""    this.sim.free();
    this.sim = createSimWorld();
    this.addTrackColliders();
    this.car = this.spawnCar();
"""
assert old in s
s=s.replace(old,"    // MUTATION: seating rebuild dropped\n",1)
open(p,'w').write(s)
EOF
log "-- M4 seating: reset() without sim free+rebuild --"
run_unit 4 tests/unit/seating.test.ts
revert

# --- M5 ghost coupling: 0.02 impulse at the boot shell's ghost.sync seam ---
python3 - <<'EOF'
p='src/boot.ts'; s=open(p).read()
old="    ghost.sync(w.status === 'idle' ? 0 : w.time, premiereOwned);"
assert old in s, "sync seam not found"
new=old+"\n    // MUTATION: 0.02 impulse at the coupling line\n    if (w.status === 'running') (w as unknown as { car: { chassis: { applyImpulse(v: {x:number;y:number;z:number}, wake: boolean): void } } }).car.chassis.applyImpulse({ x: 0, y: 0.02, z: 0 }, true);"
s=s.replace(old,new,1)
open(p,'w').write(s)
EOF
log "-- M5 shell ghost.sync coupling impulse -> ghosts.spec --"
E2E_PORT=${MUT_PORT:-5140} npx playwright test ghosts.spec.ts --reporter=list 2>&1 | tail -8 | tee -a "$LOG"
git checkout -- src
log ""

# --- M6 pixel gate: enforced views with CI=1 and NO baseline ---
log "-- M6 pixel truth: enforced views, CI=1, no baseline (expect RED x2) --"
CI=1 GQA_BASELINE_DIR=tests/visual/nonexistent E2E_PORT=$((${MUT_PORT:-5140}+1)) \
  npx playwright test visual -g "game shell kitchen01 idle|front-door cross-section idle" --reporter=list 2>&1 | tail -8 | tee -a "$LOG"
log ""
log "== done ($LABEL) =="
