# Homebrew formula for Commando
# Install: brew tap jdillon/planet57 && brew install commando

class Commando < Formula
  desc "Modern CLI framework for deployments"
  homepage "https://github.com/jdillon/commando"
  url "https://github.com/jdillon/commando/releases/download/v__VERSION__/planet57-commando-__VERSION__.tgz"
  sha256 "__SHA256__"
  license "Apache-2.0"
  version "__VERSION__"

  depends_on "oven-sh/bun/bun"

  def install
    # Stage package to libexec
    libexec.install Dir["*"]

    # Symlink the wrapper script
    # First run will auto-bootstrap ~/.commando
    bin.install_symlink libexec/"bin/cmdo" => "cmdo"
  end

  def caveats
    "First run will complete installation to ~/.commando\n\n" \
    "User data (config, plugins, state) persists across upgrades.\n" \
    "To fully remove, also delete ~/.commando after uninstall.\n"
  end

  test do
    # Just verify the wrapper exists and is executable
    assert_predicate bin/"cmdo", :executable?
  end
end
