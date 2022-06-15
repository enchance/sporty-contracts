// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import 'hardhat/console.sol';
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

//import "@openzeppelin/contracts-upgradeable/security/PullPaymentUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import './lib/Utils.sol';
import './lib/PullPaymentUpgradeableMOD.sol';


interface IGatekeeper {
    function hasRole(bytes32 role, address account) external view returns (bool);
}

/// @custom:oz-upgrades-unsafe-allow external-library-linking
contract SportyArenaV1 is Initializable, ERC1155Upgradeable, ERC1155SupplyUpgradeable, PullPaymentUpgradeable, UUPSUpgradeable {
    using UtilsUint for uint;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct TokenProps {
        uint price;
        uint limit;
        uint gatewayId;
        uint circulation;
        uint max;
    }

    struct HolderProps {
        address addr;
        uint share;
        uint basetime;
        bool active;
    }

    string public constant name = 'Shifty';
    string public constant symbol = 'SHY';
    address internal constant MARKET_ACCOUNT = 0xD07A0C38C6c4485B97c53b883238ac05a14a85D6;
    bytes32 internal constant OWNER = keccak256("ARENA_OWNER");
    bytes32 internal constant ADMIN = keccak256("ARENA_ADMIN");
    bytes32 internal constant MODERATOR = keccak256("ARENA_MODERATOR");
    bytes32 internal constant CONTRACT = keccak256("ARENA_CONTRACT");

    mapping(uint => string) public gateways;
    mapping(uint => TokenProps) public tokenProps;
    mapping(uint => mapping(address => uint)) public tokensMinted;
    HolderProps[] internal holders;

    CountersUpgradeable.Counter internal gatewayCounter;
    IGatekeeper public gk;

    error InactiveHolder();
    error WindowIsClosed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _gateway, address _gatekeeperAddr,
        address payable[] memory _holders, uint[] memory _shares) initializer public
    {
        require(_holders.length == _shares.length, 'OOPS: [] lengths must be the same');

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

    modifier onlyRole(bytes32 role) {
        require(gk.hasRole(role, _msgSender()), 'You shall not pass!');
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

    function _tokenMapper(uint tokenId, uint price, uint limit, uint max, uint gatewayId) internal virtual {
        uint[] memory tokenIds = tokenId.asSingleton();
        uint[] memory prices = price.asSingleton();
        uint[] memory limits = limit.asSingleton();
        uint[] memory maxs = max.asSingleton();
        _tokenMapperBatch(tokenIds, prices, limits, maxs, gatewayId);
    }

    function tokenMapperBatch(uint[] memory tokenIds, uint[] memory prices, uint[] memory limits, uint[] memory maxs, uint _gatewayId)
        public virtual onlyRole(ADMIN) validGateway(_gatewayId)
    {
        _tokenMapperBatch(tokenIds, prices, limits, maxs, _gatewayId);
    }

    function _tokenMapperBatch(uint[] memory tokenIds, uint[] memory prices, uint[] memory limits,
        uint[] memory maxs, uint _gatewayId) internal virtual
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

    // TEST: Untested
    function setTokenPropsBatch(uint[] memory tokenIds, uint[] memory _maxs, uint[] memory _limits, bool change_gateway, uint _gatewayId)
        internal virtual onlyRole(ADMIN)
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

    function setGatekeeper(address addr) external virtual onlyRole(ADMIN) {
        _setGatekeeper(addr);
    }

    function _setGatekeeper(address addr) internal virtual {
        require(addr != address(0), 'OOPS: Address cannot be empty');
        gk = IGatekeeper(addr);
    }

    /**
     Find out the remaining number of mints an addr can make for a specific token.
     Marked as "internal" since this is checked off-chain for speed.
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
        require(token.circulation < token.max, 'TOKEN: Mintable amount exceeded');
        require(amount >= 1, 'TOKEN: Cannot accept zero amount');
        require(amount <= mintable, 'TOKEN: Mintable amount exceeded');
    }

    function _mintInit(uint tokenId, uint amount) private {
        require(amount >= 1, 'TOKEN: Cannot accept zero amount');

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

    function mintBatch(uint[] memory tokenIds, uint[] memory amounts, bytes memory data)
        public virtual payable
    {
        uint total;
        require(tokenIds.length == amounts.length, 'OOPS: [] lengths must be the same');

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

    /* END Overrides */


    function _authorizeUpgrade(address newImplementation) internal onlyRole(OWNER) override {}

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
