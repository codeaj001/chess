import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { useToast } from "./use-toast";
import { getWalletBalance, airdropSol } from "@/lib/solana";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

// Use Solana devnet for development and testing
const SOLANA_NETWORK = "devnet";
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Define the available wallet types
export interface WalletInfo {
	name: string;
	icon: string;
	type: string;
	installed: boolean;
	provider?: any;
}

interface WalletContextType {
	connected: boolean;
	walletAddress: string | null;
	walletProvider: any | null;
	balance: number | null;
	connectWallet: (walletType: string) => Promise<void>;
	disconnectWallet: () => void;
	refreshBalance: () => Promise<void>;
	network: string;
	requestAirdrop: () => Promise<void>;
	detectedWallets: WalletInfo[];
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Define available wallets with their metadata
const availableWallets: WalletInfo[] = [
	{
		name: "Phantom",
		icon: "https://www.phantom.app/img/phantom-logo-gradient.png",
		type: "phantom",
		installed: false,
	},
	{
		name: "Solflare",
		icon: "https://solflare.com/assets/logo-dark.svg",
		type: "solflare",
		installed: false,
	},
	{
		name: "Backpack",
		icon: "https://backpack.app/assets/backpack-logo.svg",
		type: "backpack",
		installed: false,
	},
	{
		name: "Glow",
		icon: "https://glow.app/images/logo.svg",
		type: "glow",
		installed: false,
	},
];

export function WalletProvider({ children }: { children: ReactNode }) {
	const { toast } = useToast();
	const [connected, setConnected] = useState(false);
	const [walletAddress, setWalletAddress] = useState<string | null>(null);
	const [walletProvider, setWalletProvider] = useState<any | null>(null);
	const [balance, setBalance] = useState<number | null>(null);
	const [detectedWallets, setDetectedWallets] = useState<WalletInfo[]>([
		...availableWallets,
	]);

	// Check for available wallets and any existing connections
	useEffect(() => {
		const detectWallets = async () => {
			try {
				// Check for existing connection from localStorage
				const savedWalletAddress =
					localStorage.getItem("walletAddress");
				const savedWalletType = localStorage.getItem("walletType");

				// Make a copy of available wallets
				const wallets = [...availableWallets];

				// Detect Phantom wallet
				try {
					// @ts-ignore - Phantom injects solana into window
					const phantomProvider = window.solana;
					if (phantomProvider?.isPhantom) {
						// Update wallet info to show it's installed
						const phantomIndex = wallets.findIndex(
							(w) => w.type === "phantom"
						);
						if (phantomIndex >= 0) {
							wallets[phantomIndex] = {
								...wallets[phantomIndex],
								installed: true,
								provider: phantomProvider,
							};

							// If wallet is connected and we have permission
							if (phantomProvider.isConnected) {
								const address =
									phantomProvider.publicKey.toString();
								setWalletAddress(address);
								setConnected(true);
								setWalletProvider({
									type: "phantom",
									provider: phantomProvider,
									isExtension: true,
								});

								// Save to localStorage
								localStorage.setItem("walletAddress", address);
								localStorage.setItem("walletType", "phantom");

								// Get wallet balance
								const bal = await getWalletBalance(address);
								setBalance(bal);
							}
						}
					}
				} catch (error) {
					console.error("Error detecting Phantom wallet:", error);
				}

				// Detect Solflare wallet
				try {
					// @ts-ignore - Solflare injects solflare into window
					const solflareProvider = window.solflare;
					if (solflareProvider?.isSolflare) {
						// Update wallet info to show it's installed
						const solflareIndex = wallets.findIndex(
							(w) => w.type === "solflare"
						);
						if (solflareIndex >= 0) {
							wallets[solflareIndex] = {
								...wallets[solflareIndex],
								installed: true,
								provider: solflareProvider,
							};

							// If wallet is connected and we have permission
							if (solflareProvider.isConnected && !connected) {
								const address =
									solflareProvider.publicKey.toString();
								setWalletAddress(address);
								setConnected(true);
								setWalletProvider({
									type: "solflare",
									provider: solflareProvider,
									isExtension: true,
								});

								// Save to localStorage
								localStorage.setItem("walletAddress", address);
								localStorage.setItem("walletType", "solflare");

								// Get wallet balance
								const bal = await getWalletBalance(address);
								setBalance(bal);
							}
						}
					}
				} catch (error) {
					console.error("Error detecting Solflare wallet:", error);
				}

				// Detect Backpack wallet
				try {
					// @ts-ignore - Backpack injects backpack into window
					const backpackProvider = window.backpack?.solana;
					if (backpackProvider) {
						// Update wallet info to show it's installed
						const backpackIndex = wallets.findIndex(
							(w) => w.type === "backpack"
						);
						if (backpackIndex >= 0) {
							wallets[backpackIndex] = {
								...wallets[backpackIndex],
								installed: true,
								provider: backpackProvider,
							};

							// If wallet is connected and we have permission
							if (backpackProvider.isConnected && !connected) {
								const address =
									backpackProvider.publicKey.toString();
								setWalletAddress(address);
								setConnected(true);
								setWalletProvider({
									type: "backpack",
									provider: backpackProvider,
									isExtension: true,
								});

								// Save to localStorage
								localStorage.setItem("walletAddress", address);
								localStorage.setItem("walletType", "backpack");

								// Get wallet balance
								const bal = await getWalletBalance(address);
								setBalance(bal);
							}
						}
					}
				} catch (error) {
					console.error("Error detecting Backpack wallet:", error);
				}

				// Detect Glow wallet
				try {
					// @ts-ignore - Glow injects glowSolana into window
					const glowProvider = window.glowSolana;
					if (glowProvider) {
						// Update wallet info to show it's installed
						const glowIndex = wallets.findIndex(
							(w) => w.type === "glow"
						);
						if (glowIndex >= 0) {
							wallets[glowIndex] = {
								...wallets[glowIndex],
								installed: true,
								provider: glowProvider,
							};

							// If wallet is connected and we have permission
							if (glowProvider.isConnected && !connected) {
								const address =
									glowProvider.publicKey.toString();
								setWalletAddress(address);
								setConnected(true);
								setWalletProvider({
									type: "glow",
									provider: glowProvider,
									isExtension: true,
								});

								// Save to localStorage
								localStorage.setItem("walletAddress", address);
								localStorage.setItem("walletType", "glow");

								// Get wallet balance
								const bal = await getWalletBalance(address);
								setBalance(bal);
							}
						}
					}
				} catch (error) {
					console.error("Error detecting Glow wallet:", error);
				}

				// Update detected wallets
				setDetectedWallets(wallets);

				// If we have a saved wallet but no active connection, try to restore from local storage
				if (savedWalletAddress && !connected) {
					setWalletAddress(savedWalletAddress);
					setConnected(true);

					if (savedWalletType) {
						setWalletProvider({
							type: savedWalletType,
							address: savedWalletAddress,
						});
					}

					// Get wallet balance
					try {
						const bal = await getWalletBalance(savedWalletAddress);
						setBalance(bal);
					} catch (error) {
						console.error("Error getting balance:", error);
						setBalance(null);
					}
				}
			} catch (error) {
				console.error("Error detecting wallets:", error);
			}
		};

		detectWallets();
	}, []);

	const connectWallet = async (walletType: string) => {
		try {
			// Find the wallet in the detected wallets list
			const walletInfo = detectedWallets.find(
				(w) => w.type === walletType
			);

			if (!walletInfo) {
				throw new Error(`Wallet type '${walletType}' not found`);
			}

			// If it's an installed browser extension, try to connect
			if (walletInfo.installed && walletInfo.provider) {
				try {
					const provider = walletInfo.provider;
					// Connect to the wallet
					await provider.connect();

					// Get the wallet address
					const address = provider.publicKey.toString();

					// Update state
					setWalletAddress(address);
					setConnected(true);

					// Store the provider directly to ensure we have access to signTransaction
					setWalletProvider(provider);

					// Save to localStorage
					localStorage.setItem("walletAddress", address);
					localStorage.setItem("walletType", walletType);

					// Get wallet balance
					const bal = await getWalletBalance(address);
					setBalance(bal);

					toast({
						title: "Wallet Connected",
						description: `Connected with ${
							walletInfo.name
						} wallet (${address.substring(
							0,
							4
						)}...${address.substring(address.length - 4)})`,
					});

					return;
				} catch (err) {
					console.error(
						`Error connecting to ${walletInfo.name} wallet:`,
						err
					);
					toast({
						title: `${walletInfo.name} Connection Failed`,
						description:
							err instanceof Error
								? err.message
								: "Could not connect to wallet",
						variant: "destructive",
					});
					// Don't fall through to demo wallet if user explicitly rejected connection
					return;
				}
			}

			// If we're here, the extension connection failed or is not installed
			if (!walletInfo.installed) {
				toast({
					title: "Wallet Not Installed",
					description: `Please install ${walletInfo.name} wallet extension to continue`,
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error connecting wallet:", error);
			toast({
				title: "Failed to connect wallet",
				description:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
				variant: "destructive",
			});
		}
	};

	const disconnectWallet = () => {
		// Try to disconnect from real wallet if connected
		if (
			walletProvider?.isExtension &&
			walletProvider?.provider?.disconnect
		) {
			try {
				walletProvider.provider.disconnect();
			} catch (error) {
				console.error("Error disconnecting from wallet:", error);
			}
		}

		setWalletAddress(null);
		setConnected(false);
		setWalletProvider(null);
		setBalance(null);
		localStorage.removeItem("walletAddress");
		localStorage.removeItem("walletType");

		toast({
			title: "Wallet Disconnected",
			description: "Your wallet has been disconnected",
		});
	};

	const refreshBalance = async (): Promise<void> => {
		if (!walletAddress) return;

		try {
			const bal = await getWalletBalance(walletAddress);
			setBalance(bal);
		} catch (error) {
			console.error("Error refreshing balance:", error);
		}
	};

	const requestAirdrop = async () => {
		if (!walletAddress) {
			toast({
				title: "No wallet connected",
				description: "Please connect a wallet first",
				variant: "destructive",
			});
			return;
		}

		try {
			toast({
				title: "Requesting Airdrop",
				description: "Requesting 1 SOL from Devnet...",
			});

			const signature = await airdropSol(walletAddress);

			if (signature) {
				toast({
					title: "Airdrop Successful",
					description: `Received 1 SOL. Transaction: ${signature.substring(
						0,
						8
					)}...`,
				});

				// Refresh balance after airdrop
				setTimeout(() => refreshBalance(), 2000);
			}
		} catch (error) {
			console.error("Error requesting airdrop:", error);
			toast({
				title: "Airdrop Failed",
				description:
					error instanceof Error
						? error.message
						: "Failed to request SOL airdrop",
				variant: "destructive",
			});
		}
	};

	return (
		<WalletContext.Provider
			value={{
				connected,
				walletAddress,
				walletProvider,
				balance,
				connectWallet,
				disconnectWallet,
				refreshBalance,
				network: SOLANA_NETWORK,
				requestAirdrop,
				detectedWallets,
			}}
		>
			{children}
		</WalletContext.Provider>
	);
}

export function useSolanaWallet() {
	const context = useContext(WalletContext);
	if (context === undefined) {
		throw new Error("useSolanaWallet must be used within a WalletProvider");
	}
	return context;
}
