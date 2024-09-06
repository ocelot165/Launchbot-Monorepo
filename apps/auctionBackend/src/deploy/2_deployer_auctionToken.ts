import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getUniswapV2RouterAddress } from "../tasks/utils";
import { contractNames } from "../ts/deploy";

const deployAuctionToken: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const { auctionToken } = contractNames;

  const uniswapV2RouterAddress = await getUniswapV2RouterAddress(hre);
  const teamWallet = "0x979D947F4Dd459dFeECF4Ffc479c5B83828f1a54"; // TODO: change to team wallet
  const revShareWallet = "0x979D947F4Dd459dFeECF4Ffc479c5B83828f1a54"; // TODO: change to rev share wallet

  await deployments.save("TeamWallet", {
    address: teamWallet,
    abi: [],
  });

  await deployments.save("RevShareWallet", {
    address: revShareWallet,
    abi: [],
  });

  const uniswapV2Wrapper = await deploy("UniswapV2Wrapper", {
    from: deployer,
    gasLimit: 8000000,
    args: [uniswapV2RouterAddress],
    log: true,
  });

  await deploy(auctionToken, {
    from: deployer,
    gasLimit: 8000000,
    args: [
      30, // revShareFee
      20, // buybackFee
      20, // lpFee
      30, // teamFee
      revShareWallet, // revShareWallet
      teamWallet, // teamWallet
      uniswapV2Wrapper.address,
    ],
    log: true,
  });
};

export default deployAuctionToken;
deployAuctionToken.tags = ["AuctionToken"];
