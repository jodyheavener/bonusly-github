# Bonusly for GitHub

Award Bonusly points for successful Pull Request merges.

⚠️ **This is not finished yet.**

## Usage

First, set the following secrets on your repo:

```zsh
# A Bonusly API Access Token
# https://bonus.ly/api
BONUSLY_API_TOKEN

# A GitHub Personal Access Token
# https://github.com/settings/tokens/new
GH_API_TOKEN
```

Then set up a new workflow:

⚠️ These workflow instructions will not work because the repo is currently private.

```yaml
name: Bonusly

on:
  pull_request:
    types: [closed]

jobs:
  merge-allocate:
    runs-on: ubuntu-latest
    name: Merge allocate
    steps:
      - uses: actions/checkout@v2
      - uses: jodyheavener/bonusly-github@0.1.0
        if: github.event.pull_request.merged
        with:
          bonusly-token: ${{ secrets.BONUSLY_API_TOKEN }}
          github-token: ${{ secrets.GH_API_TOKEN }}
          default-hashtag: '#awesome'
```

Now, anyone who would like to award the commit authors of a merged Pull Request can indicate so by leaving a comment on it in one of the following formats:

```
@bonusly +[amount] [message]
@bonusly [amount] [message]
@bonusly [amount] points [message]
```

When the Pull Request is merged the points will be awarded and a comment will be left to let you know who got what and if any issues occurred.

**Some notes about this process:**

- The number of points are awarded to each email address associated with a commit in the PR. This includes co-authored commits.
- Comments can contain both the point assignment and other messaging. Just make sure they're on separate lines.
- Point assignment messages need to include a hashtag, per Bonusly's rules. If one is not included, the configured default will be automatically appended.
- Points are only awarded on a successful merge, which means point assignment comments can be added and removed at any point before merging.
- Comment authors must have a publicly available email so GitHub can retrieve it via the API.
- This plugin looks up Bonusly users by email, so commit and comment authors email must be associated with a user in Bonusly for points to be successfully awarded.
- The user that generated the GitHub API token will be used to post the followup comment. Set up a machine user and token to have a "bot" perform API actions and commenting.

## Development

Install the dependencies
```zsh
$ yarn install
```

Build the TypeScript and package it for distribution
```zsh
$ yarn build && yarn package
```

Run the tests
```zsh
$ yarn test
```

## License

MIT
