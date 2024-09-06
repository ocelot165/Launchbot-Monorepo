import { getProvider } from "./getProvider";

export async function getTXStatus(txHash: string, chainId: number) {
  try {
    const provider = getProvider(chainId);
    if (!provider) return;
    await provider.waitForTransaction(txHash);
    // const tx = await provider.getTransaction(txHash);
    // const txReceipt = await tx.wait();
    // console.log(txReceipt);
    // if (txReceipt.status === 1) {
    //   return true;
    // } else {
    //   throw new Error("An unexpected error occurred");
    // }
    return true;
  } catch (error) {
    console.log(error);
    throw new Error("An unexpected error occurred");
  }
}
