import { generateSigner, createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { create, createCollection, fetchCollection } from '@metaplex-foundation/mpl-core';
import { base58 } from '@metaplex-foundation/umi/serializers';
import wallet from "../wallet.json" assert { type: 'json' } ;
import { Keypair, PublicKey } from '@solana/web3.js';

const umi = createUmi("https://api.devnet.solana.com", "finalized");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const adminSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(adminSigner));

const walletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
// console.log("newKeypair",newKeypair);
console.log("wallet",walletKeypair);

const SPL_TOKEN_2022_PROGRAM_ID = PublicKey(
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  )
// Function to create a collection dynamically
async function createDynamicCollection(name, uri) {
    const collection = generateSigner(umi);
    console.log(`Collection Created. Address: ${collection.publicKey.toString()}, Name: ${name}`);

    const tx = await createCollection(umi, {
        collection,
        name,
        uri,
        plugins: []
    }).sendAndConfirm(umi);

    console.log(`Collection Transaction: https://solana.fm/tx/${base58.deserialize(tx.signature)[0]}?cluster=devnet-alpha`);
    
    return collection.publicKey;
}

// Function to mint NFTs under a specified collection
async function mintNFTs(
    eventId, 
    category, 
    collectionPublicKey, 
    quantity
) {
    // Fetch the Collection
    const collection = await fetchCollection(umi, collectionPublicKey);
    console.log(`${category} Collection fetched:`, collection);

    // Create an array of minting promises
    const mintingPromises = Array.from({ length: quantity }, (_, i) => {
        return (async () => {
            const asset = generateSigner(umi);
            console.log(`Minting ${category} NFT #${i + 1} for Event: ${eventId}, Asset Address: ${asset.publicKey.toString()}`);

            const tx = await create(umi, {
                asset,
                collection,
                name: `${category} Sponsor NFT - Event ${eventId}`,
                uri: `https://example.com/metadata/${eventId}/${category}/${i + 1}`,
                splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID
                 
            }).sendAndConfirm(umi);

            console.log(`Asset Minted and Transferred: https://solana.fm/tx/${base58.deserialize(tx.signature)[0]}?cluster=devnet-alpha`);
        })();
    });

    // Execute all minting promises in parallel
    await Promise.all(mintingPromises);
}

// Example Usage
(async () => {
    try {
        const eventId = "12345";

        // Step 1: Create the main event collection
        const eventCollectionPublicKey = await createDynamicCollection(
            `Event ${eventId} Collection`, 
            `https://example.com/event/${eventId}`
        );

        // Step 2: Create and mint NFTs under different sponsorship sub-collections
        const platinumCollectionPublicKey = await createDynamicCollection(
            `${eventId} Platinum Sponsors`, 
            `https://example.com/event/${eventId}/platinum`
        );
        const goldCollectionPublicKey = await createDynamicCollection(
            `${eventId} Gold Sponsors`, 
            `https://example.com/event/${eventId}/gold`
        );
        const silverCollectionPublicKey = await createDynamicCollection(
            `${eventId} Silver Sponsors`, 
            `https://example.com/event/${eventId}/silver`
        );

        // Mint NFTs in parallel for each category
        await Promise.all([
            mintNFTs(eventId, "Platinum", platinumCollectionPublicKey, 1),
            mintNFTs(eventId, "Gold", goldCollectionPublicKey, 0),
            mintNFTs(eventId, "Silver", silverCollectionPublicKey, 0)
        ]);

    } catch (error) {
        console.error("Error creating collections and minting NFTs:", error);
    }
})();
