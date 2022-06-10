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
            tokenMapper(1, price, 50, 0);
            tokenMapper(2, .15 ether, 67, 0);
            tokenMapper(3, 1 ether, 12, 0);
            tokenMapper(4, 1.3 ether, 7, 0);
//            tokenMapper(5, price, 50, 0);
//            tokenMapper(6, price, 50, 0);
//            tokenMapper(7, price, 50, 0);
//            tokenMapper(8, price, 50, 0);
//            tokenMapper(9, price, 50, 0);
//            tokenMapper(10, price, 50, 0);
//            tokenMapper(11, price, 50, 0);
//            tokenMapper(12, price, 50, 0);
//            tokenMapper(13, price, 50, 0);
//            tokenMapper(14, price, 50, 0);
//            tokenMapper(15, price, 50, 0);
//            tokenMapper(16, price, 50, 0);
//            tokenMapper(17, price, 50, 0);
//            tokenMapper(18, price, 50, 0);
//            tokenMapper(19, price, 50, 0);
//            tokenMapper(20, price, 50, 0);
//            tokenMapper(21, price, 50, 0);
//            tokenMapper(22, price, 50, 0);
//            tokenMapper(23, price, 50, 0);
//            tokenMapper(24, price, 50, 0);
//            tokenMapper(25, price, 50, 0);
//            tokenMapper(26, price, 50, 0);
//            tokenMapper(27, price, 50, 0);
//            tokenMapper(28, price, 50, 0);
//            tokenMapper(29, price, 50, 0);
//            tokenMapper(30, price, 50, 0);
//            tokenMapper(31, price, 50, 0);
//            tokenMapper(32, price, 50, 0);
//            tokenMapper(33, price, 50, 0);
//            tokenMapper(34, price, 50, 0);
//            tokenMapper(35, price, 50, 0);
//            tokenMapper(36, price, 50, 0);
//            tokenMapper(37, price, 50, 0);
//            tokenMapper(38, price, 50, 0);
//            tokenMapper(39, price, 50, 0);
//            tokenMapper(40, price, 50, 0);
//            tokenMapper(41, price, 50, 0);
//            tokenMapper(42, price, 50, 0);
//            tokenMapper(43, price, 50, 0);
//            tokenMapper(44, price, 50, 0);
//            tokenMapper(45, price, 50, 0);
//            tokenMapper(46, price, 50, 0);
//            tokenMapper(47, price, 50, 0);
//            tokenMapper(48, price, 50, 0);
//            tokenMapper(49, price, 50, 0);
//            tokenMapper(50, price, 50, 0);
//            tokenMapper(51, price, 50, 0);
//            tokenMapper(52, price, 50, 0);
//            tokenMapper(53, price, 50, 0);
//            tokenMapper(54, price, 50, 0);
//            tokenMapper(55, price, 50, 0);
//            tokenMapper(56, price, 50, 0);
//            tokenMapper(57, price, 50, 0);
//            tokenMapper(58, price, 50, 0);
//            tokenMapper(59, price, 50, 0);
//            tokenMapper(60, price, 50, 0);
//            tokenMapper(61, price, 50, 0);
//            tokenMapper(62, price, 50, 0);
//            tokenMapper(63, price, 50, 0);
//            tokenMapper(64, price, 50, 0);
//            tokenMapper(65, price, 50, 0);
//            tokenMapper(66, price, 50, 0);
//            tokenMapper(67, price, 50, 0);
//            tokenMapper(68, price, 50, 0);
//            tokenMapper(69, price, 50, 0);
//            tokenMapper(70, price, 50, 0);
//            tokenMapper(71, price, 50, 0);
//            tokenMapper(72, price, 50, 0);
//            tokenMapper(73, price, 50, 0);
//            tokenMapper(74, price, 50, 0);
//            tokenMapper(75, price, 50, 0);
//            tokenMapper(76, price, 50, 0);
//            tokenMapper(77, price, 50, 0);
//            tokenMapper(78, price, 50, 0);
//            tokenMapper(79, price, 50, 0);
//            tokenMapper(80, price, 50, 0);
//            tokenMapper(81, price, 50, 0);
//            tokenMapper(82, price, 50, 0);
//            tokenMapper(83, price, 50, 0);
//            tokenMapper(84, price, 50, 0);
//            tokenMapper(85, price, 50, 0);
//            tokenMapper(86, price, 50, 0);
//            tokenMapper(87, price, 50, 0);
//            tokenMapper(88, price, 50, 0);
//            tokenMapper(89, price, 50, 0);
//            tokenMapper(90, price, 50, 0);
//            tokenMapper(91, price, 50, 0);
//            tokenMapper(92, price, 50, 0);
//            tokenMapper(93, price, 50, 0);
//            tokenMapper(94, price, 50, 0);
//            tokenMapper(95, price, 50, 0);
//            tokenMapper(96, price, 50, 0);
//            tokenMapper(97, price, 50, 0);
//            tokenMapper(98, price, 50, 0);
//            tokenMapper(99, price, 50, 0);
//            tokenMapper(100, price, 50, 0);
        }

        // TODO: Remove test mint
        mint(address(0), 1, 12, 0, '');
        mint(address(0), 1, 3, 0, '');
        mint(address(0), 1, 1, 0, '');  // 16
        mint(address(0), 2, 20, 0, '');
        mint(address(0), 2, 7, 0, '');
        mint(address(0), 2, 1, 0, '');  // 28
    }

    modifier validGateway(uint gatewayId) {
        require(bytes(gateways[gatewayId]).length != 0, 'GATEWAY: Does not exist');
        _;
    }

    modifier validToken(uint tokenId) {
        require(exists(tokenId), 'TOKEN: Does not exist');
        _;
    }

    function addGateway(string memory _uri) public virtual onlyRole(ADMIN) returns (uint) {
        require(bytes(_uri).length != 0, 'GATEWAY: Does not exist');
        uint gatewayId = gatewayCounter.current();
        gateways[gatewayId] = _uri;
        gatewayCounter.increment();
        return gatewayId;
    }

    function setURI(uint tokenId, uint gatewayId) external virtual onlyRole(ADMIN) validToken(tokenId) validGateway(gatewayId) {
        _setURI(tokenId, gatewayId);
    }

    function _setURI(uint tokenId, uint gatewayId) internal virtual {
        require(tokenId >= 1, 'TOKEN: Does not exist');
        uris[tokenId] = gatewayId;
    }

    function setURIBatch(uint[] memory tokenIds, uint gatewayId) external virtual onlyRole(ADMIN) validGateway(gatewayId) {
        for (uint i; i < tokenIds.length; i++) {
            require(exists(tokenIds[i]), 'TOKEN: Does not exist');
        }
        _setURIBatch(tokenIds, gatewayId);
    }

    function _setURIBatch(uint[] memory tokenIds, uint gatewayId) internal virtual {
        for (uint i; i < tokenIds.length; i++) {
            uris[tokenIds[i]] = gatewayId;
        }
    }

    // TEST: For testing
    function mintable(address addr, uint tokenId) public view onlyRole(ADMIN) returns (uint) {
        TokenProps memory token = tokenProps[tokenId];
        uint minted = tokensMinted[addr];
        uint mintable = token.limit - minted;

        return mintable >= 1 ? mintable : 0;
    }

    // TEST: For testing
    function tokenMapper(uint tokenId, uint _price, uint _limit, uint _gatewayId) internal {
        TokenProps memory token = tokenProps[tokenId];
        require(
            token.price == 0 && token.limit == 0 && token.gatewayId == 0,
            'TOKEN: Cannot remap existing token'
        );

        token.price = _price;
        token.limit = _limit;
        token.gatewayId = _gatewayId;
        tokenProps[tokenId] = token;
    }

    // TEST: For testing
    function mint(address account, uint tokenId, uint amount, uint gatewayId, bytes memory data)
        public virtual validGateway(gatewayId) payable
    {
        require(amount >= 1, 'TOKEN: Cannot accept zero amount');

        TokenProps memory token = tokenProps[tokenId];
        uint mintable = mintable(_msgSender(), tokenId);

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
