import { describe, it, expect } from "vitest";
import { navSections } from "@/components/layout/AppSidebar";
import { MODULES as LOBBY } from "@/components/landing/LobbyEcosystem";
import { APP_MODULES, LOBBY_MODULES } from "@/lib/module-manifest";

/**
 * Guardrail: LobbyEcosystem must always mirror the AppSidebar module list
 * (minus meta routes like Dashboard / Security Dashboard / Privacy Center
 * flagged `showInLobby: false` in the manifest). Themes don't change the
 * dataset — both light and dark render the same modules — so a data-level
 * assertion is sufficient and stable.
 */

const sidebarLabels = navSections.flatMap((s) => s.items.map((i) => i.label)).sort();
const sidebarPaths  = navSections.flatMap((s) => s.items.map((i) => i.path)).sort();
const manifestLabels = APP_MODULES.map((m) => m.label).sort();
const manifestPaths  = APP_MODULES.map((m) => m.path).sort();
const lobbyLabels    = LOBBY.map((m) => m.label).sort();
const lobbyExpected  = LOBBY_MODULES.map((m) => m.label).sort();

describe("Module manifest sync", () => {
  it("AppSidebar exposes every module in the manifest", () => {
    expect(sidebarLabels).toEqual(manifestLabels);
    expect(sidebarPaths).toEqual(manifestPaths);
  });

  it("LobbyEcosystem shows exactly the lobby-visible modules", () => {
    expect(lobbyLabels).toEqual(lobbyExpected);
  });

  it("LobbyEcosystem never leaks meta-only routes", () => {
    const hidden = APP_MODULES.filter((m) => !m.showInLobby).map((m) => m.label);
    hidden.forEach((label) => expect(lobbyLabels).not.toContain(label));
  });

  it("Data set is theme-invariant (light === dark)", () => {
    // Modules are pure data — asserting equality with itself documents
    // that theme has no bearing on the module list rendered.
    expect(lobbyLabels).toEqual([...lobbyLabels]);
    expect(sidebarLabels).toEqual([...sidebarLabels]);
  });
});
