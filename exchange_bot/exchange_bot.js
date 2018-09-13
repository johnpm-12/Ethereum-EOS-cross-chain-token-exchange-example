// The bot watches the Ethereum token smart contract for transactions requesting an exchange to an EOS account.
// It issues the same number of tokens that were destroyed on the Ethereum contract to the requested account on the EOS contract.
// It also does the same exchange from EOS to ETH contract.
// The contract functions to request the exchange require the account info of the other chain to be passed in.
// The bot requires a connected web3 instance with account 0 unlocked with issue authority and the token address to be passed in when run.
// It assumes the token contract is at "tokenaccount" on EOS and "useraaaaaaaa" is the account with issue authority.
// These can be easily modified and are only hardcoded for testing.

// spawn is required to spawn subprocesses for executing cleos commands inside the EOS docker container
const { spawn } = require('child_process');
// need the ETH token ABI to interact with it with web3
let tokenContractABI = require('../eth/build/contracts/EOSExchangeableToken.json').abi;

// initialize some internal module variables
let web3;
let tokenContract;
let stopped = false;
let ethEvent;
let eosHeight = -1;

// this function loops and gets the latest block number from EOS and then checks every newly mined unchecked block for transactions of users exchanging their tokens to ETH
let pollEOS = () => {
    if (!stopped) {
        // grab latest block number
        let spawnProcess = spawn('docker exec eosio_test_chain sh -c "cleos get info"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        spawnProcess.stdout.on('data', data => {
            let block = JSON.parse(data).head_block_num;
            // this initializes the locally stored height, so the bot currently does not replay past transactions
            if (eosHeight == -1) {
                if (block == 0) {
                    eosHeight = block;
                } else {
                    eosHeight = block - 1;
                }
            }
            while (eosHeight < block) {
                eosHeight++;
                // grab the specific block info
                let spawnProcess2 = spawn('docker exec eosio_test_chain sh -c "cleos get block ' + eosHeight + '"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
                spawnProcess2.stdout.on('data', data => {
                    // parse the block info for matching actions inside matching transactions
                    for (let transaction of JSON.parse(data).transactions) {
                        if (transaction.status == 'executed') {
                            for (let action of transaction.trx.transaction.actions) {
                                if (action.account == 'tokenaccount' && action.name == 'exchangetoeth') {
                                    // grab the required details from the action
                                    let amount = action.data.quantity.split(' ')[0];
                                    let ethAddress = action.data.eth_address_to;
                                    // issue the right amount on the ETH contract
                                    tokenContract.issue(ethAddress, amount, { 'from': web3.eth.accounts[0] });
                                }
                            }
                        }
                    }
                });
                spawnProcess2.stderr.on('data', data => {
                    console.error(`stderr: ${data}`);
                });
            }
            setTimeout(pollEOS, 250);
        });
        spawnProcess.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });
    }
};

module.exports.run = function (w3, contractAddress) {
    // this initializes web3, the ETH token contract object, and the eth event object which are used elsewhere
    web3 = w3;
    tokenContract = web3.eth.contract(tokenContractABI).at(contractAddress);
    ethEvent = tokenContract.ExchangeToEOS();
    // start watching for the event
    ethEvent.watch(function (error, result) {
        if (!error) {
            // grab the relevant details from the event info
            let value = result.args._value.valueOf();
            let eosAccount = result.args._eosAccount;
            // issue the tokens on EOS
            let command = 'docker exec eosio_test_chain sh -c "cleos push action tokenaccount issue \'{\\"to\\":\\"' + eosAccount + '\\",\\"quantity\\":\\"' + value + ' ETHXEOS\\",\\"memo\\":\\"\\"}\' -p useraaaaaaaa"';
            spawn(command, [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        }
    });
    // start the EOS polling loop
    setTimeout(pollEOS, 0);
};

module.exports.stop = function () {
    // var stopped tells the EOS loop to stop polling
    stopped = true;
    // and this tells the ETH event to stop listening
    ethEvent.stopWatching();
};
