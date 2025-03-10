<script lang="ts">
  import { browser } from "$app/environment";
  import { icpAccountsStore } from "$lib/derived/icp-accounts.derived";
  import ChangeNeuronVisibilityModal from "$lib/modals/neurons/ChangeNeuronVisibilityModal.svelte";
  import { i18n } from "$lib/stores/i18n";
  import { definedNeuronsStore } from "$lib/derived/neurons.derived";
  import {
    isNeuronControllableByUser,
    isPublicNeuron,
  } from "$lib/utils/neuron.utils";
  import { IconClose, IconInfo } from "@dfinity/gix-components";

  const LOCAL_STORAGE_KEY = "isNeuronsPublicBannerDismissed";
  const CUTOFF_DATE = new Date(2025, 0, 31);

  let modalVisible: boolean;
  $: modalVisible = false;

  function isAfterCutoffDate(): boolean {
    return new Date() > CUTOFF_DATE;
  }

  let isDismissed = browser
    ? (JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEY) ?? "false"
      ) as boolean) || isAfterCutoffDate()
    : false;

  function dismissBanner() {
    isDismissed = true;
    localStorage.setItem(LOCAL_STORAGE_KEY, "true");
  }

  function openModal() {
    modalVisible = true;
  }

  function closeModal() {
    modalVisible = false;
  }

  $: hasControllablePrivateNeurons = $definedNeuronsStore.some(
    (n) =>
      !isPublicNeuron(n) &&
      isNeuronControllableByUser({
        neuron: n,
        mainAccount: $icpAccountsStore.main,
      })
  );
</script>

{#if hasControllablePrivateNeurons && !isDismissed}
  <div class="banner" data-tid="make-neurons-public-banner-component">
    <div class="icon-and-text-content-wrapper">
      <div class="icon-background">
        <div class="icon-wrapper">
          <IconInfo />
        </div>
      </div>
      <div class="text-content">
        <p class="title" data-tid="banner-title">
          {$i18n.neurons.make_neurons_public_banner_title}
        </p>
        <p class="description" data-tid="banner-description">
          {$i18n.neurons.make_neurons_public_banner_description}
          <a
            data-tid="banner-description-link"
            href="https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/neurons/neuron-management"
            target="_blank">{$i18n.neurons.learn_more}</a
          >
        </p>
      </div>
    </div>
    <button
      class="secondary action-button"
      data-tid="banner-change-neuron-visibility-button"
      on:click={openModal}
      >{$i18n.neurons.make_neurons_public_action_text}
    </button>
    <button
      class="close-button icon-only"
      on:click={dismissBanner}
      data-tid="close-button"
    >
      <IconClose />
    </button>
    {#if modalVisible}
      <ChangeNeuronVisibilityModal makePublic={true} on:nnsClose={closeModal} />
    {/if}
  </div>
{/if}

<style lang="scss">
  @use "@dfinity/gix-components/dist/styles/mixins/fonts";
  @use "@dfinity/gix-components/dist/styles/mixins/media";

  .banner {
    display: flex;
    align-items: center;
    background: var(--input-background);
    border-radius: var(--border-radius);
    padding: var(--padding) var(--padding-1_5x);
    gap: var(--padding-1_5x);
    flex-wrap: wrap;
    @include media.min-width(small) {
      flex-wrap: nowrap;
    }
  }

  .icon-and-text-content-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    column-gap: var(--padding-1_5x);
    flex-grow: 1;
    @include media.min-width(small) {
      width: auto;
    }
  }
  .icon-background {
    padding: var(--padding);
    background-color: var(--dropdown-border-color);
    border-radius: 50%;
  }

  .icon-wrapper {
    color: var(--elements-icons);
  }

  .text-content {
    display: flex;
    flex-direction: column;
  }

  .title {
    @include fonts.standard(true);
    margin: 0;
  }
  .description {
    @include fonts.standard(false);
    margin: 0;
  }

  .action-button {
    text-wrap: nowrap;
    flex-grow: 1;
    @include media.min-width(small) {
      flex-grow: 0;
    }
  }

  .close-button {
    padding: var(--padding-1_5x);
    border-radius: var(--border-radius);
    background: var(--card-background);
    color: var(--elements-icons);
  }
</style>
