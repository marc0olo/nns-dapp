import { icpSwapTickersStore } from "$lib/stores/icp-swap.store";
import { mockIcpSwapTicker } from "$tests/mocks/icp-swap.mock";
import { get } from "svelte/store";

describe("icp-swap.store", () => {
  describe("icpSwapTickersStore", () => {
    it("should initialize to undefined", () => {
      expect(get(icpSwapTickersStore)).toBeUndefined();
    });

    it("should store ticker data", () => {
      const ticker1 = {
        ...mockIcpSwapTicker,
        ticker_name: "CHAT_ICP",
        base_currency: "CHAT",
      };
      const ticker2 = {
        ...mockIcpSwapTicker,
        ticker_name: "ckUSDC_ICP",
        base_currency: "ckUSDC",
      };
      const tickers = [ticker1, ticker2];
      const now = new Date(2023, 11, 31).getTime() / 1000;
      const data = { tickers, lastUpdateTimestampSeconds: now };

      expect(get(icpSwapTickersStore)).toBeUndefined();

      icpSwapTickersStore.set(data);

      expect(get(icpSwapTickersStore)).toEqual(data);
    });
  });
});
