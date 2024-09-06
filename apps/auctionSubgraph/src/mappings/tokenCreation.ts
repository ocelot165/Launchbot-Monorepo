import { ERC20Deployed } from "../../generated/ERC20Factory/ERC20Factory";
import { CreatedToken } from "../../generated/schema";

export function handleERC20Deployed(event: ERC20Deployed): void {
  let entity = new CreatedToken(event.transaction.hash.toHex());

  entity.deployer = event.params.deployer;
  entity.erc20Address = event.params.erc20Address;
  entity.name = event.params.name;
  entity.symbol = event.params.symbol;
  entity.initialAmount = event.params.initialAmount;
  entity.timestamp = event.block.timestamp;

  entity.save();
}
