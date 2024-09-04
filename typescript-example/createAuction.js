import { Metaplex ,keypairIdentity} from '@metaplex-foundation/js';
// import {Metaplex,keypairIdentity} from '@metaplex-foundation/mpl-core';
import { Connection, Keypair,PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi';
import wallet from '../wallet.json' assert { type: 'json' };

// Create a Umi instance
const umi = createUmi('https://api.devnet.solana.com', 'confirmed');
const newKeypair = Keypair.generate();
const walletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
console.log("newKeypair",newKeypair);
console.log("wallet",walletKeypair);
// Create a Metaplex instance
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(walletKeypair));

// Ensure that the identity is set correctly
console.log('Metaplex Identity:', metaplex.identity());



// Function to create an auction house
export async function createAuctionHouse() {
  try {
    

    const pubKey = new PublicKey(Keypair.generate().publicKey);
const byteArray = pubKey.toBuffer();

 console.log("hi" , Keypair.generate().publicKey);
    
    // Create an auction house
    // console.log(adminSigner.publicKey(keypair.publicKey));

    const tx = await metaplex.auctionHouse().create({
        sellerFeeBasisPoints: 500, // 5% fee
       
        authority: Keypair.generate(),
       
        requireSignOff: true,

        
 
        });
    // const tx = await metaplex.auctionHouse().create({

    console.log("tx",tx);
   

    console.log(`Auction House Created. Transaction Signature: ${tx}`);
    console.log(`Transaction URL: https://solana.fm/tx/${tx}?cluster=devnet-alpha`);

    return tx;
  } catch (error) {
    console.error('Error creating auction house:', error);
  }
}

createAuctionHouse();
