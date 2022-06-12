//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import "@openzeppelin/contracts/access/AccessControl.sol";


contract Gatekeeper is AccessControl {
    bytes32 internal constant GATEKEEPER = keccak256("GATEKEEPER");

    constructor(address[] memory admins, address[] memory mods) {
        _grantRole(GATEKEEPER, msg.sender);
        _setRoleAdmin(GATEKEEPER, GATEKEEPER);

        bytes32 arena = keccak256('ARENA_CONTRACT');
        bytes32 admin = keccak256('ARENA_ADMIN');
        bytes32 moderator = keccak256('ARENA_MODERATOR');

        _grantRole(arena, msg.sender);
        _grantRole(admin, msg.sender);
        _grantRole(moderator, msg.sender);

        _setRoleAdmin(arena, GATEKEEPER);
        _setRoleAdmin(admin, GATEKEEPER);
        _setRoleAdmin(moderator, admin);

        for (uint i; i < admins.length; i++) {
            _grantRole(admin, admins[i]);
        }
        for (uint i; i < mods.length; i++) {
            _grantRole(moderator, mods[i]);
        }
    }
}