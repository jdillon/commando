#!/usr/bin/env bash
#
# Commando setup.
#

function __setup {
  local releasedir="$1"
  local projectdir="$2"

  if ${verbose}; then
    log "Release directory: $releasedir"
    log "Project directory: $projectdir"
  fi

  cp -v "$releasedir/commando.sh" "$projectdir"
  cp -vr "$releasedir/.commando" "$projectdir/"

  # HACK: testing
  echo '----8<---'
  find "$projectdir"
  echo '---->----'
}
