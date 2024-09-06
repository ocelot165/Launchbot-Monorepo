import gql from "graphql-tag";

export const tokensQuery = gql`
  query GetTokensCreatedBy($creatorAddress: Bytes!) {
    createdTokens(
      where: { deployer: $creatorAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      deployer
      erc20Address
      id
      initialAmount
      name
      symbol
      timestamp
    }
  }
`;
