<script>
    (() => {
        let saved;
        try { saved = JSON.parse(localStorage.getItem('hydrodactyl:appearance') || 'null'); } catch {}
        const mode = saved?.mode === 'light' || saved?.mode === 'system' ? saved.mode : 'dark';
        const root = document.documentElement;
        root.dataset.theme = mode === 'system' ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches === false ? 'light' : 'dark') : mode;
        root.dataset.accent = ['panel', 'blue', 'green', 'violet', 'orange', 'rose'].includes(saved?.accent) ? saved.accent : 'panel';
        root.dataset.palette = ['neutral', 'obsidian', 'dracula', 'nord', 'red', 'blue', 'yellow', 'green', 'violet', 'mocha'].includes(saved?.palette) ? saved.palette : 'neutral';
        root.style.colorScheme = root.dataset.theme;
    })();
</script>
<style>
    html[data-theme="light"] {
        --color-bg: #fafafa;
        --color-canvas: #fafafa;
        --color-primary: #27272a;
    }
</style>
