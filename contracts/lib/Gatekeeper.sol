//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";


contract Gatekeeper is AccessControl {
    bytes32 public GATEKEEPER = keccak256("GATEKEEPER");
    bytes32 public ARENA_CONTRACT = keccak256("ARENA_CONTRACT");
    bytes32 public ARENA_ADMIN = keccak256("ARENA_ADMIN");
    bytes32 public ARENA_MODERATOR = keccak256("ARENA_MODERATOR");

    constructor(address[] memory admins, address[] memory mods) {

        _grantRole(GATEKEEPER, msg.sender);
        _grantRole(ARENA_ADMIN, msg.sender);
        _grantRole(ARENA_MODERATOR, msg.sender);
        _grantRole(ARENA_CONTRACT, msg.sender);

        _setRoleAdmin(GATEKEEPER, GATEKEEPER);
        _setRoleAdmin(ARENA_ADMIN, GATEKEEPER);
        _setRoleAdmin(ARENA_MODERATOR, ARENA_ADMIN);
        _setRoleAdmin(ARENA_CONTRACT, GATEKEEPER);

        for (uint i; i < admins.length; i++) {
            _grantRole(ARENA_ADMIN, admins[i]);
        }
        for (uint i; i < mods.length; i++) {
            _grantRole(ARENA_MODERATOR, mods[i]);
        }
    }

    function _checkRole(bytes32 role, address account) internal view virtual override {
        if (!hasRole(role, account)) {
            revert('You shall not pass!');
        }
    }
}