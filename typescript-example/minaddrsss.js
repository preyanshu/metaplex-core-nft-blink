import { Connection, PublicKey } from '@solana/web3.js';
import { Meta } from '@metaplex-foundation/mpl-token-metadata';

const connection = new Connection('https://api.mainnet-beta.solana.com');

async function getMintAddressFromMetadata(nftAddress) {
    const metadataPDA = await Metadata.getPDA(new PublicKey(nftAddress));
    const metadataAccount = await connection.getParsedAccountInfo(metadataPDA);
    
    if (metadataAccount.value) {
        const mintAddress = metadataAccount.value.data.parsed.info.mint;
        console.log('Mint Address:', mintAddress);
    } else {
        console.log('Metadata account not found.');
    }
}

// Replace with your NFT address
getMintAddressFromMetadata('Fsaqvpg7Fo7oWGJv5wELbqb5mW3ecsz3fYTue5QdaCVx');
