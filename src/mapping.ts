import {
  ClaimSuccess,
  CreationSuccess,
} from "../generated/NFTRedPacket/NFTRedPacket";
import {
  Claimer,
  Creator,
  NFTRedPacket,
  NFTRedPacketInfo,
} from "../generated/schema";
import { CHAIN_ID } from "./constants";
import { fetchTokenContract } from "./helpers";

export function handleCreationSuccess(event: CreationSuccess): void {
  let txHash = event.transaction.hash.toHexString();
  let red_packet_info = new NFTRedPacketInfo(txHash);

  // create creator
  let creator_addr = event.transaction.from.toHexString();
  let creator = Creator.load(creator_addr);
  if (creator == null) {
    creator = new Creator(creator_addr);
  }
  creator.address = event.params.creator;
  creator.name = event.params.name;
  creator.save();

  // create token
  let tokenContract = fetchTokenContract(event.params.token_address);
  tokenContract.save();

  red_packet_info.rpid = event.params.id.toHexString();
  red_packet_info.message = event.params.message;
  red_packet_info.name = event.params.name;
  red_packet_info.creation_time = event.params.creation_time.toI32();
  red_packet_info.save();

  // create nft red packet
  let rpid = red_packet_info.rpid;
  let red_packet = new NFTRedPacket(rpid);
  red_packet.chain_id = CHAIN_ID;
  red_packet.contract_address = event.transaction.to!;
  red_packet.contract_version = 1;
  red_packet.rpid = rpid;
  red_packet.txid = txHash;
  red_packet.blockNumber = event.block.number;
  red_packet.password = "PASSWORD INVALID"; // a password was stored locally and kept by creator
  red_packet.message = event.params.message;
  red_packet.name = event.params.name;
  red_packet.total = event.params.total_tokens;
  red_packet.duration = event.params.duration.toI32();
  red_packet.shares = event.params.packet_number.toI32();
  red_packet.creation_time = red_packet_info.creation_time;
  red_packet.last_updated_time = red_packet_info.creation_time;
  red_packet.creator = creator.id;
  red_packet.creator_address = event.params.creator;
  red_packet.claimers = [];
  red_packet.token_contract = tokenContract.id;
  red_packet.token_ids = event.params.token_ids;
  red_packet.save();
}

export function handleClaimSuccess(event: ClaimSuccess): void {
  // the nft red packet id
  let rpid = event.params.id.toHexString();

  // create claimer
  let claimer_addr = event.params.claimer.toHexString();
  let claimer = Claimer.load(claimer_addr);
  if (claimer == null) {
    claimer = new Claimer(claimer_addr);
  }
  claimer.address = event.params.claimer;
  claimer.name = event.params.claimer.toHexString().slice(0, 6);
  claimer.save();

  // update pool
  let red_packet = NFTRedPacket.load(rpid);
  if (red_packet == null) {
    return;
  }
  red_packet.last_updated_time = event.block.timestamp.toI32();
  if (!red_packet.claimers.includes(claimer_addr)) {
    red_packet.claimers = red_packet.claimers.concat([claimer.id]);
  }
  red_packet.save();
}
