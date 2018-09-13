#!/usr/bin/env bash

# ensure that the script stops if anything fails
set -e

# force remove the previous eosio container if it exists, but don't stop on failure
docker stop eosio_test_chain || true && docker rm --force eosio_test_chain || true

# change to eos directory
cd "$(dirname "$0")/.."

script="./scripts/init_blockchain.sh"

# run the docker image
docker run --rm --name eosio_test_chain -d \
-p 8888:8888 -p 9876:9876 \
--mount type=bind,src="$(pwd)"/compiled_contracts,dst=/opt/eosio/bin/compiled_contracts \
--mount type=bind,src="$(pwd)"/scripts,dst=/opt/eosio/bin/scripts \
-w "/opt/eosio/bin/" eosio/eos-dev:v1.2.3 /bin/bash -c "$script"
