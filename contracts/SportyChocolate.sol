// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";



// TODO: Limit how many an account can mint after a certain amount of time
// TODO: Set a max for each token for each account
// TODO: Set the template for each card
// TODO: Create a separate page for each token
// TODO: Accounts have a minting limit per token

contract SportyChocolate is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 internal constant OWNER = keccak256("OWNER");
    bytes32 internal constant ADMIN = keccak256("ADMIN");
    bytes32 internal constant MINTER = keccak256("MINTER");

    mapping(uint => uint) public uris;
    mapping(uint => string) public gateways;
    mapping(address => mapping(uint => uint)) internal tokenLimit;
    CountersUpgradeable.Counter public gatewayCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __ERC1155_init("");
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER, msg.sender);
        _grantRole(ADMIN, msg.sender);
        _grantRole(MINTER, msg.sender);
//        _grantRole(ADMIN, '');        // Pierre
//        _grantRole(ADMIN, '');        // Mike
//        _grantRole(MINTER, '');        // Mike
    }

    function setURI(string memory newuri) public onlyRole(ADMIN) {
        _setURI(newuri);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER) {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(MINTER) {
        _mintBatch(to, ids, amounts, data);
    }




    function _authorizeUpgrade(address newImplementation) internal onlyRole(OWNER) override {}

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable, AccessControlUpgradeable) returns (bool){
        return super.supportsInterface(interfaceId);
    }
}
