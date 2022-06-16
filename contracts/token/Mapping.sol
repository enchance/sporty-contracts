//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import '../lib/Utils.sol';
import '../lib/Errors.sol';


contract Mapping is Errors {
    using UtilsUint for uint;

    struct TokenProps {
        uint price;
        uint limit;
        uint gatewayId;
        uint circulation;
        uint max;
    }

    error RemappingToken();
    error LargeTokenLimit();

    mapping(uint => TokenProps) public tokenProps;

    function _tokenMapper(uint tokenId, uint price, uint limit, uint max, uint gatewayId) internal virtual {
        uint[] memory tokenIds = tokenId.asSingleton();
        uint[] memory prices = price.asSingleton();
        uint[] memory limits = limit.asSingleton();
        uint[] memory maxs = max.asSingleton();
        _tokenMapperBatch(tokenIds, prices, limits, maxs, gatewayId);
    }

    function _tokenMapperBatch(uint[] memory tokenIds, uint[] memory prices, uint[] memory limits,
        uint[] memory maxs, uint _gatewayId) internal virtual
    {
        uint tokenlen = tokenIds.length;
        uint pricelen = prices.length;
        uint limitlen = limits.length;
        uint maxlen = maxs.length;

        if(tokenlen != pricelen || tokenlen != limitlen || tokenlen != maxlen) revert InvalidArrayLengths();

        for (uint i; i < tokenlen; i++) {
            TokenProps memory token = tokenProps[tokenIds[i]];

            // Reverts
            if(token.price != 0 && token.limit != 0 && token.max != 0 && token.circulation != 0) revert RemappingToken();
            if(limits[i] >= maxs[i]) revert LargeTokenLimit();

            token.price = prices[i];
            token.limit = limits[i];
            token.gatewayId = _gatewayId;
            token.max = maxs[i];
            tokenProps[tokenIds[i]] = token;
        }
    }
}

