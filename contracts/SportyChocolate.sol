// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PullPaymentUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import './lib/Utils.sol';



// TODO: Create a separate page for each token

contract SportyChocolateV1 is Initializable, ERC1155Upgradeable, OwnableUpgradeable,
    ERC1155SupplyUpgradeable, ERC1155BurnableUpgradeable, PullPaymentUpgradeable, UUPSUpgradeable
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
//    bytes32 internal constant OWNER = keccak256("OWNER");
//    bytes32 internal constant ADMIN = keccak256("ADMIN");
//    bytes32 internal constant MODERATOR = keccak256("MODERATOR");
//    bytes32 internal constant UPGRADER = keccak256("UPGRADER");

    // string public name;
    // string public symbol;
    mapping(uint => uint) public uris;
    mapping(uint => string) public gateways;
    mapping(uint => TokenProps) public tokenProps;
    mapping(uint => mapping(address => uint)) public tokensMinted;
    CountersUpgradeable.Counter internal gatewayCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _uri) public initializer {
        __ERC1155_init("");
        __Ownable_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __PullPayment_init();
        __UUPSUpgradeable_init();

//        name = ' Nifty';
//        symbol = 'NIFTY';

//        // Init roles
////        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
//        _grantRole(OWNER, msg.sender);
//        _grantRole(ADMIN, msg.sender);
//        _grantRole(MODERATOR, msg.sender);
//        _grantRole(UPGRADER, msg.sender);
//        // Pierre: ADMIN, MODERATOR
//        // Mike: ADMIN, MODERATOR, UPGRADER
//
//        // ACCOUNTS FOR TESTING
//        _grantRole(ADMIN, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
//        _grantRole(MODERATOR, 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);
//        _grantRole(UPGRADER, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
//
//        _setRoleAdmin(OWNER, OWNER);
//        _setRoleAdmin(ADMIN, OWNER);
//        _setRoleAdmin(MODERATOR, ADMIN);
//        _setRoleAdmin(UPGRADER, OWNER);

        // Init gateway
        addGateway(_uri);

        // Init tokens
        {
            tokenMapper(1, .1 ether, 15, 45, 0);
            tokenMapper(2, .15 ether, 15, 100, 0);
            tokenMapper(3, 1 ether, 15, 45, 0);
            tokenMapper(4, 1.3 ether, 15, 45, 0);
        }

        // TODO: Transfer minting to test instead of in here
        mint(1, 1, '');
        mint(1, 2, '');
        mint(1, 3, '');  // 6
        mint(2, 2, '');
        mint(2, 3, '');
        mint(2, 4, '');  // 9
    }

    modifier validGateway(uint gatewayId) {
        require(bytes(gateways[gatewayId]).length != 0, 'GATEWAY: Does not exist');
        _;
    }

    modifier validToken(uint tokenId) {
        require(exists(tokenId), 'TOKEN: Does not exist');
        _;
    }

    function addGateway(string memory _uri) public virtual onlyOwner returns (uint) {
        require(bytes(_uri).length != 0, 'GATEWAY: Does not exist');
        uint gatewayId = gatewayCounter.current();
        gateways[gatewayId] = _uri;
        gatewayCounter.increment();
        return gatewayId;
    }

    // function setURI(uint tokenId, uint gatewayId) external virtual onlyRole(ADMIN) validToken(tokenId) validGateway(gatewayId) {
    //     _setURI(tokenId, gatewayId);
    // }

    // function _setURI(uint tokenId, uint gatewayId) internal virtual {
    //     require(tokenId >= 1, 'TOKEN: Does not exist');
    //     uris[tokenId] = gatewayId;
    // }


    // TEST: Untested
    function setTokenPropsBatch(uint[] memory tokenIds, uint[] memory _maxs, uint[] memory _limits, bool change_gateway, uint _gatewayId) 
        internal virtual onlyOwner
    {
        uint tokenlen = tokenIds.length;
        uint maxlen = _maxs.length;
        uint limitlen = _limits.length;

        if(maxlen > 0) {
            require(maxlen == tokenlen, 'OOPS: [] lengths must be the same');
        }
        if(limitlen > 0) {
            require(limitlen == tokenlen, 'OOPS: [] lengths must be the same');
        }

        for (uint i; i < tokenlen; i++) {
            TokenProps memory token = tokenProps[tokenIds[i]];
            
            if(maxlen > 0) {
                // This prevents overminting since the mint() fn is public.
                require(_maxs[i] > token.max, 'TOKEN: Invalid token value');
                token.max = _maxs[i];
            }
            if(limitlen > 0) {
                require(_limits[i] > token.limit, 'TOKEN: Invalid token value');
                
                uint capvalue = maxlen > 0 ? _maxs[i] : token.max;

                require(_limits[i] < capvalue, 'TOKEN: Invalid token value');

                token.limit = _limits[i];
            }
            if(change_gateway) {
                token.gatewayId = _gatewayId;
            }
        
            tokenProps[tokenIds[i]] = token;
        }
    }

    /**
     Find out the remaining number of mints an addr can make for a specific token.
     Marked as "internal" since this is checked off-chain for speed.
     @param addr:     Account address
     @param tokenId:  Token
     */
    function _mintable(address addr, uint tokenId) internal view returns (uint) {
        TokenProps memory token = tokenProps[tokenId];
        if(_msgSender() == owner()) {
            // Mint as many as max allows
            return token.max - token.circulation;
        }
        else {
            // Check user limits
            uint from_max = token.max - token.circulation;
            uint from_limit = token.limit - tokensMinted[tokenId][addr];
            return from_max < from_limit ? from_max : from_limit;
        }
    }

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

    // TEST: For testing
    function mint(uint tokenId, uint amount, bytes memory data)
        public virtual payable returns (bool)
    {
        require(amount >= 1, 'TOKEN: Cannot accept zero amount');

        TokenProps memory token = tokenProps[tokenId];
        uint mintable = _mintable(_msgSender(), tokenId);

        require(
            token.price > 0 && token.limit > 0 && token.max > token.limit,
            'TOKEN: Does not exist'
        );
        require(amount <= token.max - token.circulation, 'TOKEN: Cannot mint beyond max');
        require(mintable >= 1 && amount <= mintable, 'TOKEN: limit reached');

        token.circulation += amount;

        if(_msgSender() == owner()) {
            tokensMinted[tokenId][MARKET_ACCOUNT] += amount;
            _mint(MARKET_ACCOUNT, tokenId, amount, data);
        }
        else {
            require(msg.value == token.price * amount, 'TOKEN: Exact amount only');
            tokensMinted[tokenId][_msgSender()] += amount;
            _mint(_msgSender(), tokenId, amount, data);
        }
        tokenProps[tokenId] = token;
        return true;
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



    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}


//    // The following functions are overrides required by Solidity.
//
//    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable,
//        AccessControlUpgradeable) returns (bool)
//    {
//        return super.supportsInterface(interfaceId);
//    }


    /* Overrides */

    function uri(uint tokenId) public view virtual override validToken(tokenId) returns (string memory) {
        return gateways[uris[tokenId]];
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
    internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

//    function _checkRole(bytes32 role, address account) internal view virtual override {
//        if (!hasRole(role, account)) {
//            revert("You shall not pass!");
//        }
//    }


//    /* DELETE BEFORE DEPLOYMENT TO MAINNET */
//
//    function access_owner() external view onlyOwner returns (uint) {
//        return 42;
//    }
////    function access_admin() external view onlyRole(ADMIN) returns (uint) {
////        return 42;
////    }
//    function access_upgrader() external view onlyOwner returns (uint) {
//        return 42;
//    }
}
