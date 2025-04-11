/////////////////////////////////////
///https://github.com/sergi/jsmidi///
/////////////////////////////////////


var AP = Array.prototype;
var DEFAULT_CHANNEL = 0;
var HDR_CHUNKID = "MThd";
var HDR_CHUNK_SIZE = "\x00\x00\x00\x06"; // Header size for SMF
var HDR_TYPE0 = "\x00\x00"; // Midi Type 0 id
var HDR_SPEED = "\x00\x80"; //
var EVT_NOTE_OFF = 0x8;
var EVT_NOTE_ON = 0x9;
var META_TEMPO = 0x51;

function codes2Str(byteArray) {
    return String.fromCharCode.apply(null, byteArray);
}
function str2Bytes(str, finalBytes) {
    if (finalBytes) {
        while ((str.length / 2) < finalBytes) {
            str = "0" + str;
        }
    }

    var bytes = [];
    for (var i = str.length - 1; i >= 0; i = i - 2) {
        var chars = i === 0 ? str[i] : str[i - 1] + str[i];
        bytes.unshift(parseInt(chars, 16));
    }

    return bytes;
}
var translateTickTime = function (ticks) {
    var buffer = ticks & 0x7F;
    while (ticks = ticks >> 7) {
        buffer <<= 8;
        buffer |= ((ticks & 0x7F) | 0x80);
    }
    var bList = [];
    while (true) {
        bList.push(buffer & 0xff);
        if (buffer & 0x80) {
            buffer >>= 8;
        }
        else {
            break;
        }
    }
    return bList;
};
var MidiWriter = function (config) {
    var tracks = config.tracks;
    var tracksLength = tracks.length.toString(16);
    var hexMidi = HDR_CHUNKID + HDR_CHUNK_SIZE + HDR_TYPE0;
    hexMidi += codes2Str(str2Bytes(tracksLength, 2));
    hexMidi += HDR_SPEED;
    tracks.forEach(function (trk) {
        hexMidi += codes2Str(trk.toBytes());
    });
    return {
        save: function () {

            var d = new Date();
            var downloadLink = document.createElement("a");
            downloadLink.href = "data:audio/midi;base64," + btoa(hexMidi);
            downloadLink.download = "KBD2MIDI_PIANO_" + d.toLocaleDateString() + ".mid";

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };
};
var MidiEvent = function (params) {
    this.setTime(params.time);
    this.setType(params.type);
    this.setChannel(params.channel);
    this.setPitch(params.pitch);
    this.setVelocity(params.velocity);
};
MidiEvent.createNote = function (note) {
    var events = [];
    events.push(MidiEvent.noteOn(note));
    return events;
};
MidiEvent.noteOn = function (note) {
    return new MidiEvent({
        time: note.delta,
        type: EVT_NOTE_ON,
        channel: DEFAULT_CHANNEL,
        pitch: note.pitch,
        velocity: note.velocity
    });
};
MidiEvent.noteOff = function (note) {
    return new MidiEvent({
        time: note.delta,
        type: EVT_NOTE_OFF,
        channel: DEFAULT_CHANNEL,
        pitch: note.pitch,
        velocity: 0
    });
};
MidiEvent.prototype = {
    type: 0,
    channel: 0,
    time: 0,
    setTime: function (ticks) {
        // The 0x00 byte is always the last one. This is how Midi
        // interpreters know that the time measure specification ends and the
        // rest of the event signature starts.
        this.time = translateTickTime(ticks);
    },
    setType: function (type) {
        this.type = type;
    },
    setChannel: function (channel) {
        this.channel = channel;
    },
    setPitch: function (pitch) {
        this.pitch = pitch;
    },
    setVelocity: function (velocity) {
        this.velocity = velocity;
    },
    toBytes: function () {
        var byteArray = [];

        var typeChannelByte =
            parseInt(this.type.toString(16) + this.channel.toString(16), 16);

        byteArray.push.apply(byteArray, this.time);
        byteArray.push(typeChannelByte);
        byteArray.push(this.pitch);

        // Some events don't have a second parameter
        if (this.velocity !== undefined && this.velocity !== null) {
            byteArray.push(this.velocity);
        }
        return byteArray;
    }
};

var MetaEvent = function (params) {
    if (params) {
        this.setType(params.type);
        this.setData(params.data);
    }
};
MetaEvent.prototype = {
    setType: function (t) {
        this.type = t;
    },
    setData: function (d) {
        this.data = d;
    },
    toBytes: function () {
        if (!this.type || !this.data) {
            throw new Error("Type or data for meta-event not specified.");
        }

        var byteArray = [0xff, this.type];
        if (isArray(this.data)) {
            AP.push.apply(byteArray, this.data);
        }
        console.log(byteArray);
        return byteArray;
    }
};

var MidiTrack = function (cfg) {
    this.events = [];
    for (var p in cfg) {
        if (cfg.hasOwnProperty(p)) {
            this["set" + p.charAt(0).toUpperCase() + p.substring(1)](cfg[p]);
        }
    }
};

MidiTrack.TRACK_START = [0x4d, 0x54, 0x72, 0x6b];
MidiTrack.TRACK_END = [0x0, 0xFF, 0x2F, 0x0];

MidiTrack.prototype = {
    addEvent: function (event) {
        this.events.push(event);
        return this;
    },
    setEvents: function (events) {
        AP.push.apply(this.events, events);
        return this;
    },
    setText: function (type, text) {
        // If the param text is not specified, it is assumed that a generic
        // text is wanted and that the type parameter is the actual text to be
        // used.
        if (!text) {
            type = META_TEMPO;
            text = 24;
        }
        return this.addEvent(new MetaEvent({ type: type, data: text }));
    },
    // The following are setters for different kinds of text in MIDI, they all
    // use the |setText| method as a proxy.

    setTempo: function (tempo) {
        this.addEvent(new MetaEvent({ type: META_TEMPO, data: tempo }));
    },
    toBytes: function () {
        var trackLength = 0;
        var eventBytes = [];
        var startBytes = MidiTrack.TRACK_START;
        var endBytes = MidiTrack.TRACK_END;
        var addEventBytes = function (event) {
            var bytes = event.toBytes();
            trackLength += bytes.length;
            AP.push.apply(eventBytes, bytes);
        };

        this.events.forEach(addEventBytes);

        trackLength += endBytes.length;

        var lengthBytes = str2Bytes(trackLength.toString(16), 4);

        console.log("\nstartBytes: " + startBytes);
        console.log("\nlengthBytes: " + lengthBytes);
        console.log("\neventBytes: " + eventBytes);
        console.log("\nendBytes: " + endBytes);
        return startBytes.concat(lengthBytes, eventBytes, endBytes);
    }
};

window.MidiWriter = MidiWriter;
window.MidiEvent = MidiEvent;
window.MetaEvent = MetaEvent;
window.MidiTrack = MidiTrack;
