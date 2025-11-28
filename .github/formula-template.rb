# Homebrew formula for Forge
# Install: brew tap jdillon/planet57 && brew install forge

class Forge < Formula
  desc "Modern CLI framework for deployments"
  homepage "https://github.com/jdillon/forge"
  url "https://github.com/jdillon/forge/releases/download/v__VERSION__/planet57-forge-__VERSION__.tgz"
  sha256 "__SHA256__"
  license "Apache-2.0"
  version "__VERSION__"

  depends_on "oven-sh/bun/bun"

  def install
    # Stage package to libexec
    libexec.install Dir["*"]

    # Symlink the wrapper script
    # First run will auto-bootstrap ~/.forge
    bin.install_symlink libexec/"bin/forge" => "forge"
  end

  def caveats
    "First run will complete installation to ~/.forge\n\n" \
    "User data (config, plugins, state) persists across upgrades.\n" \
    "To fully remove, also delete ~/.forge after uninstall.\n"
  end

  test do
    # Just verify the wrapper exists and is executable
    assert_predicate bin/"forge", :executable?
  end
end
