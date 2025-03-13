 
let canvas = null;
let visualSetting = null;
let visualizers = {};

onmessage = function ( e ) {
    console.log( 'Worker: Message received from main script' );
    const { bufferLength, dataArray, canvas: canvasMessage, visualSetting: visualSettingMessage } = e.data;

    if ( canvasMessage ) {
        canvas = canvasMessage;
        visualSetting = visualSettingMessage;
        console.log( 'Initializing canvas and visualSetting ' + visualSetting );
    } else {
        let visualizer = visualizers[ visualSetting ];
        if ( ! visualizer ){
            console.log( 'Error trying to run drawVisualizer '  + visualSetting + ': not found.');
            return;
        }
        console.log( 'Running drawVisualizer '  + visualSetting );
        visualizer( bufferLength, dataArray );
        console.log( '...drawVisualizer OK.' );
    }
};

visualizers[ 'frequencybars' ] = ( bufferLength, dataArray ) => {

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const canvasCtx = canvas.getContext( '2d' );
    canvasCtx.clearRect( 0, 0, WIDTH, HEIGHT );

    const drawFrequencyBars = () => {
        requestAnimationFrame( drawFrequencyBars );

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect( 0, 0, WIDTH, HEIGHT );

        const barWidth = ( WIDTH / bufferLength ) * 2.5;
        let x = 0;

        for ( let i = 0; i < bufferLength; i++ ) {
            const barHeight = dataArray[ i ];

            canvasCtx.fillStyle = 'rgb(' + ( barHeight + 100 ) + ',50,50)';
            canvasCtx.fillRect(
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

visualizers[ 'sinewave' ] = ( bufferLength, dataArray ) => {

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const canvasCtx = canvas.getContext( '2d' );
    canvasCtx.clearRect( 0, 0, WIDTH, HEIGHT );

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect( 0, 0, WIDTH, HEIGHT );

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    const sliceWidth = ( WIDTH * 1.0 ) / bufferLength;
    let x = 0;

    for ( let i = 0; i < bufferLength; i++ ) {
        const v = dataArray[ i ] / 128.0;
        const y = ( v * HEIGHT ) / 2;

        if ( i === 0 ) {
            canvasCtx.moveTo( x, y );
        } else {
            canvasCtx.lineTo( x, y );
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo( WIDTH, HEIGHT / 2 );
    canvasCtx.stroke();
};

visualizers[ 'ugly' ] = ( bufferLength, dataArray ) => {

    let barHeight;
    const barWidth = canvas.width / 2 / bufferLength;
    let firstX = 0;
    let secondX = bufferLength * barWidth;
    const ctx = canvas.getContext( '2d' );
  
    ctx.clearRect( 0, 0, canvas.width, canvas.height );
  
    for ( let i = 0; i < bufferLength; i++ ) {
        barHeight = dataArray[ i ];
        const red = ( i * barHeight ) / 10;
        const green = i * 4;
        const blue = barHeight / 4 - 12;
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(
            canvas.width / 2 - firstX,
            canvas.height - barHeight,
            barWidth,
            barHeight
        ); 
        firstX += barWidth;
        ctx.fillRect( secondX, canvas.height - barHeight, barWidth, barHeight );
        secondX += barWidth;
    }
  };


