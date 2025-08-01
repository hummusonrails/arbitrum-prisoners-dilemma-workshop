// Prisoner's Dilemma Game Contract
//
// This contract implements a multiplayer Prisoner's Dilemma game where players
// stake tokens and make strategic decisions to cooperate or defect.
//
// Game Rules:
// - Players join games by staking tokens
// - Each player chooses to cooperate or defect
// - Payoffs are distributed based on the classic prisoner's dilemma matrix:
//   - Both cooperate: Both get moderate reward
//   - Both defect: Both get small punishment
//   - One cooperates, one defects: Defector gets large reward, cooperator gets large punishment
//
// Note: this code is a template-only and has not been audited.
//
// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::vec::Vec;
use stylus_sdk::{alloy_primitives::{U256, Address}, prelude::*, stylus_core};
use alloy_sol_types::sol;

// Game move options
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Move {
    Cooperate = 0,
    Defect = 1,
}

impl From<u8> for Move {
    fn from(value: u8) -> Self {
        match value {
            0 => Move::Cooperate,
            _ => Move::Defect,
        }
    }
}

// Round state within a cell
#[derive(Clone)]
pub struct Round {
    pub player1_move: Option<Move>,
    pub player2_move: Option<Move>,
    pub player1_payout: U256,
    pub player2_payout: U256,
    pub is_finished: bool,
}

// Cell represents a multi-round game between two players
#[derive(Clone)]
pub struct Cell {
    pub player1: Address,
    pub player2: Address,
    pub stake_amount: U256,
    pub total_rounds: u8,
    pub current_round: u8,
    pub is_complete: bool,
    pub rounds: Vec<Round>,
    pub continuation_flags: u8,
}

// Contract storage
sol_storage! {
    #[entrypoint]
    pub struct PrisonersDilemma {
        uint256 cell_counter;
        mapping(uint256 => bytes) cells;
        mapping(address => uint256) player_to_cell;
        mapping(bytes32 => uint256) players_to_cell;
        mapping(uint256 => uint256) cell_stakes;
        uint256 min_stake;
        address owner;
    }
}

// Events
sol! {
    event CellCreated(uint256 indexed cell_id, address indexed player1, uint256 stake);
    event PlayerJoined(uint256 indexed cell_id, address indexed player2);
    event RoundComplete(uint256 indexed cell_id, uint8 round_num);
    event CellComplete(uint256 indexed cell_id);
}

#[public]
impl PrisonersDilemma {
    pub fn initialize(&mut self, min_stake: U256) {
        if self.owner.get() == Address::ZERO {
            self.cell_counter.set(U256::ZERO);
            self.min_stake.set(min_stake);
            self.owner.set(self.vm().msg_sender());
        }
    }

    #[payable]
    pub fn create_cell(&mut self) -> U256 {
        let sender = self.vm().msg_sender();
        let stake = self.vm().msg_value();
        
        if stake < self.min_stake.get() {
            panic!("Stake too low");
        }
        if self.player_to_cell.get(sender) != U256::ZERO {
            panic!("Already in cell");
        }
        
        let cell_id = self.cell_counter.get() + U256::from(1);
        self.cell_counter.set(cell_id);
        
        // Random rounds 1-10 using multiple entropy sources
        let block_num = self.vm().block_number();
        let timestamp = self.vm().block_timestamp();
        let sender_hash = sender.0[19] as u64; // Use last byte of address
        
        // Combine multiple sources for better randomness (using u64 arithmetic)
        let entropy = (block_num.wrapping_add(timestamp).wrapping_add(sender_hash)) % 10;
        let total_rounds = (entropy + 1) as u8;
        
        let cell = Cell {
            player1: sender,
            player2: Address::ZERO,
            stake_amount: stake,
            total_rounds,
            current_round: 0,
            is_complete: false,
            rounds: Vec::new(),
            continuation_flags: 0,
        };
        
        self.store_cell(cell_id, &cell);
        self.player_to_cell.setter(sender).set(cell_id);
        self.cell_stakes.setter(cell_id).set(stake);
        
        stylus_core::log(self.vm(), CellCreated { cell_id, player1: sender, stake });
        cell_id
    }

    #[payable]
    pub fn join_cell(&mut self, cell_id: U256) {
        let sender = self.vm().msg_sender();
        let stake = self.vm().msg_value();
        
        if self.player_to_cell.get(sender) != U256::ZERO {
            panic!("Already in cell");
        }
        
        let mut cell = self.load_cell(cell_id);
        if cell.player2 != Address::ZERO {
            panic!("Cell full");
        }
        if stake != cell.stake_amount {
            panic!("Wrong stake");
        }
        
        cell.player2 = sender;
        cell.current_round = 1;
        
        // Initialize first round
        cell.rounds.push(Round {
            player1_move: None,
            player2_move: None,
            player1_payout: U256::ZERO,
            player2_payout: U256::ZERO,
            is_finished: false,
        });
        
        self.store_cell(cell_id, &cell);
        self.player_to_cell.setter(sender).set(cell_id);
        self.cell_stakes.setter(cell_id).set(cell.stake_amount + stake);
        
        let key = self.hash_players(cell.player1, sender);
        self.players_to_cell.setter(key.into()).set(cell_id);
        
        stylus_core::log(self.vm(), PlayerJoined { cell_id, player2: sender });
    }

    pub fn submit_move(&mut self, cell_id: U256, move_choice: u8) {
        let sender = self.vm().msg_sender();
        let mut cell = self.load_cell(cell_id);
        
        if cell.is_complete {
            panic!("Cell complete");
        }
        if cell.player2 == Address::ZERO {
            panic!("Need player 2");
        }
        if sender != cell.player1 && sender != cell.player2 {
            panic!("Not in cell");
        }
        
        let round_idx = (cell.current_round - 1) as usize;
        if round_idx >= cell.rounds.len() {
            panic!("Round not ready - continuation decision needed");
        }
        
        let round = &mut cell.rounds[round_idx];
        if round.is_finished {
            panic!("Round already finished");
        }
        
        let player_move = Move::from(move_choice);
        
        if sender == cell.player1 {
            if round.player1_move.is_some() {
                panic!("Already moved");
            }
            round.player1_move = Some(player_move);
        } else {
            if round.player2_move.is_some() {
                panic!("Already moved");
            }
            round.player2_move = Some(player_move);
        }
        
        // Check if round is complete
        if round.player1_move.is_some() && round.player2_move.is_some() {
            self.resolve_round(&mut cell, cell_id, round_idx);
        }
        
        self.store_cell(cell_id, &cell);
    }

    pub fn submit_continuation_decision(&mut self, cell_id: U256, wants_continue: bool) {
        let sender = self.vm().msg_sender();
        let mut cell = self.load_cell(cell_id);
        
        if cell.is_complete {
            panic!("Cell complete");
        }
        if sender != cell.player1 && sender != cell.player2 {
            panic!("Not in cell");
        }
        if cell.current_round >= cell.total_rounds {
            panic!("Max rounds reached");
        }
        
        // Set continuation flags using bit positions:
        // Bit 0 (value 1): Player 1 wants to continue
        // Bit 1 (value 2): Player 2 wants to continue  
        // Bit 2 (value 4): Player 1 has decided
        // Bit 3 (value 8): Player 2 has decided
        if sender == cell.player1 {
            // Player 1 decision
            if wants_continue {
                cell.continuation_flags |= 1; // Set P1 wants continue
            } else {
                cell.continuation_flags &= !1; // Clear P1 wants continue
            }
            cell.continuation_flags |= 4; // Mark P1 as decided
        } else {
            // Player 2 decision
            if wants_continue {
                cell.continuation_flags |= 2; // Set P2 wants continue
            } else {
                cell.continuation_flags &= !2; // Clear P2 wants continue
            }
            cell.continuation_flags |= 8; // Mark P2 as decided
        }
        
        // Check if BOTH players have decided
        let p1_decided = (cell.continuation_flags & 4) != 0;
        let p2_decided = (cell.continuation_flags & 8) != 0;
        
        if p1_decided && p2_decided {
            let p1_wants = (cell.continuation_flags & 1) != 0;
            let p2_wants = (cell.continuation_flags & 2) != 0;
            
            if p1_wants && p2_wants && cell.current_round < cell.total_rounds {
                // Both want to continue - create next round
                cell.current_round += 1;
                cell.rounds.push(Round {
                    player1_move: None,
                    player2_move: None,
                    player1_payout: U256::ZERO,
                    player2_payout: U256::ZERO,
                    is_finished: false,
                });
                cell.continuation_flags = 0; // Reset all flags
            } else {
                // At least one doesn't want to continue or max rounds reached - end cell
                self.complete_cell(&mut cell, cell_id);
            }
        }
        
        self.store_cell(cell_id, &cell);
    }

    // Getters
    pub fn get_cell(&self, cell_id: U256) -> (Address, Address, U256, u8, u8, bool) {
        let cell = self.load_cell(cell_id);
        (cell.player1, cell.player2, cell.stake_amount, cell.total_rounds, cell.current_round, cell.is_complete)
    }

    pub fn get_player_cell(&self, player: Address) -> U256 {
        self.player_to_cell.get(player)
    }

    pub fn get_players_cell(&self, player1: Address, player2: Address) -> U256 {
        let key = self.hash_players(player1, player2);
        self.players_to_cell.get(key.into())
    }

    pub fn get_min_stake(&self) -> U256 {
        self.min_stake.get()
    }
    
    pub fn get_owner(&self) -> Address {
        self.owner.get()
    }
    
    // Get continuation decision status for a cell
    // Returns (player1_decided, player1_wants, player2_decided, player2_wants)
    pub fn get_continuation_status(&self, cell_id: U256) -> (bool, bool, bool, bool) {
        let cell = self.load_cell(cell_id);
        let p1_decided = (cell.continuation_flags & 4) != 0;
        let p1_wants = (cell.continuation_flags & 1) != 0;
        let p2_decided = (cell.continuation_flags & 8) != 0;
        let p2_wants = (cell.continuation_flags & 2) != 0;
        (p1_decided, p1_wants, p2_decided, p2_wants)
    }

    pub fn get_cell_counter(&self) -> U256 {
        self.cell_counter.get()
    }

    pub fn get_round_result(&self, cell_id: U256, round_number: u8) -> (u8, u8, U256, U256) {
        let cell = self.load_cell(cell_id);
        let round_idx = (round_number - 1) as usize;
        
        if round_idx >= cell.rounds.len() {
            return (0, 0, U256::ZERO, U256::ZERO);
        }
        
        let round = &cell.rounds[round_idx];
        if !round.is_finished {
            return (0, 0, U256::ZERO, U256::ZERO);
        }
        
        let p1_move = round.player1_move.unwrap_or(Move::Cooperate) as u8;
        let p2_move = round.player2_move.unwrap_or(Move::Cooperate) as u8;
        
        (p1_move, p2_move, round.player1_payout, round.player2_payout)
    }
}

// Private helper methods
impl PrisonersDilemma {
    fn hash_players(&self, player1: Address, player2: Address) -> [u8; 32] {
        use alloy_primitives::keccak256;
        let (min_player, max_player) = if player1 < player2 { (player1, player2) } else { (player2, player1) };
        let mut data = Vec::with_capacity(40);
        data.extend_from_slice(min_player.as_slice());
        data.extend_from_slice(max_player.as_slice());
        keccak256(&data).into()
    }

    fn resolve_round(&mut self, cell: &mut Cell, cell_id: U256, round_idx: usize) {
        let round = &mut cell.rounds[round_idx];
        let p1_move = round.player1_move.unwrap();
        let p2_move = round.player2_move.unwrap();
        let stake = cell.stake_amount;
        
        // Simplified payoff calculation
        let (p1_payout, p2_payout) = match (p1_move, p2_move) {
            (Move::Cooperate, Move::Cooperate) => (stake, stake),
            (Move::Defect, Move::Defect) => (stake / U256::from(2), stake / U256::from(2)),
            (Move::Cooperate, Move::Defect) => (stake / U256::from(2), stake + stake / U256::from(2)),
            (Move::Defect, Move::Cooperate) => (stake + stake / U256::from(2), stake / U256::from(2)),
        };
        
        round.player1_payout = p1_payout;
        round.player2_payout = p2_payout;
        round.is_finished = true;
        
        stylus_core::log(self.vm(), RoundComplete { cell_id, round_num: cell.current_round });
        
        // Check if we've completed all rounds
        if cell.current_round >= cell.total_rounds {
            self.complete_cell(cell, cell_id);
        } else {
            // Don't auto-advance - wait for continuation decisions
            cell.continuation_flags = 0; // Reset for next decision
        }
    }

    fn complete_cell(&mut self, cell: &mut Cell, cell_id: U256) {
        cell.is_complete = true;
        
        // Calculate total payouts
        let mut total_p1 = U256::ZERO;
        let mut total_p2 = U256::ZERO;
        
        for round in &cell.rounds {
            if round.is_finished {
                total_p1 += round.player1_payout;
                total_p2 += round.player2_payout;
            }
        }
        
        // Clear mappings
        self.player_to_cell.setter(cell.player1).set(U256::ZERO);
        self.player_to_cell.setter(cell.player2).set(U256::ZERO);
        
        // Transfer payouts
        if total_p1 > U256::ZERO {
            let _ = self.vm().transfer_eth(cell.player1, total_p1);
        }
        if total_p2 > U256::ZERO {
            let _ = self.vm().transfer_eth(cell.player2, total_p2);
        }
        
        stylus_core::log(self.vm(), CellComplete { cell_id });
    }

    // Serialization
    fn store_cell(&mut self, cell_id: U256, cell: &Cell) {
        let data = self.serialize_cell(cell);
        self.cells.setter(cell_id).set_bytes(&data);
    }

    fn load_cell(&self, cell_id: U256) -> Cell {
        let data = self.cells.get(cell_id);
        let mut data_vec = Vec::with_capacity(data.len());
        for i in 0..data.len() {
            if let Some(b) = data.get(i) {
                data_vec.push(b);
            }
        }
        self.deserialize_cell(&data_vec)
    }

    fn serialize_cell(&self, cell: &Cell) -> Vec<u8> {
        let mut data = Vec::with_capacity(128);
        
        data.extend_from_slice(cell.player1.as_slice());
        data.extend_from_slice(cell.player2.as_slice());
        data.extend_from_slice(&cell.stake_amount.to_be_bytes::<32>());
        data.push(cell.total_rounds);
        data.push(cell.current_round);
        data.push(if cell.is_complete { 1 } else { 0 });
        
        // Rounds count
        data.push(cell.rounds.len() as u8);
        
        // Serialize rounds
        for round in &cell.rounds {
            let mut round_byte = 0u8;
            if let Some(Move::Cooperate) = round.player1_move { round_byte |= 0x01; }
            if let Some(Move::Defect) = round.player1_move { round_byte |= 0x02; }
            if let Some(Move::Cooperate) = round.player2_move { round_byte |= 0x04; }
            if let Some(Move::Defect) = round.player2_move { round_byte |= 0x08; }
            if round.is_finished { round_byte |= 0x10; }
            data.push(round_byte);
            
            if round.is_finished {
                data.extend_from_slice(&round.player1_payout.to_be_bytes::<32>());
                data.extend_from_slice(&round.player2_payout.to_be_bytes::<32>());
            }
        }
        
        data.push(cell.continuation_flags);
        data
    }

    fn deserialize_cell(&self, data: &[u8]) -> Cell {
        if data.len() < 76 {
            panic!("Invalid cell data");
        }
        
        let player1 = Address::from_slice(&data[0..20]);
        let player2 = Address::from_slice(&data[20..40]);
        let stake_amount = U256::from_be_bytes::<32>(data[40..72].try_into().unwrap());
        let total_rounds = data[72];
        let current_round = data[73];
        let is_complete = data[74] != 0;
        let rounds_count = data[75] as usize;
        
        let mut rounds = Vec::with_capacity(rounds_count);
        let mut pos = 76;
        
        for _ in 0..rounds_count {
            if pos >= data.len() { break; }
            
            let round_byte = data[pos];
            pos += 1;
            
            let player1_move = match round_byte & 0x03 {
                0x01 => Some(Move::Cooperate),
                0x02 => Some(Move::Defect),
                _ => None,
            };
            
            let player2_move = match round_byte & 0x0C {
                0x04 => Some(Move::Cooperate),
                0x08 => Some(Move::Defect),
                _ => None,
            };
            
            let is_finished = (round_byte & 0x10) != 0;
            
            let (player1_payout, player2_payout) = if is_finished && pos + 64 <= data.len() {
                let p1_payout = U256::from_be_bytes::<32>(data[pos..pos+32].try_into().unwrap());
                let p2_payout = U256::from_be_bytes::<32>(data[pos+32..pos+64].try_into().unwrap());
                pos += 64;
                (p1_payout, p2_payout)
            } else {
                (U256::ZERO, U256::ZERO)
            };
            
            rounds.push(Round {
                player1_move,
                player2_move,
                player1_payout,
                player2_payout,
                is_finished,
            });
        }
        
        let continuation_flags = if pos < data.len() { data[pos] } else { 0 };
        
        Cell {
            player1,
            player2,
            stake_amount,
            total_rounds,
            current_round,
            is_complete,
            rounds,
            continuation_flags,
        }
    }
}
