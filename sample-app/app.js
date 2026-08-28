$(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // DEMO-ONLY SETUP
  // These recordings, timing values, and the playback timer let this sample app
  // imitate ECG readings arriving from a remote MedWand session. Applications
  // receiving real MedWandReading objects do not need this simulation code.
  // ---------------------------------------------------------------------------
  let ecgRecording10Seconds = "";
  let ecgRecording20Seconds = "";
  let ecgRecording30Seconds = "";

  const ECG_SAMPLE_RATE_HZ = 200;
  const ECG_WINDOW_SECONDS = 5;
  const ECG_CANVAS_WIDTH = ECG_SAMPLE_RATE_HZ * ECG_WINDOW_SECONDS;
  const ECG_SAMPLES_PER_READING = 8;
  const PLAYBACK_INTERVAL_MILLIS = ECG_SAMPLES_PER_READING / ECG_SAMPLE_RATE_HZ * 1000;
  let playbackTimerId = null;

  void initializeRemoteEcgDemo().catch((error) => {
    console.error("Unable to initialize the remote ECG demo.", error);
  });

  async function initializeRemoteEcgDemo() {
    // DEMO ONLY: Load prerecorded ECG values used by the simulator and previews.
    [
      ecgRecording10Seconds,
      ecgRecording20Seconds,
      ecgRecording30Seconds
    ] = await Promise.all([
      loadEcgRecording("data/medwand-ecg-10-seconds.txt"),
      loadEcgRecording("data/medwand-ecg-20-seconds.txt"),
      loadEcgRecording("data/medwand-ecg-30-seconds.txt")
    ]);

    // SDK USAGE: Create one controller and configure the element in which the
    // live ECG canvas will be rendered. ResizeEcg is optional.
    const controller = new MedWandRemoteSdk.MedWandController();
    controller.Configure("ecg-render-target");
    controller.ResizeEcg(ECG_CANVAS_WIDTH, 481);

    // DEMO ONLY: Associate the prerecorded files with the sample app controls.
    const recordings = Object.freeze({
      10: ecgRecording10Seconds,
      20: ecgRecording20Seconds,
      30: ecgRecording30Seconds
    });
    renderFullRecordingPreview("ecg-preview-10", recordings[10]);
    renderFullRecordingPreview("ecg-preview-20", recordings[20]);
    renderFullRecordingPreview("ecg-preview-30", recordings[30]);
    const recordingSelect = document.getElementById("ecg-recording-select");
    const drawButton = document.getElementById("draw-ecg-button");
    const status = document.getElementById("ecg-status");

    drawButton.disabled = false;
    status.textContent = "Select a recording";
    drawButton.addEventListener("click", () => {
      playRecording(Number(recordingSelect.value));
    });

    function playRecording(durationSeconds) {
      // DEMO ONLY: Convert a complete prerecorded strip into eight-sample
      // MedWandReading-shaped packets and deliver them at a simulated 200 Hz.
      cancelPlayback();
      controller.ResetEcg();

      const samples = parseSamples(recordings[durationSeconds]);
      let nextSampleIndex = 0;
      drawButton.disabled = true;
      status.textContent = "Drawing the " + durationSeconds + "-second ECG recording…";

      const drawNextPacket = () => {
        const packetIndex = nextSampleIndex;
        const packet = samples.slice(
          nextSampleIndex,
          nextSampleIndex + ECG_SAMPLES_PER_READING
        );
        nextSampleIndex += packet.length;
        // SDK USAGE: In a real application, pass each MedWandReading to the
        // controller as it is received from the remote data source.
        controller.AddEcgData(createEcgReading(packet, packetIndex));

        if (nextSampleIndex >= samples.length) {
          cancelPlayback();
          drawButton.disabled = false;
          status.textContent = durationSeconds + "-second ECG recording complete.";
        }
      };

      drawNextPacket();
      if (nextSampleIndex < samples.length) {
        playbackTimerId = window.setInterval(drawNextPacket, PLAYBACK_INTERVAL_MILLIS);
      }
    }

    function cancelPlayback() {
      if (playbackTimerId == null) return;
      window.clearInterval(playbackTimerId);
      playbackTimerId = null;
    }

    // SAMPLE CONVENIENCE API: This global makes it easy to test the page from
    // the browser console or replace the simulator with a remote data transport.
    // It is not created or required by the SDK. A real incoming MedWandReading
    // can be forwarded with window.remoteEcg.addData(reading).
    window.remoteEcg = Object.freeze({
      recordings,
      addData: (packet) => controller.AddEcgData(packet),
      playRecording,
      reset: () => {
        cancelPlayback();
        controller.ResetEcg();
      },
      stop: () => {
        cancelPlayback();
      }
    });
  }

  function parseSamples(recording) {
    // DEMO ONLY: The test files contain an entire strip as whitespace-delimited
    // samples. A real live integration receives already-formed readings.
    return recording
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(Number.isFinite);
  }

  function renderFullRecordingPreview(canvasId, recording) {
    // SDK USAGE: RenderEcgStrip accepts the complete whitespace-delimited ECG
    // string when a finished recording should be drawn all at once.
    const previewController = new MedWandRemoteSdk.MedWandController();
    previewController.Configure(canvasId);
    previewController.RenderEcgStrip(recording);
  }

  function createEcgReading(samples, index = 0) {
    // DEMO ONLY: Build the MedWandReading shape normally supplied by the remote
    // application or transport. The SDK does not require callers to recreate a
    // reading when they already receive one in this shape.
    return {
      timeStamp: new Date(),
      status: "success",
      index,
      count: samples.length,
      sensorType: "Ecg",
      ecgData: samples.join(" ")
    };
  }

  async function loadEcgRecording(filePath) {
    // DEMO ONLY: Fetch prerecorded data bundled with this sample application.
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error("Unable to load " + filePath + ": HTTP " + response.status);
    }

    return response.text();
  }
});
