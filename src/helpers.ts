import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  ERC721,
  ERC721NameBytes,
  ERC721SymbolBytes,
  CHAIN_ID,
  TOKEN_TYPE_ETHER,
  TOKEN_TYPE_ERC721,
  ETH_ADDR,
} from "./constants";

import { Token } from "../generated/schema";

export function isEth(value: string): boolean {
  return value == ETH_ADDR;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function fetchToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (token == null) {
    token = new Token(tokenAddress.toHexString());
  }
  token.type = isEth(tokenAddress.toHex())
    ? TOKEN_TYPE_ETHER
    : TOKEN_TYPE_ERC721;
  token.chain_id = CHAIN_ID;
  token.address = tokenAddress;
  token.name = fetchTokenName(tokenAddress);
  token.symbol = fetchTokenSymbol(tokenAddress);
  return token as Token;
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  if (isEth(tokenAddress.toHexString())) {
    return "ETH";
  }

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

export function fetchTokenName(tokenAddress: Address): string {
  if (isEth(tokenAddress.toHexString())) {
    return "Ether";
  }

  let contract = ERC721.bind(tokenAddress);
  let contractNameBytes = ERC721NameBytes.bind(tokenAddress);

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
