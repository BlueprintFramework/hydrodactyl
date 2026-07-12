import type { ITerminalAddon, Terminal } from '@xterm/xterm';

/**
 * A "scroll to bottom" helper for the xterm console — a small down-arrow
 * button pinned to the bottom-right of the terminal. It appears when the user
 * has scrolled up in the buffer (newer output hidden below the fold) and
 * disappears when they're back at the bottom. Clicking it jumps to the latest
 * output. Ported from upstream Pterodactyl's plugin of the same name.
 *
 * IMPORTANT — why this uses the NATIVE viewport scroll event, not xterm's
 * `terminal.onScroll` / `buffer.active.viewportY`:
 *   With console.css routing touches to `.xterm-viewport` (so the compositor
 *   scrolls the buffer natively), the buffer is scrolled by moving the
 *   viewport element's `scrollTop`. In this xterm v5.5.0 + DOM-renderer build
 *   that DOES update the rendered rows, but it does NOT update
 *   `buffer.active.viewportY` or emit `terminal.onScroll` for user scrolls
 *   (those only fire on xterm's own auto-scroll on new output). So
 *   `viewportY === baseY` is unreliable here. Instead we listen to the
 *   viewport element's native `scroll` event and compare `scrollTop` to the
 *   max — which tracks real user/programmatic scroll position correctly.
 *
 * The button is appended to `terminal.element` (the `.xterm` host) as a direct
 * child, NOT inside `.xterm-screen` — so the console.css `pointer-events: none`
 * rule on `.xterm-screen` doesn't affect it; it stays tappable.
 */
export class ScrollDownHelperAddon implements ITerminalAddon {
    private terminal!: Terminal;
    private viewport: HTMLElement | null = null;
    private element?: HTMLDivElement;
    private waitTimer: ReturnType<typeof setTimeout> | null = null;

    activate(terminal: Terminal): void {
        this.terminal = terminal;
        // The addon is loaded before terminal.open(), so terminal.element (and
        // the viewport) don't exist yet — wait for them.
        this.waitForViewport();

        // New output while the user is scrolled up → reveal the button so they
        // know fresher output is below. (onLineFeed fires on every writeln.)
        this.terminal.onLineFeed(() => {
            if (!this.isAtBottom()) {
                this.show();
            }
        });
    }

    dispose(): void {
        if (this.waitTimer) clearTimeout(this.waitTimer);
        if (this.viewport) this.viewport.removeEventListener('scroll', this.handleScroll);
        if (this.element) {
            this.element.remove();
            this.element = undefined;
        }
    }

    private waitForViewport = () => {
        const el = this.terminal.element;
        const vp = el ? (el.querySelector('.xterm-viewport') as HTMLElement | null) : null;
        if (vp) {
            this.viewport = vp;
            vp.addEventListener('scroll', this.handleScroll, { passive: true });
            this.handleScroll(); // set initial visibility
            return;
        }
        this.waitTimer = setTimeout(this.waitForViewport, 50);
    };

    private handleScroll = (): void => {
        if (this.isAtBottom()) {
            this.hide();
        } else {
            this.show();
        }
    };

    private isAtBottom(): boolean {
        const vp = this.viewport;
        if (!vp) return true;
        return vp.scrollTop >= vp.scrollHeight - vp.clientHeight - 2;
    }

    private show(): void {
        if (!this.terminal?.element) {
            return;
        }
        if (this.element) {
            this.element.style.opacity = '1';
            this.element.style.pointerEvents = 'auto';
            return;
        }

        this.terminal.element.style.position = 'relative';

        this.element = document.createElement('div');
        this.element.innerHTML =
            '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width:1em;height:1em;display:block;"><path fill="currentColor" d="M374.6 310.6l-160 160C208.4 476.9 200.2 480 192 480s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 370.8V64c0-17.69 14.33-31.1 31.1-31.1S224 46.31 224 64v306.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0S387.1 298.1 374.6 310.6z"/></svg>';
        Object.assign(this.element.style, {
            position: 'absolute',
            right: '0.75rem',
            bottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            fontSize: '1rem',
            color: '#e5e5e5',
            backgroundColor: 'rgba(38, 36, 40, 0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
            zIndex: '20',
            cursor: 'pointer',
            opacity: '1',
            transition: 'opacity 120ms ease',
            // never let the terminal's touch-scroll isolation swallow the tap
            touchAction: 'manipulation',
        } as Partial<CSSStyleDeclaration>);
        this.element.setAttribute('role', 'button');
        this.element.setAttribute('aria-label', 'Scroll console to bottom');
        this.element.title = 'Scroll to bottom';

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.viewport) {
                this.viewport.scrollTop = this.viewport.scrollHeight;
            } else {
                this.terminal.scrollToBottom();
            }
        });

        this.terminal.element.appendChild(this.element);
    }

    private hide(): void {
        if (this.element) {
            this.element.style.opacity = '0';
            this.element.style.pointerEvents = 'none';
        }
    }
}
