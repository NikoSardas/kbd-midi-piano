const idArray =
  "z s x d c v g b h n j m comma l dot semicolon slash q two w three e four r t six y seven u i nine o zero p minus leftBrk oct1 oct2 oct3 oct4 click sustain save reset velDown velUp rndVel chord audioLoader".split(
    " "
  );

const keyArray =
  "90 83 88 68 67 86 71 66 72 78 74 77 188 76 190 186 191 81 50 87 51 69 52 82 84 54 89 55 85 73 57 79 48 80 189 219"
    .split(" ")
    .map(Number);

const midiArray =
  "0x18 0x19 0x1A 0x1B 0x1C 0x1D 0x1E 0x1F 0x20 0x21 0x22 0x23 0x24 0x25 0x26 0x27 0x28 0x29 0x2A 0x2B 0x2C 0x2D 0x2E 0x2F 0x30 0x31 0x32 0x33 0x34 0x35 0x36 0x37 0x38 0x39 0x3A 0x3B 0x3C 0x3D 0x3E 0x3F 0x40 0x41 0x42 0x43 0x44 0x45 0x46 0x47 0x48 0x49 0x4A 0x4B 0x4C 0x4D 0x4E 0x4F 0x50 0x51 0x52 0x53 0x54 0x55 0x56 0x57 0x58 0x59 0x5A 0x5B 0x5C 0x5D 0x5E 0x5F"
    .split(" ")
    .map((hex) => parseInt(hex, 16));

const noteArray =
  "C1 Db1 D1 Eb1 E1 F1 Gb1 G1 Ab1 A1 Bb1 B1 C2 Db2 D2 Eb2 E2 F2 Gb2 G2 Ab2 A2 Bb2 B2 C3 Db3 D3 Eb3 E3 F3 Gb3 G3 Ab3 A3 Bb3 B3 C4 Db4 D4 Eb4 E4 F4 Gb4 G4 Ab4 A4 Bb4 B4 C5 Db5 D5 Eb5 E5 F5 Gb5 G5 Ab5 A5 Bb5 B5 C6 Db6 D6 Eb6 E6 F6 Gb6 G6 Ab6 A6 Bb6 B6".split(
    " "
  );

let sessionArray = [];
let monoArray = [];
let audioArray = [];
let volumeArray = [];

let notePressed = false;
let ctx; // AudioContext
let previousTime;
let currentOctave = 2;

let rndState = false;
let sustainState = false;
let clickState = false;

let mouseState = 0;

let middleC = document.getElementById("comma");

const eventHandler = {
  sendEvent(eventObj) {
    const idIndex = idArray.indexOf(eventObj.id);

    if (idIndex >= 0 && idIndex < 36) {
      notesHandler.runNote(idIndex, eventObj);
      return;
    }

    // UI control buttons (click, sustain, save, etc.)
    if (
      ["mouseenter", "mousedown", "keydown", "touchstart"].includes(
        eventObj.type
      )
    ) {
      switch (idIndex) {
        case 36:
        case 37:
        case 38:
        case 39:
          pitchHandler.changeOct(idIndex - 36);
          break;
        case 40:
          clickHandler.toggle();
          break;
        case 41:
          sustainHandler.toggle();
          break;
        case 42:
          midiHandler.exportMidi();
          break;
        case 43:
          location.reload();
          break;
        case 44:
          velocityHandler.velocityChangeHandler({
            type: eventObj.type,
            val: -10,
          });
          break;
        case 45:
          velocityHandler.velocityChangeHandler({
            type: eventObj.type,
            val: 10,
          });
          break;
        case 46:
          velocityHandler.toggleRnd();
          break;
        case 47:
          audioLoader.createLoad();
          break;
        case 48:
          helpTutorial();
          break;
      }
    }
  },

  catchEvent(event) {
    const eventObj = { type: event.type };

    if (
      ["mousedown", "mouseover", "mouseup", "touchstart", "touchend"].includes(
        event.type
      )
    ) {
      eventObj.id = event.target.id;
    } else if (["keyup", "keydown"].includes(event.type)) {
      const index = keyArray.indexOf(event.keyCode);
      eventObj.id = idArray[index];
    }

    if (event.type === "mouseover" && mouseState) {
      eventObj.type = "mousedown";
      eventObj.id = event.target.id;
      if (idArray.indexOf(eventObj.id) < 36) {
        eventHandler.sendEvent(eventObj);
      }
    } else if (event.type === "mouseout" && mouseState) {
      eventObj.type = "mouseup";
      eventObj.id = event.target.id;
      if (idArray.indexOf(eventObj.id) < 36) {
        eventHandler.sendEvent(eventObj);
      }
    } else {
      eventHandler.sendEvent(eventObj);
    }
  },

  setListeners() {
    const events = [
      "mouseup",
      "mousedown",
      "keyup",
      "keydown",
      "touchstart",
      "touchend",
      "mouseout",
      "mouseover",
    ];

    const body = document.querySelector("body");

    for (const evt of events) {
      body.addEventListener(evt, eventHandler.catchEvent);
    }

    // Arrow key and modifier bindings
    Mousetrap.bind("right", () => {
      if (currentOctave < 3) pitchHandler.changeOct(currentOctave + 1);
    });

    Mousetrap.bind("left", () => {
      if (currentOctave > 0) pitchHandler.changeOct(currentOctave - 1);
    });

    Mousetrap.bind("up", () => {
      velocityHandler.velocityChangeHandler({ type: "mousedown", val: 10 });
    });

    Mousetrap.bind("down", () => {
      velocityHandler.velocityChangeHandler({ type: "mousedown", val: -10 });
    });

    Mousetrap.bind("shift", () => {
      sustainHandler.toggle();
    });
  },
};

const notesHandler = {
  sendNote(noteObj) {
    noteObj.velocity = velocityHandler.setRandomVel(
      noteObj.velocity,
      noteObj.delta
    );

    // Default duration for key-off events
    if (noteObj.velocity === 0 && noteObj.delta === 0) {
      noteObj.delta = 8;
    }

    sessionArray.push(noteObj);
  },

  animateNote(id) {
    const noteEl = document.getElementById(id);
    if (!noteEl) return;

    noteEl.classList.toggle("active");
  },

  playAudio(midiNote, velocity, index) {
    const noteName = noteArray[midiArray.indexOf(midiNote)];
    velocityHandler.setVol(noteName);

    if (Number(velocity) !== 0) {
      monoArray[index] = new Howl({
        src: [`audio/${noteName}.mp3`],
        volume: volumeArray[noteName],
      });
      monoArray[index].play();
    } else if (!sustainState) {
      monoArray[index]?.fade(volumeArray[noteName], 0, 200);
    }
  },

  noteConstructor(event) {
    if (sessionArray.length === 0) {
      ctx = new AudioContext();
      previousTime = ctx.currentTime;

      // Unlock UI buttons
      document.getElementById("save").style.opacity = "1";
      document.getElementById("reset").disabled = false;
      document.getElementById("saveFa").style.color = "";
    }

    const pitch = pitchHandler.getPitch(event.id);
    const velocity = velocityHandler.getVel(event.type);
    const delta = Math.floor(
      (ctx.currentTime - (previousTime || 0)) / 0.00390625
    );
    previousTime = ctx.currentTime;

    return { pitch, velocity, delta, type: 9, channel: 0 };
  },

  runNote(index, eventObj) {
    const noteObj = notesHandler.noteConstructor(eventObj);

    if (noteObj.velocity !== 0) {
      if (!audioArray[index]) {
        notePressed = audioArray[index] = true;
        notesHandler.playAudio(noteObj.pitch, noteObj.velocity, index);
        notesHandler.animateNote(eventObj.id);
        notesHandler.sendNote(noteObj);
      }
    } else {
      notePressed = audioArray[index] = false;
      notesHandler.playAudio(noteObj.pitch, 0, index);
      notesHandler.animateNote(eventObj.id);
      notesHandler.sendNote(noteObj);
      document.getElementById(eventObj.id)?.classList.remove("active");
    }
  },
};

const pitchHandler = {
  getPitch(id) {
    const index = idArray.indexOf(id);
    if (index === -1) return null;

    const midiIndex = index + currentOctave * 12;
    return midiArray[midiIndex];
  },

  changeOct(oct) {
    const octaveButtons = document.getElementById("octaveDiv").children;

    if (middleC) middleC.classList.remove("middleC");

    const middleCMap = {
      0: null,
      1: "t",
      2: "comma",
      3: "z",
    };

    middleC = middleCMap[oct] ? document.getElementById(middleCMap[oct]) : null;
    if (middleC) middleC.classList.add("middleC");

    if (!notePressed) {
      Array.from(octaveButtons).forEach((btn, i) => {
        btn.className = i === oct ? "selected oct" : "oct";
      });
      currentOctave = oct;
    }
  },

  resolveDOMKey(index) {
    // Given a MIDI index (0–127), return corresponding key ID
    if (index < 36) return idArray[index];
    if (index < 48) return idArray[index - 12];
    if (index < 60) return idArray[index - 24];
    if (index < 72) return idArray[index - 36];
    return null;
  },
};

const velocityHandler = {
  getCurrentVelocity() {
    const val = parseInt(
      document.getElementById("velocityValue")?.innerText || "100",
      10
    );
    return Math.max(0, Math.min(127, val)); // Clamp between 0–127
  },

  setVol(noteName) {
    const velocity = velocityHandler.getCurrentVelocity();
    const volume =
      velocity <= 20
        ? 0.2
        : velocity <= 40
          ? 0.4
          : velocity <= 60
            ? 0.6
            : velocity <= 80
              ? 0.7
              : velocity <= 100
                ? 0.8
                : velocity <= 120
                  ? 0.9
                  : 1.0;

    volumeArray[noteName] = volume;
  },

  setRandomVel(velocity) {
    if (!rndState || velocity === 0) return velocity;

    const randomMod = velocityHandler.getRandomModifier();
    const randomized = velocity + randomMod;

    return Math.max(1, Math.min(127, randomized)); // Clamp to valid MIDI velocity
  },

  velocityChangeHandler({ val }) {
    const current = velocityHandler.getCurrentVelocity();

    let step = current === 127 || current === 120 ? 7 : 10;
    const newVal = val < 0 ? current - step : current + step;

    velocityHandler.changeVel(newVal);
  },

  changeVel(newVal) {
    const display = document.getElementById("velocityValue");
    if (!display) return;

    const clamped = Math.max(1, Math.min(127, newVal));
    display.innerText = clamped;
    localStorage.velocity = clamped;
  },

  toggleRnd() {
    const btn = document.getElementById("rndVel");
    rndState = !rndState;
    btn.classList.toggle("on", rndState);
  },

  getVel(eventType) {
    return ["mouseenter", "mousedown", "keydown", "touchstart"].includes(
      eventType
    )
      ? velocityHandler.getCurrentVelocity()
      : 0;
  },

  getRandomModifier() {
    const randomAmount = Math.floor(Math.random() * 10); // 0–9
    return Math.random() > 0.5 ? randomAmount : -randomAmount;
  },
};

const clickHandler = {
  init() {
    Fifer.loaded(() => {
      Fifer.registerAudio("click", "/audio/click.mp3", false);
    });
  },

  play() {
    Fifer.play("click", true); // loop
  },

  stop() {
    Fifer.stop("click");
  },

  toggle() {
    const clickBtn = document.getElementById("click");
    clickState = !clickState;

    if (clickState) {
      clickBtn.classList.add("on");
      clickHandler.play();
    } else {
      clickBtn.classList.remove("on");
      clickHandler.stop();
    }
  },
};

const sustainHandler = {
  toggle() {
    const btn = document.getElementById("sustain");
    sustainState = !sustainState;

    btn.classList.toggle("on", sustainState);
    localStorage.sustain = sustainState;
  },
};

const audioLoader = {
  init() {
    const fileInput = document.getElementById("KBD_Piano_audioFile");
    const audioPlayer = document.getElementById("KBD_Piano_audioControls");

    if (!fileInput || !audioPlayer) return;

    fileInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        audioPlayer.src = e.target.result;
        audioPlayer.style.display = "flex";
      };
      reader.readAsDataURL(file);
    });
  },

  createLoad() {
    document.getElementById("KBD_Piano_audioFile")?.click();
  },
};

const midiHandler = {
  init() {
    if (!navigator.requestMIDIAccess) return;

    navigator
      .requestMIDIAccess()
      .then(midiHandler.onMIDISuccess, midiHandler.onMIDIFailure);
  },

  onMIDISuccess(access) {
    const selector = document.getElementById("midiDevices");
    const midiDiv = document.getElementById("midiDiv");
    const inputs = Array.from(access.inputs.values());

    // Rebuild dropdown
    selector.innerHTML = "";
    inputs.forEach((input, i) => {
      const option = document.createElement("option");
      option.value = input.id;
      option.text = input.name;
      selector.appendChild(option);

      if (input.id === localStorage.midiPort) {
        selector.selectedIndex = i;
        localStorage.midiPortName = input.name;
        input.onmidimessage = midiHandler.handleMIDIMessage;
      }
    });

    midiDiv.style.display = inputs.length > 0 ? "flex" : "none";

    // Update selected port
    selector.addEventListener("change", () => {
      const selected = selector.selectedOptions[0];
      const device = inputs.find((i) => i.id === selected.value);
      localStorage.midiPort = selected.value;
      localStorage.midiPortName = selected.text;
      if (device) device.onmidimessage = midiHandler.handleMIDIMessage;
    });

    access.onstatechange = () => midiHandler.init(); // refresh on connect/disconnect
  },

  onMIDIFailure(err) {
    console.error("MIDI init failed:", err);
  },

  handleMIDIMessage(msg) {
    const [status, note, velocity] = msg.data;
    const isNote =
      (status === 144 || status === 128) && note >= 24 && note <= 95;

    if (!isNote) return;

    const pitchHex = "0x" + note.toString(16).toUpperCase();
    const index = midiArray.indexOf(parseInt(pitchHex, 16));
    const noteName = noteArray[index];

    if (index === -1) return;

    // Start audio context if needed
    if (!ctx) ctx = new AudioContext();

    const noteObj = {
      pitch: pitchHex,
      velocity: status === 144 ? velocity : 0,
      delta: Math.floor((ctx.currentTime - (previousTime || 0)) / 0.00390625),
      channel: 0,
      type: 9,
    };

    previousTime = ctx.currentTime;

    if (sessionArray.length === 0) {
      document.getElementById("save").style.opacity = "1";
      document.getElementById("reset").disabled = false;
      document.getElementById("saveFa").style.color = "";
    }

    // Play audio
    if (noteObj.velocity !== 0) {
      audioArray[index] = new Howl({
        src: [`audio/${noteName}.mp3`],
        volume: noteObj.velocity / 100,
      });
      audioArray[index].play();
    } else if (!sustainState) {
      audioArray[index]?.fade(audioArray[index]._volume, 0, 200);
    }

    // Highlight key visually
    const id = pitchHandler.resolveDOMKey(index);
    if (id) notesHandler.animateNote(id);

    sessionArray.push(noteObj);
  },

  exportMidi() {
    if (sessionArray.length < 2) return;

    const events = [];
    sessionArray.forEach((note) => {
      Array.prototype.push.apply(events, MidiEvent.createNote(note));
    });

    const track = new MidiTrack({ events });
    MidiWriter({ tracks: [track] }).save();
  },
};

const recordHandler = {
  micRecorder: null,
  streamRecorder: null,

  init() {
    this.setupMicRecorder();
    this.setupStreamRecorder();
  },

  setupMicRecorder() {
    const micBtn = document.getElementById("rec");
    if (!micBtn) return;

    micBtn.addEventListener("click", async () => {
      const isRecording = micBtn.classList.contains("on");

      if (isRecording) {
        micBtn.classList.remove("on");
        recordHandler.micRecorder?.finishRecording();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);

        const recorder = new WebAudioRecorder(source, {
          workerDir: "../js/", // make sure this path is valid
        });

        recorder.setEncoding("wav");
        recorder.onComplete = recordHandler.saveBlob;
        recorder.startRecording();

        recordHandler.micRecorder = recorder;
        micBtn.classList.add("on");
      } catch (err) {
        console.error("Mic recording failed:", err);
      }
    });
  },

  setupStreamRecorder() {
    const streamBtn = document.getElementById("recStreamBtn");
    if (!streamBtn) return;

    streamBtn.addEventListener("click", () => {
      const isRecording = streamBtn.classList.contains("on");

      if (isRecording) {
        streamBtn.classList.remove("on");
        recordHandler.streamRecorder?.finishRecording();
        return;
      }

      const audioCtx = new AudioContext();
      const dest = Howler.ctx.createMediaStreamDestination();
      Howler.masterGain.connect(dest);

      const source = audioCtx.createMediaStreamSource(dest.stream);

      const recorder = new WebAudioRecorder(source, {
        workerDir: "../js/",
      });

      recorder.setEncoding("wav");
      recorder.onComplete = recordHandler.saveBlob;
      recorder.startRecording();

      recordHandler.streamRecorder = recorder;
      streamBtn.classList.add("on");
    });
  },

  saveBlob(recorder, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KBD2MIDI_PIANO_${new Date().toISOString()}.wav`;
    a.click();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const loadingBar = document.getElementById("loadingBar");
  const loadingCont = document.getElementById("loadingCont");
  const loadingDiv = document.getElementById("loading");
  const pianoWrapper = document.getElementById("pianoWrapper");

  let counter = 0;

  // Mouse state handling
  document.body.onmousedown = () => {
    mouseState = 1;
  };
  document.body.onmouseup = () => {
    mouseState = 0;
  };
  document.querySelector("html").addEventListener("mouseleave", () => {
    mouseState = 0;
  });

  // White key z-index (prevent overlap flicker)
  document.querySelectorAll(".white").forEach((el, i, arr) => {
    el.style.zIndex = arr.length - i;
  });

  // Save screen size + selected octave
  window.onbeforeunload = () => {
    localStorage.width = window.outerWidth;
    localStorage.height = window.outerHeight;
    localStorage.selectedOct = currentOctave;
  };

  // Init app state
  const initApp = () => {
    document.getElementById("version").innerText =
      chrome.runtime.getManifest().version;
    pitchHandler.changeOct(Number(localStorage.selectedOct || 2));
    if (localStorage.sustain === "true") sustainHandler.toggle();
    if (localStorage.velocity) {
      document.getElementById("velocityValue").innerText =
        localStorage.velocity;
    }

    midiHandler.init();
    audioLoader.init();
    clickHandler.init();
    recordHandler.init();
    eventHandler.setListeners();
  };

  const preloadAudio = () => {
    noteArray.forEach((note) => {
      new Howl({
        src: [`audio/${note}.mp3`],
        html5: false,
        volume: 0,
        onload() {
          this.play(); // prime it
          counter++;
          loadingDiv.innerText = `Loading ${counter}/72`;
          loadingBar.style.backgroundSize = `${Math.ceil(
            (100 * counter) / noteArray.length
          )}% 100%`;

          if (counter === noteArray.length) {
            loadingCont.style.display = "none";
            pianoWrapper.style.display = "flex";
          }
        },
      });
    });
  };

  // Run it all
  initApp();
  preloadAudio();
});
