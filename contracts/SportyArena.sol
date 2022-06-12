// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PullPaymentUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import './lib/Utils.sol';




//interface IWhitelist {
//    function has_access(string memory _name, address _address) external view returns (bool);
//    function grant_access(string memory _name, address _address) external;
//}

contract SportyArenaV1 is Initializable, ERC1155Upgradeable, OwnableUpgradeable,
    ERC1155SupplyUpgradeable, PullPaymentUpgradeable, UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using UtilsUint for uint;

    struct TokenProps {
        uint price;
        uint limit;
        uint gatewayId;
        uint circulation;
        uint max;
    }

    string public constant NAME = 'Shifty';
    string public constant SYMBOL = 'SHY';
    address internal constant MARKET_ACCOUNT = 0xD07A0C38C6c4485B97c53b883238ac05a14a85D6;

    // string public name;
    // string public symbol;
    mapping(uint => string) public gateways;
    mapping(uint => TokenProps) public tokenProps;
    mapping(uint => mapping(address => uint)) public tokensMinted;
    CountersUpgradeable.Counter internal gatewayCounter;


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _uri) initializer public {
        __ERC1155_init("");
        __Ownable_init();
        __ERC1155Supply_init();
        __PullPayment_init();
        __UUPSUpgradeable_init();

        // Init gateway
        addGateway(_uri);

        // Init tokens
        {
            tokenMapper(1, .1 ether, 15, 45, 0);
            tokenMapper(2, .15 ether, 15, 100, 0);
            tokenMapper(3, 1 ether, 15, 45, 0);
            tokenMapper(4, 1.3 ether, 15, 45, 0);
        }

//        // TODO: Transfer minting to test instead of in here
//        mint(1, 1, '');
//        mint(1, 2, '');
//        mint(1, 3, '');  // 6
//        mint(2, 2, '');
//        mint(2, 3, '');
//        mint(2, 4, '');  // 9
    }

    modifier validGateway(uint gatewayId) {
        require(bytes(gateways[gatewayId]).length != 0, 'GATEWAY: Does not exist');
        _;
    }

    modifier validToken(uint tokenId) {
        require(exists(tokenId), 'TOKEN: Does not exist');
        _;
    }

    // TEST: For testing
    function addGateway(string memory _uri) public virtual onlyOwner returns (uint) {
        require(bytes(_uri).length != 0, 'GATEWAY: Does not exist');
        uint gatewayId = gatewayCounter.current();
        gateways[gatewayId] = _uri;
        gatewayCounter.increment();
        return gatewayId;
    }

    // TEST: For testing
    /**
     1. How many of this token is an account allowed to have?
     2. How many are mintable at this time? - Prevents overminting. Increase as needed.
     */
    function tokenMapper(uint tokenId, uint price, uint limit, uint max, uint gatewayId)
    public onlyOwner validGateway(gatewayId)
    {
        uint[] memory tokenIds = tokenId.asSingleton();
        uint[] memory prices = price.asSingleton();
        uint[] memory limits = limit.asSingleton();
        uint[] memory maxs = max.asSingleton();

        tokenMapperBatch(tokenIds, prices, limits, maxs, gatewayId);
    }

    // TEST: For testing
    function tokenMapperBatch(
        uint[] memory tokenIds, uint[] memory prices, uint[] memory limits,
        uint[] memory maxs, uint _gatewayId
    ) public onlyOwner validGateway(_gatewayId)
    {
        uint tokenlen = tokenIds.length;
        uint pricelen = prices.length;
        uint limitlen = limits.length;
        uint maxlen = maxs.length;

        // TEST: For testing
        require(tokenlen == pricelen && pricelen == limitlen && limitlen == maxlen, 'OOPS: [] lengths must be the same');

        for (uint i; i < tokenlen; i++) {
            TokenProps memory token = tokenProps[tokenIds[i]];
            require(
                token.price == 0 && token.gatewayId == 0 && token.limit == 0 && token.max == 0,
                'TOKEN: Cannot remap existing token'
            );
            require(limits[i] < maxs[i], 'TOKEN: Limit too large');

            token.price = prices[i];
            token.limit = limits[i];
            token.gatewayId = _gatewayId;
            token.max = maxs[i];
            tokenProps[tokenIds[i]] = token;
        }
    }



    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
