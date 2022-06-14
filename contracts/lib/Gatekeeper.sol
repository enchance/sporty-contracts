//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";


contract Gatekeeper is AccessControl {
    bytes32 public OWNER = keccak256("OWNER");

    mapping(string => bytes32) public gkroles;

    constructor(address arena_owner, address[] memory admins) {
        gkroles['ARENA_OWNER'] = keccak256("ARENA_OWNER");
        gkroles['ARENA_ADMIN'] = keccak256("ARENA_ADMIN");
        gkroles['ARENA_STAFF'] = keccak256("ARENA_STAFF");
        gkroles['ARENA_CONTRACT'] = keccak256("ARENA_CONTRACT");

        // OWNER has all roles
        _grantRole(OWNER, msg.sender);
        _grantRole(gkroles['ARENA_OWNER'], msg.sender);
        _grantRole(gkroles['ARENA_ADMIN'], msg.sender);
        _grantRole(gkroles['ARENA_STAFF'], msg.sender);
        _grantRole(gkroles['ARENA_CONTRACT'], msg.sender);

        // ARENA_OWNER has all ARENA_* roles
        _grantRole(gkroles['ARENA_OWNER'], arena_owner);
        _grantRole(gkroles['ARENA_ADMIN'], arena_owner);
        _grantRole(gkroles['ARENA_STAFF'], arena_owner);
        _grantRole(gkroles['ARENA_CONTRACT'], arena_owner);

        // Role admins
        _setRoleAdmin(OWNER, OWNER);
        _setRoleAdmin(gkroles['ARENA_OWNER'], gkroles['ARENA_OWNER']);
        _setRoleAdmin(gkroles['ARENA_ADMIN'], gkroles['ARENA_OWNER']);
        _setRoleAdmin(gkroles['ARENA_STAFF'], gkroles['ARENA_ADMIN']);
        _setRoleAdmin(gkroles['ARENA_CONTRACT'], gkroles['ARENA_OWNER']);

        // All admins are staffs
        for (uint i; i < admins.length; i++) {
            _grantRole(gkroles['ARENA_ADMIN'], admins[i]);
            _grantRole(gkroles['ARENA_STAFF'], admins[i]);
        }
    }

    function _checkRole(bytes32 role, address account) internal view virtual override {
        if (!hasRole(role, account)) {
            revert('You shall not pass!');
        }
    }

//    // TEST: For testing
//    function getKeccak256(string memory role) external returns (bytes32) {
//        return keccak256(role);
//    }
//
//    // TEST: For testing
//    function addRole(string memory _role, address[] memory addrs) public onlyRole(OWNER) {
//        bytes32 role = keccak256(_role);
//        gkroles[_role] = role;
//
//        _grantRole(role, OWNER);
//        _setRoleAdmin(role, OWNER);
//
//        for (uint i; i < addrs.length; i++) {
//            _grantRole(role, addrs[i]);
//        }
//    }
}