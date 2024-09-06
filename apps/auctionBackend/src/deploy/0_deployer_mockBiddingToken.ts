import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { contractNames } from "../ts/deploy";

const deployMockBiddingToken: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  //only on arbitrum goerli
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  console.log(chainId);
  if (chainId === 421613 || chainId === 168587773) {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;
    const { mockBiddingToken } = contractNames;

    const deploymentUSDC = await deploy(mockBiddingToken, {
      from: deployer,
      gasLimit: 8000000,
      args: ["USD Coin", "USDC"],
      log: true,
    });

    const deploymentDAI = await deploy(mockBiddingToken, {
      from: deployer,
      gasLimit: 8000000,
      args: ["DAI", "DAI"],
      log: true,
    });

    const deploymentUSDT = await deploy(mockBiddingToken, {
      from: deployer,
      gasLimit: 8000000,
      args: ["USDT", "USDT"],
      log: true,
    });

    await deployments.save("DAI", {
      abi: deploymentDAI.abi,
      address: deploymentDAI.address,
    });

    await deployments.save("USDC", {
      abi: deploymentUSDC.abi,
      address: deploymentUSDC.address,
    });

    await deployments.save("USDT", {
      abi: deploymentUSDT.abi,
      address: deploymentUSDT.address,
    });
  }
};

export default deployMockBiddingToken;
deployMockBiddingToken.tags = ["USDC"];
