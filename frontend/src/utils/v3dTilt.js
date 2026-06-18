export default {
  mounted(el, binding) {
    const max = binding.value?.max ?? 10;
    const perspective = binding.value?.perspective ?? 1000;
    const scale = binding.value?.scale ?? 1.03;

    // Use requestAnimationFrame to avoid layout thrashing and ensure smooth 60fps+ tracking
    let frameId = null;

    const onMouseMove = (e) => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xc = rect.width / 2;
        const yc = rect.height / 2;

        const dx = x - xc;
        const dy = y - yc;

        // Calculate rotation degrees based on mouse coordinates relative to center
        const rx = (dx / xc) * max;
        const ry = -(dy / yc) * max;

        // Set CSS custom properties for custom dynamic gloss gradients
        el.style.setProperty("--mx", `${((x / rect.width) * 100).toFixed(2)}%`);
        el.style.setProperty("--my", `${((y / rect.height) * 100).toFixed(2)}%`);

        el.style.transform = `perspective(${perspective}px) rotateX(${ry.toFixed(2)}deg) rotateY(${rx.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
      });
    };

    const onMouseEnter = () => {
      el.style.transition = "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.15s ease";
    };

    const onMouseLeave = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      
      frameId = requestAnimationFrame(() => {
        el.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease";
        el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    };

    el.addEventListener("mousemove", onMouseMove, { passive: true });
    el.addEventListener("mouseenter", onMouseEnter, { passive: true });
    el.addEventListener("mouseleave", onMouseLeave, { passive: true });

    // Store cleaner on element context
    el._cleanupTilt = () => {
      if (frameId) cancelAnimationFrame(frameId);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  },
  unmounted(el) {
    if (el._cleanupTilt) {
      el._cleanupTilt();
    }
  }
};
