import { VoiceViewer } from './zvisualizer-meter.js';

const heading = document.querySelector( 'h1' );
heading.textContent = 'CLICK HERE TO START';
document.body.addEventListener( 'click', init );

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
                let voiceViewer = new VoiceViewer(
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
