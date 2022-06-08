// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

//import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";



// TODO: Limit how many an account can mint after a certain amount of time
// TODO: Set a max for each token for each account
// TODO: Set the template for each card
// TODO: Create a separate page for each token
// TODO: Accounts have a minting limit per token

contract SportyChocolate is Initializable, ERC1155Upgradeable, AccessControlUpgradeable,
    ERC1155SupplyUpgradeable, UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant OWNER = keccak256("OWNER");
    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant UPGRADER = keccak256("UPGRADER");

    mapping(uint => uint) public uris;
    mapping(uint => string) public gateways;
    mapping(uint => mapping(address => uint)) internal tokenLimit;
    CountersUpgradeable.Counter public gatewayCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _uri, uint _supply) public initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __ERC1155Supply_init();
        __UUPSUpgradeable_init();

        // Init roles
//        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER, msg.sender);
        _grantRole(ADMIN, msg.sender);
        _grantRole(UPGRADER, msg.sender);
//        _grantRole(ADMIN, "");          // Pierre
//        _grantRole(ADMIN, "");          // Mike
//        _grantRole(UPGRADER, "");       // Pierre

        // Test data
        _grantRole(ADMIN, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _grantRole(UPGRADER, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);

        _setRoleAdmin(OWNER, OWNER);
        _setRoleAdmin(ADMIN, OWNER);
        _setRoleAdmin(UPGRADER, OWNER);

        // Init gateway
        addGateway(_uri);

        // Init tokens
        {
            mint(_msgSender(), 1, _supply, 0, "");
            mint(_msgSender(), 2, _supply, 0, "");
            mint(_msgSender(), 3, _supply, 0, "");
            mint(_msgSender(), 4, _supply, 0, "");
            mint(_msgSender(), 5, _supply, 0, "");
            mint(_msgSender(), 6, _supply, 0, "");
            mint(_msgSender(), 7, _supply, 0, "");
            mint(_msgSender(), 8, _supply, 0, "");
            mint(_msgSender(), 9, _supply, 0, "");
            mint(_msgSender(), 10, _supply, 0, "");
            mint(_msgSender(), 11, _supply, 0, "");
            mint(_msgSender(), 12, _supply, 0, "");
            mint(_msgSender(), 13, _supply, 0, "");
            mint(_msgSender(), 14, _supply, 0, "");
            mint(_msgSender(), 15, _supply, 0, "");
            mint(_msgSender(), 16, _supply, 0, "");
            mint(_msgSender(), 17, _supply, 0, "");
            mint(_msgSender(), 18, _supply, 0, "");
            mint(_msgSender(), 19, _supply, 0, "");
            mint(_msgSender(), 20, _supply, 0, "");
            mint(_msgSender(), 21, _supply, 0, "");
            mint(_msgSender(), 22, _supply, 0, "");
            mint(_msgSender(), 23, _supply, 0, "");
            mint(_msgSender(), 24, _supply, 0, "");
            mint(_msgSender(), 25, _supply, 0, "");
            mint(_msgSender(), 26, _supply, 0, "");
            mint(_msgSender(), 27, _supply, 0, "");
            mint(_msgSender(), 28, _supply, 0, "");
            mint(_msgSender(), 29, _supply, 0, "");
            mint(_msgSender(), 30, _supply, 0, "");
            mint(_msgSender(), 31, _supply, 0, "");
            mint(_msgSender(), 32, _supply, 0, "");
            mint(_msgSender(), 33, _supply, 0, "");
            mint(_msgSender(), 34, _supply, 0, "");
            mint(_msgSender(), 35, _supply, 0, "");
            mint(_msgSender(), 36, _supply, 0, "");
            mint(_msgSender(), 37, _supply, 0, "");
            mint(_msgSender(), 38, _supply, 0, "");
            mint(_msgSender(), 39, _supply, 0, "");
            mint(_msgSender(), 40, _supply, 0, "");
            mint(_msgSender(), 41, _supply, 0, "");
            mint(_msgSender(), 42, _supply, 0, "");
            mint(_msgSender(), 43, _supply, 0, "");
            mint(_msgSender(), 44, _supply, 0, "");
            mint(_msgSender(), 45, _supply, 0, "");
            mint(_msgSender(), 46, _supply, 0, "");
            mint(_msgSender(), 47, _supply, 0, "");
            mint(_msgSender(), 48, _supply, 0, "");
            mint(_msgSender(), 49, _supply, 0, "");
            mint(_msgSender(), 50, _supply, 0, "");
            mint(_msgSender(), 51, _supply, 0, "");
            mint(_msgSender(), 52, _supply, 0, "");
            mint(_msgSender(), 53, _supply, 0, "");
            mint(_msgSender(), 54, _supply, 0, "");
            mint(_msgSender(), 55, _supply, 0, "");
            mint(_msgSender(), 56, _supply, 0, "");
            mint(_msgSender(), 57, _supply, 0, "");
            mint(_msgSender(), 58, _supply, 0, "");
            mint(_msgSender(), 59, _supply, 0, "");
            mint(_msgSender(), 60, _supply, 0, "");
            mint(_msgSender(), 61, _supply, 0, "");
            mint(_msgSender(), 62, _supply, 0, "");
            mint(_msgSender(), 63, _supply, 0, "");
            mint(_msgSender(), 64, _supply, 0, "");
            mint(_msgSender(), 65, _supply, 0, "");
            mint(_msgSender(), 66, _supply, 0, "");
            mint(_msgSender(), 67, _supply, 0, "");
            mint(_msgSender(), 68, _supply, 0, "");
            mint(_msgSender(), 69, _supply, 0, "");
            mint(_msgSender(), 70, _supply, 0, "");
            mint(_msgSender(), 71, _supply, 0, "");
            mint(_msgSender(), 72, _supply, 0, "");
            mint(_msgSender(), 73, _supply, 0, "");
            mint(_msgSender(), 74, _supply, 0, "");
            mint(_msgSender(), 75, _supply, 0, "");
            mint(_msgSender(), 76, _supply, 0, "");
            mint(_msgSender(), 77, _supply, 0, "");
            mint(_msgSender(), 78, _supply, 0, "");
            mint(_msgSender(), 79, _supply, 0, "");
            mint(_msgSender(), 80, _supply, 0, "");
            mint(_msgSender(), 81, _supply, 0, "");
            mint(_msgSender(), 82, _supply, 0, "");
            mint(_msgSender(), 83, _supply, 0, "");
            mint(_msgSender(), 84, _supply, 0, "");
            mint(_msgSender(), 85, _supply, 0, "");
            mint(_msgSender(), 86, _supply, 0, "");
            mint(_msgSender(), 87, _supply, 0, "");
            mint(_msgSender(), 88, _supply, 0, "");
            mint(_msgSender(), 89, _supply, 0, "");
            mint(_msgSender(), 90, _supply, 0, "");
            mint(_msgSender(), 91, _supply, 0, "");
            mint(_msgSender(), 92, _supply, 0, "");
            mint(_msgSender(), 93, _supply, 0, "");
            mint(_msgSender(), 94, _supply, 0, "");
            mint(_msgSender(), 95, _supply, 0, "");
            mint(_msgSender(), 96, _supply, 0, "");
            mint(_msgSender(), 97, _supply, 0, "");
            mint(_msgSender(), 98, _supply, 0, "");
            mint(_msgSender(), 99, _supply, 0, "");
            mint(_msgSender(), 100, _supply, 0, "");
        }
    }

    modifier validGateway(uint gatewayId) {
        require(bytes(gateways[gatewayId]).length != 0, "String cannot be empty");
        _;
    }

    function addGateway(string memory _uri) public virtual onlyRole(ADMIN) returns (uint) {
        require(bytes(_uri).length != 0, "String cannot be empty");
        uint gatewayId = gatewayCounter.current();
        gateways[gatewayId] = _uri;
        gatewayCounter.increment();
        return gatewayId;
    }

    function setURI(uint tokenId, uint gatewayId) public virtual onlyRole(ADMIN)
        validGateway(gatewayId)
    {
        require(tokenId >= 1, 'Token is invalid');
        uris[tokenId] = gatewayId;
    }

    function setURIBatch(uint[] memory tokenIds, uint gatewayId) public virtual onlyRole(ADMIN)
        validGateway(gatewayId)
    {
        for (uint i; i < tokenIds.length; i++) {
            uris[tokenIds[i]] = gatewayId;
        }
    }

    function mint(address account, uint tokenId, uint amount, uint gatewayId, bytes memory data)
        public virtual onlyRole(ADMIN) validGateway(gatewayId)
    {
        require(amount >= 1, "Can't mint 0 amount");
        _mint(account, tokenId, amount, data);
        setURI(tokenId, gatewayId);
    }

    function mintBatch(address to, uint[] memory tokenIds, uint[] memory amounts, uint gatewayId, bytes memory data)
        public virtual onlyRole(ADMIN) validGateway(gatewayId)
    {
        _mintBatch(to, tokenIds, amounts, data);
        setURIBatch(tokenIds, gatewayId);
    }

    // TEST: For testing
    function uri(uint tokenId) public view virtual override returns (string memory) {
        return gateways[uris[tokenId]];
    }






    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER) override {}

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable,
        AccessControlUpgradeable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _checkRole(bytes32 role, address account) internal view virtual override {
        if (!hasRole(role, account)) {
            revert("You shall not pass!");
        }
    }



    /* DELETE BEFORE DEPLOYMENT TO MAINNET */
    function access_owner() public view onlyRole(OWNER) returns (uint) {
        return 42;
    }
//    function access_admin() public view onlyRole(ADMIN) returns (uint) {
//        return 42;
//    }
//    function access_minter() public view onlyRole(MINTER) returns (uint) {
//        return 42;
//    }
    function access_upgrader() public view onlyRole(UPGRADER) returns (uint) {
        return 42;
    }
}
