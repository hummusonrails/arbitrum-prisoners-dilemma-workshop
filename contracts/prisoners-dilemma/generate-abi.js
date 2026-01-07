// Generate JSON ABI from Solidity interface
const abi = [
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "total_rounds",
                "type": "uint8"
            }
        ],
        "name": "createCell",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "getCell",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCellCounter",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "getContinuationStatus",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMinStake",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOwner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "name": "getPlayerCell",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "player1",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "player2",
                "type": "address"
            }
        ],
        "name": "getPlayersCell",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "round_number",
                "type": "uint8"
            }
        ],
        "name": "getRoundResult",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "min_stake",
                "type": "uint256"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "joinCell",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "wants_continue",
                "type": "bool"
            }
        ],
        "name": "submitContinuationDecision",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "move_choice",
                "type": "uint8"
            }
        ],
        "name": "submitMove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "StakeTooLow",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "AlreadyInCell",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "CellFull",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "WrongStake",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "CellIsComplete",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "NeedPlayer2",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "NotInCell",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "NoRoundStarted",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "RoundNotReady",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "RoundAlreadyFinished",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "MaxRoundsReached",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "cell_id",
                "type": "uint256"
            }
        ],
        "name": "InvalidCellData",
        "type": "error"
    }
];

const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../../frontend/src/abi/PrisonersDilemmaContract.json');
fs.writeFileSync(outputPath, JSON.stringify(abi, null, 4));
console.log('ABI exported to:', outputPath);
