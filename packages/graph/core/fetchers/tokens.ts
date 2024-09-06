import { tokensQuery } from "shared/graph/core/queries/tokens";
import { TokenQuery } from "../types";
import { fetcher } from "./request";

export const fetchTokensCreatedByUser = async (
  user: string,
  chainId: number
): Promise<TokenQuery[]> => {
  try {
    const { createdTokens } = await fetcher(chainId, tokensQuery, {
      creatorAddress: user,
    });
    return createdTokens.map((token: any) => {
      return {
        erc20Address: token.erc20Address,
        name: token.name,
        symbol: token.symbol,
        initialAmount: token.initialAmount,
        decimals: 18,
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};
