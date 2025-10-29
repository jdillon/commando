# AWS command wrapper with optional aws-vault support

# Global configuration
declare -g aws_vault_use
aws_vault_use="${AWS_VAULT_USE:-true}"  # Default to using aws-vault

declare -g aws_vault_exe
aws_vault_exe="$(command -v aws-vault || true)"

declare -g aws_vault_profile

declare -g aws_vault_options
aws_vault_options="--duration=${AWS_VAULT_DURATION:-15m}"  # Duration for assume-role session (minimum 15m)

declare -g aws_exe
aws_exe="$(command -v aws || true)"

if [[ -z "$aws_exe" ]]; then
  echo "ERROR: aws-cli not found in PATH" >&2
  echo "Please install aws-cli: https://aws.amazon.com/cli/" >&2
  exit 1
fi

declare -g aws_options
aws_options=""

# aws-vault direct command wrapper
function aws_vault {
  ${aws_vault_exe} "$@"
}

# Helper function that returns aws-vault prefix as array or empty
# Usage: local cmd=($(aws_vault_prefix)); "${cmd[@]}" <command>
function aws_vault_prefix {
  if [[ "${aws_vault_use}" == "true" ]] && [[ -n "${aws_vault_profile}" ]]; then
    echo "${aws_vault_exe} exec ${aws_vault_profile} ${aws_vault_options} --"
  fi
}

# aws command wrapper
function aws {
  local aws_vault=($(aws_vault_prefix))
  log_debug "${aws_vault[@]}" ${aws_exe} ${aws_options} "$@"
  "${aws_vault[@]}" ${aws_exe} ${aws_options} "$@"
}

# Command wrapper for forge
function command_aws {
  aws "$@"
}
