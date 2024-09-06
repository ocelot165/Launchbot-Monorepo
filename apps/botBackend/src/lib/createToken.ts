import { Wallet, ethers, utils } from "ethers";
import { getProvider } from "shared/web3/getProvider";
import { getERC20FactoryContract } from "shared/web3/utils";

async function createToken(
  name: string,
  symbol: string,
  supply: string,
  privateKey: string,
  chainId: number
) {
  const wallet = new Wallet(privateKey, getProvider(chainId));

  const contract = getERC20FactoryContract(chainId);

  const feeData = await wallet.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (gasPrice === null)
    throw new Error("An error occurred while estimating gas");

  let walletBalance;
  let gas;
  let gasRequired;
  walletBalance = await wallet.getBalance();
  gas = await contract
    .connect(wallet)
    .estimateGas.deployERC20(name, symbol, ethers.utils.parseUnits(supply));
  gasRequired = gas.mul(gasPrice);
  if (walletBalance.lt(gasRequired))
    throw new Error(
      `Insufficient Gas for TX. Gas required: ${utils.formatEther(
        gasRequired
      )} ETH`
    );

  const tx = await contract
    .connect(wallet)
    .deployERC20(name, symbol, ethers.utils.parseUnits(supply));

  return tx.hash;
}

export default createToken;
