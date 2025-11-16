<script>
  import { toastStore } from '@stores/toast.svelte';
  import Toast from '@components/utils/Toast.svelte';
</script>

<div class="flex" aria-live="polite" aria-atomic="true">
  {#each $toastStore as { id, message, type, duration }}
    <Toast {message} {type} {duration} onClose={() => toastStore.close(id)} />
  {/each}
</div>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  div {
    position: fixed;
    top: 6rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    pointer-events: none;

    width: max-content;
    min-width: 12rem;
    max-width: calc(100vw - 2rem);

    @include respond-up(small-desktop) {
      top: 3rem;
      max-width: calc(100vw - 40%);
    }
  }
</style>
