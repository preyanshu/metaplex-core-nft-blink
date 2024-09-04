import { generateSigner, createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { create, fetchCollection } from '@metaplex-foundation/mpl-core';
import { base58 } from '@metaplex-foundation/umi/serializers';
import wallet from "../wallet.json" assert { type: 'json' };

// Setup Umi
const umi = createUmi("https://api.devnet.solana.com", "finalized");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const adminSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(adminSigner));

(async () => {
    // Generate the Asset KeyPair for the new NFT
    const asset = generateSigner(umi);
    const assetAddress = asset.publicKey.toString();
    console.log("This is your new NFT asset address:", assetAddress);

    // Fetch the Collection
    const collectionAddress = "5pZ845wWRsZB8SDJHEpoesYRiHsDAY2mNaoMJhrSNF5M"; // Use the collection's address as reference
    const collection = await fetchCollection(umi, publicKey(collectionAddress));
    console.log("Collection:", collection);

    // Define the recipient's public key
    const recipientPublicKey = publicKey("BNvUw1bdLGkSovk8D7E32DsY3UW7czsRoPUSRMNPH2hX"); // Replace with the recipient's public key

    // Mint and Transfer the new NFT Asset
    try {
        const tx = await create(umi, {
            asset,
            collection,
            name: "My Asset",
            uri: "https://example.com",
        }).sendAndConfirm(umi);

        // Log the mint address explicitly
        console.log("Mint Address Used for New NFT Minting:", asset.publicKey.toString());

        // Deserialize the Signature from the Transaction
        console.log("New NFT Minted and Transferred: https://solana.fm/tx/" + base58.deserialize(tx.signature)[0] + "?cluster=devnet-alpha");
    } catch (error) {
        console.error("Error during mint and transfer:", error);
    }
})();
