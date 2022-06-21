// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import 'hardhat/console.sol';
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import './deployed/GatekeeperInherit.sol';
import './lib/Utils.sol';
import "./lib/Errors.sol";


/// @custom:oz-upgrades-unsafe-allow external-library-linking
contract PunchOutV1 is Initializable, ERC1155Upgradeable, UUPSUpgradeable, GatekeeperInherit, Errors {
//    using UtilsUint for uint;
//    using CountersUpgradeable for CountersUpgradeable.Counter;

        struct MatchProps {
            uint leagueId;
            uint matchId;
            uint status;        // Ongoing, Finished, Cancelled
            uint winnerId;      // Solo, Group, or Institution will have its own CODE value
            string uri;         // Betting uri
            uint gatewayId;
        }

        struct Bet {
            uint matchId;
        }

    string public constant name = 'IndexSports Punchout';
    string public constant symbol = 'PUNCH';
    bytes32 internal constant OWNER = keccak256("ARENA_OWNER");
    bytes32 internal constant ADMIN = keccak256("ARENA_ADMIN");
//    bytes32 internal constant STAFF = keccak256("ARENA_STAFF");
    bytes32 internal constant SERVER = keccak256("ARENA_SERVER");

//    mapping(uint => string) public gateways;
//    CountersUpgradeable.Counter internal gatewayCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address gatekeeperAddr) initializer public {
        __ERC1155_init("");
        __UUPSUpgradeable_init();

        // Init Gatekeeper
        _setGatekeeper(gatekeeperAddr);
    }

    function setGatekeeper(address addr) external virtual onlyRole(OWNER) {
        _setGatekeeper(addr);
    }

    // TODO: Modify
    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(SERVER) {
        _mint(account, id, amount, data);
    }

    // TODO: Modify
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(SERVER) {
        _mintBatch(to, ids, amounts, data);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(OWNER) override {}
}