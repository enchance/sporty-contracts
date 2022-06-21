//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";



contract Gatekeeper is AccessControl {
    error InvalidRole();
    error InvalidAdmin();

    bytes32 internal constant OWNER = keccak256("OWNER");
    bytes32 internal constant CONTRACT = keccak256("CONTRACT");
//    address internal immutable OWNERADDR;
    mapping(string => bytes32) public gkroles;

    constructor(address arena_owner, address[] memory admins) {
//        OWNERADDR = msg.sender;

        gkroles['ARENA_OWNER'] = keccak256("ARENA_OWNER");
        gkroles['ARENA_ADMIN'] = keccak256("ARENA_ADMIN");
        gkroles['ARENA_STAFF'] = keccak256("ARENA_STAFF");
        gkroles['ARENA_SERVER'] = keccak256("ARENA_SERVER");

        // OWNER only has access to create itself and ARENA_OWNER
        _grantRole(OWNER, msg.sender);
        _grantRole(CONTRACT, msg.sender);
        _grantRole(gkroles['ARENA_OWNER'], msg.sender);     // For updating SportyArena

        // ARENA_OWNER has all ARENA_* roles
        _grantRole(gkroles['ARENA_OWNER'], arena_owner);
        _grantRole(gkroles['ARENA_ADMIN'], arena_owner);
        _grantRole(gkroles['ARENA_STAFF'], arena_owner);
        _grantRole(gkroles['ARENA_SERVER'], arena_owner);
//        _grantRole(gkroles['CONTRACT'], arena_owner);

        // Role admins
        _setRoleAdmin(OWNER, OWNER);
        _setRoleAdmin(CONTRACT, OWNER);
        _setRoleAdmin(gkroles['ARENA_OWNER'], OWNER);
        _setRoleAdmin(gkroles['ARENA_ADMIN'], gkroles['ARENA_OWNER']);
        _setRoleAdmin(gkroles['ARENA_STAFF'], gkroles['ARENA_ADMIN']);
//        _setRoleAdmin(gkroles['CONTRACT'], gkroles['ARENA_OWNER']);

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

    function _exists(string memory role) private view returns (bool) {
        bytes32 kcrole = keccak256(abi.encodePacked(role));
        return kcrole == keccak256(abi.encodePacked('OWNER')) ||
            kcrole == keccak256(abi.encodePacked('CONTRACT')) ||
            kcrole == keccak256(abi.encodePacked('')) || kcrole == gkroles[role];
    }

    function addRole(string memory _role, string memory _admin, address[] memory addrs) external onlyRole(OWNER) {
        if(_exists(_role)) revert InvalidRole();
        if(!_exists(_admin)) revert InvalidAdmin();

        bytes32 role = keccak256(bytes(_role));
        gkroles[_role] = role;
        bytes32 admin = keccak256(bytes(_admin)) == OWNER ? OWNER : gkroles[_admin];

        _grantRole(role, msg.sender);
        _setRoleAdmin(role, admin);

        for (uint i; i < addrs.length; i++) {
            _grantRole(role, addrs[i]);
        }
    }
}