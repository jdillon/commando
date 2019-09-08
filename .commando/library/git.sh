#
# Git support
#

function __git_module {
  declare -g git_executable='git'
  declare -g git_options=

  function git {
    resolve_executable 'git' "$git_executable" git_executable
    log "Running: $git_executable $git_options $*"

    "$git_executable" ${git_options} "$@"
  }
}

require_module util.sh

define_module __git_module "$@"
