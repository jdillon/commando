# terraform

declare -g terraform_exe
terraform_exe="$(command -v terraform || true)"

if [[ -z "$terraform_exe" ]]; then
  echo "ERROR: terraform not found in PATH" >&2
  echo "Please install terraform: https://www.terraform.io/downloads" >&2
  exit 1
fi

declare -g terraform_options
terraform_options=""

function terraform {
  local aws_vault=($(aws_vault_prefix))
  log_debug "${aws_vault[@]}" ${terraform_exe} ${terraform_options} "$@"
  "${aws_vault[@]}" ${terraform_exe} ${terraform_options} "$@"
}

function command_terraform {
  terraform "$@"
}

function command_tf {
  terraform "$@"
}

function command_tf_init {
  terraform init "$@"
}

function command_tf_plan {
  terraform plan "$@"
}

function command_tf_apply {
  terraform apply "$@"
}

function command_tf_reformat {
  for s in $basedir/stacks/*; do
    terraform -chdir=$s fmt
  done
}

function command_tf_unlock {
  terraform force-unlock -force $1
}
