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
    name: Bonusly
    steps:
      - uses: actions/checkout@v2
      - name: Merge allocate
        uses: jodyheavener/bonusly-github@0.1.0
        with:
          api-token: ${{ secrets.BONUSLY_API_TOKEN }}
```
