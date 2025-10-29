# Example forge configuration
# This file should be placed in .forge/config.bash in your project

#command_default="help"

# Source library modules as needed
# Note: Order matters - aws.bash must be sourced before terraform.bash
source "${forgedir}/aws.bash"
source "${forgedir}/terraform.bash"

# Source your project-specific command modules
# source "${forgedir}/mycommands.bash"
