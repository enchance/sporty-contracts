//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import "@openzeppelin/contracts/access/AccessControl.sol";


contract Gatekeeper is AccessControl {
    bytes32 internal constant GATEKEEPER = keccak256("GATEKEEPER");
    bytes32 internal constant CONTRACTOR = keccak256("CONTRACTOR");

    constructor(address[] memory admins, address[] memory mods) {
        _grantRole(GATEKEEPER, msg.sender);
        _grantRole(CONTRACTOR, msg.sender);
        _setRoleAdmin(GATEKEEPER, GATEKEEPER);
        _setRoleAdmin(CONTRACTOR, GATEKEEPER);

        bytes32 admin = keccak256('ARENA_ADMIN');
        bytes32 moderator = keccak256('ARENA_MODERATOR');
        _grantRole(admin, msg.sender);
        _grantRole(moderator, msg.sender);
        _setRoleAdmin(admin, GATEKEEPER);
        _setRoleAdmin(moderator, admin);

        for (uint i; i < admins.length; i++) {
            _grantRole(admin, admins[i]);
        }
        for (uint i; i < mods.length; i++) {
            _grantRole(moderator, mods[i]);
        }

        // Test accounts
        _grantRole(admin, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _grantRole(moderator, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        _grantRole(CONTRACTOR, 0x90F79bf6EB2c4f870365E785982E1f101E93b906);
    }
}