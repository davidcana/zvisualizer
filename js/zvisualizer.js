/*
el
source
audioCtx
visualSetting
*/
export var VoiceViewer = function ( config ) {
  
    // Init some vars
    this.el = config.el;
    this.audioCtx = config.audioCtx;
    this.visualSetting = config.visualSetting || 'sinewave';

    // Set up the different audio nodes we will use for the app
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.85;
    config.source.connect( this.analyser );
    this.analyser.connect( this.audioCtx.destination );

    // Create worker
    const worker = new Worker(
        new URL( 'worker.js', import.meta.url )
    );
    
    // Init canvas or meter
    this.initElements( worker );

    // Visualize!
    this.visualize( worker );
};

VoiceViewer.prototype.initElements = function( worker ) {

    if ( this.el instanceof HTMLCanvasElement ){
        // Init canvas
        this.canvas = this.el;
        console.log( 'Visualize ' + this.canvas.id + ' canvas: ' + this.visualSetting );
        
        // Post canvas to worker
        const transferCanvas = this.canvas.transferControlToOffscreen();
        worker.postMessage(
            { 
                canvas: transferCanvas,
                canvasId: this.canvas.id,
                visualSetting: this.visualSetting
            },
            [ transferCanvas ]
        );

    } else if ( this.el instanceof HTMLMeterElement ){
        // Init meter
        this.meter = this.el;
        console.log( 'Visualize ' + this.meter.id + ' meter: ' + this.visualSetting );
    }
};

VoiceViewer.prototype.visualize = function( worker ) {

    // Get the visualizer and run it
    const visualizer = this.visualizers[ this.visualSetting ];
    if ( ! visualizer ){
        console.log( 'Error trying to run visualizer '  + this.visualSetting + ': not found.');
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

VoiceViewer.prototype.visualizeVolumeMeter = function( worker ) {
    
    const pcmData = new Float32Array( this.analyser.fftSize );

    const onFrame = () => {
        this.analyser.getFloatTimeDomainData( pcmData );
        let sumSquares = 0.0;
        for ( const amplitude of pcmData ){
            sumSquares += amplitude * amplitude;
        }
        this.meter.value = Math.sqrt( sumSquares / pcmData.length );
        requestAnimationFrame( onFrame );
    };

    requestAnimationFrame( onFrame );
};

VoiceViewer.prototype.visualizers = {
    'sinewave': VoiceViewer.prototype.visualizeSinewave,
    'frequencybars': VoiceViewer.prototype.visualizeFrequencyBars,
    'ugly': VoiceViewer.prototype.visualizeUgly,
    'volumeMeter': VoiceViewer.prototype.visualizeVolumeMeter
};

