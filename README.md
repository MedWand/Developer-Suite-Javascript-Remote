# Developer-Suite-Javascript-Remote

Sample browser application demonstrating how to use the mwsdk-javascript-remote package. Current build demonstrates how to render MedWand-compatible ECG data with `@medwand/mwsdk-javascript-remote`.

Install the mwsdk-javascript-remote package with 
npm install @medwand/mwsdk-javascript-remote@3.2.1

## SDK usage versus sample simulation

The application demonstrates two supported ECG workflows:

- Live rendering: create a `MedWandController`, call `Configure`, and pass each
  remotely received `MedWandReading` to `AddEcgData` as it arrives.
- Complete-strip rendering: create and configure a controller, then pass the
  complete whitespace-delimited ECG data string to `RenderEcgStrip`.

The smallest live integration is:

```javascript
const controller = new MedWandRemoteSdk.MedWandController();
controller.Configure("ecg-render-target");

// Call this for each MedWandReading received by your application.
controller.AddEcgData(medWandReading);
```

The following code in `sample-app/app.js` exists only to demonstrate and test
those SDK calls with prerecorded data:

- Fetching and parsing the files under `sample-app/data`
- Splitting a recording into simulated readings of eight ECG samples each
- Delivering those readings on a timer to imitate a 200 Hz live stream
- Creating `MedWandReading`-shaped test objects
- Playback buttons, status text, and the `window.remoteEcg` convenience API

Production applications that already receive `MedWandReading` objects from a
remote source should pass those objects directly to `AddEcgData`; they do not
need to parse samples, create replacement readings, or reproduce the sample's
playback timer.

The package itself is installed in `node_modules`. `server.mjs` exposes its
browser bundle at `/vendor/mwsdk-javascript-remote.js`, and `index.html` loads
that bundle before `app.js`, making `MedWandRemoteSdk` available in the browser.

## Run the sample app

From the repository root:

```powershell
npm start
```

Then open <http://127.0.0.1:4173/>.
