import { BigNumber } from "ethers";
import { ChainMapping } from "./types/assets";

export enum ChainIds {
  ETHEREUM = 1,
  ARBITRUM = 42161,
  FANTOM = 250,
  ARBITRUM_RINKEBY = 421611,
  ARBITRUM_GOERLI = 421613,
  KOVAN = 42,
  GOERLI = 5,
  LOCALHOST = 31337,
  MELIORA_TEST = 3333,
  BLAST_TESTNET = 168587773
}

export const ZERO_ADDRESS: string =
  "0x0000000000000000000000000000000000000000";

export const ETH_PRICE_FEED_ID: string =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

export const HERMES_URL: string = "https://hermes-beta.pyth.network";

export const RPC_URLS: ChainMapping = {
  [ChainIds.LOCALHOST]: `https://b63f-2804-388-e07c-3451-d19e-d2f9-bb4e-5755.ngrok-free.app/rpc`,
  [ChainIds.ARBITRUM_GOERLI]: `https://arb-goerli.g.alchemy.com/v2/KR0VnTKpJ4s7w-IoXTdiSX1D35gtRv-E`,
  [ChainIds.BLAST_TESTNET]:
    "https://practical-evocative-valley.blast-sepolia.quiknode.pro/5a1302f1d47a9c3c17b6c2139523001beaba7fe2/"
  // "https://rpc.ankr.com/blast_testnet_sepolia/5eabfdf298ec6109f8c7dfd9e4805b974364359d347cd1fdf1afd19b9ecbbeb4"
  // "https://blast-sepolia.drpc.org"
};

export const SOCKET_RPC_URLS: ChainMapping = {
  [ChainIds.LOCALHOST]: `wss://b63f-2804-388-e07c-3451-d19e-d2f9-bb4e-5755.ngrok-free.app/rpc`,
  [ChainIds.ARBITRUM_GOERLI]: `wss://arb-goerli.g.alchemy.com/v2/KR0VnTKpJ4s7w-IoXTdiSX1D35gtRv-E`,
  [ChainIds.BLAST_TESTNET]:
    "wss://practical-evocative-valley.blast-sepolia.quiknode.pro/5a1302f1d47a9c3c17b6c2139523001beaba7fe2/"
};

export const ETHERSCAN_URL: ChainMapping = {
  [ChainIds.ARBITRUM]: "https://arbiscan.io",
  [ChainIds.ARBITRUM_GOERLI]: "https://testnet.arbiscan.io",
  [ChainIds.LOCALHOST]: "",
  [ChainIds.MELIORA_TEST]: "https://volatilis-testnet.calderaexplorer.xyz",
  [ChainIds.BLAST_TESTNET]: "https://testnet.blastscan.io/"
};

export const EASY_AUCTION_ADDRESS: ChainMapping = {
  [ChainIds.LOCALHOST]: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`,
  [ChainIds.ARBITRUM_GOERLI]: "0xB792bf99843FBEf42814c0C931FbbA563B579DC5",
  [ChainIds.BLAST_TESTNET]: "0xc95Bc0Ab5556c4fd347CFF1bb9948208197849d8"
};

export const PYTH_CONTRACT_ADDRESS: ChainMapping = {
  [ChainIds.LOCALHOST]: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`,
  [ChainIds.ARBITRUM_GOERLI]: "0xB792bf99843FBEf42814c0C931FbbA563B579DC5",
  [ChainIds.BLAST_TESTNET]: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"
};

export const TOKEN_DEPLOYER_ADDRESS: ChainMapping = {
  [ChainIds.LOCALHOST]: `0xB3a41f225e1080D2D79c3eFe351074dd73f8a9cE`,
  [ChainIds.ARBITRUM_GOERLI]: "0xD7CEba9905c9311E701Dd2Dc212469D24c09576d",
  [ChainIds.BLAST_TESTNET]: "0xD01A049DaBE978F14f5f4Bb4814392c19e324bFF"
};

export const REFERRAL_REWARD_MANAGER_ADDRESS: ChainMapping = {
  [ChainIds.LOCALHOST]: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`,
  [ChainIds.ARBITRUM_GOERLI]: "0x2F5534ccDb562cf2BAD5e453248163E51D921e99",
  [ChainIds.BLAST_TESTNET]: "0xd04655263AeEC6723689BC09c8153b5e0c6B8D1a"
};

export const WRAPPED_NATIVE_ADDRESS: ChainMapping = {
  [ChainIds.ARBITRUM]: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  [ChainIds.ARBITRUM_GOERLI]: "0xEe01c0CD76354C383B8c7B4e65EA88D00B06f36f",
  [ChainIds.LOCALHOST]: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  [ChainIds.MELIORA_TEST]: "0xF5c6100Fa77971b2B531c752eA82874Df8bAB44A",
  [ChainIds.BLAST_TESTNET]: "0x4200000000000000000000000000000000000023"
};

export const NATIVE_ADDRESS: ChainMapping = {
  [ChainIds.ARBITRUM]: "0x0000000000000000000000000000000000000000",
  [ChainIds.ARBITRUM_GOERLI]: "0x0000000000000000000000000000000000000000",
  [ChainIds.LOCALHOST]: "0x0000000000000000000000000000000000000000",
  [ChainIds.MELIORA_TEST]: "0x0000000000000000000000000000000000000000"
};

export const NATIVE_NAME: ChainMapping = {
  [ChainIds.ARBITRUM]: "Ether",
  [ChainIds.ARBITRUM_GOERLI]: "Ether",
  [ChainIds.LOCALHOST]: "Ether",
  [ChainIds.MELIORA_TEST]: "Ether"
};
export const NATIVE_SYMBOL: ChainMapping = {
  [ChainIds.ARBITRUM]: "ETH",
  [ChainIds.ARBITRUM_GOERLI]: "ETH",
  [ChainIds.LOCALHOST]: "ETH",
  [ChainIds.MELIORA_TEST]: "ETH"
};

export const ERC20_FACTORY_ADDRESS: ChainMapping = {
  [ChainIds.ARBITRUM]: "0x000",
  [ChainIds.ARBITRUM_GOERLI]: "0xD7CEba9905c9311E701Dd2Dc212469D24c09576d",
  [ChainIds.BLAST_TESTNET]: "0xD01A049DaBE978F14f5f4Bb4814392c19e324bFF"
};

export const BIDDING_TOKENS: ChainMapping = {
  [ChainIds.BLAST_TESTNET]: [
    {
      address: "0x9F95d4Ad58F8b2bE5C602c84d6E59A0706cc18C3",
      symbol: "USDC",
      name: "USD Coin",
      logoURI: "/webApp/logos/USDC.svg"
    },
    {
      address: "0x14044fAC147B6417fAC0840ff6fD5678602017Fd",
      symbol: "DAI",
      name: "DAI Stablecoin",
      logoURI: "/webApp/logos/DAI.svg"
    },

    {
      address: "0x43b6047C689F6676731C3D0fFd40D02B3e11c62b",
      symbol: "USDT",
      name: "Tether USD",
      logoURI: "/webApp/logos/USDT.svg"
    }
  ]
};

export const CHAIN_ID = ChainIds.BLAST_TESTNET;

export const START_BLOCK = 50913042;

export const FEE_NUMERATOR = BigNumber.from("50");

export const WEB_APP_URL = "t.me/Blast_Launch_test_bot/LaunchbotApp";

export const DEFI_LLAMA_API = "https://coins.llama.fi";
