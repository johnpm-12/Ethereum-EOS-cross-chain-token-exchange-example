## Ethereum EOS cross-chain token exchange example

A basic example showing a token deployed on both Ethereum and EOS that allows holders to transfer their balance from Ethereum to EOS and vice versa

This is implemented with standard token contracts on both blockchains that allow a specific account to issue tokens when it detects a request to do so on the other blockchain. A bot runs that listens for these exchange request transactions and runs a corresponding transaction on the other chain. These cross-chain exchange request transactions destroy the tokens on the starting chain and the bot's followup transaction issues the same amount on the other chain, so the total supply of the token across both blockchains remains invariant (other than some delay with ~15 second block times on Ethereum and ~0.5s on EOS where supplies may be temporarily mismatched while transactions confirm). The exchange request transactions also require the requested wallet or account on the other chain that will receive the funds so the bot knows where the tokens go.

### Requirements

This was developed on Ubuntu 18.04 and not tested on other platforms, however it should work on any machine with standard installs of the following:

* [Docker](https://docs.docker.com/install/)
* [Node.js](https://nodejs.org/en/)
* [NPM](https://www.npmjs.com/get-npm)
* [Truffle](https://truffleframework.com/truffle)

The EOS dev Docker image v1.2.3 must be pulled first as well:

```Bash
docker pull eosio/eos-dev:v1.2.3
```

### Tests

```Bash
npm test
```
This will run the truffle tests in /eth/test/ which will launch a local test EOS node with the contract deployed and accounts set up and will also launch the exchange bot that facilitates cross-chain exchanges. Truffle also launches a local Ethereum testnet (ganache) and deploys the contract and sets up wallets with ETH balances. The tests will also clean up when done by stopping the EOS docker image and the exchange bot.

The tests check the following:
* Initial supply of the token on both blockchains
* Transferring tokens from Ethereum to EOS and the correct Ethereum wallet losing funds that the corresponding EOS account gains
* Transferring tokens from EOS to Ethereum and the correct EOS account losing funds that the corresponding Ethereum wallet gains
* Ensuring the individual balances on both blockchains change as expected in the correct wallets/accounts
* Ensuring that the total supply of the token across both chains remains invariant
* Ensuring that the supply on one chain goes up exactly the same amount that it goes down on the other chain when a cross-chain exchange occurs
* Ensuring that wallets/accounts with no balance cannot force exchange requests without losing funds
* Ensuring that nobody can double spend

![](https://i.imgur.com/F3aDCuI.png)

### Potential improvements

There is no way for anyone to double spend or issue themselves free money, however the bot could be improved in a number of ways. For example, the bot could wait a reasonable number of blocks before issuing the tokens on the other chain to ensure there are sufficient confirmations on the initial chain. The bot could also maintain storage of transaction hashes on both chains that have alredy been processed so it can be cleanly restarted. It would need to recheck all blocks since the last time it was running to ensure it didn't miss any events. The bot could also store transaction hashes of issue commands on both chains to ensure that the issue transactions actually finished. On Ethereum, gas price fluctuations could cause transactions to linger for days, and the bot could watch for that and resend the transactions with a higher gas price. Also, the contracts could be modified to have the user send along EOS or ETH so the bot always has a balance to execute the transactions. The bot could also verify that requested accounts exist on EOS before submitting a transaction, and if they don't, it can go back and reissue the tokens on ETH. It can't do exactly the same going the other way, but it can at least check for user input errors on ETH addresses and reissue back on EOS if the user entered an invalid ETH address. Or there is also the possibility of having the bot not even send any transactions, but only act as a verification service that provides hashed digests proving to the contracts that the bot has verified the request transaction has been mined. The contracts would need to be modified to account for that and be able to check that the provided digest was signed by the bot's key. This method may seem better, but it requires that the user go through 3 steps just to exchange their tokens: request transaction on chain 1, ask bot for verification code, and issue transaction on chain 2. The current implementation only requires 1 step (request transaction on chain 1) and is just as secure.
