// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBlast {
    function configureClaimableGas() external;

    function claimAllGas(
        address contractAddress,
        address recipientOfGas
    ) external returns (uint256);

    function claimMaxGas(
        address contractAddress,
        address recipientOfGas
    ) external returns (uint256);
}
