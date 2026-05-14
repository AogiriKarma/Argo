<script lang="ts">
  /**
   * Affiche la face d'un skin Minecraft via crop CSS du PNG 64x64.
   * La face est au pixel (8, 8) sur 8x8. À l'échelle voulue, on ajuste
   * background-size et background-position.
   */
  interface Props {
    skinUrl: string;
    size?: number;
    class?: string;
  }
  let { skinUrl, size = 28, class: cls = '' }: Props = $props();
</script>

<span
  class="inline-block rounded {cls}"
  style="
    width: {size}px;
    height: {size}px;
    background-image: url({skinUrl});
    background-size: {size * 8}px {size * 8}px;
    background-position: -{size}px -{size}px;
    image-rendering: pixelated;
  "
  aria-hidden="true"
></span>
