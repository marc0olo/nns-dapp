import { NeuronsTablePo } from "$tests/page-objects/NeuronsTable.page-object";
import { BasePageObject } from "$tests/page-objects/base.page-object";
import type { PageObjectElement } from "$tests/types/page-object.types";
import { LosingRewardsBannerPo } from "./LosingRewardsBanner.page-object";
import { MakeNeuronsPublicBannerPo } from "./MakeNeuronsPublicBanner.page-object";

export class NnsNeuronsPo extends BasePageObject {
  private static readonly TID = "nns-neurons-component";

  static under(element: PageObjectElement): NnsNeuronsPo {
    return new NnsNeuronsPo(element.byTestId(NnsNeuronsPo.TID));
  }

  getNeuronsTablePo(): NeuronsTablePo {
    return NeuronsTablePo.under(this.root);
  }

  async isContentLoaded(): Promise<boolean> {
    return (await this.isPresent()) && !(await this.isContentLoading());
  }

  isContentLoading(): Promise<boolean> {
    return this.hasSpinner();
  }

  async waitForContentLoaded(): Promise<void> {
    await this.waitFor();
    await this.waitForAbsent("spinner");
  }

  async getNeuronIds(): Promise<string[]> {
    const rows = await this.getNeuronsTablePo().getNeuronsTableRowPos();
    return Promise.all(rows.map((row) => row.getNeuronId()));
  }

  hasEmptyMessage(): Promise<boolean> {
    return this.isPresent("empty-message-component");
  }

  hasSpinner(): Promise<boolean> {
    return this.isPresent("spinner");
  }

  getMakeNeuronsPublicBannerPo(): MakeNeuronsPublicBannerPo {
    return MakeNeuronsPublicBannerPo.under(this.root);
  }

  getLosingRewardsBannerPo(): LosingRewardsBannerPo {
    return LosingRewardsBannerPo.under(this.root);
  }
}
