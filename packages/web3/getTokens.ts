import { BigNumber, utils } from "ethers";
import {
  NATIVE_ADDRESS,
  NATIVE_NAME,
  NATIVE_SYMBOL,
  RPC_URLS,
} from "../constants";
import fetch, { RequestInit } from "node-fetch";

interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
}

interface TokenResponse {
  address: string;
  pageKey: string;
  tokenBalances: TokenBalance[];
}

async function fetchData(
  method: string,
  params: any[],
  chainId: number
): Promise<any> {
  const raw = JSON.stringify({
    jsonrpc: "2.0",
    method,
    headers: {
      "Content-Type": "application/json",
    },
    params,
    id: 1,
  });

  const requestOptions: RequestInit = {
    method: "POST",
    body: raw,
    redirect: "follow" as RequestRedirect,
  };

  try {
    const response = await fetch(RPC_URLS[chainId], requestOptions);
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`Error fetching data with method ${method}:`, error);
    throw error;
  }
}

async function fetchTokenMetadata(
  tokenAddress: string,
  chainId: number
): Promise<any> {
  return fetchData("alchemy_getTokenMetadata", [tokenAddress], chainId);
}

async function getTokens(userAddress: string, chainId: number) {
  try {
    const data: TokenResponse = await fetchData(
      "alchemy_getTokenBalances",
      [userAddress, "erc20"],
      chainId
    );

    const tokenAddresses = data?.tokenBalances?.map(
      (token) => token.contractAddress
    );

    const userTokensPromises = tokenAddresses.map(
      async (tokenAddress, index) => {
        const metadata = await fetchTokenMetadata(tokenAddress, chainId);
        const isETHToken =
          tokenAddress.toLowerCase() ===
          (NATIVE_ADDRESS?.[chainId] ?? "").toLowerCase();

        const balance = BigNumber.from(
          data?.tokenBalances?.[index]?.tokenBalance
        );

        return {
          name: isETHToken ? NATIVE_NAME[chainId] : metadata?.name,
          decimals: metadata?.decimals,
          symbol: isETHToken ? NATIVE_SYMBOL?.[chainId] : metadata?.symbol,
          chainId,
          address: isETHToken ? NATIVE_ADDRESS?.[chainId] : tokenAddress,
          balance: utils.formatUnits(balance, metadata?.decimals),
        };
      }
    );

    const userTokens = await Promise.all(userTokensPromises);

    return userTokens;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    throw error;
  }
}

export default getTokens;
