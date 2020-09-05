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

First, set a secret in your repo:

```zsh
# Your Bonusly API Access Token
BONUSLY_API_TOKEN
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
        if: github.event.action == 'closed' && github.event.pull_request.merged
        with:
          api-token: ${{ secrets.BONUSLY_API_TOKEN }}
```
