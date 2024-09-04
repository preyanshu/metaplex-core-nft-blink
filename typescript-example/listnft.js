import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import wallet from "../wallet.json" assert { type: 'json' };

// Create a Keypair from the wallet JSON
const walletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
console.log("wallet", walletKeypair);

// Create a Metaplex instance
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const metaplex = Metaplex.make(connection).use(keypairIdentity(walletKeypair));

// Function to list an NFT for sale
async function listNFTForSale(
    mintAccount,
    tokenAccount,
    auctionHouse,
    price
) {
    try {
        // Fetch the auction house
        console.log("Fetching auction house details...");
        const auctionHouseDetails = await metaplex.auctionHouse().findByAddress({ address: auctionHouse });

        console.log("Auction House Details:", auctionHouseDetails);

        // Create a new listing for the NFT
        console.log("Creating listing for NFT...");

        const { transaction, signers } = await metaplex.auctionHouse().list({
            auctionHouse: auctionHouseDetails,
            seller: walletKeypair,       // The public key of the seller
            authority: walletKeypair,    // The public key of the authority
            mintAccount: mintAccount,              // The mint account of the NFT
            tokenAccount: tokenAccount,            // The token account address associated with the NFT
            price: price * 1e9                // The listing price in lamports (1 SOL = 1e9 lamports)
                                        // Number of tokens to list (must be 1 for NFTs)
        });

        // Sign and send the transaction
        const signature = await metaplex.connection.sendTransaction(transaction, [walletKeypair, ...signers]);

        // Confirm the transaction
        const confirmed = await metaplex.connection.confirmTransaction(signature);

        console.log(`NFT Listed for Sale. Transaction Signature: ${signature}`);
        console.log(`Transaction URL: https://solana.fm/tx/${signature}?cluster=devnet-alpha`);

    } catch (error) {
        console.error("Error listing NFT for sale:", error);
    }
}

// Example usage
(async () => {
    try {
        const mintAccount = new PublicKey("2iXPAsaWKPxxFehLCg5TXccXciCtRkHDCup22cwgRw2Y"); // Replace with your NFT mint account
        const tokenAccount = new PublicKey("2iXPAsaWKPxxFehLCg5TXccXciCtRkHDCup22cwgRw2Y"); // Replace with your NFT token account
        const auctionHouse = new PublicKey("BzZCWKkBLsjFQNxToZ8siwaRCEBHBDTdmwprrhcSmSnV") // Replace with your auction house public key
        const price = 5; // Price in SOL

        // List the NFT for sale
        await listNFTForSale(mintAccount, tokenAccount, auctionHouse, price);

    } catch (error) {
        console.error("Error in listing NFT:", error);
    }
})();
