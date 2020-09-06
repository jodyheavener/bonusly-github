# Bonusly for GitHub

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

## Usage

First, set the following secrets on your repo:

```zsh
# Your Bonusly API Access Token
# https://bonus.ly/api
BONUSLY_API_TOKEN

# A GitHub Personal Access Token
# https://github.com/settings/tokens/new
GITHUB_API_TOKEN
```

Then set up a new workflow:

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
```
