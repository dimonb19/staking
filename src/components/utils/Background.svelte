<script lang="ts">
  let width = $state<number>(0);
  let scroll = $state<number>(0);
</script>

<svelte:window bind:innerWidth={width} bind:scrollY={scroll} />

<div
  id="background-image"
  class="bg-animation"
  style:top={`max(-${scroll / 100}vh, -100vh)`}
></div>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  #background-image {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 200vh;
    background-image: url('/stars.webp');
    background-attachment: scroll;
    // background-repeat: no-repeat;
    // background-position: top;
    // background-size: cover;
    z-index: -100;
    transition:
      opacity 0.6s linear,
      filter 0.9s ease-in-out;

    // Fallback if no support
    opacity: 1;
    filter: none;

    @starting-style {
      opacity: 0;
      filter: brightness(125%) contrast(150%);
    }
  }
</style>
