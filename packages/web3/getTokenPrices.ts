import { ChainIds, DEFI_LLAMA_API } from "../constants";
import { getAddress } from "ethers/lib/utils";

const getDefiLLamaQuery = (tokens: string[]) => {
  let query = "";
  for (let index = 0; index < tokens.length; index++) {
    if (index !== 0) {
      query += ",";
    }
    query += `arbitrum:${getAddress(tokens[index])}`;
  }
  return query;
};

export async function getTokenPrices(tokens: string[], chainId: number) {
  if (chainId === ChainIds.ARBITRUM_GOERLI) {
    return {
      "0x040c70c5D4e97A87b27876585C011412696fe432": 1
    };
  } else if (chainId === ChainIds.BLAST_TESTNET) {
    return {
      "0x9F95d4Ad58F8b2bE5C602c84d6E59A0706cc18C3": 1,
      "0x14044fAC147B6417fAC0840ff6fD5678602017Fd": 1,
      "0x43b6047C689F6676731C3D0fFd40D02B3e11c62b": 1
    };
  } else {
    let tokenMapping: Record<string, number> = {};
    const query = getDefiLLamaQuery(tokens);
    const response = await fetch(`${DEFI_LLAMA_API}/prices/current/${query}`);
    const result = await response.json();
    const coins = result?.coins ?? {};
    for (let index = 0; index < tokens.length; index++) {
      const coinData = coins[`ethereum:${getAddress(tokens[index])}`];
      if (coinData && coinData.confidence > 0.75) {
        tokenMapping[getAddress(tokens[index])] = Number(coinData.price);
      }
    }
    return tokenMapping;
  }
}
