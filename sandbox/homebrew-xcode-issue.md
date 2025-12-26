# Homebrew Xcode Version Check Issue

## Problem

Installing forge via Homebrew on deimos fails:

```
Error: Your Xcode (16.4) is too outdated.
Please update to Xcode 26.0 (or delete it).
```

## Root Cause

Homebrew enforces minimum Xcode versions per macOS in [`Library/Homebrew/os/mac/xcode.rb`](https://github.com/Homebrew/brew/blob/master/Library/Homebrew/os/mac/xcode.rb):

```ruby
def self.minimum_version
  case macos
  when "26" then "26.0"   # macOS 26 requires Xcode 26.0
  when "15" then "16.0"
  ...
```

The check triggers because the forge formula has **no bottles**. Homebrew assumes "no bottle = needs to build = needs Xcode" even though forge only extracts a tarball.

## Solution: Add Bottles

Bottles tell Homebrew "pre-built, no compilation needed" and skip the Xcode check.

Since forge just extracts a tarball, bottles would be identical content. Options:

1. **Build bottles in CI** - GitHub Actions can build bottles for each macOS version
2. **Use `bottle :unneeded`** - Tell Homebrew this formula never needs building (may not work for taps)

## Workaround

Install latest Xcode via xcodes, then switch back to older version for iOS builds:

```bash
# Install Xcode 26.x
xcodes install 26.0

# After brew install, switch back
sudo xcode-select -s /Applications/Xcode-16.4.0.app
```

## References

- [Homebrew/brew xcode.rb source](https://github.com/Homebrew/brew/blob/master/Library/Homebrew/os/mac/xcode.rb)
- [Discussion #3822 - "requires nonexistent xcode version"](https://github.com/orgs/Homebrew/discussions/3822)
- [Issue #18736 - Homebrew requires Xcode when CLT is sufficient](https://github.com/Homebrew/brew/issues/18736)
