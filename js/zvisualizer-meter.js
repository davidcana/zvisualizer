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
    this.visualSetting = config.visualSetting || 'volumeMeter';

    // Set up the different audio nodes we will use for the app
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.85;
    config.source.connect( this.analyser );
    this.analyser.connect( this.audioCtx.destination );
    
    // Init canvas or meter
    this.initElements();

    // Visualize!
    this.visualize();
};

VoiceViewer.prototype.initElements = function() {

    if ( this.el instanceof HTMLMeterElement ){
        // Init meter
        this.meter = this.el;
        console.log( 'Visualize ' + this.meter.id + ' meter: ' + this.visualSetting );
    }
};

VoiceViewer.prototype.visualize = function() {

    // Get the visualizer and run it
    const visualizer = this.visualizers[ this.visualSetting ];
    if ( ! visualizer ){
        console.log( 'Error trying to run visualizer '  + this.visualSetting + ': not found.');
        return;
    }
    visualizer.call( this );
};

VoiceViewer.prototype.visualizeVolumeMeter = function( worker ) {
    
    const dataArray = new Float32Array( this.analyser.fftSize );
    
    const onFrame = () => {
        this.analyser.getFloatTimeDomainData( dataArray );
        let sumSquares = 0.0;
        for ( const amplitude of dataArray ){
            sumSquares += amplitude * amplitude;
        }
        this.meter.value = Math.sqrt( sumSquares / dataArray.length );
        requestAnimationFrame( onFrame );
    };

    requestAnimationFrame( onFrame );
};

VoiceViewer.prototype.visualizers = {
    'volumeMeter': VoiceViewer.prototype.visualizeVolumeMeter
};

