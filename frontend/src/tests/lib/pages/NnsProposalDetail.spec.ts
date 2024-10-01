import { resetNeuronsApiService } from "$lib/api-services/governance.api-service";
import * as governanceApi from "$lib/api/governance.api";
import * as proposalsApi from "$lib/api/proposals.api";
import NnsProposalDetail from "$lib/pages/NnsProposalDetail.svelte";
import { actionableProposalsSegmentStore } from "$lib/stores/actionable-proposals-segment.store";
import {
  mockIdentity,
  resetIdentity,
  setNoIdentity,
} from "$tests/mocks/auth.store.mock";
import { mockProposalInfo } from "$tests/mocks/proposal.mock";
import { NnsProposalPo } from "$tests/page-objects/NnsProposal.page-object";
import { JestPageObjectElement } from "$tests/page-objects/jest.page-object";
import { runResolvedPromises } from "$tests/utils/timers.test-utils";
import { toastsStore } from "@dfinity/gix-components";
import { render } from "@testing-library/svelte";
import { get } from "svelte/store";

vi.mock("$lib/api/governance.api");

describe("NnsProposalDetail", () => {
  beforeEach(() => {
    resetIdentity();
    vi.restoreAllMocks();
    resetNeuronsApiService();
    toastsStore.reset();
    vi.spyOn(governanceApi, "queryNeurons").mockResolvedValue([]);

    actionableProposalsSegmentStore.set("all");
    vi.spyOn(proposalsApi, "queryProposal").mockResolvedValue(mockProposalInfo);
  });

  const props = {
    proposalIdText: `${mockProposalInfo.id}`,
  };

  const renderComponent = () => {
    const { container } = render(NnsProposalDetail, props);
    return NnsProposalPo.under(new JestPageObjectElement(container));
  };

  describe("logged in user", () => {
    beforeEach(() => {
      resetIdentity();
    });

    it("should render proposal detail if signed in", async () => {
      const po = renderComponent();
      await runResolvedPromises();

      expect(await po.isPresent("proposal-details-grid")).toBe(true);
      expect(await po.isContentLoaded()).toBe(true);
      expect(await po.getProposalSystemInfoSectionPo().isPresent()).toBe(true);
      expect(await po.getProposalSummaryPo().isPresent()).toBe(true);
      expect(await po.getProposalProposerActionsEntryPo().isPresent()).toBe(
        true
      );
      expect(get(toastsStore)).toEqual([]);
    });

    it("should show one toast if queryProposal fails", async () => {
      vi.spyOn(console, "error").mockReturnValue(undefined);
      const errorMessage = "proposal not found";
      vi.spyOn(proposalsApi, "queryProposal").mockRejectedValue(
        new Error(errorMessage)
      );

      renderComponent();
      await runResolvedPromises();

      expect(get(toastsStore)).toMatchObject([
        {
          level: "error",
          text: `An error occurred while loading the proposal. id: "${mockProposalInfo.id}". ${errorMessage}`,
        },
      ]);
    });

    it("should query neurons", async () => {
      renderComponent();
      await runResolvedPromises();

      expect(governanceApi.queryNeurons).toHaveBeenCalledWith({
        identity: mockIdentity,
        certified: true,
        includeEmptyNeurons: false,
      });
      expect(governanceApi.queryNeurons).toHaveBeenCalledWith({
        identity: mockIdentity,
        certified: false,
        includeEmptyNeurons: false,
      });
      expect(governanceApi.queryNeurons).toHaveBeenCalledTimes(2);
    });
  });

  describe("logged out user", () => {
    beforeEach(() => {
      setNoIdentity();
    });

    it("should render proposal detail if not signed in", async () => {
      const po = renderComponent();
      await runResolvedPromises();

      expect(await po.isPresent("proposal-details-grid")).toBe(true);
      expect(await po.isContentLoaded()).toBe(true);
      expect(await po.getProposalSystemInfoSectionPo().isPresent()).toBe(true);
      expect(await po.getProposalSummaryPo().isPresent()).toBe(true);
      expect(await po.getProposalProposerActionsEntryPo().isPresent()).toBe(
        true
      );
    });

    it("should show one toast if queryProposal fails", async () => {
      vi.spyOn(console, "error").mockReturnValue(undefined);
      const errorMessage = "proposal not found";
      vi.spyOn(proposalsApi, "queryProposal").mockRejectedValue(
        new Error(errorMessage)
      );

      renderComponent();
      await runResolvedPromises();

      expect(get(toastsStore)).toMatchObject([
        {
          level: "error",
          text: `An error occurred while loading the proposal. id: "${mockProposalInfo.id}". ${errorMessage}`,
        },
      ]);
    });

    it("should NOT query neurons", async () => {
      renderComponent();
      await runResolvedPromises();

      expect(governanceApi.queryNeurons).not.toHaveBeenCalled();
    });
  });
});
