import { ZVisualizer } from './zvisualizer-meter.js';

const heading = document.querySelector( 'h1' );
heading.textContent = 'CLICK HERE TO START';
document.body.addEventListener( 'click', init );
const zvisualizers = [];

async function init() {
    alert( 'app-version2' );
    heading.textContent = 'Voice-change-O-matic';
    document.body.removeEventListener( 'click', init );

    // Main block for doing the audio recording
    navigator.mediaDevices
        .getUserMedia( { audio: true } )
        .then(( stream ) => {
            const audioCtx = new AudioContext();
            let source = audioCtx.createMediaStreamSource( stream );

            const numberOfViewers = 6;
            //const visualSetting = 'frequencybars';
            //const visualSetting = 'sinewave';
            //const visualSetting = 'ugly';
            const visualSetting = 'volumeMeter';

            for ( let c = 1; c <= numberOfViewers; ++c ){
                zvisualizers[ c ] = new ZVisualizer(
                    {
                        el: document.getElementById( 'volumeMeter' + c ),
                        source: source,
                        audioCtx: audioCtx,
                        visualSetting: visualSetting
                    }
                );
            }
            
        })
        .catch( function ( e ) {
            console.error( 'The following error occured: ' + e );
        });
}

// Mute/unmute buttons
const muteElements = document.querySelectorAll( 'button.mute' );
muteElements.forEach( el => el.addEventListener( 'click', event => {
    const mute = event.target;
    const reference = mute.getAttribute( 'data-reference' );
    const ZVisualizer = zvisualizers[ reference ];

    if ( mute.innerHTML == "Mute" ) {
        alert( `Mute mute${reference}` );
        ZVisualizer.mute();
        mute.innerHTML = "Unmute";
    } else {
        alert( `Unmute mute${reference}` );
        ZVisualizer.unmute();
        mute.innerHTML = "Mute";
    }
}));

