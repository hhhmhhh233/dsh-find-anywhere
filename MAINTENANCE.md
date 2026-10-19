# Maintenance Policy

## Status: as-is, best-effort

This repository is published as a snapshot. It is provided "as is", without warranty of any kind. Maintenance is best-effort only.

## What is not promised

- No commitment to keep the plugin working with future DeepSeek Harness Web UI changes.
- No commitment to review, merge, or respond to issues or pull requests within any timeframe.
- No roadmap, no regular release cadence, no backports, and no security response SLA.
- No new feature development. The current scope is frozen.
- No guarantee that the published tgz matches any particular DSH version.

## What best-effort means

We may fix a clear, reproducible bug or merge a small, low-risk patch when time allows. Silence, a closed issue, or an unmerged pull request is not a judgment on the report; it means the maintainers cannot commit to it.

## For users

- Pin the version or tgz you have tested.
- Review the source before installing. The client bundle runs inside the DSH Web UI page and reads rendered DOM text.
- If an upstream change breaks the plugin, fork it. The MIT license permits this.
- Build locally when needed: `bash scripts/build.sh`. `src/` is the source of truth; `lib/` is generated.
- Because the source repository ignores `lib/`, use the release tgz when you need a prebuilt package, or build it yourself.

## For forks

- You are welcome to fork and maintain your own version.
- If you publish a modified fork, rename the package and plugin id to avoid confusing users.
- Keep the MIT license notice.

## Versioning

`0.1.0` is the published snapshot. No semantic-versioning compatibility promise is made for future changes.
