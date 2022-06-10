// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";



// TODO: Limit how many an account can mint after a certain amount of time
// TODO: Set the template for each card
// TODO: Create a separate page for each token

contract SportyChocolateV1 is Initializable, ERC1155Upgradeable, AccessControlUpgradeable,
    ERC1155SupplyUpgradeable, UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct TokenProps {
        uint price;
        uint limit;
        uint gatewayId;
    }

    string public constant NAME = 'Shifty';
    string public constant SYMBOL = 'SHY';
    address internal constant MARKETPLACE_ACCOUNT = 0xD07A0C38C6c4485B97c53b883238ac05a14a85D6;
    bytes32 internal constant OWNER = keccak256("OWNER");
    bytes32 internal constant ADMIN = keccak256("ADMIN");
    bytes32 internal constant UPGRADER = keccak256("UPGRADER");

    string public name;
    string public symbol;
    mapping(uint => uint) public uris;
    mapping(uint => string) public gateways;
    mapping(uint => TokenProps) public tokenProps;
    mapping(address => uint) public tokensMinted;
//    mapping(uint => uint) internal tokenLimit;
//    mapping(uint => mapping(address => uint)) internal tokensMinted;
    CountersUpgradeable.Counter internal gatewayCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _uri) public initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __ERC1155Supply_init();
        __UUPSUpgradeable_init();

//        name = ' Nifty';
//        symbol = 'NIFTY';

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
            uint price = .1 ether;
            _tokenMapper(1, price, 50, 0);
            _tokenMapper(2, .15 ether, 50, 0);
//            _tokenMapper(3, price, 50, 0);
//            _tokenMapper(4, price, 50, 0);
//            _tokenMapper(5, price, 50, 0);
//            _tokenMapper(6, price, 50, 0);
//            _tokenMapper(7, price, 50, 0);
//            _tokenMapper(8, price, 50, 0);
//            _tokenMapper(9, price, 50, 0);
//            _tokenMapper(10, price, 50, 0);
//            _tokenMapper(11, price, 50, 0);
//            _tokenMapper(12, price, 50, 0);
//            _tokenMapper(13, price, 50, 0);
//            _tokenMapper(14, price, 50, 0);
//            _tokenMapper(15, price, 50, 0);
//            _tokenMapper(16, price, 50, 0);
//            _tokenMapper(17, price, 50, 0);
//            _tokenMapper(18, price, 50, 0);
//            _tokenMapper(19, price, 50, 0);
//            _tokenMapper(20, price, 50, 0);
//            _tokenMapper(21, price, 50, 0);
//            _tokenMapper(22, price, 50, 0);
//            _tokenMapper(23, price, 50, 0);
//            _tokenMapper(24, price, 50, 0);
//            _tokenMapper(25, price, 50, 0);
//            _tokenMapper(26, price, 50, 0);
//            _tokenMapper(27, price, 50, 0);
//            _tokenMapper(28, price, 50, 0);
//            _tokenMapper(29, price, 50, 0);
//            _tokenMapper(30, price, 50, 0);
//            _tokenMapper(31, price, 50, 0);
//            _tokenMapper(32, price, 50, 0);
//            _tokenMapper(33, price, 50, 0);
//            _tokenMapper(34, price, 50, 0);
//            _tokenMapper(35, price, 50, 0);
//            _tokenMapper(36, price, 50, 0);
//            _tokenMapper(37, price, 50, 0);
//            _tokenMapper(38, price, 50, 0);
//            _tokenMapper(39, price, 50, 0);
//            _tokenMapper(40, price, 50, 0);
//            _tokenMapper(41, price, 50, 0);
//            _tokenMapper(42, price, 50, 0);
//            _tokenMapper(43, price, 50, 0);
//            _tokenMapper(44, price, 50, 0);
//            _tokenMapper(45, price, 50, 0);
//            _tokenMapper(46, price, 50, 0);
//            _tokenMapper(47, price, 50, 0);
//            _tokenMapper(48, price, 50, 0);
//            _tokenMapper(49, price, 50, 0);
//            _tokenMapper(50, price, 50, 0);
//            _tokenMapper(51, price, 50, 0);
//            _tokenMapper(52, price, 50, 0);
//            _tokenMapper(53, price, 50, 0);
//            _tokenMapper(54, price, 50, 0);
//            _tokenMapper(55, price, 50, 0);
//            _tokenMapper(56, price, 50, 0);
//            _tokenMapper(57, price, 50, 0);
//            _tokenMapper(58, price, 50, 0);
//            _tokenMapper(59, price, 50, 0);
//            _tokenMapper(60, price, 50, 0);
//            _tokenMapper(61, price, 50, 0);
//            _tokenMapper(62, price, 50, 0);
//            _tokenMapper(63, price, 50, 0);
//            _tokenMapper(64, price, 50, 0);
//            _tokenMapper(65, price, 50, 0);
//            _tokenMapper(66, price, 50, 0);
//            _tokenMapper(67, price, 50, 0);
//            _tokenMapper(68, price, 50, 0);
//            _tokenMapper(69, price, 50, 0);
//            _tokenMapper(70, price, 50, 0);
//            _tokenMapper(71, price, 50, 0);
//            _tokenMapper(72, price, 50, 0);
//            _tokenMapper(73, price, 50, 0);
//            _tokenMapper(74, price, 50, 0);
//            _tokenMapper(75, price, 50, 0);
//            _tokenMapper(76, price, 50, 0);
//            _tokenMapper(77, price, 50, 0);
//            _tokenMapper(78, price, 50, 0);
//            _tokenMapper(79, price, 50, 0);
//            _tokenMapper(80, price, 50, 0);
//            _tokenMapper(81, price, 50, 0);
//            _tokenMapper(82, price, 50, 0);
//            _tokenMapper(83, price, 50, 0);
//            _tokenMapper(84, price, 50, 0);
//            _tokenMapper(85, price, 50, 0);
//            _tokenMapper(86, price, 50, 0);
//            _tokenMapper(87, price, 50, 0);
//            _tokenMapper(88, price, 50, 0);
//            _tokenMapper(89, price, 50, 0);
//            _tokenMapper(90, price, 50, 0);
//            _tokenMapper(91, price, 50, 0);
//            _tokenMapper(92, price, 50, 0);
//            _tokenMapper(93, price, 50, 0);
//            _tokenMapper(94, price, 50, 0);
//            _tokenMapper(95, price, 50, 0);
//            _tokenMapper(96, price, 50, 0);
//            _tokenMapper(97, price, 50, 0);
//            _tokenMapper(98, price, 50, 0);
//            _tokenMapper(99, price, 50, 0);
//            _tokenMapper(100, price, 50, 0);
        }

        // TODO: Remove test mint
        mint(address(0), 1, 12, 0, '');
        mint(address(0), 2, 12, 0, '');
    }

    modifier validGateway(uint gatewayId) {
        require(bytes(gateways[gatewayId]).length != 0, "String cannot be empty");
        _;
    }

    modifier validToken(uint tokenId) {
        require(exists(tokenId), 'TOKEN: Does not exist');
        _;
    }

    function addGateway(string memory _uri) public virtual onlyRole(ADMIN) returns (uint) {
        require(bytes(_uri).length != 0, "String cannot be empty");
        uint gatewayId = gatewayCounter.current();
        gateways[gatewayId] = _uri;
        gatewayCounter.increment();
        return gatewayId;
    }

    function setURI(uint tokenId, uint gatewayId) external virtual onlyRole(ADMIN) validGateway(gatewayId) {
        _setURI(tokenId, gatewayId);
    }

    // TEST: For testing
    function _setURI(uint tokenId, uint gatewayId) internal virtual validGateway(gatewayId) {
        require(tokenId >= 1, 'TOKEN: Does not exist');
        uris[tokenId] = gatewayId;
    }

    function setURIBatch(uint[] memory tokenIds, uint gatewayId) external virtual onlyRole(ADMIN) validGateway(gatewayId) {
        _setURIBatch(tokenIds, gatewayId);
    }

    // TEST: For testing
    function _setURIBatch(uint[] memory tokenIds, uint gatewayId) internal virtual validGateway(gatewayId) {
        for (uint i; i < tokenIds.length; i++) {
            uris[tokenIds[i]] = gatewayId;
        }
    }

    // TEST: For testing
    function _mintable(address addr, uint tokenId) internal view returns (uint) {
        TokenProps memory token = tokenProps[tokenId];
        uint minted = tokensMinted[addr];
        uint mintable = token.limit - minted;

        return mintable >= 1 ? mintable : 0;
    }

    // TEST: For testing
    function tokenMapper(uint tokenId, uint _price, uint _limit, uint _gatewayId)
        external onlyRole(ADMIN) validGateway(_gatewayId)
    {
        TokenProps memory token = tokenProps[tokenId];
        require(
            token.price == 0 && token.limit == 0 && token.gatewayId == 0,
            'TOKEN: Cannot remap existing token'
        );
        _tokenMapper(tokenId, _price, _limit, _gatewayId);
    }

    // TEST: For testing
    function _tokenMapper(uint tokenId, uint _price, uint _limit, uint _gatewayId) internal {
        TokenProps memory token = tokenProps[tokenId];
        token.price = _price;
        token.limit = _limit;
        token.gatewayId = _gatewayId;
        tokenProps[tokenId] = token;
    }

    // TEST: For testing
    function mint(address account, uint tokenId, uint amount, uint gatewayId,
        bytes memory data) public virtual validGateway(gatewayId) payable
    {
        uint mintable = _mintable(_msgSender(), tokenId);
        TokenProps memory token = tokenProps[tokenId];

        require(amount >= 1, "Can't mint 0 amount");

        if(hasRole(ADMIN, _msgSender())) {
            _mint(MARKETPLACE_ACCOUNT, tokenId, amount, data);
        }
        else {
            require(mintable >= 1, 'TOKEN: limit reached');
            require(msg.value == token.price, 'TOKEN: Exact amount only');
            _mint(account, tokenId, amount, data);
        }
        _setURI(tokenId, gatewayId);
    }

    // TEST: For testing
    function mintBatch() public {}

//    function mintBatch(address to, uint[] memory tokenIds, uint[] memory amounts, uint gatewayId,
//        uint limit, bytes memory data) public virtual validGateway(gatewayId)
//    {
//        _mintBatch(to, tokenIds, amounts, data);
//        _setURIBatch(tokenIds, gatewayId);
//
////        for (uint i; i < tokenIds.length; i++) {
////            tokenLimit[tokenIds[i]] = limit;
////        }
//    }



    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER) override {}

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable,
        AccessControlUpgradeable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }


    /* Overrides */

    function uri(uint tokenId) public view virtual override validToken(tokenId) returns (string memory) {
        return gateways[uris[tokenId]];
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
    internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _checkRole(bytes32 role, address account) internal view virtual override {
        if (!hasRole(role, account)) {
            revert("You shall not pass!");
        }
    }


    /* DELETE BEFORE DEPLOYMENT TO MAINNET */

    function access_owner() external view onlyRole(OWNER) returns (uint) {
        return 42;
    }
//    function access_admin() external view onlyRole(ADMIN) returns (uint) {
//        return 42;
//    }
    function access_upgrader() external view onlyRole(UPGRADER) returns (uint) {
        return 42;
    }
}
