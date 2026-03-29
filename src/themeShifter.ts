// ============================================================================
// ZenNode — Theme Shifter
//
// Dynamic warm-amber color overlay that activates when the developer's
// cognitive load hits overload territory (score ≥ 80). Grounded in
// chromotherapy research: warm tones reduce cortisol, lower eye strain,
// and signal the nervous system to down-regulate.
//
// Hysteresis prevents rapid toggling:
//   • Shift ON:  score ≥ 80  (themeShift flag from backend)
//   • Shift OFF: score < 60  (safely back in friction/flow territory)
//
// The overlay uses VS Code's `workbench.colorCustomizations` setting.
// Original user colors are preserved and restored on revert.
// ============================================================================

import * as vscode from 'vscode';
import { THRESHOLD_FRICTION_MAX } from './scorer';

// ── Hysteresis threshold ────────────────────────────────────────────────────
// Revert when score drops back into friction/flow territory.
// Tied to THRESHOLD_FRICTION_MAX so it stays in sync with scorer thresholds.
const REVERT_THRESHOLD = THRESHOLD_FRICTION_MAX;

// ── Warm Amber Palette ──────────────────────────────────────────────────────
// Carefully tuned warm tones — calming, not aggressive.
// Works best with dark themes. Light themes get a warm tint too.
const WARM_AMBER_OVERRIDES: Record<string, string> = {
    // ── Editor core ──
    'editor.background': '#1E1A14',   // warm dark umber
    'editor.foreground': '#E8D5B7',   // warm cream text
    'editor.lineHighlightBackground': '#2E261A44', // subtle warm line highlight
    'editor.selectionBackground': '#6B5A3C66', // warm selection
    'editor.wordHighlightBackground': '#6B5A3C33', // warm word highlight
    'editorCursor.foreground': '#E8A84C',   // amber cursor

    // ── Sidebar ──
    'sideBar.background': '#1A1610',
    'sideBar.foreground': '#D4C4A8',
    'sideBarTitle.foreground': '#E8C87A',

    // ── Activity bar ──
    'activityBar.background': '#1A1610',
    'activityBar.foreground': '#E8C87A',   // amber icons
    'activityBarBadge.background': '#D4873C',   // warm badge

    // ── Title bar ──
    'titleBar.activeBackground': '#1E1A14',
    'titleBar.activeForeground': '#E8D5B7',
    'titleBar.inactiveBackground': '#1A1610',
    'titleBar.inactiveForeground': '#B8A88C',

    // ── Tabs ──
    'tab.activeBackground': '#2A2218',
    'tab.activeForeground': '#F5E6CC',
    'tab.inactiveBackground': '#1A1610',
    'tab.inactiveForeground': '#9E8E72',
    'tab.activeBorderTop': '#D4873C',   // amber top border = warm accent
    'editorGroupHeader.tabsBackground': '#1A1610',

    // ── Status bar ──
    'statusBar.background': '#7B4F28',   // warm amber bar
    'statusBar.foreground': '#FFF3E0',
    'statusBar.debuggingBackground': '#8B5E3C',
    'statusBar.noFolderBackground': '#5C3D1E',

    // ── Panel (terminal, output, etc.) ──
    'panel.background': '#1A1610',
    'panel.border': '#5C4A3288',
    'panelTitle.activeForeground': '#E8C87A',
    'panelTitle.activeBorder': '#D4873C',
    'terminal.background': '#1A1610',
    'terminal.foreground': '#E8D5B7',

    // ── Borders & accents ──
    'focusBorder': '#D4873C88',
    'editorGroup.border': '#5C4A3244',
    'sideBarSectionHeader.background': '#2A221844',

    // ── Input & dropdowns ──
    'input.background': '#2A2218',
    'input.foreground': '#E8D5B7',
    'input.border': '#5C4A3288',
    'dropdown.background': '#2A2218',
    'dropdown.foreground': '#E8D5B7',

    // ── Scrollbar ──
    'scrollbarSlider.background': '#6B5A3C44',
    'scrollbarSlider.hoverBackground': '#6B5A3C88',
    'scrollbarSlider.activeBackground': '#D4873CAA',

    // ── Badge / notification warm accent ──
    'badge.background': '#D4873C',
    'badge.foreground': '#FFF3E0',
};

// All keys we override — used for save/restore
const OVERRIDE_KEYS = Object.keys(WARM_AMBER_OVERRIDES);

// ============================================================================
// ThemeShifter Class
// ============================================================================

export class ThemeShifter implements vscode.Disposable {
    private _isShifted = false;
    private _savedColors: Record<string, string | undefined> = {};
    private _disposed = false;

    /** Whether the warm-amber overlay is currently active */
    get isShifted(): boolean {
        return this._isShifted;
    }

    /**
     * Call once on extension activation to detect and clean up any amber colors
     * left over from a previous session that didn't deactivate cleanly (e.g. crash,
     * forced window reload). Checks if any of our override keys are currently set
     * in workbench.colorCustomizations and strips them if so.
     */
    async recoverStuckTheme(): Promise<void> {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        const currentColors: Record<string, string> =
            workbenchConfig.get('colorCustomizations') ?? {};

        const isStuck = OVERRIDE_KEYS.some(key => currentColors[key] !== undefined);
        if (!isStuck) { return; }

        // Amber colors are present but _isShifted is false — leftover from crash/reload.
        // Force-remove all our keys.
        const cleaned: Record<string, string> = { ...currentColors };
        for (const key of OVERRIDE_KEYS) {
            delete cleaned[key];
        }

        await workbenchConfig.update(
            'colorCustomizations',
            Object.keys(cleaned).length > 0 ? cleaned : undefined,
            vscode.ConfigurationTarget.Workspace
        );

        console.log('[ZenNode] Cleaned up stuck warm-amber theme from previous session.');
    }

    // ── Main API ────────────────────────────────────────────────────────────

    /**
     * Evaluate the cognitive report and decide whether to shift or revert.
     * Handles hysteresis internally:
     *   - Shift ON when themeShift flag is true (score ≥ 80)
     *   - Shift OFF when score drops below REVERT_THRESHOLD (60)
     *
     * @param score    The current cognitive load score (0–100)
     * @param themeShift  The backend's theme-shift recommendation
     */
    async evaluate(score: number, themeShift: boolean): Promise<void> {
        if (this._disposed) {
            return;
        }

        if (!this._isShifted && themeShift) {
            // Score hit ≥ 80 → shift to warm amber
            await this._applyWarmOverlay();
        } else if (this._isShifted && score < REVERT_THRESHOLD) {
            // Score recovered below 60 → revert to original
            await this._revertOverlay();
        }
        // Otherwise: maintain current state (hysteresis zone 60–79)
    }

    /**
     * Force revert to original colors — used on session reset or deactivation.
     */
    async forceRevert(): Promise<void> {
        if (this._isShifted) {
            await this._revertOverlay();
        }
    }

    // ── Private: Apply / Revert ─────────────────────────────────────────────

    /**
     * Save the user's current color customizations, then apply warm amber overlay.
     */
    private async _applyWarmOverlay(): Promise<void> {
        try {
            const workbenchConfig = vscode.workspace.getConfiguration('workbench');
            const currentColors: Record<string, string> =
                workbenchConfig.get('colorCustomizations') ?? {};

            // Save original values for keys we're about to override
            this._savedColors = {};
            for (const key of OVERRIDE_KEYS) {
                // undefined means the key wasn't set — we'll delete it on revert
                this._savedColors[key] = currentColors[key];
            }

            // Merge: existing user colors + our warm overrides (ours win)
            const mergedColors = { ...currentColors, ...WARM_AMBER_OVERRIDES };

            await workbenchConfig.update(
                'colorCustomizations',
                mergedColors,
                vscode.ConfigurationTarget.Workspace
            );

            this._isShifted = true;
            console.log('[ZenNode] 🌅 Theme shifted to warm amber — take it easy.');
        } catch (err) {
            console.error('[ZenNode] Failed to apply warm theme overlay:', err);
        }
    }

    /**
     * Restore original color customizations, removing our warm overrides.
     */
    private async _revertOverlay(): Promise<void> {
        try {
            const workbenchConfig = vscode.workspace.getConfiguration('workbench');
            const currentColors: Record<string, string> =
                workbenchConfig.get('colorCustomizations') ?? {};

            // Build restored colors: start from current, revert our keys
            const restoredColors: Record<string, string> = { ...currentColors };

            for (const key of OVERRIDE_KEYS) {
                const savedValue = this._savedColors[key];
                if (savedValue !== undefined) {
                    // Restore original user value
                    restoredColors[key] = savedValue;
                } else {
                    // Key didn't exist before — remove it
                    delete restoredColors[key];
                }
            }

            // If the restored object is empty, set to undefined to clean up settings
            const hasColors = Object.keys(restoredColors).length > 0;

            await workbenchConfig.update(
                'colorCustomizations',
                hasColors ? restoredColors : undefined,
                vscode.ConfigurationTarget.Workspace
            );

            this._isShifted = false;
            this._savedColors = {};
            console.log('[ZenNode] 🌿 Theme reverted to original — feeling better?');
        } catch (err) {
            console.error('[ZenNode] Failed to revert theme overlay:', err);
        }
    }

    // ── Disposable ──────────────────────────────────────────────────────────

    dispose(): void {
        this._disposed = true;
        // Revert on dispose to leave the user's theme clean
        if (this._isShifted) {
            this._revertOverlay().catch((err) => {
                console.error('[ZenNode] Error reverting theme on dispose:', err);
            });
        }
    }
}
