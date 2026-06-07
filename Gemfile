source "https://rubygems.org"

# Use the github-pages gem so local builds match what GitHub Pages runs in
# production (it pins Jekyll and all plugins to the exact versions GH Pages uses).
gem "github-pages", group: :jekyll_plugins

# Lock the http_parser.rb gem to a version that compiles on newer Ruby.
gem "webrick"

# Avoid compiling prism by avoiding minitest 6+ (which requires prism)
gem "minitest", "< 6"
