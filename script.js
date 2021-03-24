let baseNotes = {
    'C': {
        major:false,
        minor:false,
        playing:false
    }, 
    'D': {
        major:false,
        minor:false,
        playing:false
    },
    'E': {
        major:false,
        minor:false,
        playing:false
    },
    'F': {
        major:false,
        minor:false,
        playing:false
    },
    'G': {
        major:false,
        minor:false,
        playing:false
    },
    'A': {
        major:false,
        minor:false,
        playing:false
    },
    'B': {
        major:false,
        minor:false,
        playing:false
    }
}
let map;
let initalNotes = [];
let isPlaying = 0;
let nowPlaying = [];
let melodySequence = [];
let melodyDuration = 0;
let pianoPart;
let ragas = {
    'Yaman': {
        name:'Yaman',
        notes:['C','D','E','F','G','A','B'],
        up:['B-','D','E','F#','A','B','C+'],
        down:['C+','B','A','G','F#','E','D','C'],
        pattern:['B,A','G,F','G,E','F,A'],
        start:15,
        end:17,
        description:"You have probaby just woken up from your afternoon sleep in",
        activity:"sipping on your afternoon tea"
    }
}
let currentRaga = 'Yaman';
let octave = 4;
let time = 0.7;
let marker;
interval = 0.7;
//const synth = new Tone.Synth().toMaster();
var synth = new Tone.Synth().toMaster();


//BLE Setup 
const serviceUuid = "19b10010-e8f2-537e-4f6c-d104768a1214";
let myBLE;
let isConnected = false;
let isclicked = false;
let noteBLECha;
let octaveBLECha;
let startBLECha = 0;
let playingBLECha;
let hasStarted
let locationPicked = false
//BLE Setup
window.initMap =  function() {
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 1,
      center: { lat: 43, lng: -74 },
      mapId: "3dbdab5c3a4e0b1a",
    });
    marker = new google.maps.Marker({
        position: { lat: 43, lng: -74 },
        map,
        title: "Hello World!"
    });
    marker.setMap(map);
}
function setup() {
    // Create a p5ble class
    console.log('Setup')
    myBLE = new p5ble();
    var button = document.getElementById("BLEbutton");
    button.addEventListener("click", connectAndStartNotify);
}
function resetconnection() {
    console.log('Reset')
    if(!isclicked) {
        myBLE.connect(serviceUuid, gotCharacteristics);
        console.log('connected..')
        isclicked = true;
    } else {
        myBLE.disconnect();
        isConnected = myBLE.isConnected();
        console.log('disconnected..')
        isclicked = false;
    }
}
function connectAndStartNotify() {
    myBLE.connect(serviceUuid, gotCharacteristics);
    console.log('AM I CONNECTING?')
}
function onDisconnected() {
    console.log('Device got disconnected.');
    isConnected = false;
    isclicked = false;
}

//Handling BLE Characteristics
function gotCharacteristics(error, characteristics) {
    if (error) console.log('error: ', error);
    console.log('characteristics: ', characteristics);
    // Check if myBLE is connected
    isConnected = myBLE.isConnected();
    // Add a event handler when the device is disconnected
    updateDOM('BLE_CONNECTED');
    noteBLECha = characteristics[3];
    playingBLECha = characteristics[2];
    octaveBLECha = characteristics[0];
    startBLECha = characteristics[1];
    myBLE.startNotifications(noteBLECha, handleNoteUpdate);
    myBLE.startNotifications(octaveBLECha, handleOctaveUpdate);
    myBLE.startNotifications(startBLECha, handleStateChange);
    myBLE.onDisconnected(onDisconnected)
}
function handleNoteUpdate(data) {
    console.log('NOTE DATA',data);

    //how to identify switch?
    let receiveData = String.fromCharCode(data);
    console.log('receiveData',receiveData);
    if(receiveData && baseNotes[receiveData]) {
        //turn off the note
        //if(baseNotes[receiveData].playing && receiveData.length == 1) {
        if(baseNotes[receiveData].playing) {
            baseNotes[receiveData].playing = false;
            baseNotes[receiveData].major = false;
            baseNotes[receiveData].minor = false;
            let notechar;
            if(baseNotes[receiveData].major) {
                notechar = baseNotes[receiveData[0]];
            }
            if(baseNotes[receiveData].minor) {
                notechar = baseNotes[receiveData[0]] + '#';
            }
            if(initalNotes.indexOf(receiveData) > -1) {
                let removed;
                initalNotes.splice(initalNotes.indexOf(receiveData),1);
                updateDOM('UPDATE_NOTES',initalNotes);
                for(let i=0;i<nowPlaying.length;i++) {
                    if(nowPlaying[i].note.indexOf(receiveData) > -1) {
                        pianoPart.remove(nowPlaying[i].time)
                    }
                    removed = i;
                }
                console.log('REMOVING SHIZ');
                nowPlaying.splice(removed,1);
                melodyDuration = melodyDuration - interval;
            }
        } 
        //switch note
        else if(!baseNotes[receiveData].playing) {
            baseNotes[receiveData].playing = true;
            baseNotes[receiveData].major = true;
            if(!isPlaying) {
                synth.triggerAttackRelease(receiveData+octave.toString(), "4n", Tone.now());
            } else {
                //console.log('ADDING SHIZ')
                nowPlaying.push({time : melodyDuration+interval,note:getNote(receiveData),dur:'1n'});
                pianoPart.add(melodyDuration+interval,{time : melodyDuration+interval,note:getNote(receiveData),dur:'1n'});
                melodyDuration = melodyDuration + interval;
                console.log('ADDING SHIZ',nowPlaying)
            }
            initalNotes.push(receiveData);
            updateDOM('UPDATE_NOTES',initalNotes);
        } 
        /*else if(baseNotes[receiveData].playing && receiveData.length > 1) {
            baseNotes[receiveData].playing = true;
            let notechar;
            if(baseNotes[receiveData].major) {
                baseNotes[receiveData].major = false;
                baseNotes[receiveData].minor = true;
                notechar = baseNotes[receiveData] + '#';
            }
            if(baseNotes[receiveData].minor) {
                baseNotes[receiveData].major = true;
                baseNotes[receiveData].minor = false;
                notechar = baseNotes[receiveData];
            }
            if(initalNotes.indexOf(notechar) > -1) {
                initalNotes.splice(initalNotes.indexOf(notechar),1);
            }
            initalNotes.push(notechar);
            console.log('initalNotes',initalNotes);
        }*/
        console.log('initalNotes',initalNotes);
        console.log('baseNotes',baseNotes);
        playMelody()
    } else {
        console.log('invalid Value');
    }
}
function handleOctaveUpdate(data) {
    //console.log('OCTAVE DATA',data);
}
function handleStateChange(data) {
    console.log('STATE CHANGE',data)
    //isPlaying = !isPlaying;
    if(!isPlaying) {
        hasStarted = true;
        playMelody(initalNotes);
    }

}

//music based functions
let play = (playString) => {
    let now = 0;
    let lastTime = now;
    let noteArray = [];
    console.log('playString',playString);
    for(let i=0;i<playString.length;i++) {
        let notes = playString[i].split(',');
        let scheduledTime = now + interval*(i);
        lastTime = scheduledTime;
        for(let j=0;j<notes.length;j++) {
            let newNote = getNote(notes[j]);
            if(newNote.indexOf('K') > -1) {
                newNote = null;
            }
            console.log('newnote',newNote);
            noteArray.push({time : scheduledTime+j*(interval/notes.length),note:newNote,dur:(notes.length).toString() + 'n'})
            //playingMeta.notes[notes[j]] = {time : scheduledTime+j*(interval/notes.length),note:newNote,dur:(notes.length).toString() + 'n'};
            //synth.triggerAttackRelease(newNote,(notes.length).toString() + 'n',scheduledTime+j*(interval/notes.length))
        }
    }
    nowPlaying = noteArray;
    melodyDuration = lastTime;
    /*return {
        noteArray : noteArray,
        duration : (lastTime - now)
    }*/
}
let getNote = (note) => {
    let higher = note.split('+');
    let lower = note.split('-');
    if(higher.length > 1) {
        return higher[0].toString() + (octave+1).toString()
    } else {
        if(lower.length > 1) {
            return lower[0].toString() + (octave-1).toString()
        } else {
            return note.toString() + octave.toString();
        }
    }
}
let playMelody = () => {
    //melody.stop();
    let ragaName = Object.keys(ragas);
    let stateObj = {};
    let ragaMatches = {
        perfect:[],
        close:[]
    }
    console.log('ragaName',ragaName);
    console.log('INITIAL NOTES',initalNotes);
    for(let i=0;i<ragaName.length;i++) {
        let current = ragas[ragaName];
        let matchingNotes = 0;
        console.log('ragaName',current.notes);
        for(let j=0;j< initalNotes.length;j++) {
            console.log('CHECK',current.notes[i],initalNotes);
            if(current.notes[i].indexOf(initalNotes[i]) > -1) {
                matchingNotes ++;
            }
        }
        console.log('matchingNotes',matchingNotes)
        if(matchingNotes == current.notes.length && matchingNotes == initalNotes.length) {
            console.log('FOUND RAGA');
            ragaMatches.perfect.push(current);
            //play the found raga
        } 
        else if(matchingNotes == current.notes.length && (matchingNotes < initalNotes.length)) {
            // check difference and suggest to remove
            console.log('TBD')
        }
        else if (matchingNotes != current.notes.length) {
            let diff = current.notes.length - matchingNotes;
            console.log('CHECKING CLOSEST',diff,current.notes.length,initalNotes)
            if(diff > 0 && [1,2].indexOf(diff) > -1 && current.notes.length > initalNotes.length) {
                //ask to add a few notes
                console.log('QUALII')
                let absentNotes = current.notes.filter(x => (initalNotes.indexOf(x) == -1));
                var newRaga = JSON.parse(JSON.stringify(current));
                newRaga.absentNotes = absentNotes
                ragaMatches.close.push(newRaga);
            } else {
                // just play whatever 
                console.log('playing whatever')
            }
        }
    }
    if(ragaMatches.perfect.length) {
        let pickedIndex = Math.floor(Math.random()*ragaMatches.perfect.length);
        //play this chosen raga
        stateObj.raga = ragaMatches.perfect[pickedIndex];
        updateDOM('RAGA_FOUND',stateObj.raga);
        findLocation(stateObj.raga);
    } else {
        if(ragaMatches.close.length) {
            let pickedIndex = Math.floor(Math.random()*ragaMatches.close.length);
            // suggest closest raga
            stateObj.closestRaga = ragaMatches.close[pickedIndex];
            updateDOM('RAGA_FORMATION',stateObj.closestRaga);
        } 
        stateObj.melody = {};
        stateObj.melody.up = (!isPlaying && hasStarted) ? initalNotes.sort(() => Math.random() - 0.5) : initalNotes;
        stateObj.melody.down = (!isPlaying && hasStarted) ? initalNotes.sort(() => Math.random() - 0.5) : initalNotes;
        stateObj.melody.pattern = (!isPlaying && hasStarted) ? initalNotes.sort(() => Math.random() - 0.5) : initalNotes;
    }
    console.log('stateObj',stateObj)
    stateBasedActions(stateObj)
    /*let time = 0;
    for(let i=0;i<initalNotes.length;i++) {
        let playTime = '0' + ':' + (time + i*2).toString();
        melodySequence.push([playTime,initalNotes[i]])
    }
    melody.start();*/
}
let stateBasedActions = (stateObj) => {
    let notes = [];
    console.log('HERE?');
    if(stateObj.raga) {
        // fetch music travel place
        // update DOM

         //hack
        notes = stateObj.raga.up;
        //notes.push(null);
        notes = notes.concat(stateObj.raga.down);
        //notes.push(null);
        notes = notes.concat(stateObj.raga.pattern);
    } else {
        if(stateObj.melody) {
            // update DOM
        }  

        //hack
        notes = stateObj.melody.up;
        //notes.push('K');
        notes.concat(stateObj.melody.down);
        //notes.push('K');
        notes.concat(stateObj.melody.pattern);
    }

    if(!isPlaying && hasStarted)  {
        play(notes);
        isPlaying = !isPlaying;
        playSequenceMelody(notes);
        
    }

}
let playSequenceMelody = (melodies) => {
    //console.log('IS THIS AGAIN?')
    pianoPart = new Tone.Part(function(time, event) {
        let allnotes = ['C','D','E','F','G','A','B'];
        for(let i=0;i<allnotes.length;i++) {
            if(event.note.indexOf(allnotes[i]) > -1) {
                //console.log('HAHAHA',allnotes[i]);
                myBLE.write(playingBLECha,i+1);
            }
        }
        synth.triggerAttackRelease(event.note, event.dur, time);
      }, nowPlaying).start();
    
      pianoPart.loop = true;
      pianoPart.loopEnd = nowPlaying.length.toString() +"m";
    
    // Note that if you pass a time into the start method 
    // you can specify when the synth part starts 
    // e.g. .start('8n') will start after 1 eighth note
    // start the transport which controls the main timeline
    Tone.Transport.start();

}


//location based functions
let fetchLocations = (long,pickedTime) => {
    return new Promise((resolve,reject) => {
        let lat = (Math.floor(Math.random()*90)).toString();
        fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+long+'&key=AIzaSyDwKefEB9myjsR-EES3hgGKkdlkMvUb0Fc').then( async (response,body) => {
                    // The API call was successful!
            let json = await response.json();
            console.log('success!', json['results']);
            if(json['results'] && json['results'][0]) {
                console.log(json['results'][0])
                let res = json['results'][0];
                let countryLevel = undefined;
                console.log(res['address_components'].length)
                for(let i=0;i<res['address_components'].length;i++) {
                    let addcomp = res['address_components'][i];
                    if(addcomp && addcomp.types && addcomp.types.length) {
                        for(let j=0;j<addcomp.types.length;j++) {
                            if(['country'].indexOf(addcomp.types[j])) {
                                countryLevel = i;
                            }
                        }
                    }
                }
                console.log('countryLevel',countryLevel)
                if(countryLevel != undefined) {
                    console.log('country',res['address_components'][countryLevel])
                    let returnObj =  {
                                country: res['address_components'][countryLevel]['long_name'],
                                place: (countryLevel!=0) ? res['address_components'][countryLevel-1]['long_name'] : null,
                                lat:lat,
                                long:long,
                                time:pickedTime
                            }
                    resolve(returnObj);
                } else {
                    let returnObj = {};
                    resolve(returnObj);
                }
            } else {
                console.log('STUCK')
                fetchLocations(long)
                .then((data) => {
                    resolve(data)
                })
                .catch((err) => {
                    reject(err)
                })
            }
        }).catch(function (err) {
            // There was an error
            console.warn('Something went wrong.', err);
            reject(err)
        });
    })
}
let findLocation = () => {
    let date = new Date();
    let hours = date.getHours();
    let long;
    let pickedTime;
    if(hours > ragas[currentRaga].start && hours < ragas[currentRaga].end) {
        console.log('IN YOUR ZONE')
    } else {
        pickedTime = Math.floor(Math.random()*(ragas[currentRaga].end - ragas[currentRaga].start) + ragas[currentRaga].start);
        //let pickedTime = 2;
        let difference = pickedTime - hours;
        let l = (difference*15 + (-74));
        console.log('LL',l)
        if(l > 0) {
            long = l.toString()
        } else {
            if(l*(-1) > 180) {
                l = 360 - (l*(-1));
                long = l.toString();
            } else {
                long = '-' + (l*(-1)).toString();
            }
        }
        console.log('HAHA',pickedTime,difference,long);
    }
    //playSequenceMelody([])
    //playMelody(initalNotes);
    //lat = '-' + lat;
    if(!locationPicked) {
        locationPicked = true;
        fetchLocations(long,pickedTime)
        .then((data) => {
            updateDOM('RELOCATE',data);
        })
        .catch((err) => {
        console.log('ERR',err);
        })
    }
}

//update HTML on various stages of music making
let updateDOM = (state,data) => {
    switch(state) {
        case 'BLE_CONNECTED':
            let bleButton = document.getElementById('BLEbuttonText');
            bleButton.innerText = 'Connected to Bluetooth'
        break;
        case 'RELOCATE':
            let intro = document.getElementById('intro');
            intro.innerText = ragas[currentRaga].description;

            let countryName = document.getElementById('countryName');
            countryName.innerText = data.place + ', ' + data.country;

           

            let description = document.getElementById('moodDescription');
            description.innerText = ragas[currentRaga].activity + ' and listening to Raga ' + ragas[currentRaga].name;
            console.log('description.innerText',description.innerText);
            if(marker) {
                console.log('reset marker')
                marker.setPosition( new google.maps.LatLng( data.lat, data.long ) )
                //marker.setPosition( {lat:data.lat, lng:data.long} );
            }
        break;
        case 'RAGA_FORMATION':
            let playingString = ''
            for(let i=0;i<initalNotes.length;i++) {
                playingString = playingString + initalNotes[i] + ' '
            }
            let elemName = document.getElementById('suggestedRagaName');
            elemName.innerText = data.name;
            let elemNote = document.getElementById('closestragaNotes');
            let html = ''
            for(let i=0;i<data.notes.length;i++) {
                console.log('LALALA',data.notes[i])
                if(initalNotes.indexOf(data.notes[i]) == -1) {
                    html = html + '<p id="missing" class="suggestedNote"><b>' + data.notes[i] + '</p>';
                } else {
                    html = html + '<p class="suggestedNote">' + data.notes[i] + '</p>'
                }
            }
            elemNote.innerHTML = html;

            let elemR = document.getElementById('raga');
            elemR.innerText = '';
            let ragaHeading1 = document.getElementById('ragaHeading');
            ragaHeading1.innerText = '';
            let closestHeading1 = document.getElementById('closestheading');
            closestHeading1.innerText = 'Suggested Raga for your notes combination';

            //add box style 
            let suggestDiv = document.getElementById('suggestedRaga');
            suggestDiv.style.borderColor = '#a7998b';
            suggestDiv.style.borderStyle = 'solid';
            suggestDiv.style.borderWidth = '1px';
        break;
        case 'RAGA_FOUND':
            let elem = document.getElementById('raga');
            elem.innerText = 'Raga - ' + data.name;
            let ragaHeading = document.getElementById('ragaHeading');
            ragaHeading.innerText = 'Selected notes play';
            let closestHeading = document.getElementById('closestheading');
            closestHeading.innerText = '';
            let elemNamec = document.getElementById('suggestedRagaName');
            elemNamec.innerText = '';
            let closest = document.getElementById('closestragaNotes');
            let html1 = '';
            closest.innerHTML = '<p></p>';

            let suggestDiv1 = document.getElementById('suggestedRaga');
            suggestDiv1.style.borderColor = '';
            suggestDiv1.style.borderStyle = '';
            suggestDiv1.style.borderWidth = '';

             //add box style 
             let suggestDiv2 = document.getElementById('playingRaga');
             suggestDiv2.style.borderColor = '#a7998b';
             suggestDiv2.style.borderStyle = 'solid';
             suggestDiv2.style.borderWidth = '1px';
        break;
        case 'UPDATE_NOTES':
            let playingString1 = ''
            for(let i=0;i<initalNotes.length;i++) {
                playingString1 = playingString1 + initalNotes[i] + ' '
            }
            let noteElem = document.getElementById('notes');
            noteElem.innerText = playingString1;
        break;
        default:
            console.log('NO_STATE',state)
    }
}


(function(window, document, undefined){
    window.onload = () => {
        setup();
    }
})(window, document, undefined);

