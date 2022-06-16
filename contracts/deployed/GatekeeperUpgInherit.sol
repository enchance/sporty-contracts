//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import './Gatekeeper.sol';


interface IGatekeeper {
    function hasRole(bytes32 role, address account) external view returns (bool);
}

contract GatekeeperUpgInherit is ContextUpgradeable {
    IGatekeeper public gk;

    modifier onlyRole(bytes32 role) {
        require(gk.hasRole(role, _msgSender()), 'You shall not pass!');
        _;
    }

    function _setGatekeeper(address addr) internal virtual {
        require(addr != address(0), 'OOPS: Address cannot be empty');
        gk = IGatekeeper(addr);
    }
}
