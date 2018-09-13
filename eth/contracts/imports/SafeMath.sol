pragma solidity ^0.4.24;

// standard safemath library for unsigned ints, divide is unnecessary because EVM already throws when dividing by 0
// change functions to public instead of internal to use as a deployed library instead of inlining bytecode
// change library to contract to inherit it

library SafeMath {

    function plus(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }

    function minus(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(a >= b);
        return a - b;
    }

    function times(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

}
