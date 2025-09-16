# Nitro dev node

This repository contains a simple script to start a Nitro dev node and deploy the Stylus `Cache Manager` contract for testing purposes.

## Prerequisites

Before beginning, ensure the following is installed and running on your machine:

- Docker: Required to run the Nitro dev node in a container. Install Docker by following [the official installation guide](https://docs.docker.com/get-started/get-docker/) for your operating system.
- cast: A command-line tool from Foundry for interacting with Ethereum smart contracts. You can install it via Foundry by following [the installation instructions](https://book.getfoundry.sh/getting-started/installation).
- jq: A lightweight JSON parsing tool used to extract contract addresses from the script output. Install jq by following [the official installation guide](https://jqlang.github.io/jq/download/) for your operating system.

## Development account (used by default)

In `--dev` mode, the script uses a pre-funded development account by default. This account is pre-funded with ETH in all networks and is used to deploy contracts, interact with the chain, and assume chain ownership.

- Address: 0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E
- Private key: 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659

You don’t need to set up a private key manually unless you prefer using your own key.
 

## Chain ownership in `--dev` mode

In Nitro `--dev` mode, the default chain owner is set to `0x0000000000000000000000000000000000000000`. However, you can use the `ArbDebug` precompile to set the chain owner. This precompile includes the `becomeChainOwner()` function, which can be called to assume ownership of the chain.

Chain ownership is important because it allows the owner to perform certain critical functions within the Arbitrum environment, such as:

- Adding or removing other chain owners
- Setting the L1 and L2 base fees directly
- Adjusting the gas pricing inertia and backlog tolerance
- Modifying the computational speed limit and transaction gas limits
- Managing network and infrastructure fee accounts

The script automatically sets the chain owner to the pre-funded dev account before registering the `Cache Manager` contract. Here’s how the `becomeChainOwner()` function is called within the script:

```bash
cast send 0x00000000000000000000000000000000000000FF "becomeChainOwner()" --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 --rpc-url http://127.0.0.1:8547
```

This step ensures that the dev account has ownership of the chain, which is necessary to register the `Cache Manager` as a WASM cache manager.


## Usage

To use the script, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/OffchainLabs/nitro-devnode.git
cd nitro-devnode
```

2. Run the dev node script:
Run the script to start the Nitro dev node, deploy the Stylus `Cache Manager` contract, and register it as a WASM cache manager using the default development account:

```bash
./run-dev-node.sh
```

The script will:

- Start the Nitro dev node in the background using Docker.
- Deploy the Stylus `Cache Manager` contract on the local Nitro network.
- Register the `Cache Manager` contract as a WASM cache manager.

## Note on `--dev` mode

The script starts the Nitro node in `--dev` mode, which does not persist chain data. Each time you restart the node, the chain state resets. This is suitable for testing and development purposes, but for persistent chain data, consider using a full node setup instead of `--dev`.
