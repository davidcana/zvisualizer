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
            
            let voiceViewer = new VoiceViewer(
                document.getElementById( 'canvas1' ),
                source,
                audioCtx
            );
            /*
            for ( let c = 1; c < 7; ++c ){
                let voiceViewer = new VoiceViewer(
                    document.getElementById( 'canvas' + c ),
                    source,
                    audioCtx
                );
            }
            */
        })
        .catch( function ( e ) {
            console.error( 'The following gUM error occured: ' + e );
        });
}

var VoiceViewer = function ( _canvas, _source, _audioCtx ) {
  
    this.canvas = _canvas;
    this.audioCtx = _audioCtx;

    // Set up the different audio nodes we will use for the app
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.85;
    _source.connect( this.analyser );
    this.analyser.connect( this.audioCtx.destination );

    // Set up canvas context for visualizer
    //this.canvasCtx = this.canvas.getContext( '2d' );
    
    // Visualize!
    //this.visualize( 'sinewave' );
    //this.visualize( 'frequencybars' );
    this.visualize( 'ugly' );
};

VoiceViewer.prototype.visualize = function( visualSetting ) {

    console.log( visualSetting );
    
    // Create worker
    const worker = new Worker( new URL( 'js/worker.js', 'http://localhost:9000/' ) );
    
    // Post canvas to worker
    const transferCanvas = this.canvas.transferControlToOffscreen();
    worker.postMessage(
        { canvas: transferCanvas },
        [ transferCanvas ]
    );

    // Visualize!
    if ( visualSetting == 'sinewave' ) {
        this.visualizeSinewave( worker );

    } else if ( visualSetting == 'frequencybars' ) {
        this.visualizeFrequencyBars( worker );

    } else if ( visualSetting == 'ugly' ) {
        this.visualizeUgly( worker );
    }
};

VoiceViewer.prototype.visualizeUgly = function( worker ) {

    this.analyser.fftSize = 128; 
    const bufferLength = this.analyser.frequencyBinCount; 
    const dataArray = new Uint8Array( bufferLength );
  
    const drawUgly = () => {
        this.analyser.getByteFrequencyData( dataArray );
        worker.postMessage( { bufferLength, dataArray } );
        requestAnimationFrame( drawUgly );
    }
  
    drawUgly();
};

VoiceViewer.prototype.visualizeSinewave = function( worker ) {

    const WIDTH = this.canvas.width;
    const HEIGHT = this.canvas.height;
    this.analyser.fftSize = 2048;
    const bufferLength = this.analyser.fftSize;
    console.log( bufferLength );

    // We can use Float32Array instead of Uint8Array if we want higher precision
    // const dataArray = new Float32Array(bufferLength);
    const dataArray = new Uint8Array( bufferLength );

    this.canvasCtx.clearRect( 0, 0, WIDTH, HEIGHT );

    const drawSinewave = () => {
        requestAnimationFrame( drawSinewave );

        this.analyser.getByteTimeDomainData( dataArray );

        this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        this.canvasCtx.fillRect( 0, 0, WIDTH, HEIGHT );

        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        this.canvasCtx.beginPath();

        const sliceWidth = ( WIDTH * 1.0 ) / bufferLength;
        let x = 0;

        for ( let i = 0; i < bufferLength; i++ ) {
            const v = dataArray[ i ] / 128.0;
            const y = ( v * HEIGHT ) / 2;

            if ( i === 0 ) {
                this.canvasCtx.moveTo( x, y );
            } else {
                this.canvasCtx.lineTo( x, y );
            }

            x += sliceWidth;
        }

        this.canvasCtx.lineTo( WIDTH, HEIGHT / 2 );
        this.canvasCtx.stroke();
    };

    drawSinewave();
};

VoiceViewer.prototype.visualizeFrequencyBars = function( worker ) {

    const WIDTH = this.canvas.width;
    const HEIGHT = this.canvas.height;
    this.analyser.fftSize = 256;

    // Set div to 1 to view all frequencies
    const div = 6;
    const bufferLengthAlt = this.analyser.frequencyBinCount / div;
    console.log( bufferLengthAlt );

    // See comment above for Float32Array()
    const dataArrayAlt = new Uint8Array( bufferLengthAlt );

    this.canvasCtx.clearRect( 0, 0, WIDTH, HEIGHT );

    const drawFrequencyBars = () => {
        requestAnimationFrame( drawFrequencyBars );

        this.analyser.getByteFrequencyData( dataArrayAlt );

        this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.fillRect( 0, 0, WIDTH, HEIGHT );

        const barWidth = ( WIDTH / bufferLengthAlt ) * 2.5;
        let x = 0;

        for ( let i = 0; i < bufferLengthAlt; i++ ) {
            const barHeight = dataArrayAlt[i];

            this.canvasCtx.fillStyle = 'rgb(' + ( barHeight + 100 ) + ',50,50)';
            this.canvasCtx.fillRect(
                x,
                HEIGHT - barHeight / 2,
                barWidth,
                barHeight / 2
            );

            x += barWidth + 1;
        }
    };

    drawFrequencyBars();
};

