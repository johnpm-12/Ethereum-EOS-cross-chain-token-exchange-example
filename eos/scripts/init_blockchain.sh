#!/usr/bin/env bash

# THESE PRIVATE KEYS ARE FOR TESTING PURPOSES ONLY, DO NOT USE THEM ON EOS MAIN NET

set -e
PATH="$PATH:/opt/eosio/bin:/opt/eosio/bin/scripts"
# allows nodeos to be put in foreground later
set -m

# start nodeos in background, which is a local EOS node
nodeos -e -p eosio -d /mnt/dev/data \
  --config-dir /mnt/dev/config \
  --http-validate-host=false \
  --plugin eosio::producer_plugin \
  --plugin eosio::history_plugin \
  --plugin eosio::chain_api_plugin \
  --plugin eosio::history_api_plugin \
  --plugin eosio::http_plugin \
  --http-server-address=0.0.0.0:8888 \
  --access-control-allow-origin=* \
  --contracts-console \
  --verbose-http-errors &
sleep 5s
# sleep to ensure it has time to initialize before we start playing with wallets, accounts, and contracts

# setup eosio system account, and store password in a txt file inside docker (just in case we need it)
cleos wallet create -n eosiomain --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > eosiomain_wallet_password.txt
cleos wallet import -n eosiomain --private-key 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3

# tokenwallet is the wallet associated with the tokenaccount, which is where the token contract will be deployed
cleos wallet create -n tokenwallet --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > token_wallet_password.txt
# owner key
cleos wallet import -n tokenwallet --private-key 5JpWT4ehouB2FF9aCfdfnZ5AwbQbTtHBAwebRXt94FmjyhXwL4K
# active key
cleos wallet import -n tokenwallet --private-key 5JD9AGTuTeD5BXZwGQ5AtwBqHK21aHmYnTetHgk1B3pjj7krT8N

# create tokenaccount with above wallet's public keys
cleos create account eosio tokenaccount EOS6PUh9rs7eddJNzqgqDx1QrspSHLRxLMcRdwHZZRL4tpbtvia5B EOS8BCgapgYA2L4LJfCzekzeSr3rzgSTUXRXwNi8bNRoz31D14en9

# deploy the contract to tokenaccount
deploy_contract.sh eth_exchangeable_token tokenaccount tokenwallet $(cat token_wallet_password.txt)

# script for creating more accounts
create_accounts.sh

# this initializes the ETHXEOS token on the newly deployed token contract and sets useraaaaaaaa as the issuer
cleos push action tokenaccount create '{"issuer":"useraaaaaaaa","maximum_supply":"10000 ETHXEOS"}' -p tokenaccount

# create file to indicate blockchain has been initialized, useful for debugging
touch "/mnt/dev/data/initialized"

# put background nodeos to foreground
fg %1
