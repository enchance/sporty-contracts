//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";


contract Gatekeeper is AccessControl {
    bytes32 public OWNER = keccak256("OWNER");

    mapping(string => bytes32) public gkroles;

    constructor(address[] memory admins) {
        gkroles['ARENA_OWNER'] = keccak256("ARENA_OWNER");
        gkroles['ARENA_ADMIN'] = keccak256("ARENA_ADMIN");
        gkroles['ARENA_STAFF'] = keccak256("ARENA_STAFF");
        gkroles['ARENA_CONTRACT'] = keccak256("ARENA_CONTRACT");

        _grantRole(OWNER, msg.sender);
        _grantRole(gkroles['ARENA_OWNER'], msg.sender);
        _grantRole(gkroles['ARENA_ADMIN'], msg.sender);
        _grantRole(gkroles['ARENA_STAFF'], msg.sender);
        _grantRole(gkroles['ARENA_CONTRACT'], msg.sender);

        // Role admins
        _setRoleAdmin(OWNER, OWNER);
        _setRoleAdmin(gkroles['ARENA_OWNER'], OWNER);
        _setRoleAdmin(gkroles['ARENA_ADMIN'], gkroles['ARENA_OWNER']);
        _setRoleAdmin(gkroles['ARENA_STAFF'], gkroles['ARENA_ADMIN']);
        _setRoleAdmin(gkroles['ARENA_CONTRACT'], gkroles['ARENA_OWNER']);

        for (uint i; i < admins.length; i++) {
            _grantRole(gkroles['ARENA_ADMIN'], admins[i]);
        }
    }

    function _checkRole(bytes32 role, address account) internal view virtual override {
        if (!hasRole(role, account)) {
            revert('You shall not pass!');
        }
    }
}