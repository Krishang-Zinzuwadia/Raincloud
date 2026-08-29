(() => {
  "use strict";

  const MESSAGE_SOURCE = "krishang-portfolio-doom";
  const BUNDLE_URL = "./doom-shareware-1.9.jsdos?rev=opl-music-2";
  const retryButton = document.getElementById("retry-doom");
  const errorMessage = document.getElementById("error-message");
  const playerElement = document.getElementById("dos-player");

  let player = null;
  let state = "loading";
  let muted = false;
  let windowActive = true;
  let startupTimeout = 0;
  let runtimeMusicDevice = null;

  function inspectRuntimeConfig(commandInterface) {
    if (typeof commandInterface.fsReadFile === "function") {
      void commandInterface
        .fsReadFile("DEFAULT.CFG")
        .then((contents) => {
          const config = new TextDecoder().decode(contents);
          const match = config.match(/^snd_musicdevice\s+(-?\d+)/m);
          runtimeMusicDevice = match ? Number.parseInt(match[1], 10) : null;
        })
        .catch(() => {
          runtimeMusicDevice = null;
        });
    }
  }

  function report(type, detail = {}) {
    if (window.parent === window) return;

    window.parent.postMessage(
      { source: MESSAGE_SOURCE, type, ...detail },
      window.location.origin
    );
  }

  function setState(nextState, detail = {}) {
    state = nextState;
    document.body.dataset.state = nextState;
    report("state", { state: nextState, ...detail });
  }

  function showError(error) {
    const message =
      error instanceof Error ? error.message : String(error || "Unknown error");
    window.clearTimeout(startupTimeout);
    errorMessage.textContent = message;
    setState("error", { message });
  }

  function applyPreferences() {
    if (!player) return;

    player.setVolume(muted ? 0 : 1);
    player.setPaused(!windowActive);
  }

  function handlePlayerEvent(eventName, eventDetail) {
    if (eventName === "ci-ready") {
      inspectRuntimeConfig(eventDetail);
    }

    if (eventName === "ci-ready") {
      window.clearTimeout(startupTimeout);
      setState(windowActive ? "running" : "paused");
      applyPreferences();

      const canvas = playerElement.querySelector("canvas");
      if (canvas instanceof HTMLCanvasElement) {
        canvas.tabIndex = 0;
        canvas.focus({ preventScroll: true });
      }
    }

    report("runtime-event", { event: eventName });
  }

  function startDoom() {
    if (player || typeof window.Dos !== "function") return;

    setState("starting");

    try {
      player = window.Dos(playerElement, {
        url: BUNDLE_URL,
        pathPrefix: "./js-dos/emulators/",
        backend: "dosbox",
        backendLocked: true,
        workerThread: true,
        autoStart: true,
        autoSave: false,
        kiosk: true,
        imageRendering: "pixelated",
        renderAspect: "4/3",
        mouseCapture: false,
        noCursor: false,
        volume: muted ? 0 : 1,
        onEvent: handlePlayerEvent,
      });
      player.setNoCloud(true);
      player.setTheme("dark");
      player.setScaleControls(false);
      applyPreferences();

      startupTimeout = window.setTimeout(() => {
        if (state === "starting") {
          showError(
            new Error("The original DOS executable took too long to start.")
          );
        }
      }, 45000);
    } catch (error) {
      showError(error);
    }
  }

  async function stopPlayer() {
    const currentPlayer = player;
    player = null;
    if (!currentPlayer) return;

    try {
      await currentPlayer.stop();
    } catch {
      // Reloading the isolated frame remains a complete teardown fallback.
    }
  }

  function handleParentMessage(event) {
    if (
      event.source !== window.parent ||
      event.origin !== window.location.origin ||
      event.data?.source !== MESSAGE_SOURCE
    ) {
      return;
    }

    if (event.data.type === "set-active") {
      windowActive = Boolean(event.data.active);
      if (player) {
        player.setPaused(!windowActive);
        if (state === "running" || state === "paused") {
          setState(windowActive ? "running" : "paused");
        }
      }
      return;
    }

    if (event.data.type === "set-muted") {
      muted = Boolean(event.data.muted);
      player?.setVolume(muted ? 0 : 1);
      return;
    }

    if (event.data.type === "reset") {
      void stopPlayer().finally(() => window.location.reload());
      return;
    }

    if (event.data.type === "focus-game") {
      playerElement.querySelector("canvas")?.focus();
    }
  }

  window.addEventListener("message", handleParentMessage);
  window.addEventListener("beforeunload", () => {
    window.clearTimeout(startupTimeout);
    void stopPlayer();
  });
  retryButton.addEventListener("click", () => window.location.reload());

  window.render_game_to_text = () =>
    JSON.stringify({
      game: "DOOM Shareware v1.9",
      executable: "DOOM.EXE",
      iwad: "DOOM1.WAD",
      episode: "Knee-Deep in the Dead",
      state,
      muted,
      active: windowActive,
      audio: {
        renderer: "AdLib OPL2 music + Sound Blaster 16 SFX",
        configuredDevice: runtimeMusicDevice,
      },
    });

  window.advanceTime = (milliseconds) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, Math.max(0, Math.min(milliseconds, 1000)));
    });

  if (typeof window.Dos === "function") {
    startDoom();
  } else {
    showError(new Error("The local js-dos runtime is unavailable."));
  }
})();
