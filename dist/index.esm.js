function t(t, a, i) {
    for (var o = 0; o < i.length; o++) t.setUint8(a + o, i.charCodeAt(o));
}
function a(a, i, o) {
    var e = (function (a, i, o, e, s) {
        var u = a.reduce(function (t, a) {
                return t + a.byteLength;
            }, 0),
            n = new ArrayBuffer(44 + u),
            r = new DataView(n),
            h = o,
            d = 0;
        return (
            t(r, d, 'RIFF'),
            (d += 4),
            r.setUint32(d, 36 + u, !0),
            t(r, (d += 4), 'WAVE'),
            t(r, (d += 4), 'fmt '),
            (d += 4),
            r.setUint32(d, 16, !0),
            (d += 4),
            r.setUint16(d, 1, !0),
            (d += 2),
            r.setUint16(d, h, !0),
            (d += 2),
            r.setUint32(d, i, !0),
            (d += 4),
            r.setUint32(d, h * i * (e / 8), !0),
            (d += 4),
            r.setUint16(d, h * (e / 8), !0),
            (d += 2),
            r.setUint16(d, e, !0),
            t(r, (d += 2), 'data'),
            (d += 4),
            r.setUint32(d, u, !0),
            (d += 4),
            a.forEach(function (t) {
                for (var a = new DataView(t.buffer), i = 0; i < t.byteLength; ) r.setUint8(d, a.getUint8(i)), d++, i++;
            }),
            r
        );
    })(a, i || 16e3, 1, o || 16);
    return new Blob([e], { type: 'audio/wav' });
}
var i = (function () {
    function t(t) {
        (this.toSampleRate = 22050),
            (this.resumePlayDuration = 1e3),
            (this.fromSampleRate = 16e3),
            (this.isAudioDataEnded = !1),
            (this.status = 'uninit'),
            (this.audioDatas = []),
            (this.pcmAudioDatas = []),
            (this.audioDataOffset = 0),
            (this.processor = new Worker(''.concat(t, '/processor.worker.js')));
    }
    return (
        (t.prototype.postMessage = function (t) {
            var a = t.type,
                i = t.data,
                o = t.isLastData;
            'uninit' !== this.status && (this.processor.postMessage({ type: a, data: i }), (this.isAudioDataEnded = o));
        }),
        (t.prototype.playAudio = function () {
            var t = this;
            if ((clearTimeout(this.playAudioTime), this.audioContext)) {
                for (var a = 0, i = this.audioDataOffset; i < this.audioDatas.length; i++) a += this.audioDatas[i].length;
                if (!a)
                    return void (
                        'play' === this.status &&
                        (this.isAudioDataEnded || this.resumePlayDuration <= 0
                            ? this.stop()
                            : (this.playAudioTime = setTimeout(function () {
                                  t.playAudio();
                              }, this.resumePlayDuration)))
                    );
                for (var o = this.audioContext.createBuffer(1, a, this.toSampleRate), e = o.getChannelData(0), s = this.audioDatas[this.audioDataOffset], u = 0; s; ) {
                    if (((this.audioDataOffset += 1), o.copyToChannel)) o.copyToChannel(s, 0, u), (u += s.length);
                    else for (i = 0; i < s.length; i++) e[i] = s[i];
                    s = this.audioDatas[this.audioDataOffset];
                }
                var n = this.audioContext.createBufferSource();
                (this.bufferSource = n),
                    (n.buffer = o),
                    n.connect(this.audioContext.destination),
                    n.start(),
                    (n.onended = function (a) {
                        'play' === t.status &&
                            (t.audioDatas.length
                                ? t.playAudio()
                                : t.isAudioDataEnded || t.resumePlayDuration <= 0
                                ? t.stop()
                                : (t.playAudioTime = setTimeout(function () {
                                      t.playAudio();
                                  }, t.resumePlayDuration)));
                    });
            }
        }),
        (t.prototype.reset = function () {
            var t;
            (this.processor.onmessage = null), (this.audioDataOffset = 0), (this.audioDatas = []), (this.pcmAudioDatas = []), (this.status = 'uninit'), (this.isAudioDataEnded = !1), clearTimeout(this.playAudioTime);
            try {
                null === (t = this.bufferSource) || void 0 === t || t.stop();
            } catch (t) {
                console.log(t);
            }
        }),
        (t.prototype.start = function (t) {
            var a = this,
                i = void 0 === t ? {} : t,
                o = i.autoPlay,
                e = void 0 === o || o,
                s = i.sampleRate,
                u = void 0 === s ? 16e3 : s,
                n = i.resumePlayDuration,
                r = void 0 === n ? 1e3 : n;
            this.reset(), (this.status = 'init'), (this.resumePlayDuration = r);
            var h = u,
                d = Math.max(h, 22050);
            (d = Math.min(d, 96e3)),
                (this.fromSampleRate = h),
                (this.toSampleRate = d),
                this.processor.postMessage({ type: 'init', data: { fromSampleRate: h, toSampleRate: d } }),
                (this.processor.onmessage = function (t) {
                    var i = t.data,
                        o = i.audioData,
                        s = i.pcmAudioData;
                    a.audioDatas.push(o), a.pcmAudioDatas.push(s), 1 === a.audioDatas.length && e && 'init' === a.status && a.play();
                });
        }),
        (t.prototype.play = function () {
            var t;
            this.audioContext || ((this.audioContext = new (window.AudioContext || window.webkitAudioContext)()), this.audioContext.resume()),
                this.audioContext && ((this.status = 'play'), null === (t = this.onPlay) || void 0 === t || t.call(this), this.playAudio());
        }),
        (t.prototype.stop = function () {
            var t, a;
            (this.audioDataOffset = 0), (this.status = 'stop'), clearTimeout(this.playAudioTime);
            try {
                null === (t = this.bufferSource) || void 0 === t || t.stop(), null === (a = this.onStop) || void 0 === a || a.call(this, this.audioDatas);
            } catch (t) {
                console.log(t);
            }
        }),
        (t.prototype.getAudioDataBlob = function (t) {
            var i, o;
            if (null === (i = this.pcmAudioDatas) || void 0 === i ? void 0 : i.length) return 'wav' === t ? a(this.pcmAudioDatas, this.fromSampleRate, 16) : ((o = this.pcmAudioDatas), new Blob(o, { type: 'audio/pcm' }));
        }),
        t
    );
})();
export { i as default };
