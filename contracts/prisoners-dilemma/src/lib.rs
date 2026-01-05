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

// Events and Errors
sol! {
    event CellCreated(uint256 indexed cell_id, address indexed player1, uint256 stake);
    event PlayerJoined(uint256 indexed cell_id, address indexed player2);
    event RoundComplete(uint256 indexed cell_id, uint8 round_num);
    event CellComplete(uint256 indexed cell_id);
    error StakeTooLow(uint256 cell_id);
    error AlreadyInCell(uint256 cell_id);
    error CellFull(uint256 cell_id);
    error WrongStake(uint256 cell_id);
    error CellIsComplete(uint256 cell_id);
    error NeedPlayer2(uint256 cell_id);
    error NotInCell(uint256 cell_id);
    error NoRoundStarted(uint256 cell_id);
    error RoundNotReady(uint256 cell_id);
    error RoundAlreadyFinished(uint256 cell_id);
    error MaxRoundsReached(uint256 cell_id);
    error InvalidCellData(uint256 cell_id);
}

// Error types
#[derive(SolidityError)]
pub enum PrisonersDilemmaErrors {
    StakeTooLow(StakeTooLow),
    AlreadyInCell(AlreadyInCell),
    CellFull(CellFull),
    WrongStake(WrongStake),
    CellIsComplete(CellIsComplete),
    NeedPlayer2(NeedPlayer2),
    NotInCell(NotInCell),
    NoRoundStarted(NoRoundStarted),
    RoundNotReady(RoundNotReady),
    RoundAlreadyFinished(RoundAlreadyFinished),
    MaxRoundsReached(MaxRoundsReached),
    InvalidCellData(InvalidCellData),
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
    pub fn create_cell(&mut self, total_rounds: u8) -> Result<U256, PrisonersDilemmaErrors> {
        let sender = self.vm().msg_sender();
        let stake = self.vm().msg_value();
        
        if stake < self.min_stake.get() {
            return Err(PrisonersDilemmaErrors::StakeTooLow(StakeTooLow { cell_id: U256::ZERO }));
        }
        if self.player_to_cell.get(sender) != U256::ZERO {
            return Err(PrisonersDilemmaErrors::AlreadyInCell(AlreadyInCell { cell_id: U256::ZERO }));
        }
        
        let cell_id = self.cell_counter.get() + U256::from(1);
        self.cell_counter.set(cell_id);
        
        // TODO: Workshop Objective 1 - Create and store the new cell.
        //
        // As a workshop participant, your task is to initialize the `Cell` struct with the
        // correct data and store it in the contract's state. This is a fundamental part
        // of managing game state in a smart contract.
        //
        // Requirements:
        // 1. Initialize a `Cell` struct. The `sender` is `player1`.
        // 2. The `stake_amount` is the `stake` provided to the function.
        // 3. `player2` should be an empty address for now: `Address::ZERO`.
        // 4. `current_round` should start at 0, and `is_complete` should be `false`.
        // 5. The `rounds` vector should be empty: `Vec::new()`.
        //
        // Example Syntax:
        // let new_cell = Cell {
        //     player1: /* address of the creator */,
        //     player2: Address::ZERO,
        //     stake_amount: /* value sent with the transaction */,
        //     total_rounds: /* number of rounds from function input */,
        //     current_round: 0,
        //     is_complete: false,
        //     rounds: Vec::new(),
        //     continuation_flags: 0,
        // };
        //
        // After creating the cell, you must store it using the helper function:
        // self.store_cell(cell_id, &new_cell);
        //
        // Finally, map the player to the new cell ID:
        // self.player_to_cell.insert(sender, cell_id);

        // YOUR CODE HERE

        self.cell_stakes.setter(cell_id).set(stake);
        
    stylus_core::log(self.vm(), CellCreated { cell_id, player1: sender, stake });
    Ok(cell_id)
    }

    #[payable]
    pub fn join_cell(&mut self, cell_id: U256) -> Result<(), PrisonersDilemmaErrors> {
        let sender = self.vm().msg_sender();
        let stake = self.vm().msg_value();
        
        if self.player_to_cell.get(sender) != U256::ZERO {
            return Err(PrisonersDilemmaErrors::AlreadyInCell(AlreadyInCell { cell_id }));
        }

        let mut cell = self.load_cell(cell_id);
        if cell.player2 != Address::ZERO {
            return Err(PrisonersDilemmaErrors::CellFull(CellFull { cell_id }));
        }
        if stake != cell.stake_amount {
            return Err(PrisonersDilemmaErrors::WrongStake(WrongStake { cell_id }));
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
    Ok(())
    }

    pub fn submit_move(&mut self, cell_id: U256, move_choice: u8) -> Result<(), PrisonersDilemmaErrors> {
        let sender = self.vm().msg_sender();
        let mut cell = self.load_cell(cell_id);
        
        if cell.is_complete {
            return Err(PrisonersDilemmaErrors::CellIsComplete(CellIsComplete { cell_id }));
        }
        if cell.player2 == Address::ZERO {
            return Err(PrisonersDilemmaErrors::NeedPlayer2(NeedPlayer2 { cell_id }));
        }
        if sender != cell.player1 && sender != cell.player2 {
            return Err(PrisonersDilemmaErrors::NotInCell(NotInCell { cell_id }));
        }

        if cell.current_round == 0 {
            return Err(PrisonersDilemmaErrors::NoRoundStarted(NoRoundStarted { cell_id }));
        }
        let round_idx = (cell.current_round - 1) as usize;
        if round_idx >= cell.rounds.len() {
            return Err(PrisonersDilemmaErrors::RoundNotReady(RoundNotReady { cell_id }));
        }

        let round = &mut cell.rounds[round_idx];
        if round.is_finished {
            return Err(PrisonersDilemmaErrors::RoundAlreadyFinished(RoundAlreadyFinished { cell_id }));
        }
        
        let player_move = Move::from(move_choice);
        
        if sender == cell.player1 {
            if round.player1_move.is_some() {
                return Err(PrisonersDilemmaErrors::RoundAlreadyFinished(RoundAlreadyFinished { cell_id }));
            }
            round.player1_move = Some(player_move);
        } else {
            if round.player2_move.is_some() {
                return Err(PrisonersDilemmaErrors::RoundAlreadyFinished(RoundAlreadyFinished { cell_id }));
            }
            round.player2_move = Some(player_move);
        }
        
        // Check if round is complete
        if round.player1_move.is_some() && round.player2_move.is_some() {
            self.resolve_round(&mut cell, cell_id, round_idx);
        }
        
    self.store_cell(cell_id, &cell);
    Ok(())
    }

    pub fn submit_continuation_decision(&mut self, cell_id: U256, wants_continue: bool) -> Result<(), PrisonersDilemmaErrors> {
        let sender = self.vm().msg_sender();
        let mut cell = self.load_cell(cell_id);
        
        if cell.is_complete {
            return Err(PrisonersDilemmaErrors::CellIsComplete(CellIsComplete { cell_id }));
        }
        if sender != cell.player1 && sender != cell.player2 {
            return Err(PrisonersDilemmaErrors::NotInCell(NotInCell { cell_id }));
        }
        if cell.current_round >= cell.total_rounds {
            return Err(PrisonersDilemmaErrors::MaxRoundsReached(MaxRoundsReached { cell_id }));
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
                // After incrementing, rounds.len() will always be < current_round
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
    Ok(())
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
        let stake = cell.stake_amount;

        // TODO: Workshop Objective 2 - Implement the Payoff Logic & Experiment with Game Theory.
        //
        // This is the heart of the game. Your task is to define the rules that determine
        // the consequences of players' actions. By changing these rules, you can dramatically
        // alter the game's strategy and outcomes.
        //
        // The `Move` enum has two variants: `Move::Cooperate` and `Move::Defect`.
        //
        // **Part 1: Implement the Classic Prisoner's Dilemma**
        // First, implement the standard payoff matrix:
        // 1. If both Cooperate: Both get their original `stake` back (1.0x).
        // 2. If both Defect: Both get half of their `stake` back (0.5x).
        // 3. If one Cooperates and the other Defects: The defector gets 1.5x the `stake`,
        //    and the cooperator gets only 0.5x back.
        //
        // **Part 2: Invent Your Own Rules!**
        // After implementing the classic rules, get creative. This is your chance to be a game
        // designer. What happens if you change the incentives?
        //
        // Experiment with new ideas:
        // - **"Stag Hunt"**: Make mutual cooperation much more rewarding (e.g., 2.0x stake).
        // - **"Game of Chicken"**: Make mutual defection the worst possible outcome (e.g., 0 stake).
        // - **"Generous World"**: What if cooperating always returns at least the initial stake?
        //
        // **Requirements:**
        // - Use a `match` statement on the tuple `(move1, move2)`.
        // - Calculate payouts for `player1` and `player2` based on your chosen rules.
        // - Assign results to `round.player1_payout` and `round.player2_payout`.
        // - Set `round.is_finished = true` and log the `RoundComplete` event.
        //
        // Example Syntax:
        // if let (Some(move1), Some(move2)) = (round.player1_move, round.player2_move) {
        //     let (payout1, payout2) = match (move1, move2) {
        //         (Move::Cooperate, Move::Cooperate) => (stake, stake), // Classic example
        //         // ... implement the other cases for your rules ...
        //     };
        //
        //     round.player1_payout = payout1;
        //     round.player2_payout = payout2;
        //     round.is_finished = true;
        //
        //     self.vm().log(RoundComplete { cell_id, round_num: (round_idx + 1) as u8 });
        // }

        // YOUR CODE HERE
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
            // Return a default cell
            return Cell {
                player1: Address::ZERO,
                player2: Address::ZERO,
                stake_amount: U256::ZERO,
                total_rounds: 0,
                current_round: 0,
                is_complete: false,
                rounds: Vec::new(),
                continuation_flags: 0,
            };
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