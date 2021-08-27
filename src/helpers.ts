import { Address } from "@graphprotocol/graph-ts";
import { TokenContract } from "../generated/schema";
import {
  CHAIN_ID,
  ERC721,
  ERC721NameBytes,
  ERC721SymbolBytes,
} from "./constants";

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function fetchTokenContract(tokenAddress: Address): TokenContract {
  let tokenContract = TokenContract.load(tokenAddress.toHexString());
  if (tokenContract == null) {
    tokenContract = new TokenContract(tokenAddress.toHexString());
  }
  tokenContract.chain_id = CHAIN_ID;
  tokenContract.address = tokenAddress;
  tokenContract.name = fetchTokenContractName(tokenAddress);
  tokenContract.symbol = fetchTokenSymbol(tokenAddress);
  return tokenContract as TokenContract;
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC721.bind(tokenAddress);
  let contractSymbolBytes = ERC721SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = "unknown";
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}

export function fetchTokenContractName(address: Address): string {
  let contract = ERC721.bind(address);
  let contractNameBytes = ERC721NameBytes.bind(address);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}
