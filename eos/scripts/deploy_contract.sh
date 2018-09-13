#!/usr/bin/env bash

set -o errexit
PATH="$PATH:/opt/eosio/bin"

# change to executable directory
cd "/opt/eosio/bin"

COMPILEDCONTRACTSPATH="$( pwd -P )/compiled_contracts"

# unlock wallet, ignore error if already unlocked
if [ ! -z $3 ]; then ./cleos wallet unlock -n $3 --password $4 || true; fi

# deploy compiled contract
cleos set contract $2 "$COMPILEDCONTRACTSPATH/$1/" --permission $2
