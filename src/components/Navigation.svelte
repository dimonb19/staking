<script lang="ts">
  import type { Action } from 'svelte/action';

  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';

  import Rainbow from '@components/web3/Rainbow.tsx';

  import Logo from '@components/icons/Logo.svelte';

  // Rainbow button (React) Mount helper used when wallet isn't connected yet.
  const mountRainbow: Action<HTMLDivElement> = (node) => {
    const root = createRoot(node);
    root.render(createElement(Rainbow));
    return {
      destroy() {
        root.unmount();
      },
    };
  };
</script>

<nav class="flex-row">
  <div class="flex-row">
    <Logo />
    <a
      class="nohover-link fle pc-only"
      href="https://conexus.degenerousdao.com/"
    >
      CoNexus
    </a>
    <a
      class="nohover-link flex pc-only"
      href="https://governance.dgrslabs.ink/"
    >
      Governance Hub
    </a>
  </div>
  <div class="rainbow-slot" use:mountRainbow>
    <button class="rainbow-btn" disabled> Loading... </button>
  </div>
</nav>

<style lang="scss">
  @use '/src/styles/mixins/' as *;

  nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding: 1rem;
    justify-content: space-between;
    z-index: 100;
    @include dark-blue;
    @include box-shadow;

    a {
      font-weight: 500;
      text-transform: capitalize;
      @include white-txt;

      &:hover,
      &:active,
      &:focus {
        @include cyan(1, text);
      }
    }
  }
</style>
