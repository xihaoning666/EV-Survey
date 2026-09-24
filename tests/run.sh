#!/bin/bash
#
# Verification suite for survey.html and backend/collector.gs.
#
#   tests/run.sh              run everything
#   tests/run.sh '2*'         run the case files matching a glob
#
# Each case is a fresh process, because the entry link is read once at page load.
# The runtime is JavaScriptCore, which ships with macOS, so there is nothing to install.
# Browser APIs come from tests/shim.js and the Apps Script APIs from tests/collector.test.js;
# the survey's own <script> is extracted from survey.html unmodified.

set -u
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
REPO=$(cd "$(dirname "$0")/.." && pwd)

[ -x "$JSC" ] || { echo "JavaScriptCore not found at $JSC"; exit 1; }

BUILD=$(mktemp -d)
trap 'rm -rf "$BUILD"' EXIT

cp "$REPO/tests/shim.js" "$REPO/tests/run.js" "$REPO/tests/collector.test.js" "$BUILD/"
cp "$REPO/suburbs-data.js" "$REPO/backend/collector.gs" "$BUILD/"
mkdir -p "$BUILD/cases"
cp "$REPO"/tests/cases/*.js "$BUILD/cases/"

/usr/bin/python3 - "$REPO" "$BUILD" <<'PY'
import re, sys
repo, build = sys.argv[1], sys.argv[2]
html = open(repo + '/survey.html').read()
script = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S)[0]
# The survey keeps its state in script-scoped bindings; expose the ones the cases assert on.
script += ("\n;globalThis.__S=function(){return S;};globalThis.__CONFIG=CONFIG;"
           "globalThis.__payload=payload;globalThis.__flow=flow;globalThis.__panelUrl=panelUrl;"
           "globalThis.__save=save;globalThis.__LS_KEY=LS_KEY;\n")
open(build + '/app.js', 'w').write(script)
PY

cd "$BUILD" || exit 1
failed=0

for f in cases/${1:-*}.js; do
  echo "== $(basename "$f" .js)"
  cp "$f" case.js
  out=$("$JSC" run.js 2>&1)
  echo "$out"
  case "$out" in *HAS_FAILURES*) failed=$((failed+1));; esac
done

if [ -z "${1:-}" ]; then
  echo "== collector"
  out=$("$JSC" collector.test.js 2>&1)
  echo "$out"
  case "$out" in *HAS_FAILURES*) failed=$((failed+1));; esac
fi

echo
if [ "$failed" -eq 0 ]; then echo "ALL GREEN"; else echo "$failed file(s) with failures"; fi
exit "$failed"
