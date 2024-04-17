//! Tests the migration of the accounts database.
//!
//! Assumes that the NNS Dapp Wasm has already been compiled and is available in the `out/` directory in the repository root.
use candid::{decode_one, encode_one};
use nns_dapp::{accounts_store::schema::SchemaLabel, arguments::CanisterArguments, stats::{wasm_memory_size_bytes, Stats}};
use pocket_ic::{PocketIc, PocketIcBuilder, WasmResult};
use proptest::prelude::*;
use std::fs;
use strum_macros::EnumIter;
use pretty_assertions::assert_eq;

fn args_with_schema(schema: Option<SchemaLabel>) -> Vec<u8> {
    let mut args = nns_dapp::arguments::CanisterArguments::default();
    args.schema = schema;
    encode_one(args).expect("Failed to encode arguments")
}

/// Data that should be unaffected by migration.
#[derive(Debug, Eq, PartialEq)]
struct InvariantStats {
    pub stats: Stats,
    // TODO: Are there any more invariants that should be checked?
}

/// An Internet Computer with two NNS dapps, one to migrate and one as a reference.
///
/// - Accounts are created in both canisters.
/// - Migrations and rollbacks are applied only to the main (non-reference) canister.
/// - The two canisters should always have the same accounts.
struct TestEnv {
    pic: PocketIc,
    pub canister_id: ic_principal::Principal,
    pub reference_canister_id: ic_principal::Principal,
    pub controller: ic_principal::Principal,
}
impl TestEnv {
    /// Path to the Wasm
    const WASM_PATH: &'static str = "../../out/nns-dapp_test.wasm.gz";
    /// Creates a new test environment.
    pub fn new() -> TestEnv {
        let pic = PocketIcBuilder::new().with_nns_subnet().build();
        let nns_sub = pic.topology().get_nns().unwrap();
        let controller = ic_principal::Principal::anonymous();
        let canister_id = pic.create_canister_on_subnet(Some(controller), None, nns_sub);
        let reference_canister_id = pic.create_canister_on_subnet(Some(controller), None, nns_sub);
        TestEnv {
            pic,
            canister_id,
            reference_canister_id,
            controller,
        }
    }
    /// Installs the Wasm with a given schema.
    ///
    /// The reference canister is installed with the default schema.
    pub fn install_wasm_with_schema(&self, schema: Option<SchemaLabel>) {
        let wasm_bytes = fs::read(Self::WASM_PATH).expect("Failed to read wasm file");
        self.pic.install_canister(
            self.canister_id,
            wasm_bytes.to_owned(),
            args_with_schema(schema),
            Some(self.controller),
        );
        self.pic.install_canister(
            self.reference_canister_id,
            wasm_bytes.to_owned(),
            encode_one(CanisterArguments::default()).unwrap(),
            Some(self.controller),
        );
    }
    /// Upgrades the canister to a given schema.
    pub fn upgrade_to_schema(&self, schema: Option<SchemaLabel>) {
        let wasm_bytes = fs::read(Self::WASM_PATH).expect("Failed to read wasm file");
        self.pic
            .stop_canister(self.canister_id, Some(self.controller))
            .expect("Failed to stop canister pre-upgrade");
        self.pic
            .upgrade_canister(
                self.canister_id,
                wasm_bytes,
                args_with_schema(schema),
                Some(self.controller),
            )
            .expect("Upgrade failed");
        self.pic
            .start_canister(self.canister_id, Some(self.controller))
            .expect("Failed to start canister post-upgrade");
    }
    /// Gets stats from a given canister.
    fn get_stats_from_canister(&self, canister_id: ic_principal::Principal) -> Stats {
        let WasmResult::Reply(reply) = self
            .pic
            .query_call(canister_id, self.controller, "get_stats", encode_one(()).unwrap())
            .expect("Failed to get stats")
        else {
            unreachable!()
        };
        decode_one(&reply).unwrap()
    }
    /// Gets stats from the main canister.
    pub fn get_stats(&self) -> Stats {
        self.get_stats_from_canister(self.canister_id)
    }
    /// Gets the invariants from either the main or the reference canister.
    fn get_invariants_from_canister(&self, canister_id: ic_principal::Principal) -> InvariantStats {
        let stats = {
            let mut stats = self.get_stats_from_canister(canister_id);
            // These fields may change and are not expected to be invariant, so we will set them to default values.
            stats.migration_countdown = None;
            stats.accounts_db_stats_recomputed_on_upgrade = None;
            stats.periodic_tasks_count = None;
            stats.wasm_memory_size_bytes = None;
            stats.stable_memory_size_bytes = None;
            stats.performance_counts.truncate(0);
            stats.schema = None;
            // The rest should be invariant:
            stats
        };
        InvariantStats { stats }
    }
    /// Performs some checks that the reference canister and the test canister are identical in relevant ways.
    ///
    /// Tests:
    /// - The number of accounts is the same.
    /// - All test accounts are the same, assuming that test account keys are `Principal::new_user_test_id(index)` for index in `0..num_accounts-1` without gaps.
    ///   - If non-test accounts are created, the test will still check all test accounts.
    ///   - If there are "holes" in the test account indices, we have no efficient way of finding test accounts, so the test will be less useful.  Please avoid doing this.
    pub fn assert_invariants_match(&self) {
        let expected = self.get_invariants_from_canister(self.reference_canister_id);
        let actual = self.get_invariants_from_canister(self.canister_id);
        assert_eq!(
            expected, actual,
            "Account stats do not match for the main and reference canisters"
        );
    }
    /// Creates accounts in the main and reference canisters.
    ///
    /// Note: The account keys are `Principal::new_user_test_id(index)` for index in `0..num_accounts-1`.
    ///       The bulk account creation assumes that the account indices are contiguous, starting at zero,
    ///       for good practical reasons, so we will keep that rule.  Note that consecutive indices do NOT
    ///       generally yield consecutive principals, so the accounts are scattered around the BTreeMap in
    ///       a slightly random way.    
    pub fn create_toy_accounts(&self, num_accounts: u128) {
        for canister_id in &[self.canister_id, self.reference_canister_id] {
            self.pic
                .update_call(
                    *canister_id,
                    self.controller,
                    "create_toy_accounts",
                    encode_one(num_accounts).unwrap(),
                )
                .expect("Failed to create toy accounts");
        }
    }
    /// Applies an arbitrary operation.
    pub fn perform(&self, operation: Operation) {
        match operation {
            Operation::CreateToyAccounts(num_accounts) => self.create_toy_accounts(u128::from(num_accounts)),
            Operation::UpgradeToMap => self.upgrade_to_schema(Some(SchemaLabel::Map)),
            Operation::UpgradeToStableStructures => self.upgrade_to_schema(Some(SchemaLabel::AccountsInStableMemory)),
            Operation::Tick(ticks) => {
                for _ in 0..ticks {
                    self.pic.tick();
                }
            }
        }
    }
}

/// Operations that can be applied to an nns-dapp as part of randomized testing.
///
/// Note: u8 is used for some variants, rather than the larger types supported by the actual API, to keep the test runtime reasonable.
#[derive(Debug, Eq, PartialEq, EnumIter, Copy, Clone)]
enum Operation {
    UpgradeToMap,
    UpgradeToStableStructures,
    Tick(u8),
    CreateToyAccounts(u8),
    // TODO: Modify a random account
    // TODO: Delete a random account
}

/// A strategy by which Proptest can choose operations.
fn operation_strategy() -> impl Strategy<Value = Operation> {
    prop_oneof![
        Just(Operation::UpgradeToMap),
        Just(Operation::UpgradeToStableStructures),
        (0..100u8).prop_map(Operation::CreateToyAccounts),
        (0..100u8).prop_map(Operation::Tick),
    ]
}
/// A strategy by which Proptest can choose a sequence of operations.
fn operation_sequence_strategy() -> impl Strategy<Value = Vec<Operation>> {
    prop::collection::vec(operation_strategy(), 1..20)
}
/// A strategy to select a schema label.
fn schema_label_strategy() -> impl Strategy<Value = SchemaLabel> {
    prop_oneof![Just(SchemaLabel::Map), Just(SchemaLabel::AccountsInStableMemory),]
}

#[test]
fn migration_happy_path() {
    let test_env = TestEnv::new();
    // Install the initial Wasm with schema "Map"
    {
        test_env.install_wasm_with_schema(Some(SchemaLabel::Map));
        test_env.assert_invariants_match();
        assert_eq!(test_env.get_stats().schema, Some(SchemaLabel::Map as u32));
    }
    // Create some accounts.
    {
        test_env.create_toy_accounts(17);
        test_env.assert_invariants_match();
    }
    // Upgrade to the new schema "AccountsInStableMemory"
    {
        test_env.upgrade_to_schema(Some(SchemaLabel::AccountsInStableMemory));
        test_env.assert_invariants_match();
        assert_eq!(
            test_env.get_stats().schema,
            Some(SchemaLabel::Map as u32),
            "The authoritative schema should still be the old one until the migration is complete"
        );
    }
    // Step the migration
    {
        for _ in 0..10 {
            test_env.create_toy_accounts(13);
            test_env.assert_invariants_match();
            test_env.pic.tick();
        }
        assert_eq!(
            test_env.get_stats().schema,
            Some(SchemaLabel::AccountsInStableMemory as u32),
            "The migration should have completed successfully"
        );
    }
}

#[test]
fn interrupted_migration() {
    let test_env = TestEnv::new();
    // Install the initial Wasm with schema "Map"
    {
        test_env.install_wasm_with_schema(Some(SchemaLabel::Map));
        test_env.assert_invariants_match();
        assert_eq!(test_env.get_stats().schema, Some(SchemaLabel::Map as u32));
    }
    // Create some accounts.
    {
        test_env.create_toy_accounts(321);
        test_env.assert_invariants_match();
    }
    // Upgrade to the new schema "AccountsInStableMemory"
    {
        test_env.upgrade_to_schema(Some(SchemaLabel::AccountsInStableMemory));
        test_env.assert_invariants_match();
        assert_eq!(
            test_env.get_stats().schema,
            Some(SchemaLabel::Map as u32),
            "The authoritative schema should still be the old one until the migration is complete"
        );
    }
    // Step the migration a little bit
    {
        for _ in 0..5 {
            test_env.create_toy_accounts(5);
            test_env.assert_invariants_match();
            test_env.pic.tick();
            test_env.assert_invariants_match();
        }
        assert_eq!(
            test_env.get_stats().schema,
            Some(SchemaLabel::Map as u32),
            "The insufficient ticks have passed for the migration to complete, so the schema should not have changed"
        );
        assert_ne!(
            test_env.get_stats().migration_countdown,
            Some(0),
            "The migration should still be in progress"
        );
    }
    // Roll back to the "Map" schema.
    {
        test_env.upgrade_to_schema(Some(SchemaLabel::Map));
        test_env.assert_invariants_match();
        assert_eq!(
            test_env.get_stats().schema,
            Some(SchemaLabel::Map as u32),
            "The authoritative schema should have stayed as Map"
        );
        assert_eq!(
            test_env.get_stats().migration_countdown,
            Some(0),
            "There should be no migration in progress after rollback; the map should have been loaded in the post_upgrade hook."
        );
    }
    // Make sure nothing is in progress that could cause data loss.
    {
        for _ in 0..20 {
            test_env.create_toy_accounts(5);
            test_env.assert_invariants_match();
            test_env.pic.tick();
            test_env.assert_invariants_match();
        }
    }
}

proptest! {
    #[test]
    fn map_to_map_migration_should_work_with_other_operations(schema in schema_label_strategy(), operations in operation_sequence_strategy()) {
        let test_env = TestEnv::new();
        test_env.install_wasm_with_schema(Some(schema));
        for operation in operations {
            test_env.perform(operation);
            test_env.assert_invariants_match();
        }
    }
}
