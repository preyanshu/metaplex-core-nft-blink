use anchor_lang::prelude::*;
use mpl_core::{
    ID as MPL_CORE_PROGRAM_ID,
    accounts::BaseCollectionV1,
    types::{PluginAuthorityPair, Plugin, PermanentFreezeDelegate},
    instructions::{CreateV2CpiBuilder, CreateCollectionV2CpiBuilder},
};

declare_id!("4ZdokY28dYZLSp2oqTCMXFCQUooGxViri2tVpRykRfvR");

// Define a struct to store achievement requirements
#[derive(Debug, Clone)]
pub enum Achievement {
    FollowerCount(i64),
    StreakDays(i64),
    DscvrPoints(i64),
}

// Define a hardcoded map of achievements to NFT metadata URIs
const ACHIEVEMENTS: [(&str, Achievement, &str, u64); 3] = [
    ("follower_count_50", Achievement::FollowerCount(50), "https://example.com/nft1.json", 1),
    ("streak_days_3", Achievement::StreakDays(3), "https://example.com/nft2.json", 5),
    ("dscvr_points_1000000000", Achievement::DscvrPoints(1_000_000_000), "https://example.com/nft3.json", 7),
];

#[program]
pub mod anchor_example {
    use super::*;

    pub fn initialize_database(ctx: Context<InitializeDatabase>) -> Result<()> {
        let database = &mut ctx.accounts.database;
        let initial_achievements = vec![
            AchievementData {
                name: "follower_count_50".to_string(),
                wallets: vec![],
                current_count: 0,
                max_nft_cap: 10,
            },
            AchievementData {
                name: "streak_days_3".to_string(),
                wallets: vec![],
                current_count: 0,
                max_nft_cap: 5,
            },
            AchievementData {
                name: "dscvr_points_1000000000".to_string(),
                wallets: vec![],
                current_count: 0,
                max_nft_cap: 7,
            },
        ];

        database.achievements_count = initial_achievements.len() as u64;
        database.achievements = initial_achievements;

        msg!("Database initialized with {:?} achievements!", database.achievements);
        Ok(())
    }

    pub fn create_collection(ctx: Context<CreateCollection>) -> Result<()> {
        let mut collection_plugins = vec![];
        collection_plugins.push(PluginAuthorityPair {
            plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate { frozen: true }),
            authority: None,
        });

        CreateCollectionV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
            .collection(&ctx.accounts.collection.to_account_info())
            .payer(&ctx.accounts.payer.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .name("My Super Collection".to_string())
            .uri("https://example.com".to_string())
            .plugins(collection_plugins)
            .invoke()?;

        Ok(())
    }

    pub fn create_asset(
        ctx: Context<CreateAsset>,
        name: String,
        follower_count: i64,
        dscvr_points: i64,
        streak_day_count: i64,
    ) -> Result<()> {
        msg!("Checking for achievements...");
        msg!("follower_count: {}", follower_count);
        msg!("dscvr_points: {}", dscvr_points);
        msg!("streak_day_count: {}", streak_day_count);

        let achievement_name = if follower_count >= 50 && name == "follower_count_50" {
            "follower_count_50"
        } else if streak_day_count >= 3 && name == "streak_days_3" {
            "streak_days_3"
        } else if dscvr_points >= 1_000_000_000 && name == "dscvr_points_1000000000" {
            "dscvr_points_1000000000"
        } else {
            return Err(ErrorCode::AchievementNotMet.into());
        };

        msg!("Achievement Name: {}", achievement_name);

        // Fetch the database account
        let database = &mut ctx.accounts.database;

        // Check if the wallet address is already associated with the achievement
        let wallet_address = ctx.accounts.signer.key.to_string();
        let achievement_data = database
            .achievements
            .iter_mut()
            .find(|data| data.name == achievement_name)
            .ok_or(ErrorCode::AchievementNotFound)?;

        if achievement_data.wallets.contains(&wallet_address) {
            return Err(ErrorCode::AlreadyMinted.into());
        }

        // Check the NFT cap
        if achievement_data.current_count >= achievement_data.max_nft_cap {
            return Err(ErrorCode::NftCapExceeded.into());
        }

        // Retrieve URI for the achievement
        let uri = ACHIEVEMENTS
            .iter()
            .find_map(|(name, _, uri, _)| if name == &achievement_name { Some(*uri) } else { None })
            .ok_or(ErrorCode::AchievementNotMet)?;

        msg!("URI: {}", uri);

        // Create the asset
        CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
            .asset(&ctx.accounts.asset.to_account_info())
            .collection(Some(&ctx.accounts.collection.to_account_info()))
            .payer(&ctx.accounts.payer.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .name("Achievement Asset".to_string())
            .uri(uri.to_string())
            .invoke()?;

        // Store the wallet address that minted this achievement and update count
        achievement_data.wallets.push(wallet_address);
        achievement_data.current_count += 1;

        msg!("Achievement minted successfully! {:?}", database.achievements);

        Ok(())
    }
}

// Define the context for initializing the database
#[derive(Accounts)]
pub struct InitializeDatabase<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = 8000)]  // Adjust space as needed
    pub database: Account<'info, Database>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateCollection<'info> {
    pub signer: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub collection: Signer<'info>,
    #[account(address = MPL_CORE_PROGRAM_ID)]
    /// CHECK: This doesn't need to be checked, because there is the address constraint
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAsset<'info> {
    pub signer: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        constraint = collection.update_authority == signer.key(),
    )]
    pub collection: Account<'info, BaseCollectionV1>,
    #[account(mut)]
    pub asset: Signer<'info>,
    #[account(address = MPL_CORE_PROGRAM_ID)]
    /// CHECK: This doesn't need to be checked, because there is the address constraint
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub database: Account<'info, Database>,
}

#[account]
#[derive(Debug)]
pub struct Database {
    pub achievements_count: u64, // Number of achievements stored
    pub achievements: Vec<AchievementData>, // Dynamic size for achievement data
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AchievementData {
    pub name: String,
    pub wallets: Vec<String>, // Use String for wallet addresses
    pub current_count: u64, // Current number of NFTs minted for this achievement
    pub max_nft_cap: u64,   // Maximum number of NFTs that can be minted for this achievement
}

#[error_code]
pub enum ErrorCode {
    #[msg("The user has not met the criteria for the achievement.")]
    AchievementNotMet,
    #[msg("The user has already minted this achievement.")]
    AlreadyMinted,
    #[msg("The maximum NFT cap for this achievement has been reached.")]
    NftCapExceeded,
    #[msg("Achievement not found.")]
    AchievementNotFound,
}
