#![allow(clippy::all)]
#![allow(unused_imports)]
#![allow(clippy::missing_docs_in_private_items)]
#![allow(non_camel_case_types)]
#![allow(dead_code)]

use crate::types::{CandidType, Deserialize, EmptyRecord, Serialize};
use ic_cdk::api::call::CallResult;
// This is an experimental feature to generate Rust binding from Candid.
// You may want to manually adjust some of the types.
#![allow(dead_code, unused_imports)]
// use candid::{self, CandidType, Decode, Deserialize, Serialize, Clone, Debug, Encode, candid::Principal};
// use ic_cdk::api::call::CallResult as Result;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SnsWasmCanisterInitPayload {
    pub allowed_principals: Vec<candid::Principal>,
    pub access_controls_enabled: bool,
    pub sns_subnet_ids: Vec<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SnsWasm {
    pub wasm: serde_bytes::ByteBuf,
    pub canister_type: i32,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AddWasmRequest {
    pub hash: serde_bytes::ByteBuf,
    pub wasm: Option<SnsWasm>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SnsWasmError {
    pub message: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum Result_ {
    Error(SnsWasmError),
    Hash(serde_bytes::ByteBuf),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AddWasmResponse {
    pub result: Option<Result_>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct NeuronBasketConstructionParameters {
    pub dissolve_delay_interval_seconds: u64,
    pub count: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Canister {
    pub id: Option<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DappCanisters {
    pub canisters: Vec<Canister>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CfNeuron {
    pub nns_neuron_id: u64,
    pub amount_icp_e8s: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CfParticipant {
    pub hotkey_principal: String,
    pub cf_neurons: Vec<CfNeuron>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct NeuronsFundParticipants {
    pub participants: Vec<CfParticipant>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct TreasuryDistribution {
    pub total_e8s: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct NeuronDistribution {
    pub controller: Option<candid::Principal>,
    pub dissolve_delay_seconds: u64,
    pub memo: u64,
    pub stake_e8s: u64,
    pub vesting_period_seconds: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DeveloperDistribution {
    pub developer_neurons: Vec<NeuronDistribution>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AirdropDistribution {
    pub airdrop_neurons: Vec<NeuronDistribution>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SwapDistribution {
    pub total_e8s: u64,
    pub initial_swap_amount_e8s: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct FractionalDeveloperVotingPower {
    pub treasury_distribution: Option<TreasuryDistribution>,
    pub developer_distribution: Option<DeveloperDistribution>,
    pub airdrop_distribution: Option<AirdropDistribution>,
    pub swap_distribution: Option<SwapDistribution>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum InitialTokenDistribution {
    FractionalDeveloperVotingPower(FractionalDeveloperVotingPower),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Countries {
    pub iso_codes: Vec<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SnsInitPayload {
    pub url: Option<String>,
    pub max_dissolve_delay_seconds: Option<u64>,
    pub max_dissolve_delay_bonus_percentage: Option<u64>,
    pub nns_proposal_id: Option<u64>,
    pub min_participant_icp_e8s: Option<u64>,
    pub neuron_basket_construction_parameters: Option<NeuronBasketConstructionParameters>,
    pub fallback_controller_principal_ids: Vec<String>,
    pub token_symbol: Option<String>,
    pub final_reward_rate_basis_points: Option<u64>,
    pub max_icp_e8s: Option<u64>,
    pub neuron_minimum_stake_e8s: Option<u64>,
    pub confirmation_text: Option<String>,
    pub logo: Option<String>,
    pub name: Option<String>,
    pub swap_start_timestamp_seconds: Option<u64>,
    pub swap_due_timestamp_seconds: Option<u64>,
    pub initial_voting_period_seconds: Option<u64>,
    pub neuron_minimum_dissolve_delay_to_vote_seconds: Option<u64>,
    pub description: Option<String>,
    pub max_neuron_age_seconds_for_age_bonus: Option<u64>,
    pub min_participants: Option<u64>,
    pub initial_reward_rate_basis_points: Option<u64>,
    pub wait_for_quiet_deadline_increase_seconds: Option<u64>,
    pub transaction_fee_e8s: Option<u64>,
    pub dapp_canisters: Option<DappCanisters>,
    pub neurons_fund_participants: Option<NeuronsFundParticipants>,
    pub max_age_bonus_percentage: Option<u64>,
    pub initial_token_distribution: Option<InitialTokenDistribution>,
    pub reward_rate_transition_duration_seconds: Option<u64>,
    pub token_logo: Option<String>,
    pub token_name: Option<String>,
    pub max_participant_icp_e8s: Option<u64>,
    pub proposal_reject_cost_e8s: Option<u64>,
    pub restricted_countries: Option<Countries>,
    pub min_icp_e8s: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DeployNewSnsRequest {
    pub sns_init_payload: Option<SnsInitPayload>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DappCanistersTransferResult {
    pub restored_dapp_canisters: Vec<Canister>,
    pub nns_controlled_dapp_canisters: Vec<Canister>,
    pub sns_controlled_dapp_canisters: Vec<Canister>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SnsCanisterIds {
    pub root: Option<candid::Principal>,
    pub swap: Option<candid::Principal>,
    pub ledger: Option<candid::Principal>,
    pub index: Option<candid::Principal>,
    pub governance: Option<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DeployNewSnsResponse {
    pub dapp_canisters_transfer_result: Option<DappCanistersTransferResult>,
    pub subnet_id: Option<candid::Principal>,
    pub error: Option<SnsWasmError>,
    pub canisters: Option<SnsCanisterIds>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetAllowedPrincipalsArg {}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetAllowedPrincipalsResponse {
    pub allowed_principals: Vec<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SnsVersion {
    pub archive_wasm_hash: serde_bytes::ByteBuf,
    pub root_wasm_hash: serde_bytes::ByteBuf,
    pub swap_wasm_hash: serde_bytes::ByteBuf,
    pub ledger_wasm_hash: serde_bytes::ByteBuf,
    pub governance_wasm_hash: serde_bytes::ByteBuf,
    pub index_wasm_hash: serde_bytes::ByteBuf,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetNextSnsVersionRequest {
    pub governance_canister_id: Option<candid::Principal>,
    pub current_version: Option<SnsVersion>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetNextSnsVersionResponse {
    pub next_version: Option<SnsVersion>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetSnsSubnetIdsArg {}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetSnsSubnetIdsResponse {
    pub sns_subnet_ids: Vec<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetWasmRequest {
    pub hash: serde_bytes::ByteBuf,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GetWasmResponse {
    pub wasm: Option<SnsWasm>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SnsUpgrade {
    pub next_version: Option<SnsVersion>,
    pub current_version: Option<SnsVersion>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct InsertUpgradePathEntriesRequest {
    pub upgrade_path: Vec<SnsUpgrade>,
    pub sns_governance_canister_id: Option<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct InsertUpgradePathEntriesResponse {
    pub error: Option<SnsWasmError>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ListDeployedSnsesArg {}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, Default)]
pub struct DeployedSns {
    pub root_canister_id: Option<candid::Principal>,
    pub governance_canister_id: Option<candid::Principal>,
    pub index_canister_id: Option<candid::Principal>,
    pub swap_canister_id: Option<candid::Principal>,
    pub ledger_canister_id: Option<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ListDeployedSnsesResponse {
    pub instances: Vec<DeployedSns>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ListUpgradeStepsRequest {
    pub limit: u32,
    pub starting_at: Option<SnsVersion>,
    pub sns_governance_canister_id: Option<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct PrettySnsVersion {
    pub archive_wasm_hash: String,
    pub root_wasm_hash: String,
    pub swap_wasm_hash: String,
    pub ledger_wasm_hash: String,
    pub governance_wasm_hash: String,
    pub index_wasm_hash: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ListUpgradeStep {
    pub pretty_version: Option<PrettySnsVersion>,
    pub version: Option<SnsVersion>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ListUpgradeStepsResponse {
    pub steps: Vec<ListUpgradeStep>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UpdateAllowedPrincipalsRequest {
    pub added_principals: Vec<candid::Principal>,
    pub removed_principals: Vec<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum UpdateAllowedPrincipalsResult {
    Error(SnsWasmError),
    AllowedPrincipals(GetAllowedPrincipalsResponse),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UpdateAllowedPrincipalsResponse {
    pub update_allowed_principals_result: Option<UpdateAllowedPrincipalsResult>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UpdateSnsSubnetListRequest {
    pub sns_subnet_ids_to_add: Vec<candid::Principal>,
    pub sns_subnet_ids_to_remove: Vec<candid::Principal>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UpdateSnsSubnetListResponse {
    pub error: Option<SnsWasmError>,
}

pub struct Service(pub candid::Principal);
impl Service {
    pub async fn add_wasm(&self, arg0: AddWasmRequest) -> CallResult<(AddWasmResponse,)> {
        ic_cdk::call(self.0, "add_wasm", (arg0,)).await
    }
    pub async fn deploy_new_sns(&self, arg0: DeployNewSnsRequest) -> CallResult<(DeployNewSnsResponse,)> {
        ic_cdk::call(self.0, "deploy_new_sns", (arg0,)).await
    }
    pub async fn get_allowed_principals(
        &self,
        arg0: GetAllowedPrincipalsArg,
    ) -> CallResult<(GetAllowedPrincipalsResponse,)> {
        ic_cdk::call(self.0, "get_allowed_principals", (arg0,)).await
    }
    pub async fn get_latest_sns_version_pretty(&self, arg0: ()) -> CallResult<(Vec<(String, String)>,)> {
        ic_cdk::call(self.0, "get_latest_sns_version_pretty", (arg0,)).await
    }
    pub async fn get_next_sns_version(
        &self,
        arg0: GetNextSnsVersionRequest,
    ) -> CallResult<(GetNextSnsVersionResponse,)> {
        ic_cdk::call(self.0, "get_next_sns_version", (arg0,)).await
    }
    pub async fn get_sns_subnet_ids(&self, arg0: GetSnsSubnetIdsArg) -> CallResult<(GetSnsSubnetIdsResponse,)> {
        ic_cdk::call(self.0, "get_sns_subnet_ids", (arg0,)).await
    }
    pub async fn get_wasm(&self, arg0: GetWasmRequest) -> CallResult<(GetWasmResponse,)> {
        ic_cdk::call(self.0, "get_wasm", (arg0,)).await
    }
    pub async fn insert_upgrade_path_entries(
        &self,
        arg0: InsertUpgradePathEntriesRequest,
    ) -> CallResult<(InsertUpgradePathEntriesResponse,)> {
        ic_cdk::call(self.0, "insert_upgrade_path_entries", (arg0,)).await
    }
    pub async fn list_deployed_snses(&self, arg0: ListDeployedSnsesArg) -> CallResult<(ListDeployedSnsesResponse,)> {
        ic_cdk::call(self.0, "list_deployed_snses", (arg0,)).await
    }
    pub async fn list_upgrade_steps(&self, arg0: ListUpgradeStepsRequest) -> CallResult<(ListUpgradeStepsResponse,)> {
        ic_cdk::call(self.0, "list_upgrade_steps", (arg0,)).await
    }
    pub async fn update_allowed_principals(
        &self,
        arg0: UpdateAllowedPrincipalsRequest,
    ) -> CallResult<(UpdateAllowedPrincipalsResponse,)> {
        ic_cdk::call(self.0, "update_allowed_principals", (arg0,)).await
    }
    pub async fn update_sns_subnet_list(
        &self,
        arg0: UpdateSnsSubnetListRequest,
    ) -> CallResult<(UpdateSnsSubnetListResponse,)> {
        ic_cdk::call(self.0, "update_sns_subnet_list", (arg0,)).await
    }
}
