const record = require('node-record-lpcm16');
const speech = require('@google-cloud/speech');
const util = require('util');
const log4js = require('log4js');

const ENCODING = 'LINEAR16';
const SAMPLING_RATE_HERTZ = 16000;
const REC_SILENCE_SEC = 0.5;
const REC_SILENCE_THRESHOLD = 0.1;
const REC_PROGRAM = 'rec';

const MAX_STREAM_LENGTH_SEC = 60000;
const LANGUAGE_CODE = 'ja-JP';
const MAX_ALTERNATIVES = 3;
const ENABLE_WORD_TIME_OFFSETS = true;
const ENABLE_AUTO_PUCTUATION = true;

const IS_DEBUG_MODE = false;

const logger = log4js.getLogger();
logger.level = IS_DEBUG_MODE ? 'debug' : 'info';

const client = new speech.SpeechClient();

const request = {
    config: {
        encoding: ENCODING,
        sampleRateHertz: SAMPLING_RATE_HERTZ,
        languageCode: LANGUAGE_CODE,
        maxAlternatives: MAX_ALTERNATIVES,
        enableWordTimeOffsets: ENABLE_WORD_TIME_OFFSETS,
        enableAutomaticPunctuation: ENABLE_AUTO_PUCTUATION,
    },
    interimResults: IS_DEBUG_MODE,
};

function create_recognization_stream() {
    let timer = null;

    logger.debug('##### start #####');

    // Create a recognize stream
    const recognizeStream = client
        .streamingRecognize(request)
        .on('error', (e) => {
            logger.error(e.toString());
        })
        .on('data', data => {
            logger.debug(util.inspect(data, true, null));

            const transcript = data.results[0] && data.results[0].alternatives[0] ?
                `${data.results[0].alternatives[0].transcript}\n` :
                '';
            logger.info(transcript);
        });

    // Start recording and send the microphone input to the Speech API
    record
        .start({
            recordProgram: REC_PROGRAM,
            sampleRateHertz: SAMPLING_RATE_HERTZ,
            silence: REC_SILENCE_SEC,
            threshold: REC_SILENCE_THRESHOLD,
            verbose: IS_DEBUG_MODE,
        })
        .on('error', (e) => {
            logger.error(e.toString());
        })
        .on('end', () => {
            logger.debug('##### end #####');

            clearTimeout(timer);
            start_recognization();
        })
        .pipe(recognizeStream);

    // Restart recording after timeout
    timer = setTimeout(() => {
        logger.debug('##### timeout #####');

        record.stop();
    }, MAX_STREAM_LENGTH_SEC);
}

function start_recognization() {
    create_recognization_stream();
}

start_recognization();
