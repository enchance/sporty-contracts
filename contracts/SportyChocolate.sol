// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
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

    bytes32 public constant OWNER = keccak256("OWNER");
    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant MINTER = keccak256("MINTER");
    bytes32 public constant UPGRADER = keccak256("UPGRADER");

    mapping(uint => uint) public uris;
    mapping(uint => string) public gateways;
    mapping(address => mapping(uint => uint)) internal tokenLimit;
    CountersUpgradeable.Counter public gatewayCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _uri) public initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __UUPSUpgradeable_init();

//        console.log(hasRole(OWNER, msg.sender));
//        console.log(hasRole(ADMIN, msg.sender));
//        console.log(hasRole(MINTER, msg.sender));
//        console.log(hasRole(UPGRADER, msg.sender));

        // Init roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER, msg.sender);
        _grantRole(ADMIN, msg.sender);
        _grantRole(MINTER, msg.sender);
        _grantRole(UPGRADER, msg.sender);
//        _grantRole(ADMIN, 0xFF01E7B2329BBd74bb1d28B75164eB7DCAbDD8F3);        // Pierre
//        _grantRole(UPGRADER, '');     // Pierre
//        _grantRole(ADMIN, '');        // Mike
//        _grantRole(MINTER, '');       // Mike

        // Test data
        _grantRole(ADMIN, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _grantRole(MINTER, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        _grantRole(UPGRADER, 0x90F79bf6EB2c4f870365E785982E1f101E93b906);
//        console.log(hasRole(OWNER, msg.sender));
//        console.log(hasRole(ADMIN, msg.sender));
//        console.log(hasRole(MINTER, msg.sender));
//        console.log(hasRole(UPGRADER, msg.sender));


        // Init gateway
        addGateway(_uri);

        // Init tokens
        uint supply = 100000;
        mint(_msgSender(), 0, supply, 0, "");
        mint(_msgSender(), 1, supply, 0, "");
        mint(_msgSender(), 2, supply, 0, "");
        mint(_msgSender(), 3, supply, 0, "");
        mint(_msgSender(), 4, supply, 0, "");
        mint(_msgSender(), 5, supply, 0, "");
        mint(_msgSender(), 6, supply, 0, "");
        mint(_msgSender(), 7, supply, 0, "");
        mint(_msgSender(), 8, supply, 0, "");
        mint(_msgSender(), 9, supply, 0, "");
        mint(_msgSender(), 10, supply, 0, "");
        mint(_msgSender(), 11, supply, 0, "");
        mint(_msgSender(), 12, supply, 0, "");
        mint(_msgSender(), 13, supply, 0, "");
        mint(_msgSender(), 14, supply, 0, "");
        mint(_msgSender(), 15, supply, 0, "");
        mint(_msgSender(), 16, supply, 0, "");
        mint(_msgSender(), 17, supply, 0, "");
        mint(_msgSender(), 18, supply, 0, "");
        mint(_msgSender(), 19, supply, 0, "");
        mint(_msgSender(), 20, supply, 0, "");
    }

    // TEST: For testing
    function addGateway(string memory _uri) public virtual onlyRole(ADMIN) returns (uint) {
        uint gatewayId = gatewayCounter.current();
        gateways[gatewayId] = _uri;
        gatewayCounter.increment();
        return gatewayId;
    }

    // TEST: For testing
    function setURI(uint tokenId, uint gatewayId) public virtual onlyRole(ADMIN) {
        uris[tokenId] = gatewayId;
    }

    // TEST: For testing
    function setURIBatch(uint[] memory tokenIds, uint gatewayId) public virtual onlyRole(ADMIN) {
        for (uint i; i < tokenIds.length; i++) {
            uris[tokenIds[i]] = gatewayId;
        }
    }

    // TEST: For testing
    function mint(address account, uint tokenId, uint amount, uint gatewayId, bytes memory data) public virtual onlyRole(MINTER) {
        require(amount >= 1, "Can't mint 0 amount");
        _mint(account, tokenId, amount, data);
        setURI(tokenId, gatewayId);
    }

    // TEST: Untested
    function mintBatch(address to, uint[] memory tokenIds, uint[] memory amounts, uint gatewayId, bytes memory data)
    public virtual onlyRole(MINTER) {
        _mintBatch(to, tokenIds, amounts, data);
        setURIBatch(tokenIds, gatewayId);
    }

    // TEST: For testing
    function uri(uint tokenId) public view virtual override returns (string memory) {
        return gateways[uris[tokenId]];
    }



    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER) override {}

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable, AccessControlUpgradeable) returns (bool){
        return super.supportsInterface(interfaceId);
    }


    function _checkRole(bytes32 role, address account) internal view virtual override {
        if (!hasRole(role, account)) {
            revert("You shall not pass!");
        }
    }

    /* DELETE BEFORE MAINNET DEPLOYMENT */
    function access_owner() public view onlyRole(OWNER) returns (uint) {
        return 42;
    }
    function access_admin() public view onlyRole(ADMIN) returns (uint) {
        return 42;
    }
    function access_minter() public view onlyRole(MINTER) returns (uint) {
        return 42;
    }
    function access_upgrader() public view onlyRole(UPGRADER) returns (uint) {
        return 42;
    }
}
