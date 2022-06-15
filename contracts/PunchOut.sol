//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


// TODO: Only one user can create Leagues
// TODO: Stages are created to host matches
// TODO: Players populate the stages
// TODO: Once a match starts it cannot be stopped
// TODO: People can bet on a match with a minimum bet set by the players

/*
PLAYERS:
- Match players
- Bettors
- League Host
- Arbiters: not selected or owned by the League Host

PAYOUT:
- League Host: 10%
-

MATCH PHASES:
- Posted
- Ongoing
- Started
- Ended
- Finalized
*/


contract PunchOut is Initializable, UUPSUpgradeable {

}