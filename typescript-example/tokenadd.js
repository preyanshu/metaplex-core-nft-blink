import {
    PublicKey,
    Connection,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccount,
    TOKEN_PROGRAM_ID, // Use the standard SPL Token program
    TOKEN_2022_PROGRAM_ID, // Use if your mint was created with TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import wallet from "../wallet.json" assert { type: 'json' };

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

/**
 * Function to get or create an associated token account address for a given mint address and owner address.
 * @param {Connection} connection - The Solana connection object.
 * @param {Keypair} payer - The payer account for transaction fees.
 * @param {PublicKey} mintAddress - The mint address of the NFT or token.
 * @param {PublicKey} ownerAddress - The owner address for which the token account is to be found.
 * @returns {Promise<PublicKey>} - The associated token account address.
 */
async function getOrCreateTokenAccount(connection, payer, mintAddress, ownerAddress) {
    try {
        // Convert to PublicKey if they are strings
        const mintPublicKey = new PublicKey(mintAddress);
        const ownerPublicKey = new PublicKey(ownerAddress);

        // Get the associated token address
        const tokenAccountAddress = await getAssociatedTokenAddress(
            mintPublicKey,
            ownerPublicKey
        );

        console.log("Token Account Address:", tokenAccountAddress.toString());

        // Check if the token account already exists
        const accountInfo = await connection.getAccountInfo(tokenAccountAddress);

        if (accountInfo === null) {
            console.log("Token account does not exist. Creating now...");

            // Create the associated token account instruction
            const createATAInstruction = createAssociatedTokenAccount(
                payer.publicKey, // Fee payer
                ownerPublicKey, // Owner of the token account
                mintPublicKey, // Mint address
                TOKEN_PROGRAM_ID // Using the standard token program
            );

            const transaction = new Transaction().add(createATAInstruction);
            await sendAndConfirmTransaction(connection, transaction, [payer]);

            console.log(`Token Account Created: ${tokenAccountAddress.toString()}`);
        } else {
            console.log(`Token Account already exists: ${tokenAccountAddress.toString()}`);
        }

        return tokenAccountAddress;
    } catch (error) {
        console.error("Error getting or creating token account:", error);
        throw error;
    }
}

// Example usage
(async () => {
    try {
        // Setup connection and payer
        const connection = new Connection('https://api.devnet.solana.com', 'finalized');
        const payer = keypair; // Replace with your payer keypair

        const mintAddress = '5pZ845wWRsZB8SDJHEpoesYRiHsDAY2mNaoMJhrSNF5M'; // Replace with your mint address
        const ownerAddress = "BNvUw1bdLGkSovk8D7E32DsY3UW7czsRoPUSRMNPH2hX"; // Replace with the owner's public key
        console.log(`Mint Address: ${mintAddress}`);

        const tokenAccountAddress = await getOrCreateTokenAccount(connection, payer, mintAddress, ownerAddress);
        console.log(`Token Account Address: ${tokenAccountAddress.toString()}`);
    } catch (error) {
        console.error("Error in example usage:", error);
    }
})();
