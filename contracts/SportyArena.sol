// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import 'hardhat/console.sol';
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";

import './lib/Utils.sol';
import "./lib/Errors.sol";
import './modified/PullPaymentUpgradeableMOD.sol';
import './deployed/GatekeeperUpgInherit.sol';
import "./token/Mapping.sol";


interface IPunchOut {}

/// @custom:oz-upgrades-unsafe-allow external-library-linking
contract SportyArenaV1 is Initializable, ERC1155Upgradeable, ERC1155SupplyUpgradeable, PullPaymentUpgradeable, UUPSUpgradeable,
    GatekeeperUpgInherit, Errors, Mapping
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using UtilsUint for uint;

    struct HolderProps {
        address addr;
        uint share;
        uint basetime;
        bool active;
    }

    string public constant name = 'IndexSports Games';
    string public constant symbol = 'ISG';
    address internal constant MARKET_ACCOUNT = 0xD07A0C38C6c4485B97c53b883238ac05a14a85D6;
    bytes32 internal constant OWNER = keccak256("ARENA_OWNER");
    bytes32 internal constant ADMIN = keccak256("ARENA_ADMIN");
    bytes32 internal constant STAFF = keccak256("ARENA_STAFF");
    bytes32 internal constant CONTRACT = keccak256("CONTRACT");

    mapping(uint => string) public gateways;
    mapping(uint => mapping(address => uint)) public tokensMinted;
    HolderProps[] internal holders;

    CountersUpgradeable.Counter internal gatewayCounter;
    IPunchOut public po;

    error InactiveHolder();
    error WindowIsClosed();
    error MintableExceeded();
    error ZeroAmount();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _gateway, address _gatekeeperAddr,
        address payable[] memory _holders, uint[] memory _shares) initializer public
    {
        if(_holders.length != _shares.length) revert InvalidArrayLengths();

        __ERC1155_init("");
        __ERC1155Supply_init();
        __PullPayment_init();
        __UUPSUpgradeable_init();

        // Init Gatekeeper
        _setGatekeeper(_gatekeeperAddr);

        // Init gateway
        _addGateway(_gateway);

        // Init tokens
        {
            _tokenMapper(1, .1 ether, 15, 45, 0);
            _tokenMapper(2, .15 ether, 15, 100, 0);
            _tokenMapper(3, 1 ether, 15, 45, 0);
            _tokenMapper(4, 1.3 ether, 15, 45, 0);
        }

        // Holders
        for (uint i; i < _holders.length; i++) {
            holders.push(HolderProps({
                addr: _holders[i],
                share: _shares[i],
                basetime: 0,
                active: true
            }));
        }

        // TODO: Transfer minting to test instead of in here
        _mintInit(1, 1);
        _mintInit(1, 2);
        _mintInit(1, 3);  // 6
        _mintInit(2, 2);
        _mintInit(2, 3);
        _mintInit(2, 4);  // 9
    }

    modifier validGateway(uint gatewayId) {
        require(bytes(gateways[gatewayId]).length != 0, 'GATEWAY: Does not exist');
        _;
    }

    modifier validToken(uint tokenId) {
        require(exists(tokenId), 'TOKEN: Does not exist');
        _;
    }

    function addGateway(string memory _uri) public virtual onlyRole(ADMIN) {
        _addGateway(_uri);
    }

    function _addGateway(string memory _uri) internal virtual {
        require(bytes(_uri).length != 0, 'GATEWAY: Does not exist');
        uint gatewayId = gatewayCounter.current();
        gateways[gatewayId] = _uri;
        gatewayCounter.increment();
    }

    /**
     1. How many of this token is an account allowed to have?
     2. How many are mintable at this time? - Prevents overminting. Increase as needed.
     */
    function tokenMapper(uint tokenId, uint price, uint limit, uint max, uint gatewayId) public virtual onlyRole(ADMIN) {
        _tokenMapper(tokenId, price, limit, max, gatewayId);
    }

    function tokenMapperBatch(uint[] memory tokenIds, uint[] memory prices, uint[] memory limits, uint[] memory maxs, uint _gatewayId)
        public virtual onlyRole(ADMIN) validGateway(_gatewayId)
    {
        _tokenMapperBatch(tokenIds, prices, limits, maxs, _gatewayId);
    }

    function updateTokenMaps(uint[] calldata tokenIds, uint[] calldata limits, uint[] calldata maxs) external virtual onlyRole(STAFF) {
        _updateTokenMaps(tokenIds, limits, maxs);
    }

    function updateTokenGateway(uint tokenId, uint gatewayId) external onlyRole(STAFF) validGateway(gatewayId) {
        _updateTokenGateway(tokenId, gatewayId);
    }

    function updateTokenGatewayBatch(uint[] calldata tokenIds, uint gatewayId) external onlyRole(STAFF) validGateway(gatewayId) {
        _updateTokenGatewayBatch(tokenIds, gatewayId);
    }

    /**
     Find out the remaining number of mints an addr can make for a specific token.
     @param addr:     Account address
     @param tokenId:  Token
     */
    function mintableAmount(address addr, uint tokenId) public view virtual returns (uint) {
        TokenProps memory token = tokenProps[tokenId];
        if(gk.hasRole(ADMIN, _msgSender())) {
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

    function _allocate(uint _amount) internal virtual {
        uint bp = 10000;
        if(_amount > bp) {
            uint amount = _amount.split(8000);  // Only distribute 80%
            uint len = holders.length;

            for (uint i; i < len; i++) {
                HolderProps memory holder = holders[i];
                uint to_send = amount.split(holder.share);
                _asyncTransfer(holder.addr, to_send);
            }
        }
    }

    function _preMintRequirements(TokenProps memory token, uint mintable, uint amount) internal virtual {
        require(
            token.price > 0 && token.limit > 0 && token.max > token.limit,
            'TOKEN: Does not exist'
        );
        if(token.circulation >= token.max) revert MintableExceeded();
        if(amount == 0) revert ZeroAmount();
        if(amount > mintable) revert MintableExceeded();
    }

    function _mintInit(uint tokenId, uint amount) private {
        if(amount == 0) revert ZeroAmount();

        TokenProps memory token = tokenProps[tokenId];
        uint mintable = mintableAmount(_msgSender(), tokenId);

        _preMintRequirements(token, mintable, amount);

        token.circulation += amount;
        tokenProps[tokenId] = token;

        tokensMinted[tokenId][MARKET_ACCOUNT] += amount;
        _mint(MARKET_ACCOUNT, tokenId, amount, '');
        _allocate(msg.value);
    }

    function mint(uint tokenId, uint amount, bytes memory data) public virtual payable {
        TokenProps memory token = tokenProps[tokenId];
        uint mintable = mintableAmount(_msgSender(), tokenId);

        _preMintRequirements(token, mintable, amount);

        token.circulation += amount;
        tokenProps[tokenId] = token;

        if(gk.hasRole(ADMIN, _msgSender())) {
            tokensMinted[tokenId][MARKET_ACCOUNT] += amount;
            _mint(MARKET_ACCOUNT, tokenId, amount, data);
        }
        else {
            require(msg.value >= token.price * amount, 'OOPS: Insufficient amount');
            tokensMinted[tokenId][_msgSender()] += amount;
            _mint(_msgSender(), tokenId, amount, data);
        }
        _allocate(msg.value);
    }

    function mintBatch(uint[] memory tokenIds, uint[] memory amounts, bytes memory data) public virtual payable {
        uint total;

        if(tokenIds.length != amounts.length) revert InvalidArrayLengths();

        for (uint i; i < tokenIds.length; i++) {
            uint tokenId = tokenIds[i];
            uint amount = amounts[i];

            TokenProps memory token = tokenProps[tokenId];
            uint mintable = mintableAmount(_msgSender(), tokenId);

            _preMintRequirements(token, mintable, amount);

            token.circulation += amount;
            tokenProps[tokenId] = token;

            if(gk.hasRole(ADMIN, _msgSender())) {
                tokensMinted[tokenId][MARKET_ACCOUNT] += amount;
            }
            else {
                tokensMinted[tokenId][_msgSender()] += amount;
                total += token.price * amount;
            }
        }

        if(gk.hasRole(ADMIN, _msgSender())) {
            _mintBatch(MARKET_ACCOUNT, tokenIds, amounts, data);
        }
        else {
            require(msg.value >= total, 'OOPS: Insufficient amount');
            _mintBatch(_msgSender(), tokenIds, amounts, data);
        }
        _allocate(msg.value);
    }

    function toggleHolder(address addr, bool active) external onlyRole(OWNER) {
        uint len = holders.length;
        for (uint i; i < len; i++) {
            HolderProps memory holder = holders[i];
            if(holder.addr == addr) {
                if(holder.active != active) {
                    holder.active = active;
                    holders[i] = holder;
                }
                break;
            }
        }
    }

    function uri(uint tokenId) public view virtual override validToken(tokenId) returns (string memory) {
        uint gatewayId = tokenProps[tokenId].gatewayId;
        return gateways[gatewayId];
    }

    function withdrawPayments(address payable payee) public virtual override {
        uint delay = 7 days;
        uint len = holders.length;

        for (uint i; i < len; i++) {
            HolderProps memory holder = holders[i];
            if(holder.addr == payee) {
                uint prevTime = holder.basetime;
                holder.basetime = block.timestamp;
                holders[i] = holder;

                // Window
                if(!holder.active) revert InactiveHolder();
                if(prevTime.window(delay) > 0) revert WindowIsClosed();

                _escrow.withdraw(payee);
                break;
            }
        }
    }

    function window(address payee) external view returns (uint) {
        uint delay = 7 days;
        uint remaining;
        uint len = holders.length;

        for (uint i; i < len; i++) {
            HolderProps memory holder = holders[i];
            if(holder.addr == payee) {
                remaining = holder.basetime.window(delay);
                break;
            }
        }
        return remaining;
    }

    function setGatekeeper(address addr) external virtual onlyRole(OWNER) {
        _setGatekeeper(addr);
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(OWNER) override {}



    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    // TODO: DELETE this before deployment
    // DELETE ME
    function foo() public pure virtual returns (uint) {
        return 123;
    }
}

/// @custom:oz-upgrades-unsafe-allow external-library-linking
contract SportyArenaV2 is SportyArenaV1 {
    // DELETE ME
    function foo() public pure virtual override returns (uint) {
        return 789;
    }
}