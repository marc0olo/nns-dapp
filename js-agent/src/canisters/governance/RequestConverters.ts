import { Principal } from "@dfinity/agent";
import BigNumber from "bignumber.js";
import * as convert from "../converter";
import { Doms } from "../ledger/model";
import {
    Action,
    AddHotKeyRequest,
    Ballot,
    Change,
    ClaimNeuronRequest,
    Command,
    DisburseRequest,
    DisburseToNeuronRequest,
    FollowRequest,
    IncreaseDissolveDelayRequest,
    ListProposalsRequest,
    MakeMotionProposalRequest,
    MakeNetworkEconomicsProposalRequest,
    MakeRewardNodeProviderProposalRequest,
    ManageNeuron,
    NeuronId,
    NodeProvider,
    Operation,
    Proposal,
    ProposalId,
    RegisterVoteRequest,
    RemoveHotKeyRequest,
    SpawnRequest,
    SplitRequest,
    StartDissolvingRequest
} from "./model";
import {
    Action as RawAction,
    Amount as RawAmount,
    Ballot as RawBallot,
    Change as RawChange,
    Command as RawCommand,
    ListProposalInfo,
    ManageNeuron as RawManageNeuron,
    NeuronId as RawNeuronId,
    NodeProvider as RawNodeProvider,
    Operation as RawOperation,
    Proposal as RawProposal
} from "./rawService";

export default class RequestConverters {
    private readonly principal: Principal;
    constructor(principal: Principal) {
        this.principal = principal;
    }

    public fromManageNeuron = (manageNeuron: ManageNeuron) : RawManageNeuron => {
        return {
            id: [this.fromNeuronId(manageNeuron.id)],
            command: [this.fromCommand(manageNeuron.command)]
        }
    }

    public fromClaimNeuronRequest = (request: ClaimNeuronRequest) : [Array<number>, BigNumber, BigNumber] => {
        return [
            convert.arrayBufferToArrayOfNumber(request.publicKey),
            convert.bigIntToBigNumber(request.nonce),
            convert.bigIntToBigNumber(request.dissolveDelayInSecs)
        ];
    }

    public fromListProposalsRequest = (request: ListProposalsRequest) : ListProposalInfo => {    
        return {
            include_reward_status: request.includeRewardStatus,
            before_proposal: request.beforeProposal ? [this.fromProposalId(request.beforeProposal)] : [],
            limit: request.limit,
            exclude_topic: request.excludeTopic,
            include_status: request.includeStatus
        };
    }

    public fromAddHotKeyRequest = (request: AddHotKeyRequest) : RawManageNeuron => {
        const rawOperation: RawOperation = { AddHotKey: { new_hot_key: [request.principal] } };
        const rawCommand: RawCommand =  { Configure: { operation: [rawOperation] } };
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromRemoveHotKeyRequest = (request: RemoveHotKeyRequest) : RawManageNeuron => {
        const rawOperation: RawOperation = { RemoveHotKey: { hot_key_to_remove: [request.principal] } };
        const rawCommand: RawCommand =  { Configure: { operation: [rawOperation] } };
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromStartDissolvingRequest = (request: StartDissolvingRequest) : RawManageNeuron => {
        const rawOperation: RawOperation = { StartDissolving: {} };
        const rawCommand: RawCommand =  { Configure: { operation: [rawOperation] } };
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromStopDissolvingRequest = (request: StartDissolvingRequest) : RawManageNeuron => {
        const rawOperation: RawOperation = { StopDissolving: {} };
        const rawCommand: RawCommand =  { Configure: { operation: [rawOperation] } };
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromIncreaseDissolveDelayRequest = (request: IncreaseDissolveDelayRequest) : RawManageNeuron => {
        const rawOperation: RawOperation = { IncreaseDissolveDelay: { 
            additional_dissolve_delay_seconds : request.additionalDissolveDelaySeconds 
        }};
        const rawCommand: RawCommand =  { Configure: { operation: [rawOperation] } };
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromFollowRequest = (request: FollowRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { Follow: { 
            topic : request.topic, 
            followees : request.followees.map(this.fromNeuronId) 
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromRegisterVoteRequest = (request: RegisterVoteRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { RegisterVote: { 
            vote : request.vote, 
            proposal : [this.fromProposalId(request.proposal)] }
        };
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromSpawnRequest = (request: SpawnRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { Spawn: { 
            new_controller: [request.newController]
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }
    
    public fromSplitRequest = (request: SplitRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { Split: { 
            amount_doms: convert.bigIntToBigNumber(request.amount)
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromDisburseRequest = (request: DisburseRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { Disburse: { 
            to_account: [this.principal],
            to_subaccount: convert.fromSubAccountId(request.toSubaccountId),
            amount : [this.fromDoms(request.amount)]
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromDisburseToNeuronRequest = (request: DisburseToNeuronRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { DisburseToNeuron: { 
            dissolve_delay_seconds : convert.bigIntToBigNumber(request.dissolveDelaySeconds),
            kyc_verified : request.kycVerified,
            amount_doms : convert.bigIntToBigNumber(request.amount),
            new_controller : [request.newController],
            nonce : convert.bigIntToBigNumber(request.nonce)
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromMakeMotionProposalRequest = (request: MakeMotionProposalRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { MakeProposal: { 
            url: request.url,
            summary: request.summary,
            action: [{ Motion: { motion_text: request.text } }]
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromMakeNetworkEconomicsProposalRequest = (request: MakeNetworkEconomicsProposalRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { MakeProposal: { 
            url: request.url,
            summary: request.summary,
            action: [{ NetworkEconomics: { 
                reject_cost_doms: convert.bigIntToBigNumber(request.rejectCost),
                manage_neuron_cost_per_proposal_doms: convert.bigIntToBigNumber(request.manageNeuronCostPerProposal),
                neuron_minimum_stake_doms: convert.bigIntToBigNumber(request.neuronMinimumStake),
                maximum_node_provider_rewards_doms: convert.bigIntToBigNumber(request.maximumNodeProviderRewards),
                neuron_spawn_dissolve_delay_seconds: convert.bigIntToBigNumber(request.neuronSpawnDissolveDelaySeconds),
            } }]
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    public fromMakeRewardNodeProviderProposalRequest = (request: MakeRewardNodeProviderProposalRequest) : RawManageNeuron => {
        const rawCommand: RawCommand =  { MakeProposal: { 
            url: request.url,
            summary: request.summary,
            action: [{ RewardNodeProvider: { 
                amount_doms: convert.bigIntToBigNumber(request.amount),
                node_provider: [{
                    id: [request.nodeProvider]
                }]
            } }]
        }};
        return {
            id: [this.fromNeuronId(request.neuronId)],
            command: [rawCommand]
        };
    }

    private fromNeuronId = (neuronId: NeuronId) : RawNeuronId => {
        return {
            id: convert.bigIntToBigNumber(neuronId)
        };
    }

    private fromProposalId = (proposalId: ProposalId) : RawNeuronId => {
        return {
            id: convert.bigIntToBigNumber(proposalId)
        };
    }

    private fromBallot = (ballot: Ballot) : RawBallot => {
        return {
            vote: ballot.vote,
            voting_power: convert.bigIntToBigNumber(ballot.votingPower)
        };
    }

    private fromProposal = (proposal: Proposal) : RawProposal => {
        return {
            url: proposal.url,
            action: proposal.action ? [this.fromAction(proposal.action)] : [],
            summary: proposal.summary
        }
    }

    private fromAction = (action: Action) : RawAction => {
        if ("ExternalUpdate" in action) {
            const externalUpdate = action.ExternalUpdate;
            return {
                ExternalUpdate: {
                    update_type: externalUpdate.updateType,
                    payload: convert.arrayBufferToArrayOfNumber(externalUpdate.payload)
                }
            }
        }
        if ("ManageNeuron" in action) {
            const manageNeuron = action.ManageNeuron;
            return {
                ManageNeuron: {
                    id: manageNeuron.id ? [this.fromNeuronId(manageNeuron.id)] : [],
                    command: manageNeuron.command ? [this.fromCommand(manageNeuron.command[0])] : []
                }
            }
        }
        if ("ApproveKyc" in action) {
            const approveKyc = action.ApproveKyc;
            return {
                ApproveKyc: {
                    principals: approveKyc.principals
                }
            }
        }
        if ("NetworkEconomics" in action) {
            const networkEconomics = action.NetworkEconomics;
            return {
                NetworkEconomics: {
                    reject_cost_doms: convert.bigIntToBigNumber(networkEconomics.rejectCost),
                    manage_neuron_cost_per_proposal_doms: convert.bigIntToBigNumber(networkEconomics.manageNeuronCostPerProposal),
                    neuron_minimum_stake_doms: convert.bigIntToBigNumber(networkEconomics.neuronMinimumStake),
                    neuron_spawn_dissolve_delay_seconds: convert.bigIntToBigNumber(networkEconomics.neuronSpawnDissolveDelaySeconds),
                    maximum_node_provider_rewards_doms: convert.bigIntToBigNumber(networkEconomics.maximumNodeProviderRewards)
                }
            }
        }
        if ("RewardNodeProvider" in action) {
            const rewardNodeProvider = action.RewardNodeProvider;
            return {
                RewardNodeProvider: {
                    node_provider : rewardNodeProvider.nodeProvider ? [this.fromNodeProvider(rewardNodeProvider.nodeProvider)] : [],
                    amount_doms : convert.bigIntToBigNumber(rewardNodeProvider.amount)
                }
            }
        }
        if ("AddOrRemoveNodeProvider" in action) {
            const addOrRemoveNodeProvider = action.AddOrRemoveNodeProvider;
            return {
                AddOrRemoveNodeProvider: {
                    change: addOrRemoveNodeProvider.change ? [this.fromChange(addOrRemoveNodeProvider.change)] : []
                }
            }
        }
        if ("Motion" in action) {
            const motion = action.Motion;
            return {
                Motion: {
                    motion_text: motion.motionText
                }
            }
        }
        this.throwUnrecognisedTypeError("action", action);
    }

    private fromCommand = (command: Command) : RawCommand => {
        if ("Split" in command) {
            const split = command.Split;
            return {
                Split: {
                    amount_doms: convert.bigIntToBigNumber(split.amount)
                }
            }
        }
        if ("Follow" in command) {
            const follow = command.Follow;
            return {
                Follow: {
                    topic: follow.topic,
                    followees: follow.followees.map(this.fromNeuronId)
                }
            }
        }
        if ("Configure" in command) {
            const configure = command.Configure;
            return {
                Configure: {
                    operation: [this.fromOperation(configure.operation)]
                }
            }
        }
        if ("RegisterVote" in command) {
            const registerVote = command.RegisterVote;
            return {
                RegisterVote: {
                    vote: registerVote.vote,
                    proposal: [this.fromProposalId(registerVote.proposal)]
                }
            }
        }
        if ("DisburseToNeuron" in command) {
            const disburseToNeuron = command.DisburseToNeuron;
            return {
                DisburseToNeuron: {
                    dissolve_delay_seconds: convert.bigIntToBigNumber(disburseToNeuron.dissolveDelaySeconds),
                    kyc_verified: disburseToNeuron.kycVerified,
                    amount_doms: convert.bigIntToBigNumber(disburseToNeuron.amount),
                    new_controller: disburseToNeuron.newController ? [disburseToNeuron.newController] : [],
                    nonce: convert.bigIntToBigNumber(disburseToNeuron.nonce)
                }
            }
        }
        if ("MakeProposal" in command) {
            const makeProposal = command.MakeProposal;
            return {
                MakeProposal: {
                    url: makeProposal.url,
                    action: makeProposal.action ? [this.fromAction(makeProposal.action)] : [],
                    summary: makeProposal.summary
                }
            }
        }
        if ("Disburse" in command) {
            const disburse = command.Disburse;
            return {
                Disburse: {
                    to_subaccount: disburse.toSubaccountId ? convert.fromSubAccountId(disburse.toSubaccountId) : [],
                    to_account: [this.principal],
                    amount: disburse.amount ? [this.fromDoms(disburse.amount)] : []
                }
            }
        }
        this.throwUnrecognisedTypeError("command", command);
    }

    private fromOperation = (operation: Operation) : RawOperation => {
        if ("RemoveHotKey" in operation) {
            const removeHotKey = operation.RemoveHotKey;
            return {
                RemoveHotKey: {
                    hot_key_to_remove: removeHotKey.hotKeyToRemove ? [removeHotKey.hotKeyToRemove] : []
                }
            }
        }
        if ("AddHotKey" in operation) {
            const addHotKey = operation.AddHotKey;
            return {
                AddHotKey: {
                    new_hot_key: addHotKey.newHotKey ? [addHotKey.newHotKey] : []
                }
            }
        }
        if ("StopDissolving" in operation) {
            return {
                StopDissolving: {}
            }
        }
        if ("StartDissolving" in operation) {
            return {
                StartDissolving: {}
            }
        }
        if ("IncreaseDissolveDelay" in operation) {
            const increaseDissolveDelay = operation.IncreaseDissolveDelay;
            return {
                IncreaseDissolveDelay: {
                    additional_dissolve_delay_seconds: increaseDissolveDelay.additionalDissolveDelaySeconds
                }
            }
        }
        this.throwUnrecognisedTypeError("operation", operation);
    }

    private fromChange = (change: Change) : RawChange => {
        if ("ToRemove" in change) {
            return {
                ToRemove: this.fromNodeProvider(change.ToRemove)
            }
        }
        if ("ToAdd" in change) {
            return {
                ToAdd: this.fromNodeProvider(change.ToAdd)
            }
        }
        this.throwUnrecognisedTypeError("change", change);
    }

    private fromNodeProvider = (nodeProvider: NodeProvider) : RawNodeProvider => {
        return {
            id: nodeProvider.id ? [nodeProvider.id] : []
        }
    }

    private fromDoms = (doms: Doms) : RawAmount => {
        return {
            doms: convert.bigIntToBigNumber(doms)
        }
    }

    private throwUnrecognisedTypeError = (name: string, value: any) => {
        throw new Error(`Unrecognised ${name} type - ${JSON.stringify(value)}`);
    }
}
