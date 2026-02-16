import { ref, computed, onMounted, onBeforeUnmount, type Ref } from 'vue';

export interface MagicCardOptions {
    gradientSize?: number;
    gradientColor?: string;
    gradientOpacity?: number;
}

/**
 * Converts a hex color (e.g. "#262626") to an rgba string with the given alpha.
 */
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useMagicCard(options: MagicCardOptions = {}) {
    const {
        gradientSize = 200,
        gradientColor = '#262626',
        gradientOpacity = 0.8,
    } = options;

    const cardRef: Ref<HTMLElement | null> = ref(null);
    const mouseX = ref(-gradientSize);
    const mouseY = ref(-gradientSize);

    const colorWithAlpha = hexToRgba(gradientColor, gradientOpacity);

    function handleMouseMove(e: MouseEvent) {
        const el = cardRef.value;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        mouseX.value = e.clientX - rect.left;
        mouseY.value = e.clientY - rect.top;
    }

    function handleMouseLeave() {
        mouseX.value = -gradientSize;
        mouseY.value = -gradientSize;
    }

    const backgroundStyle = computed(() => ({
        background: `radial-gradient(${gradientSize}px circle at ${mouseX.value}px ${mouseY.value}px, ${colorWithAlpha}, transparent 100%)`,
    }));

    onMounted(() => {
        const el = cardRef.value;
        if (!el) return;
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);
    });

    onBeforeUnmount(() => {
        const el = cardRef.value;
        if (!el) return;
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
    });

    return {
        cardRef,
        backgroundStyle,
    };
}
