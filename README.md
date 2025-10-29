# Forge - Bash CLI Framework

A simple, modular framework for building project-specific CLI tools in bash.

## Status

🚧 **Work in Progress** - This repository contains the extracted forge framework from existing projects and analysis for a next-generation redesign.

## Contents

- `forge` - Main framework script (current implementation)
- `lib/` - Reusable modules (aws, terraform, keybase)
- `examples/` - Example configuration files
- `docs/` - Framework documentation and comparison analysis
- `tmp/` - Session notes and handoff documents

## Documentation

### For Current Implementation

See the example projects:
- `/Users/jason/ws/cirqil/admin/` - Admin project with forge
- `/Users/jason/ws/cirqil/website/cirqil.com/` - Website project with forge

### For Redesign

- **[Framework Comparison](docs/FRAMEWORK_COMPARISON.md)** - Detailed analysis of forge vs commando frameworks
- **[Session Handoff](tmp/SESSION_HANDOFF.md)** - Complete context for next development session

## Goals

Design a next-generation CLI framework that:

1. **Installs once** in system PATH (e.g., `/usr/local/bin/forge`)
2. **Discovers config** from current working directory
3. **Shares modules** across projects (no duplication)
4. **Keeps simplicity** of current forge
5. **Adds features** from commando (help, discovery)
6. **Stays in bash** for maximum compatibility

## Current Features

### Forge Framework

- Simple function-based commands
- Module system via bash sourcing
- Error trapping with helpful messages
- Debug logging (`log_debug`)
- Optional aws-vault integration
- Environment variable configuration

### Available Modules

- **aws.bash** - AWS CLI wrapper with optional aws-vault
- **terraform.bash** - Terraform wrapper using aws-vault
- **keybase.bash** - Keybase integration helpers

## Usage (Current Implementation)

### Project Setup

```bash
# Copy forge to project
cp forge /path/to/project/

# Create config directory
mkdir -p /path/to/project/.forge

# Create config file
cat > /path/to/project/.forge/config.bash <<EOF
source "\${forgedir}/aws.bash"
source "\${forgedir}/terraform.bash"
EOF

# Create local config (gitignored)
cat > /path/to/project/.forge/local.bash <<EOF
aws_vault_profile="my-profile"
EOF
```

### Running Commands

```bash
cd /path/to/project
./forge aws sts get-caller-identity
./forge tf plan
```

## Next Steps

See [Session Handoff](tmp/SESSION_HANDOFF.md) for detailed next steps and design proposals.

### Immediate Priorities

1. Implement CWD-aware config discovery
2. Create shared module repository structure
3. Add backward compatibility shim
4. Build proof of concept

## References

- **Commando Framework**: `/Users/jason/ws/jdillon/commando-bash/`
- **Admin Project**: `/Users/jason/ws/cirqil/admin/`
- **Website Project**: `/Users/jason/ws/cirqil/website/cirqil.com/`

## License

TBD
