import dotenv from "dotenv";
import { ChainIds } from "../../constants";
import { ChainMapping } from "../../types/assets";

dotenv.config({ path: "../../.env" });

export const GRAPH_URI: ChainMapping = {
  [ChainIds.LOCALHOST]: `https://b63f-2804-388-e07c-3451-d19e-d2f9-bb4e-5755.ngrok-free.app/graph`,
  [ChainIds.ARBITRUM_GOERLI]: `https://api.goldsky.com/api/public/project_clm5qt3p4rajs38v85owch1oh/subgraphs/auction-subgraph-goerli/1.1.1/gn`,
  [ChainIds.BLAST_TESTNET]: `https://api.goldsky.com/api/public/project_clrzzrzhm111o01rehti60p51/subgraphs/auction-subgraph-blast/0.0.0/gn`
};
