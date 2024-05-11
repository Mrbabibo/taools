(function () {
    const APPID = '5c9c7714';
    const API_SECRET = 'OTkzMzcyN2NkODFiZmZhMTE2NmQzNjc2';
    const API_KEY = '03458eaaa4ffe7c1c72d5be87f98267c';

    let btnControl = document.getElementById('controll_tts');
    let btnStatus = 'UNDEFINED'; // "UNDEFINED" "CONNECTING" "PLAY" "STOP"
    function changeBtnStatus(status) {
        btnStatus = status;
        if (status === 'UNDEFINED') {
            btnControl.innerText = '立即合成';
        } else if (status === 'CONNECTING') {
            btnControl.innerText = '正在合成';
        } else if (status === 'PLAY') {
            btnControl.innerText = '停止播放';
        } else if (status === 'STOP') {
            btnControl.innerText = '重新播放';
        }
    }

    const audioPlayer = new AudioPlayer('./js');
    audioPlayer.onPlay = () => {
        changeBtnStatus('PLAY');
    };
    audioPlayer.onStop = audioDatas => {
        console.log(audioDatas);
        btnStatus === 'PLAY' && changeBtnStatus('STOP');
    };
    function getWebSocketUrl(apiKey, apiSecret) {
        var url = 'wss://tts-api.xfyun.cn/v2/tts';
        var host = location.host;
        var date = new Date().toGMTString();
        var algorithm = 'hmac-sha256';
        var headers = 'host date request-line';
        var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
        var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
        var signature = CryptoJS.enc.Base64.stringify(signatureSha);
        var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
        var authorization = btoa(authorizationOrigin);
        url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
        return url;
    }
    function encodeText(text, type) {
        if (type === 'unicode') {
            let buf = new ArrayBuffer(text.length * 4);
            let bufView = new Uint16Array(buf);
            for (let i = 0, strlen = text.length; i < strlen; i++) {
                bufView[i] = text.charCodeAt(i);
            }
            let binary = '';
            let bytes = new Uint8Array(buf);
            let len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        } else {
            return Base64.encode(text);
        }
    }

    let ttsWS;
    function connectWebSocket() {
        const url = getWebSocketUrl(API_KEY, API_SECRET);
        if ('WebSocket' in window) {
            ttsWS = new WebSocket(url);
        } else if ('MozWebSocket' in window) {
            ttsWS = new MozWebSocket(url);
        } else {
            alert('浏览器不支持WebSocket');
            return;
        }
        changeBtnStatus('CONNECTING');

        ttsWS.onopen = e => {
            audioPlayer.start({
                autoPlay: true,
                sampleRate: 16000,
                resumePlayDuration: 1000,
            });
            changeBtnStatus('PLAY');
            var text = document.getElementById('textarea').value.trim() || '请输入您要合成的文本';
            var tte = 'UTF8';
            var params = {
                common: {
                    app_id: APPID,
                },
                business: {
                    aue: 'raw',
                    auf: 'audio/L16;rate=16000',
                    vcn: document.getElementById('vcn').value,
                    speed: +document.getElementById('speed').value,
                    volume: +document.getElementById('volume').value,
                    pitch: +document.getElementById('pitch').value,
                    bgs: 1,
                    tte,
                    // ttp: 'cssml',
                },
                data: {
                    status: 2,
                    text: encodeText(text, tte),
                },
            };
            ttsWS.send(JSON.stringify(params));
        };
        ttsWS.onmessage = e => {
            let jsonData = JSON.parse(e.data);
            // 合成失败
            if (jsonData.code !== 0) {
                console.error(jsonData);
                changeBtnStatus('UNDEFINED');
                return;
            }
            audioPlayer.postMessage({
                type: 'base64',
                data: jsonData.data.audio,
                isLastData: jsonData.data.status === 2,
            });
            if (jsonData.code === 0 && jsonData.data.status === 2) {
                ttsWS.close();
            }
        };
        ttsWS.onerror = e => {
            console.error(e);
        };
        ttsWS.onclose = e => {
            // console.log(e);
        };
    }

    document.getElementById('textarea').onchange =
        document.getElementById('speed').onchange =
        document.getElementById('volume').onchange =
        document.getElementById('pitch').onchange =
        document.getElementById('vcn').onchange =
            () => {
                changeBtnStatus('UNDEFINED');
                ttsWS?.close();
                audioPlayer.reset();
            };

    document.getElementById('controll_tts').onclick = function () {
        if (btnStatus === 'UNDEFINED') {
            // 开始合成
            connectWebSocket();
        } else if (btnStatus === 'CONNECTING') {
            // 停止合成
            changeBtnStatus('UNDEFINED');
            ttsWS?.close();
            audioPlayer.reset();
            return;
        } else if (btnStatus === 'PLAY') {
            audioPlayer.stop();
        } else if (btnStatus === 'STOP') {
            audioPlayer.play();
        }
    };
    // document.getElementById('download_pcm').onclick = function () {
    //     const blob = audioPlayer.getAudioDataBlob('pcm');
    //     if (!blob) {
    //         return;
    //     }
    //     let defaultName = new Date().getTime();
    //     let node = document.createElement('a');
    //     node.href = window.URL.createObjectURL(blob);
    //     node.download = `${defaultName}.pcm`;
    //     node.click();
    //     node.remove();
    // };

    // document.getElementById('download_wav').onclick = function () {
    //     const blob = audioPlayer.getAudioDataBlob('wav');
    //     if (!blob) {
    //         return;
    //     }
    //     let defaultName = new Date().getTime();
    //     let node = document.createElement('a');
    //     node.href = window.URL.createObjectURL(blob);
    //     node.download = `${defaultName}.wav`;
    //     node.click();
    //     node.remove();
    // };
})();
