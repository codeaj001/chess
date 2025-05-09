import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AIMatches from "@/pages/ai-matches";
import { WalletProvider } from "./hooks/useSolanaWallet";

function Router() {
	return (
		<Switch>
			<Route path="/" component={Home} />
			<Route path="/ai-matches" component={AIMatches} />
			<Route component={NotFound} />
		</Switch>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<WalletProvider>
				<Router />
				<Toaster />
			</WalletProvider>
		</QueryClientProvider>
	);
}

export default App;
