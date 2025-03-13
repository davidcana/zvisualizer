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

            const numberOfViewers = 1;
            //const visualSetting = 'frequencybars';
            const visualSetting = 'sinewave';
            //const visualSetting = 'ugly';
            
            for ( let c = 1; c <= numberOfViewers; ++c ){
                let voiceViewer = new VoiceViewer(
                    document.getElementById( 'canvas' + c ),
                    source,
                    audioCtx,
                    visualSetting
                );
            }
            
        })
        .catch( function ( e ) {
            console.error( 'The following gUM error occured: ' + e );
        });
}

var VoiceViewer = function ( _canvas, _source, _audioCtx, _visualSetting ) {
  
    this.canvas = _canvas;
    this.audioCtx = _audioCtx;

    // Set up the different audio nodes we will use for the app
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.85;
    _source.connect( this.analyser );
    this.analyser.connect( this.audioCtx.destination );
    
    // Visualize!
    this.visualize( _visualSetting || 'sinewave' );
};

VoiceViewer.prototype.visualize = function( visualSetting ) {

    console.log( 'Visualize ' + this.canvas.id + ' canvas: ' + visualSetting );
    
    // Create worker
    const worker = new Worker(
        new URL( 'worker.js', import.meta.url )
    );

    // Post canvas to worker
    const transferCanvas = this.canvas.transferControlToOffscreen();
    worker.postMessage(
        { 
            canvas: transferCanvas,
            canvasId: this.canvas.id,
            visualSetting
        },
        [ transferCanvas ]
    );

    // Get the visualizer and run it
    const visualizer = this.visualizers[ visualSetting ];
    if ( ! visualizer ){
        console.log( 'Error trying to run visualizer '  + visualSetting + ': not found.');
        return;
    }
    visualizer.call( this, worker );
};

VoiceViewer.prototype.visualizeUgly = function( worker ) {

    this.analyser.fftSize = 128; 
    const bufferLength = this.analyser.frequencyBinCount; 
    console.log( bufferLength );
    const dataArray = new Uint8Array( bufferLength );
  
    const drawUgly = () => {
        this.analyser.getByteFrequencyData( dataArray );
        worker.postMessage( { bufferLength, dataArray } );
        requestAnimationFrame( drawUgly );
    }
  
    drawUgly();
};

VoiceViewer.prototype.visualizeSinewave = function( worker ) {

    this.analyser.fftSize = 2048;
    const bufferLength = this.analyser.fftSize;
    console.log( bufferLength );

    // We can use Float32Array instead of Uint8Array if we want higher precision
    // const dataArray = new Float32Array(bufferLength);
    const dataArray = new Uint8Array( bufferLength );

    const drawSinewave = () => {
        requestAnimationFrame( drawSinewave );
        this.analyser.getByteTimeDomainData( dataArray );
        worker.postMessage( { bufferLength, dataArray } );
    };

    drawSinewave();
};

VoiceViewer.prototype.visualizeFrequencyBars = function( worker ) {

    this.analyser.fftSize = 256;

    // Set div to 1 to view all frequencies
    const div = 6;
    const bufferLength = this.analyser.frequencyBinCount / div;
    console.log( bufferLength );

    // See comment above for Float32Array()
    const dataArray = new Uint8Array( bufferLength );

    const drawFrequencyBars = () => {
        requestAnimationFrame( drawFrequencyBars );
        this.analyser.getByteFrequencyData( dataArray );
        worker.postMessage( { bufferLength, dataArray } );
    };

    drawFrequencyBars();
};

VoiceViewer.prototype.visualizers = {
    'sinewave': VoiceViewer.prototype.visualizeSinewave,
    'frequencybars': VoiceViewer.prototype.visualizeFrequencyBars,
    'ugly': VoiceViewer.prototype.visualizeUgly,
};
