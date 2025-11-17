<script lang="ts">
  let {
    onclick = () => {},
    text = 'Refresh',
    disabled = false,
  }: {
    onclick: () => void;
    text?: string;
    disabled?: boolean;
  } = $props();

  let svgFocus = $state<boolean>(false);
</script>

<button
  class="orange-btn"
  onpointerover={() => (svgFocus = true)}
  onpointerout={() => (svgFocus = false)}
  {onclick}
  aria-label="Refresh"
  {disabled}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-100 -100 200 200"
    stroke-width="20"
    stroke-linejoin="round"
    stroke-linecap="round"
    transform={svgFocus ? 'scale(0.75) rotate(360)' : ''}
  >
    <g id="refresh-arrow">
      <path d="M -75 -30 A 80 80 0 0 1 75 -30" fill="none" />
      <polygon points="75 -30 75 -70 40 -40" />
    </g>
    <use href="#refresh-arrow" transform="rotate(180)" />
  </svg>
  {text}
</button>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  button {
    fill: currentColor;
    stroke: currentColor;
  }
</style>
