pragma solidity ^0.4.24;

// simple managed contract

contract Managed {

    address public manager;
    // newManager is for changing the manager, it requires 2 vars because it is done in 2 steps
    address public newManager;

    // manager is initially the deployer of the contract
    constructor() public {
        manager = msg.sender;
    }

    modifier managerOnly() {
        require(msg.sender == manager);
        _;
    }

    // changing the manager is done in 2 steps to ensure a simple input error doesn't break a contract
    function transferManager(address _newManager) public managerOnly {
        newManager = _newManager;
    }

    // the new manager has to accept before it actually changes
    function acceptManager() public {
        require(msg.sender == newManager);
        manager = newManager;
    }

}
