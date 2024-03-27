//! Tests the migration of the accounts database.
//! 
//! Assumes that the NNS Dapp Wasm has already been compiled and is available in the `out/` directory in the repository root.
use std::fs;
use candid::{encode_one, decode_one};
use nns_dapp::{accounts_store::schema::SchemaLabel, arguments::CanisterArguments, stats::Stats};
use pocket_ic::{PocketIc, PocketIcBuilder, WasmResult};


fn args_with_schema(schema: Option<SchemaLabel>) -> Vec<u8> {
    let mut args = nns_dapp::arguments::CanisterArguments::default();
    args.schema = schema;
    encode_one(args).expect("Failed to encode arguments")

}

/// Data that should be unaffected by migration.
#[derive(Debug, Eq, PartialEq)]
struct InvariantStats {
    pub num_accounts: u64,
}

/// An Internet Computer with just the NNS Dapp.
struct TestEnv {
    pub pic: PocketIc,
    pub canister_id: ic_principal::Principal,
    pub reference_canister_id: ic_principal::Principal,
    pub controller: ic_principal::Principal,
}
impl TestEnv {
    /// Path to the Wasm
    const WASM_PATH : &'static str = "../../out/nns-dapp_test.wasm.gz";
    /// Creates a new test environment.
    pub fn new() -> TestEnv {
        let pic = PocketIcBuilder::new().with_nns_subnet().build();
        let nns_sub = pic.topology().get_nns().unwrap();
        let controller = ic_principal::Principal::anonymous();
        let canister_id = pic.create_canister_on_subnet(Some(controller), None, nns_sub);        
        let reference_canister_id = pic.create_canister_on_subnet(Some(controller), None, nns_sub);        
        TestEnv { pic, canister_id, reference_canister_id, controller }
    }
    /// Installs the Wasm with a given schema.
    /// 
    /// The reference canister is installed with the default schema.
    pub fn install_wasm_with_schema(&self, schema: Option<SchemaLabel>) {
        let wasm_bytes = fs::read(Self::WASM_PATH).expect("Failed to read wasm file");
        self.pic.install_canister(self.canister_id, wasm_bytes.to_owned(), args_with_schema(schema), Some(self.controller));
        self.pic.install_canister(self.reference_canister_id, wasm_bytes.to_owned(), encode_one(CanisterArguments::default()).unwrap(), Some(self.controller));
    }
    /// Upgrades the canister to a given schema.
    pub fn upgrade_to_schema(&self, schema: Option<SchemaLabel>) {
        let wasm_bytes = fs::read(Self::WASM_PATH).expect("Failed to read wasm file");
        self.pic.upgrade_canister(self.canister_id, wasm_bytes, args_with_schema(schema), Some(self.controller)).expect("Upgrade failed");
    }
    /// Gets stats from a given canister.
    fn get_stats_from_canister(&self, canister_id: ic_principal::Principal) -> Stats {
        let WasmResult::Reply(reply) = self.pic.query_call(canister_id, self.controller, "get_stats", encode_one(()).unwrap()).expect("Failed to get stats") else {
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
        let stats: Stats = self.get_stats_from_canister(canister_id);
        InvariantStats { num_accounts: u64::from(stats.accounts_count) }
    }
    /// Asserts that the number of accounts is as expected.
    pub fn assert_invariants_match(&self) {
        let expected = self.get_invariants_from_canister(self.reference_canister_id);
        let actual = self.get_invariants_from_canister(self.canister_id);
        assert_eq!(expected, actual, "Account stats do not match for the main and reference canisters");
    }
    /// Creates accounts in the main and reference canisters.
    pub fn create_toy_accounts(&self, num_accounts: u128) {
        for canister_id in &[self.canister_id, self.reference_canister_id] {
            self.pic.update_call(*canister_id, self.controller, "create_toy_accounts", encode_one(num_accounts).unwrap()).expect("Failed to create toy accounts");
        }
    }
}

#[test]
fn migration_toy_1() {
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
    }
}


    // Plan:
    // - [x] Create the arguments from rust.
    // - [x] Create accounts
    // - [x] Check accounts count is as expected
    // - [x] Upgrade to trigger a migration.
    // - [ ] Call step? Might be simpler than calling the heartbeat.  Heartbeat would be more realistic so that can be a strech goal ponce everything elese is working.
    // - [ ] Make a PR with rustdocs!
    //    - [ ] Examples of passing in wasm, gzipped or not.
    //    - [ ] Example of passing in arguments, empty, from Rust or from a binary (not text) candid file.
    //    - [ ] Tell the infra story - installing pocket-ic and building the Wasm before running the test.
    // - [x] Bonus: Run this on a system subnet.
