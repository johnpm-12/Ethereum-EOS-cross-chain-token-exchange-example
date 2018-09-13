#!/usr/bin/env bash

# THESE PRIVATE KEYS ARE FOR TESTING PURPOSES ONLY, DO NOT USE THEM ON EOS MAIN NET

set -o errexit
PATH="$PATH:/opt/eosio/bin"

# create 3 accounts with wallets unlocked and ready to use on keosd
cleos wallet create -n useraaaaaaaawallet --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > useraaaaaaaa_wallet_password.txt
cleos wallet import -n useraaaaaaaawallet --private-key 5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5
cleos create account eosio "useraaaaaaaa" "EOS6kYgMTCh1iqpq9XGNQbEi8Q6k5GujefN9DSs55dcjVyFAq7B6b" "EOS6kYgMTCh1iqpq9XGNQbEi8Q6k5GujefN9DSs55dcjVyFAq7B6b"

cleos wallet create -n useraaaaaaabwallet --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > useraaaaaaab_wallet_password.txt
cleos wallet import -n useraaaaaaabwallet --private-key 5KLqT1UFxVnKRWkjvhFur4sECrPhciuUqsYRihc1p9rxhXQMZBg
cleos create account eosio "useraaaaaaab" "EOS78RuuHNgtmDv9jwAzhxZ9LmC6F295snyQ9eUDQ5YtVHJ1udE6p" "EOS78RuuHNgtmDv9jwAzhxZ9LmC6F295snyQ9eUDQ5YtVHJ1udE6p"

cleos wallet create -n useraaaaaaacwallet --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > useraaaaaaac_wallet_password.txt
cleos wallet import -n useraaaaaaacwallet --private-key 5K2jun7wohStgiCDSDYjk3eteRH1KaxUQsZTEmTGPH4GS9vVFb7
cleos create account eosio "useraaaaaaac" "EOS5yd9aufDv7MqMquGcQdD6Bfmv6umqSuh9ru3kheDBqbi6vtJ58" "EOS5yd9aufDv7MqMquGcQdD6Bfmv6umqSuh9ru3kheDBqbi6vtJ58"
