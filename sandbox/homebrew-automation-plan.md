# Homebrew Automation Plan for Forge

Based on analysis of beads project's `.github/workflows/`.

## Current State

- Forge uses Bun runtime (not standalone binary)
- Formula at `homebrew-planet57/Formula/forge.rb`
- Manual process: rebuild tarball, compute sha256, update formula

## Beads Approach (Reference)

1. **release.yml** triggers on tag push `v*`
2. GoReleaser builds platform binaries + checksums.txt
3. **update-homebrew.yml** downloads checksums, generates formula, pushes to tap repo
4. Uses `HOMEBREW_TAP_TOKEN` (PAT with repo scope) to push to tap

## Proposed Forge Approach

### Option A: Bun Tarball (Current Approach, Automated)

Keep current formula structure but automate:

```yaml
# .github/workflows/release.yml
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      - name: Build tarball
        run: bun run pack

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: build/*.tgz
          generate_release_notes: true

  update-homebrew:
    needs: release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get version
        id: version
        run: echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Download tarball and compute sha256
        run: |
          curl -sL "https://github.com/jdillon/forge/releases/download/v${{ steps.version.outputs.version }}/planet57-forge-${{ steps.version.outputs.version }}.tgz" -o forge.tgz
          echo "sha256=$(shasum -a 256 forge.tgz | awk '{print $1}')" >> $GITHUB_OUTPUT
        id: checksum

      - name: Update formula
        run: |
          # Generate formula with version and sha256 substituted
          # (template approach or sed replacement)

      - name: Push to homebrew-planet57
        env:
          HOMEBREW_TAP_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
        run: |
          git clone "https://x-access-token:${HOMEBREW_TAP_TOKEN}@github.com/jdillon/homebrew-planet57.git" tap
          cp Formula/forge.rb tap/Formula/forge.rb
          cd tap
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add Formula/forge.rb
          git commit -m "Update forge to ${{ steps.version.outputs.version }}"
          git push
```

### Option B: Standalone Binary (Future)

Use `bun build --compile` for zero-dependency binary:

1. Build binaries for darwin-arm64, darwin-x64, linux-x64
2. Upload as release assets
3. Formula uses platform-specific URLs like beads

**Pros**: No Bun dependency for users
**Cons**: Larger binaries (~50MB), more complex build

### Recommendation

**Phase 1**: Option A (automate current approach)
- Low effort, matches current manual process
- Gets automation working quickly

**Phase 2**: Option B (standalone binary)
- Better UX for users
- Add when ready for wider distribution

## Implementation Steps

1. [ ] Create `.github/workflows/release.yml`
2. [ ] Create formula template with placeholders
3. [ ] Create `HOMEBREW_TAP_TOKEN` secret (PAT with repo scope)
4. [ ] Test with a v0.1.0 tag push
5. [ ] Document release process

## Secrets Required

- `HOMEBREW_TAP_TOKEN`: Personal Access Token with `repo` scope for pushing to homebrew-planet57

## Formula Template

```ruby
class Forge < Formula
  desc "Modern CLI framework for deployments"
  homepage "https://github.com/jdillon/forge"
  url "https://github.com/jdillon/forge/releases/download/v{{VERSION}}/planet57-forge-{{VERSION}}.tgz"
  sha256 "{{SHA256}}"
  license "Apache-2.0"
  version "{{VERSION}}"

  depends_on "oven-sh/bun/bun"

  def install
    # ... (existing install logic)
  end
end
```

## Open Questions

1. Should we keep local tarball testing workflow separate?
2. Do we want a manual dispatch trigger for testing?
3. Should formula live in forge repo or just homebrew-planet57?
