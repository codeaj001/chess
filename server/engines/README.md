# Leela Chess Zero Integration for CompChess

This directory contains the integration of Leela Chess Zero (Lc0) with the CompChess platform. Lc0 is a powerful open-source neural network-based chess engine that provides high-quality chess moves with different playing styles.

## Overview

The integration consists of several components:

1. **Lc0 Wrapper** (`lc0-wrapper.ts`): A TypeScript wrapper for the Lc0 engine that handles communication using the UCI protocol.
2. **Engine Personalities** (`personalities.ts`): Definitions of different AI personalities with unique playing characteristics.
3. **Engine Manager** (`engine-manager.ts`): A service that manages multiple engine instances and handles move generation.

## Installation Requirements

### 1. Install Leela Chess Zero

#### Ubuntu/Debian:

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential cmake libboost-all-dev libopenblas-dev opencl-headers ocl-icd-opencl-dev

# Clone and build Lc0
git clone https://github.com/LeelaChessZero/lc0.git
cd lc0
./build.sh
sudo cp build/release/lc0 /usr/local/bin/
```

### 2. Download Neural Network Weights

The engine manager will automatically download the required network weights on first run, but you can also download them manually:

```bash
# Create a networks directory
mkdir -p networks

# Download network weights
curl -L https://training.lczero.org/get_network?sha=00af53b081e80147172e6f281c01daf5290b4d67b0013027d582aed7d7bc29ff -o networks/beginner.pb.gz
curl -L https://training.lczero.org/get_network?sha=fd28dc61c1c446bc718db6bd9e1d3e1f33a7925c1da56091e60c93af9563f9b7 -o networks/intermediate.pb.gz
curl -L https://training.lczero.org/get_network?sha=b30e742bcfd905815e0e7dbd4e1bafb41ade748f85d006b8e28758f1a3107ae3 -o networks/advanced.pb.gz
curl -L https://training.lczero.org/get_network?sha=latest -o networks/best.pb.gz
```

### 3. Environment Configuration

Set the following environment variables:

```bash
# Path to the networks directory (optional, defaults to ./networks)
export LC0_NETWORKS_PATH=/path/to/networks

# Maximum number of concurrent engines (optional, defaults to 4)
export LC0_MAX_ENGINES=4
```

## Usage

The integration is designed to be used through the existing CompChess API. The engine manager initializes automatically when the first move is requested.

### Example:

```typescript
import { engineManager } from "./engines/engine-manager";

// Initialize the engine manager (optional, happens automatically on first use)
await engineManager.initialize();

// Generate a move for a specific personality
const move = await engineManager.generateMove(fen, personalityId);
```

## Personalities

The system includes 12 different personalities with varying playing styles and strengths:

1. **Rookie Rook** (ELO 1100): A beginner-level personality with basic positional understanding
2. **Pawn Pioneer** (ELO 1250): A cautious personality that prioritizes pawn structure
3. **Knight Novice** (ELO 1400): An intermediate personality with tactical awareness
4. **Bishop Battler** (ELO 1600): A solid intermediate personality focused on piece development
5. **Tactical Tempest** (ELO 1750): An aggressive personality that prioritizes attacks
6. **Queenside Quasar** (ELO 1900): A strong personality that excels in queenside play
7. **Positronic Mind** (ELO 2100): A well-rounded advanced personality
8. **DeepBlunder 9000** (ELO 2250): An advanced personality with occasional surprising moves
9. **NeuralKnight** (ELO 2380): An advanced personality with neural network evaluation
10. **Grandmaster Gamma** (ELO 2550): A master-level personality with solid principles
11. **Quantum Queen** (ELO 2680): A master-level personality with near-perfect play

Each personality has unique parameters that affect its playing style, including:

-   **Temperature**: Controls randomness in move selection
-   **CPUCT**: Exploration constant for MCTS
-   **FPU Reduction**: First play urgency reduction
-   **Policy Temperature**: Controls diversity in policy network output
-   **Nodes**: Number of nodes to search
-   **Contempt**: Attitude toward draws

## Customization

To add or modify personalities, edit the `personalities.ts` file. Each personality is defined with a set of parameters that affect its playing style and strength.

## Troubleshooting

### Common Issues:

1. **Engine not found**: Ensure Lc0 is installed and in your PATH
2. **Network weights not found**: Check the LC0_NETWORKS_PATH environment variable
3. **Performance issues**: Reduce the number of concurrent engines or adjust the move time calculation

### Logs:

The engine manager and wrapper produce detailed logs that can help diagnose issues:

-   Engine initialization logs
-   Move generation logs
-   Error logs for failed operations

## License

Leela Chess Zero is licensed under the GPL-3.0 License. See the [Lc0 repository](https://github.com/LeelaChessZero/lc0) for more details.
