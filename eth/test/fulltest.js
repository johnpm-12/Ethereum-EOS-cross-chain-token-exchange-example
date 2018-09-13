const { spawn, spawnSync } = require('child_process');

let exchangeBot = require('../../exchange_bot/exchange_bot.js');

var EOSExchangeableToken = artifacts.require('EOSExchangeableToken');

contract('EOSExchangeableToken', function (accounts) {

    let token;

    before(async function () {
        await EOSExchangeableToken.deployed().then(async instance => {
            token = instance;
            console.log('\nStarting EOS container...');
            // quick_start.sh starts the container, sets up accounts, deploys the contract, and initializes the token
            spawnSync('cd ../eos/scripts && sh quick_start.sh', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
            console.log('Started EOS.\nWaiting 15 seconds for EOS to start producing blocks and contract to be deployed and initialized...');
            // wait to ensure EOS is ready before we start the tests
            await new Promise(resolve => setTimeout(resolve, 15000));
            console.log('Starting exchange bot...');
            // the exchange bot only starts listening when run is called
            // a connected web3 instance with account 0 unlocked is required, along with the eth address of the contract
            exchangeBot.run(web3, token.address);
            console.log('Started exchange bot.\nStarting tests...\n');
        });
    });

    after(function () {
        console.log('\nStopping exchange bot...');
        // stop functions ensures that web3 stops listening and the EOS polling loop stops, to prevent the tests from hanging at the end
        exchangeBot.stop();
        console.log('Stopped exchange bot.\nStopping EOS...');
        // clean up the docker container to ensure there is no system impact after the tests are done
        spawn('docker stop eosio_test_chain', [], { 'shell': true });
        console.log('Stopped EOS.\n');
    });

    it('should verify initial supply of token is 10,000 on ETH', function () {
        token.totalSupply.call().then(supply => {
            assert.equal(supply.valueOf(), 10000, 'total supply on ETH is not 10,000');
        });
    });

    it('should verify initial supply of token is 0 on EOS', function () {
        // this spawns a subprocress that runs docker exec which runs a bash command inside the docker container
        // the command inside the docker container is cleos which is the tool used to interface with EOS nodes
        // this specific command returns info about a token initialized on the token contract
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos get currency stats tokenaccount ETHXEOS"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        // the output is in JSON, so parse stdout from the subprocess and compare it to the expected result
        // ETHXEOS is the token symbol
        let cleosResultJSON = JSON.parse(spawnCleosResult.stdout);
        assert.equal(cleosResultJSON.ETHXEOS.supply, '0 ETHXEOS', 'total supply on EOS is not 0');
    });

    it('should verify initial balance of account 0 on ETH is 10,000', function () {
        token.balanceOf.call(accounts[0]).then(balance => {
            assert.equal(balance.valueOf(), 10000, 'balance is not 10,000');
        });
    });

    it('should verify initial balance of account "useraaaaaaab" on EOS is 0', function () {
        // this cleos command returns the balance of an account of a token initialized on the token contract
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos get currency balance tokenaccount useraaaaaaab ETHXEOS"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        // cleos outputs nothing if the account has no balance, so sdtout should be an empty string if the balance is 0
        assert.isEmpty(spawnCleosResult.stdout.trim(), 'balance of "useraaaaaaab" on EOS is not 0');
    });

    it('should exchange 1,000 tokens from ETH account 0 to EOS account "useraaaaaaab"', async function () {
        // this ETH transaction destroys tokens from the calling address and lets the bot know what EOS account to issue the same number of tokens to
        // there are no asserts in this test because if the transaction fails, this statement will throw which will fail the test
        await token.exchangeToEOS(1000, 'useraaaaaaab', { 'from': accounts[0] }).then(async () => {
            // if the transaction succeeds, wait for 2 seconds to ensure the bot and other chain have time to react before verifying results
            await new Promise(resolve => setTimeout(resolve, 2000));
        });
    });

    it('should verify current balance of account 0 on ETH is now 9,000', function () {
        token.balanceOf.call(accounts[0]).then(balance => {
            assert.equal(balance.valueOf(), 9000, 'balance is not 9,000');
        });
    });

    it('should verify current balance of account "useraaaaaaab" on EOS is now 1,000', function () {
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos get currency balance tokenaccount useraaaaaaab ETHXEOS"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        assert.isNotEmpty(spawnCleosResult.stdout.trim(), 'balance of "useraaaaaaab" on EOS is 0');
        assert.equal(spawnCleosResult.stdout.trim(), '1000 ETHXEOS', 'balance of "useraaaaaaab" on EOS is not 1,000');
    });

    it('should verify current supply of token is now 9,000 on ETH', function () {
        token.totalSupply.call().then(supply => {
            assert.equal(supply.valueOf(), 9000, 'total supply on ETH is not 9,000');
        });
    });

    it('should verify current supply of token is now 1,000 on EOS', function () {
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos get currency stats tokenaccount ETHXEOS"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        let cleosResultJSON = JSON.parse(spawnCleosResult.stdout);
        assert.equal(cleosResultJSON.ETHXEOS.supply, '1000 ETHXEOS', 'total supply on EOS is not 1,000');
    });

    it('should exchange 300 tokens from EOS account "useraaaaaaab" to ETH account 1', async function () {
        // this cleos command pushes the exchange request transaction from account useraaaaaaab, which does the same thing on EOS as it does on the ETH contract
        spawnSync('docker exec eosio_test_chain sh -c "cleos push action tokenaccount exchangetoeth \'{\\"from\\":\\"useraaaaaaab\\",\\"quantity\\":\\"300 ETHXEOS\\",\\"memo\\":\\"\\",\\"eth_address_to\\":\\"' + accounts[1] + '\\"}\' -p useraaaaaaab"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        // wait to ensure the bot and other chain have time to react before verifying results
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should verify current balance of account "useraaaaaaab" on EOS is now 700', function () {
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos get currency balance tokenaccount useraaaaaaab ETHXEOS"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        assert.isNotEmpty(spawnCleosResult.stdout.trim(), 'balance of "useraaaaaaab" on EOS is 0');
        assert.equal(spawnCleosResult.stdout.trim(), '700 ETHXEOS', 'balance of "useraaaaaaab" on EOS is not 700');
    });

    it('should verify current balance of account 1 on ETH is now 300', function () {
        token.balanceOf.call(accounts[1]).then(balance => {
            assert.equal(balance.valueOf(), 300, 'balance is not 300');
        });
    });

    it('should verify current supply of token is now 9,300 on ETH', function () {
        token.totalSupply.call().then(supply => {
            assert.equal(supply.valueOf(), 9300, 'total supply on ETH is not 9,300');
        });
    });

    it('should verify current supply of token is now 700 on EOS', function () {
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos get currency stats tokenaccount ETHXEOS"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        let cleosResultJSON = JSON.parse(spawnCleosResult.stdout);
        assert.equal(cleosResultJSON.ETHXEOS.supply, '700 ETHXEOS', 'total supply on EOS is not 700');
    });

    it('should verify that ETH account 2 cannot exchange non-existent tokens to EOS', function () {
        // this transaction should revert which ensures no event is fired and the exchange bot does nothing
        token.exchangeToEOS(1000, 'useraaaaaaab', { 'from': accounts[2] }).then(() => {
            assert(false, 'transaction did not revert');
        }).catch(() => {
            assert(true);
        });
    });

    it('should verify that EOS account "useraaaaaaac" cannot exchange non-existent tokens to ETH', function () {
        // this command should fail because the account has no tokens to exchange
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos push action tokenaccount exchangetoeth \'{\\"from\\":\\"useraaaaaaac\\",\\"quantity\\":\\"300 ETHXEOS\\",\\"memo\\":\\"\\",\\"eth_address_to\\":\\"' + accounts[3] + '\\"}\' -p useraaaaaaac"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        // when a cleos push action command fails, it outputs the failure message to stderr, which is normally empty
        // since it should fail, we assert that stderr is not empty
        assert.isNotEmpty(spawnCleosResult.stderr, 'transaction did not fail');
    });

    it('should verify that ETH account 1 cannot double spend by exchanging and then transferring tokens before the EOS transaction finishes', function () {
        // only one of these transactions should succeed because account 1 only has 300 tokens
        token.exchangeToEOS(300, 'useraaaaaaab', { 'from': accounts[1] }).then(() => {
            token.transfer(300, { 'from': accounts[1] }).then(() => {
                assert(false, 'second transaction did not revert');
            }).catch(() => {
                assert(true);
            });
        });
    });

    it('should verify that EOS account "useraaaaaaab" cannot double spend by exchanging and then transferring tokens before the ETH transaction finishes', function () {
        // the EOS account should have 1,000 tokens at this point from the previous test cases, so we'll have it exchange all 1,000 and then push a transaction to transfer those same 1,000 to a different EOS account right after
        // the second transaction should fail
        spawnSync('docker exec eosio_test_chain sh -c "cleos push action tokenaccount exchangetoeth \'{\\"from\\":\\"useraaaaaaab\\",\\"quantity\\":\\"1000 ETHXEOS\\",\\"memo\\":\\"\\",\\"eth_address_to\\":\\"' + accounts[4] + '\\"}\' -p useraaaaaaab"', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        let spawnCleosResult = spawnSync('docker exec eosio_test_chain sh -c "cleos transfer useraaaaaaab useraaaaaaac -c tokenaccount \\"1000 ETHXEOS\\" \\"\\""', [], { 'cwd': process.cwd(), 'encoding': 'utf8', 'shell': true });
        assert.isNotEmpty(spawnCleosResult.stderr, 'second transaction did not fail');
    });
});
