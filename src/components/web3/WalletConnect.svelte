<script>
  import { onMount } from 'svelte';

  import { createRoot } from 'react-dom/client';

  import RainbowConnect from '@components/web3/Rainbow';

  onMount(() => {
    const reactRoot = document.getElementById('react-root');
    if (reactRoot) {
      const root = createRoot(reactRoot); // Create a root
      root.render(RainbowConnect());
    }
  });
</script>

<div id="react-root"></div>
