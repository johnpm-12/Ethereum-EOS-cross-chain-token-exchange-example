var EOSExchangeableToken = artifacts.require('./EOSExchangeableToken.sol');

module.exports = function (deployer) {
    // deploy the token with symbol ETHXEOS and 10000 initial supply
    deployer.deploy(EOSExchangeableToken, 'ETH EOS Crosschain Token', 'ETHXEOS', 0, 10000);
};
