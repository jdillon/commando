#!/usr/bin/env bash
# Keybase helpers for user management

# Check if a keybase user has uploaded PGP keys
function command_keybase_check {
  local username="$1"

  if [[ -z "$username" ]]; then
    echo "Usage: $basename keybase_check <username>"
    echo ""
    echo "Example: $basename keybase_check axmar"
    exit 1
  fi

  echo "Checking Keybase user: $username"

  # Try to fetch PGP keys from keybase
  local url="https://keybase.io/$username/pgp_keys.asc"
  local response
  local http_code

  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [[ "$http_code" == "200" ]]; then
    echo "✓ User '$username' has PGP keys uploaded to Keybase"
    echo "  URL: https://keybase.io/$username"
    return 0
  elif [[ "$http_code" == "404" ]]; then
    echo "✗ User '$username' exists but has NO PGP keys uploaded"
    echo "  URL: https://keybase.io/$username"
    echo ""
    echo "They need to:"
    echo "  1. Generate a PGP key (if they don't have one)"
    echo "  2. Upload it to Keybase: keybase pgp select"
    echo "  3. Or follow: https://keybase.io/docs/command_line"
    return 1
  else
    echo "✗ Unable to check user '$username' (HTTP $http_code)"
    echo "  The user may not exist on Keybase"
    echo "  URL: https://keybase.io/$username"
    return 1
  fi
}

# Check all users defined in regular_users local
function command_keybase_check_all {
  echo "Checking all users in terraform/stacks/identity/users.tf..."
  echo ""

  # Extract usernames from users.tf
  local users_file="$basedir/stacks/identity/users.tf"

  if [[ ! -f "$users_file" ]]; then
    echo "Error: $users_file not found"
    return 1
  fi

  # Extract keybase usernames from pgp_key lines
  local keybase_users
  keybase_users=$(grep -E 'pgp_key.*=.*"keybase:' "$users_file" | \
                  sed -E 's/.*keybase:([^"]+).*/\1/' | \
                  sort -u)

  if [[ -z "$keybase_users" ]]; then
    echo "No keybase users found in $users_file"
    return 0
  fi

  local failed=0

  while IFS= read -r username; do
    # Don't use 'if !' because it will exit on errexit
    set +o errexit
    command_keybase_check "$username"
    local result=$?
    set -o errexit

    if [[ $result -ne 0 ]]; then
      ((failed++))
    fi
    echo ""
  done <<< "$keybase_users"

  if [[ $failed -gt 0 ]]; then
    echo "⚠️  $failed user(s) are missing PGP keys"
    echo "   Please have them upload keys before running terraform apply"
    return 1
  else
    echo "✓ All users have valid PGP keys"
    return 0
  fi
}
