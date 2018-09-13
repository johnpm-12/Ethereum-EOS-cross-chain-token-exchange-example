pragma solidity ^0.4.24;

import "./imports/Managed.sol";
import "./imports/SafeMath.sol";

contract EOSExchangeableToken is Managed {

    // gotta protect against over/under flows
    using SafeMath for uint256;

    // standard ERC20 stuff
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    // address that has authority to issue and destroy tokens, will be assigned to the exchange bot
    address public issuer;

    event Issue(address indexed _to, uint256 _value);
    event Destroy(address indexed _from, uint256 _value);

    // event that is fired when an address requests transferring their tokens cross-chain
    event ExchangeToEOS(address indexed _from, uint256 _value, string _eosAccount);

    // set up the token with an initial supply in the hands of the issuer
    constructor(string _name, string _symbol, uint8 _decimals, uint256 _initialSupply) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply;
        issuer = msg.sender;
    }

    // ensures that only the issuer address can issue or destroy
    modifier issuerOnly() {
        require(msg.sender == issuer);
        _;
    }

    // normal ERC20 functions, implemented with safemath
    function transfer(address _to, uint256 _value) public returns (bool) {
        balanceOf[msg.sender] = balanceOf[msg.sender].minus(_value);
        balanceOf[_to] = balanceOf[_to].plus(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        balanceOf[_from] = balanceOf[_from].minus(_value);
        balanceOf[_to] = balanceOf[_to].plus(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_value == 0 || allowance[msg.sender][_spender] == 0);
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function issue(address _to, uint256 _value) public issuerOnly {
        balanceOf[_to] = balanceOf[_to].plus(_value);
        totalSupply = totalSupply.plus(_value);
        emit Issue(_to, _value);
        emit Transfer(0x0, _to, _value);
    }

    function destroy(address _from, uint256 _value) public issuerOnly {
        balanceOf[_from] = balanceOf[_from].minus(_value);
        totalSupply = totalSupply.minus(_value);
        emit Destroy(_from, _value);
        emit Transfer(_from, 0x0, _value);
    }

    // this is the function you call to request your tokens to be transferred to EOS
    // it destroys your tokens initially and then fires the event which the bot listens for to issue the tokens on the other chain
    // doing it this way ensures that nobody can trick the bot into issuing them tokens and ensures that the tokens are destroyed on the initial chain before the bot even starts issuing them on the other chain
    function exchangeToEOS(uint256 _value, string _eosAccount) public {
        balanceOf[msg.sender] = balanceOf[msg.sender].minus(_value);
        totalSupply = totalSupply.minus(_value);
        emit Destroy(msg.sender, _value);
        emit Transfer(msg.sender, 0x0, _value);
        emit ExchangeToEOS(msg.sender, _value, _eosAccount);
    }

    // allows manager to change the issuer of the token
    function setIssuer(address _issuer) public managerOnly {
        issuer = _issuer;
    }

}
