var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/jszip/dist/jszip.min.js
var require_jszip_min = __commonJS({
  "node_modules/jszip/dist/jszip.min.js"(exports, module) {
    !(function(e) {
      if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
      else if ("function" == typeof define && define.amd) define([], e);
      else {
        ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).JSZip = e();
      }
    })(function() {
      return (function s(a, o, h) {
        function u(r, e2) {
          if (!o[r]) {
            if (!a[r]) {
              var t = "function" == typeof __require && __require;
              if (!e2 && t) return t(r, true);
              if (l) return l(r, true);
              var n = new Error("Cannot find module '" + r + "'");
              throw n.code = "MODULE_NOT_FOUND", n;
            }
            var i = o[r] = { exports: {} };
            a[r][0].call(i.exports, function(e3) {
              var t2 = a[r][1][e3];
              return u(t2 || e3);
            }, i, i.exports, s, a, o, h);
          }
          return o[r].exports;
        }
        for (var l = "function" == typeof __require && __require, e = 0; e < h.length; e++) u(h[e]);
        return u;
      })({ 1: [function(e, t, r) {
        "use strict";
        var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        r.encode = function(e2) {
          for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; ) f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
          return h.join("");
        }, r.decode = function(e2) {
          var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
          if (e2.substr(0, u.length) === u) throw new Error("Invalid base64 input, it looks like a data url.");
          var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; ) t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
          return l;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
        "use strict";
        var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
        function o(e2, t2, r2, n2, i2) {
          this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
        }
        o.prototype = { getContentWorker: function() {
          var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
          return e2.on("end", function() {
            if (this.streamInfo.data_length !== t2.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), e2;
        }, getCompressedWorker: function() {
          return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, o.createWorkerFrom = function(e2, t2, r2) {
          return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
        }, t.exports = o;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
        "use strict";
        var n = e("./stream/GenericWorker");
        r.STORE = { magic: "\0\0", compressWorker: function() {
          return new n("STORE compression");
        }, uncompressWorker: function() {
          return new n("STORE decompression");
        } }, r.DEFLATE = e("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
        "use strict";
        var n = e("./utils");
        var o = (function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n2 = 0; n2 < 8; n2++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        })();
        t.exports = function(e2, t2) {
          return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? (function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
            return -1 ^ e3;
          })(0 | t2, e2, e2.length, 0) : (function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
            return -1 ^ e3;
          })(0 | t2, e2, e2.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(e, t, r) {
        "use strict";
        r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
      }, {}], 6: [function(e, t, r) {
        "use strict";
        var n = null;
        n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
      }, { lie: 37 }], 7: [function(e, t, r) {
        "use strict";
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
        function h(e2, t2) {
          a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
        }
        r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
          this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
        }, h.prototype.flush = function() {
          a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
        }, h.prototype.cleanUp = function() {
          a.prototype.cleanUp.call(this), this._pako = null;
        }, h.prototype._createPako = function() {
          this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
          var t2 = this;
          this._pako.onData = function(e2) {
            t2.push({ data: e2, meta: t2.meta });
          };
        }, r.compressWorker = function(e2) {
          return new h("Deflate", e2);
        }, r.uncompressWorker = function() {
          return new h("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
        "use strict";
        function A(e2, t2) {
          var r2, n2 = "";
          for (r2 = 0; r2 < t2; r2++) n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
          return n2;
        }
        function n(e2, t2, r2, n2, i2, s2) {
          var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _ = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
          var S = 0;
          t2 && (S |= 8), l || !_ && !g || (S |= 2048);
          var z = 0, C = 0;
          w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= (function(e3, t3) {
            var r3 = e3;
            return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
          })(h.unixPermissions, w)) : (C = 20, z |= (function(e3) {
            return 63 & (e3 || 0);
          })(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _ && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
          var E = "";
          return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
        }
        var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
        function s(e2, t2, r2, n2) {
          i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        I.inherits(s, i), s.prototype.push = function(e2) {
          var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
          this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
        }, s.prototype.openedSource = function(e2) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
          var t2 = this.streamFiles && !e2.file.dir;
          if (t2) {
            var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r2.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = true;
        }, s.prototype.closedSource = function(e2) {
          this.accumulate = false;
          var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r2.dirRecord), t2) this.push({ data: (function(e3) {
            return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
          })(e2), meta: { percent: 100 } });
          else for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, s.prototype.flush = function() {
          for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++) this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
          var r2 = this.bytesWritten - e2, n2 = (function(e3, t3, r3, n3, i2) {
            var s2 = I.transformTo("string", i2(n3));
            return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
          })(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
          this.push({ data: n2, meta: { percent: 100 } });
        }, s.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, s.prototype.registerPrevious = function(e2) {
          this._sources.push(e2);
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
        }, s.prototype.error = function(e2) {
          var t2 = this._sources;
          if (!i.prototype.error.call(this, e2)) return false;
          for (var r2 = 0; r2 < t2.length; r2++) try {
            t2[r2].error(e2);
          } catch (e3) {
          }
          return true;
        }, s.prototype.lock = function() {
          i.prototype.lock.call(this);
          for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++) e2[t2].lock();
        }, t.exports = s;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
        "use strict";
        var u = e("../compressions"), n = e("./ZipFileWorker");
        r.generateWorker = function(e2, a, t2) {
          var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
          try {
            e2.forEach(function(e3, t3) {
              h++;
              var r2 = (function(e4, t4) {
                var r3 = e4 || t4, n3 = u[r3];
                if (!n3) throw new Error(r3 + " is not a valid compression method !");
                return n3;
              })(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
              t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
            }), o.entriesCount = h;
          } catch (e3) {
            o.error(e3);
          }
          return o;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
        "use strict";
        function n() {
          if (!(this instanceof n)) return new n();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var e2 = new n();
            for (var t2 in this) "function" != typeof this[t2] && (e2[t2] = this[t2]);
            return e2;
          };
        }
        (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(e2, t2) {
          return new n().loadAsync(e2, t2);
        }, n.external = e("./external"), t.exports = n;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
        "use strict";
        var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
        function f(n2) {
          return new i.Promise(function(e2, t2) {
            var r2 = n2.decompressed.getContentWorker().pipe(new a());
            r2.on("error", function(e3) {
              t2(e3);
            }).on("end", function() {
              r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
            }).resume();
          });
        }
        t.exports = function(e2, o) {
          var h = this;
          return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
            var t2 = new s(o);
            return t2.load(e3), t2;
          }).then(function(e3) {
            var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
            if (o.checkCRC32) for (var n2 = 0; n2 < r2.length; n2++) t2.push(f(r2[n2]));
            return i.Promise.all(t2);
          }).then(function(e3) {
            for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
              var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
              h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
            }
            return t2.zipComment.length && (h.comment = t2.zipComment), h;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("../stream/GenericWorker");
        function s(e2, t2) {
          i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
        }
        n.inherits(s, i), s.prototype._bindStream = function(e2) {
          var t2 = this;
          (this._stream = e2).pause(), e2.on("data", function(e3) {
            t2.push({ data: e3, meta: { percent: 0 } });
          }).on("error", function(e3) {
            t2.isPaused ? this.generatedError = e3 : t2.error(e3);
          }).on("end", function() {
            t2.isPaused ? t2._upstreamEnded = true : t2.end();
          });
        }, s.prototype.pause = function() {
          return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
        }, t.exports = s;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
        "use strict";
        var i = e("readable-stream").Readable;
        function n(e2, t2, r2) {
          i.call(this, t2), this._helper = e2;
          var n2 = this;
          e2.on("data", function(e3, t3) {
            n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
          }).on("error", function(e3) {
            n2.emit("error", e3);
          }).on("end", function() {
            n2.push(null);
          });
        }
        e("../utils").inherits(n, i), n.prototype._read = function() {
          this._helper.resume();
        }, t.exports = n;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
        "use strict";
        t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e2, t2);
          if ("number" == typeof e2) throw new Error('The "data" argument must not be a number');
          return new Buffer(e2, t2);
        }, allocBuffer: function(e2) {
          if (Buffer.alloc) return Buffer.alloc(e2);
          var t2 = new Buffer(e2);
          return t2.fill(0), t2;
        }, isBuffer: function(e2) {
          return Buffer.isBuffer(e2);
        }, isStream: function(e2) {
          return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
        } };
      }, {}], 15: [function(e, t, r) {
        "use strict";
        function s(e2, t2, r2) {
          var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
          s2.date = s2.date || /* @__PURE__ */ new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _(e2)) && b.call(this, n2, true);
          var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
          r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
          var o2 = null;
          o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
          var h2 = new d(e2, o2, s2);
          this.files[e2] = h2;
        }
        var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _ = function(e2) {
          "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
          var t2 = e2.lastIndexOf("/");
          return 0 < t2 ? e2.substring(0, t2) : "";
        }, g = function(e2) {
          return "/" !== e2.slice(-1) && (e2 += "/"), e2;
        }, b = function(e2, t2) {
          return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
        };
        function h(e2) {
          return "[object RegExp]" === Object.prototype.toString.call(e2);
        }
        var n = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(e2) {
          var t2, r2, n2;
          for (t2 in this.files) n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
        }, filter: function(r2) {
          var n2 = [];
          return this.forEach(function(e2, t2) {
            r2(e2, t2) && n2.push(t2);
          }), n2;
        }, file: function(e2, t2, r2) {
          if (1 !== arguments.length) return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
          if (h(e2)) {
            var n2 = e2;
            return this.filter(function(e3, t3) {
              return !t3.dir && n2.test(e3);
            });
          }
          var i2 = this.files[this.root + e2];
          return i2 && !i2.dir ? i2 : null;
        }, folder: function(r2) {
          if (!r2) return this;
          if (h(r2)) return this.filter(function(e3, t3) {
            return t3.dir && r2.test(e3);
          });
          var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
          return n2.root = t2.name, n2;
        }, remove: function(r2) {
          r2 = this.root + r2;
          var e2 = this.files[r2];
          if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir) delete this.files[r2];
          else for (var t2 = this.filter(function(e3, t3) {
            return t3.name.slice(0, r2.length) === r2;
          }), n2 = 0; n2 < t2.length; n2++) delete this.files[t2[n2].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(e2) {
          var t2, r2 = {};
          try {
            if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type) throw new Error("No output type specified.");
            u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
            var n2 = r2.comment || this.comment || "";
            t2 = o.generateWorker(this, r2, n2);
          } catch (e3) {
            (t2 = new l("error")).error(e3);
          }
          return new a(t2, r2.type || "string", r2.mimeType);
        }, generateAsync: function(e2, t2) {
          return this.generateInternalStream(e2).accumulate(t2);
        }, generateNodeStream: function(e2, t2) {
          return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
        } };
        t.exports = n;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
        "use strict";
        t.exports = e("stream");
      }, { stream: void 0 }], 17: [function(e, t, r) {
        "use strict";
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
          for (var t2 = 0; t2 < this.data.length; t2++) e2[t2] = 255 & e2[t2];
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data[this.zero + e2];
        }, i.prototype.lastIndexOfSignature = function(e2) {
          for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s) if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2) return s - this.zero;
          return -1;
        }, i.prototype.readAndCheckSignature = function(e2) {
          var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
          return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
        }, i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return [];
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
        "use strict";
        var n = e("../utils");
        function i(e2) {
          this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
        }
        i.prototype = { checkOffset: function(e2) {
          this.checkIndex(this.index + e2);
        }, checkIndex: function(e2) {
          if (this.length < this.zero + e2 || e2 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
        }, setIndex: function(e2) {
          this.checkIndex(e2), this.index = e2;
        }, skip: function(e2) {
          this.setIndex(this.index + e2);
        }, byteAt: function() {
        }, readInt: function(e2) {
          var t2, r2 = 0;
          for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--) r2 = (r2 << 8) + this.byteAt(t2);
          return this.index += e2, r2;
        }, readString: function(e2) {
          return n.transformTo("string", this.readData(e2));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var e2 = this.readInt(4);
          return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
        } }, t.exports = i;
      }, { "../utils": 32 }], 19: [function(e, t, r) {
        "use strict";
        var n = e("./Uint8ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
        "use strict";
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data.charCodeAt(this.zero + e2);
        }, i.prototype.lastIndexOfSignature = function(e2) {
          return this.data.lastIndexOf(e2) - this.zero;
        }, i.prototype.readAndCheckSignature = function(e2) {
          return e2 === this.readData(4);
        }, i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
        "use strict";
        var n = e("./ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return new Uint8Array(0);
          var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
        t.exports = function(e2) {
          var t2 = n.getTypeOf(e2);
          return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
        "use strict";
        r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(e, t, r) {
        "use strict";
        var n = e("./GenericWorker"), i = e("../utils");
        function s(e2) {
          n.call(this, "ConvertWorker to " + e2), this.destType = e2;
        }
        i.inherits(s, n), s.prototype.processChunk = function(e2) {
          this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
        "use strict";
        var n = e("./GenericWorker"), i = e("../crc32");
        function s() {
          n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
          this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
        }, t.exports = s;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
        }
        n.inherits(s, i), s.prototype.processChunk = function(e2) {
          if (e2) {
            var t2 = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = t2 + e2.data.length;
          }
          i.prototype.processChunk.call(this, e2);
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataWorker");
          var t2 = this;
          this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
            t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
          }, function(e3) {
            t2.error(e3);
          });
        }
        n.inherits(s, i), s.prototype.cleanUp = function() {
          i.prototype.cleanUp.call(this), this.data = null;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
        }, s.prototype._tickAndRepeat = function() {
          this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
        }, s.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return false;
          var e2 = null, t2 = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              e2 = this.data.substring(this.index, t2);
              break;
            case "uint8array":
              e2 = this.data.subarray(this.index, t2);
              break;
            case "array":
            case "nodebuffer":
              e2 = this.data.slice(this.index, t2);
          }
          return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
        "use strict";
        function n(e2) {
          this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        n.prototype = { push: function(e2) {
          this.emit("data", e2);
        }, end: function() {
          if (this.isFinished) return false;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = true;
          } catch (e2) {
            this.emit("error", e2);
          }
          return true;
        }, error: function(e2) {
          return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
        }, on: function(e2, t2) {
          return this._listeners[e2].push(t2), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(e2, t2) {
          if (this._listeners[e2]) for (var r2 = 0; r2 < this._listeners[e2].length; r2++) this._listeners[e2][r2].call(this, t2);
        }, pipe: function(e2) {
          return e2.registerPrevious(this);
        }, registerPrevious: function(e2) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return false;
          var e2 = this.isPaused = false;
          return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
        }, flush: function() {
        }, processChunk: function(e2) {
          this.push(e2);
        }, withStreamInfo: function(e2, t2) {
          return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var e2 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = true, this.previous && this.previous.lock();
        }, toString: function() {
          var e2 = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + e2 : e2;
        } }, t.exports = n;
      }, {}], 29: [function(e, t, r) {
        "use strict";
        var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
        if (n.nodestream) try {
          o = e("../nodejs/NodejsStreamOutputAdapter");
        } catch (e2) {
        }
        function l(e2, o2) {
          return new a.Promise(function(t2, r2) {
            var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
            e2.on("data", function(e3, t3) {
              n2.push(e3), o2 && o2(t3);
            }).on("error", function(e3) {
              n2 = [], r2(e3);
            }).on("end", function() {
              try {
                var e3 = (function(e4, t3, r3) {
                  switch (e4) {
                    case "blob":
                      return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                    case "base64":
                      return u.encode(t3);
                    default:
                      return h.transformTo(e4, t3);
                  }
                })(s2, (function(e4, t3) {
                  var r3, n3 = 0, i3 = null, s3 = 0;
                  for (r3 = 0; r3 < t3.length; r3++) s3 += t3[r3].length;
                  switch (e4) {
                    case "string":
                      return t3.join("");
                    case "array":
                      return Array.prototype.concat.apply([], t3);
                    case "uint8array":
                      for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++) i3.set(t3[r3], n3), n3 += t3[r3].length;
                      return i3;
                    case "nodebuffer":
                      return Buffer.concat(t3);
                    default:
                      throw new Error("concat : unsupported type '" + e4 + "'");
                  }
                })(i2, n2), a2);
                t2(e3);
              } catch (e4) {
                r2(e4);
              }
              n2 = [];
            }).resume();
          });
        }
        function f(e2, t2, r2) {
          var n2 = t2;
          switch (t2) {
            case "blob":
            case "arraybuffer":
              n2 = "uint8array";
              break;
            case "base64":
              n2 = "string";
          }
          try {
            this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
          } catch (e3) {
            this._worker = new s("error"), this._worker.error(e3);
          }
        }
        f.prototype = { accumulate: function(e2) {
          return l(this, e2);
        }, on: function(e2, t2) {
          var r2 = this;
          return "data" === e2 ? this._worker.on(e2, function(e3) {
            t2.call(r2, e3.data, e3.meta);
          }) : this._worker.on(e2, function() {
            h.delay(t2, arguments, r2);
          }), this;
        }, resume: function() {
          return h.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(e2) {
          if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
          return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
        } }, t.exports = f;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
        "use strict";
        if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r.blob = false;
        else {
          var n = new ArrayBuffer(0);
          try {
            r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
          } catch (e2) {
            try {
              var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
            } catch (e3) {
              r.blob = false;
            }
          }
        }
        try {
          r.nodestream = !!e("readable-stream").Readable;
        } catch (e2) {
          r.nodestream = false;
        }
      }, { "readable-stream": 16 }], 31: [function(e, t, s) {
        "use strict";
        for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++) u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
        u[254] = u[254] = 1;
        function a() {
          n.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function l() {
          n.call(this, "utf-8 encode");
        }
        s.utf8encode = function(e2) {
          return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : (function(e3) {
            var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
            for (i2 = 0; i2 < a2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          })(e2);
        }, s.utf8decode = function(e2) {
          return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : (function(e3) {
            var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
            for (t2 = r2 = 0; t2 < s2; ) if ((n2 = e3[t2++]) < 128) a2[r2++] = n2;
            else if (4 < (i2 = u[n2])) a2[r2++] = 65533, t2 += i2 - 1;
            else {
              for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; ) n2 = n2 << 6 | 63 & e3[t2++], i2--;
              1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
            }
            return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
          })(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
        }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
          var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
          if (this.leftOver && this.leftOver.length) {
            if (h.uint8array) {
              var r2 = t2;
              (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
            } else t2 = this.leftOver.concat(t2);
            this.leftOver = null;
          }
          var n2 = (function(e3, t3) {
            var r3;
            for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); ) r3--;
            return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
          })(t2), i2 = t2;
          n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
        }, a.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
          this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
        }, s.Utf8EncodeWorker = l;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
        "use strict";
        var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
        function n(e2) {
          return e2;
        }
        function l(e2, t2) {
          for (var r2 = 0; r2 < e2.length; ++r2) t2[r2] = 255 & e2.charCodeAt(r2);
          return t2;
        }
        e("setimmediate"), a.newBlob = function(t2, r2) {
          a.checkSupport("blob");
          try {
            return new Blob([t2], { type: r2 });
          } catch (e2) {
            try {
              var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return n2.append(t2), n2.getBlob(r2);
            } catch (e3) {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var i = { stringifyByChunk: function(e2, t2, r2) {
          var n2 = [], i2 = 0, s2 = e2.length;
          if (s2 <= r2) return String.fromCharCode.apply(null, e2);
          for (; i2 < s2; ) "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
          return n2.join("");
        }, stringifyByChar: function(e2) {
          for (var t2 = "", r2 = 0; r2 < e2.length; r2++) t2 += String.fromCharCode(e2[r2]);
          return t2;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
          } catch (e2) {
            return false;
          }
        })(), nodebuffer: (function() {
          try {
            return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
          } catch (e2) {
            return false;
          }
        })() } };
        function s(e2) {
          var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
          if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2) for (; 1 < t2; ) try {
            return i.stringifyByChunk(e2, r2, t2);
          } catch (e3) {
            t2 = Math.floor(t2 / 2);
          }
          return i.stringifyByChar(e2);
        }
        function f(e2, t2) {
          for (var r2 = 0; r2 < e2.length; r2++) t2[r2] = e2[r2];
          return t2;
        }
        a.applyFromCharCode = s;
        var c = {};
        c.string = { string: n, array: function(e2) {
          return l(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.string.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return l(e2, new Uint8Array(e2.length));
        }, nodebuffer: function(e2) {
          return l(e2, r.allocBuffer(e2.length));
        } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
          return new Uint8Array(e2).buffer;
        }, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.arraybuffer = { string: function(e2) {
          return s(new Uint8Array(e2));
        }, array: function(e2) {
          return f(new Uint8Array(e2), new Array(e2.byteLength));
        }, arraybuffer: n, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(new Uint8Array(e2));
        } }, c.uint8array = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return e2.buffer;
        }, uint8array: n, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.nodebuffer = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.nodebuffer.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return f(e2, new Uint8Array(e2.length));
        }, nodebuffer: n }, a.transformTo = function(e2, t2) {
          if (t2 = t2 || "", !e2) return t2;
          a.checkSupport(e2);
          var r2 = a.getTypeOf(t2);
          return c[r2][e2](t2);
        }, a.resolve = function(e2) {
          for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
            var i2 = t2[n2];
            "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
          }
          return r2.join("/");
        }, a.getTypeOf = function(e2) {
          return "string" == typeof e2 ? "string" : "[object Array]" === Object.prototype.toString.call(e2) ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && e2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && e2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, a.checkSupport = function(e2) {
          if (!o[e2.toLowerCase()]) throw new Error(e2 + " is not supported by this platform");
        }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
          var t2, r2, n2 = "";
          for (r2 = 0; r2 < (e2 || "").length; r2++) n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
          return n2;
        }, a.delay = function(e2, t2, r2) {
          setImmediate(function() {
            e2.apply(r2 || null, t2 || []);
          });
        }, a.inherits = function(e2, t2) {
          function r2() {
          }
          r2.prototype = t2.prototype, e2.prototype = new r2();
        }, a.extend = function() {
          var e2, t2, r2 = {};
          for (e2 = 0; e2 < arguments.length; e2++) for (t2 in arguments[e2]) Object.prototype.hasOwnProperty.call(arguments[e2], t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
          return r2;
        }, a.prepareContent = function(r2, e2, n2, i2, s2) {
          return u.Promise.resolve(e2).then(function(n3) {
            return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) && "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
              var e3 = new FileReader();
              e3.onload = function(e4) {
                t2(e4.target.result);
              }, e3.onerror = function(e4) {
                r3(e4.target.error);
              }, e3.readAsArrayBuffer(n3);
            }) : n3;
          }).then(function(e3) {
            var t2 = a.getTypeOf(e3);
            return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = (function(e4) {
              return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
            })(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
        "use strict";
        var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = e("./support");
        function h(e2) {
          this.files = [], this.loadOptions = e2;
        }
        h.prototype = { checkSignature: function(e2) {
          if (!this.reader.readAndCheckSignature(e2)) {
            this.reader.index -= 4;
            var t2 = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
          }
        }, isSignature: function(e2, t2) {
          var r2 = this.reader.index;
          this.reader.setIndex(e2);
          var n2 = this.reader.readString(4) === t2;
          return this.reader.setIndex(r2), n2;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
          this.zipComment = this.loadOptions.decodeFileName(r2);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; ) e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var e2, t2;
          for (e2 = 0; e2 < this.files.length; e2++) t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
        }, readCentralDir: function() {
          var e2;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
          if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
          if (e2 < 0) throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
          this.reader.setIndex(e2);
          var t2 = e2;
          if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
            if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var r2 = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
          var n2 = t2 - r2;
          if (0 < n2) this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
          else if (n2 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
        }, prepareReader: function(e2) {
          this.reader = n(e2);
        }, load: function(e2) {
          this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, t.exports = h;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
        "use strict";
        var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
        function l(e2, t2) {
          this.options = e2, this.loadOptions = t2;
        }
        l.prototype = { isEncrypted: function() {
          return 1 == (1 & this.bitFlag);
        }, useUTF8: function() {
          return 2048 == (2048 & this.bitFlag);
        }, readLocalPart: function(e2) {
          var t2, r2;
          if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if (null === (t2 = (function(e3) {
            for (var t3 in h) if (Object.prototype.hasOwnProperty.call(h, t3) && h[t3].magic === e3) return h[t3];
            return null;
          })(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
          this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
        }, readCentralPart: function(e2) {
          this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
          var t2 = e2.readInt(2);
          if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var e2 = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var e2 = n(this.extraFields[1].value);
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
          }
        }, readExtraFields: function(e2) {
          var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; ) t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
          e2.setIndex(i2);
        }, handleUTF8: function() {
          var e2 = u.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
          else {
            var t2 = this.findExtraFieldUnicodePath();
            if (null !== t2) this.fileNameStr = t2;
            else {
              var r2 = s.transformTo(e2, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r2);
            }
            var n2 = this.findExtraFieldUnicodeComment();
            if (null !== n2) this.fileCommentStr = n2;
            else {
              var i2 = s.transformTo(e2, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(i2);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var e2 = this.extraFields[28789];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var e2 = this.extraFields[25461];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        } }, t.exports = l;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
        "use strict";
        function n(e2, t2, r2) {
          this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
        }
        var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
        n.prototype = { internalStream: function(e2) {
          var t2 = null, r2 = "string";
          try {
            if (!e2) throw new Error("No output type specified.");
            var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
            "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
            var i2 = !this._dataBinary;
            i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
          } catch (e3) {
            (t2 = new h("error")).error(e3);
          }
          return new s(t2, r2, "");
        }, async: function(e2, t2) {
          return this.internalStream(e2).accumulate(t2);
        }, nodeStream: function(e2, t2) {
          return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
        }, _compressWorker: function(e2, t2) {
          if (this._data instanceof o && this._data.compression.magic === e2.magic) return this._data.getCompressedWorker();
          var r2 = this._decompressWorker();
          return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
        }, _decompressWorker: function() {
          return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
        } };
        for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, f = 0; f < u.length; f++) n.prototype[u[f]] = l;
        t.exports = n;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
        (function(t2) {
          "use strict";
          var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
          if (e2) {
            var i = 0, s = new e2(u), a = t2.document.createTextNode("");
            s.observe(a, { characterData: true }), r = function() {
              a.data = i = ++i % 2;
            };
          } else if (t2.setImmediate || void 0 === t2.MessageChannel) r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
            var e3 = t2.document.createElement("script");
            e3.onreadystatechange = function() {
              u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
            }, t2.document.documentElement.appendChild(e3);
          } : function() {
            setTimeout(u, 0);
          };
          else {
            var o = new t2.MessageChannel();
            o.port1.onmessage = u, r = function() {
              o.port2.postMessage(0);
            };
          }
          var h = [];
          function u() {
            var e3, t3;
            n = true;
            for (var r2 = h.length; r2; ) {
              for (t3 = h, h = [], e3 = -1; ++e3 < r2; ) t3[e3]();
              r2 = h.length;
            }
            n = false;
          }
          l.exports = function(e3) {
            1 !== h.push(e3) || n || r();
          };
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}], 37: [function(e, t, r) {
        "use strict";
        var i = e("immediate");
        function u() {
        }
        var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
        function o(e2) {
          if ("function" != typeof e2) throw new TypeError("resolver must be a function");
          this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
        }
        function h(e2, t2, r2) {
          this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
        }
        function f(t2, r2, n2) {
          i(function() {
            var e2;
            try {
              e2 = r2(n2);
            } catch (e3) {
              return l.reject(t2, e3);
            }
            e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
          });
        }
        function c(e2) {
          var t2 = e2 && e2.then;
          if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2) return function() {
            t2.apply(e2, arguments);
          };
        }
        function d(t2, e2) {
          var r2 = false;
          function n2(e3) {
            r2 || (r2 = true, l.reject(t2, e3));
          }
          function i2(e3) {
            r2 || (r2 = true, l.resolve(t2, e3));
          }
          var s2 = p(function() {
            e2(i2, n2);
          });
          "error" === s2.status && n2(s2.value);
        }
        function p(e2, t2) {
          var r2 = {};
          try {
            r2.value = e2(t2), r2.status = "success";
          } catch (e3) {
            r2.status = "error", r2.value = e3;
          }
          return r2;
        }
        (t.exports = o).prototype.finally = function(t2) {
          if ("function" != typeof t2) return this;
          var r2 = this.constructor;
          return this.then(function(e2) {
            return r2.resolve(t2()).then(function() {
              return e2;
            });
          }, function(e2) {
            return r2.resolve(t2()).then(function() {
              throw e2;
            });
          });
        }, o.prototype.catch = function(e2) {
          return this.then(null, e2);
        }, o.prototype.then = function(e2, t2) {
          if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s) return this;
          var r2 = new this.constructor(u);
          this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
          return r2;
        }, h.prototype.callFulfilled = function(e2) {
          l.resolve(this.promise, e2);
        }, h.prototype.otherCallFulfilled = function(e2) {
          f(this.promise, this.onFulfilled, e2);
        }, h.prototype.callRejected = function(e2) {
          l.reject(this.promise, e2);
        }, h.prototype.otherCallRejected = function(e2) {
          f(this.promise, this.onRejected, e2);
        }, l.resolve = function(e2, t2) {
          var r2 = p(c, t2);
          if ("error" === r2.status) return l.reject(e2, r2.value);
          var n2 = r2.value;
          if (n2) d(e2, n2);
          else {
            e2.state = a, e2.outcome = t2;
            for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; ) e2.queue[i2].callFulfilled(t2);
          }
          return e2;
        }, l.reject = function(e2, t2) {
          e2.state = s, e2.outcome = t2;
          for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; ) e2.queue[r2].callRejected(t2);
          return e2;
        }, o.resolve = function(e2) {
          if (e2 instanceof this) return e2;
          return l.resolve(new this(u), e2);
        }, o.reject = function(e2) {
          var t2 = new this(u);
          return l.reject(t2, e2);
        }, o.all = function(e2) {
          var r2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var n2 = e2.length, i2 = false;
          if (!n2) return this.resolve([]);
          var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
          for (; ++t2 < n2; ) h2(e2[t2], t2);
          return o2;
          function h2(e3, t3) {
            r2.resolve(e3).then(function(e4) {
              s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
            }, function(e4) {
              i2 || (i2 = true, l.reject(o2, e4));
            });
          }
        }, o.race = function(e2) {
          var t2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var r2 = e2.length, n2 = false;
          if (!r2) return this.resolve([]);
          var i2 = -1, s2 = new this(u);
          for (; ++i2 < r2; ) a2 = e2[i2], t2.resolve(a2).then(function(e3) {
            n2 || (n2 = true, l.resolve(s2, e3));
          }, function(e3) {
            n2 || (n2 = true, l.reject(s2, e3));
          });
          var a2;
          return s2;
        };
      }, { immediate: 36 }], 38: [function(e, t, r) {
        "use strict";
        var n = {};
        (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
        "use strict";
        var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
        function p(e2) {
          if (!(this instanceof p)) return new p(e2);
          this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
          var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
          if (r2 !== l) throw new Error(i[r2]);
          if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
            var n2;
            if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l) throw new Error(i[r2]);
            this._dict_set = true;
          }
        }
        function n(e2, t2) {
          var r2 = new p(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || i[r2.err];
          return r2.result;
        }
        p.prototype.push = function(e2, t2) {
          var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
          do {
            if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l) return this.onEnd(r2), !(this.ended = true);
            0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
          } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
          return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
        }, p.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, p.prototype.onEnd = function(e2) {
          e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, n(e2, t2);
        }, r.gzip = function(e2, t2) {
          return (t2 = t2 || {}).gzip = true, n(e2, t2);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
        "use strict";
        var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _ = Object.prototype.toString;
        function a(e2) {
          if (!(this instanceof a)) return new a(e2);
          this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
          var r2 = c.inflateInit2(this.strm, t2.windowBits);
          if (r2 !== m.Z_OK) throw new Error(n[r2]);
          this.header = new s(), c.inflateGetHeader(this.strm, this.header);
        }
        function o(e2, t2) {
          var r2 = new a(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || n[r2.err];
          return r2.result;
        }
        a.prototype.push = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
          do {
            if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK) return this.onEnd(r2), !(this.ended = true);
            h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
          } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
          return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
        }, a.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, a.prototype.onEnd = function(e2) {
          e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, o(e2, t2);
        }, r.ungzip = o;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
        "use strict";
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
        r.assign = function(e2) {
          for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
            var r2 = t2.shift();
            if (r2) {
              if ("object" != typeof r2) throw new TypeError(r2 + "must be non-object");
              for (var n2 in r2) r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
            }
          }
          return e2;
        }, r.shrinkBuf = function(e2, t2) {
          return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
        };
        var i = { arraySet: function(e2, t2, r2, n2, i2) {
          if (t2.subarray && e2.subarray) e2.set(t2.subarray(r2, r2 + n2), i2);
          else for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          var t2, r2, n2, i2, s2, a;
          for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++) n2 += e2[t2].length;
          for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++) s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
          return a;
        } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
          for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          return [].concat.apply([], e2);
        } };
        r.setTyped = function(e2) {
          e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
        }, r.setTyped(n);
      }, {}], 42: [function(e, t, r) {
        "use strict";
        var h = e("./common"), i = true, s = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (e2) {
          i = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (e2) {
          s = false;
        }
        for (var u = new h.Buf8(256), n = 0; n < 256; n++) u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
        function l(e2, t2) {
          if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i)) return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
          for (var r2 = "", n2 = 0; n2 < t2; n2++) r2 += String.fromCharCode(e2[n2]);
          return r2;
        }
        u[254] = u[254] = 1, r.string2buf = function(e2) {
          var t2, r2, n2, i2, s2, a = e2.length, o = 0;
          for (i2 = 0; i2 < a; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
          for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
          return t2;
        }, r.buf2binstring = function(e2) {
          return l(e2, e2.length);
        }, r.binstring2buf = function(e2) {
          for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++) t2[r2] = e2.charCodeAt(r2);
          return t2;
        }, r.buf2string = function(e2, t2) {
          var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
          for (r2 = n2 = 0; r2 < a; ) if ((i2 = e2[r2++]) < 128) o[n2++] = i2;
          else if (4 < (s2 = u[i2])) o[n2++] = 65533, r2 += s2 - 1;
          else {
            for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; ) i2 = i2 << 6 | 63 & e2[r2++], s2--;
            1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
          }
          return l(o, n2);
        }, r.utf8border = function(e2, t2) {
          var r2;
          for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); ) r2--;
          return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
        };
      }, { "./common": 41 }], 43: [function(e, t, r) {
        "use strict";
        t.exports = function(e2, t2, r2, n) {
          for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
            for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; ) ;
            i %= 65521, s %= 65521;
          }
          return i | s << 16 | 0;
        };
      }, {}], 44: [function(e, t, r) {
        "use strict";
        t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(e, t, r) {
        "use strict";
        var o = (function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n = 0; n < 8; n++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        })();
        t.exports = function(e2, t2, r2, n) {
          var i = o, s = n + r2;
          e2 ^= -1;
          for (var a = n; a < s; a++) e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
          return -1 ^ e2;
        };
      }, {}], 46: [function(e, t, r) {
        "use strict";
        var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _ = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
        function R(e2, t2) {
          return e2.msg = n[t2], t2;
        }
        function T(e2) {
          return (e2 << 1) - (4 < e2 ? 9 : 0);
        }
        function D(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        function F(e2) {
          var t2 = e2.state, r2 = t2.pending;
          r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
        }
        function N(e2, t2) {
          u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = t2;
        }
        function P(e2, t2) {
          e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
        }
        function L(e2, t2) {
          var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
          e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
          do {
            if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
              s2 += 2, r2++;
              do {
              } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
              if (n2 = S - (c2 - s2), s2 = c2 - S, a2 < n2) {
                if (e2.match_start = t2, o2 <= (a2 = n2)) break;
                d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
              }
            }
          } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
          return a2 <= e2.lookahead ? a2 : e2.lookahead;
        }
        function j(e2) {
          var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
          do {
            if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
              for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              i2 += f2;
            }
            if (0 === e2.strm.avail_in) break;
            if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x) for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); ) ;
          } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
        }
        function Z(e2, t2) {
          for (var r2, n2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x) if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
              for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; ) ;
              e2.strstart++;
            } else e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
            else n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
            if (n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function W(e2, t2) {
          for (var r2, n2, i2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
              for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; ) ;
              if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            } else if (e2.match_available) {
              if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out) return A;
            } else e2.match_available = 1, e2.strstart++, e2.lookahead--;
          }
          return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function M(e2, t2, r2, n2, i2) {
          this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
        }
        function H() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function G(e2) {
          var t2;
          return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _);
        }
        function K(e2) {
          var t2 = G(e2);
          return t2 === m && (function(e3) {
            e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
          })(e2.state), t2;
        }
        function Y(e2, t2, r2, n2, i2, s2) {
          if (!e2) return _;
          var a2 = 1;
          if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2) return R(e2, _);
          8 === n2 && (n2 = 9);
          var o2 = new H();
          return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
        }
        h = [new M(0, 0, 0, 0, function(e2, t2) {
          var r2 = 65535;
          for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
            if (e2.lookahead <= 1) {
              if (j(e2), 0 === e2.lookahead && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            e2.strstart += e2.lookahead, e2.lookahead = 0;
            var n2 = e2.block_start + r2;
            if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out)) return A;
            if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
        }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
          return Y(e2, t2, v, 15, 8, 0);
        }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
          return e2 && e2.state ? 2 !== e2.state.wrap ? _ : (e2.state.gzhead = t2, m) : _;
        }, r.deflate = function(e2, t2) {
          var r2, n2, i2, s2;
          if (!e2 || !e2.state || 5 < t2 || t2 < 0) return e2 ? R(e2, _) : _;
          if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f) return R(e2, 0 === e2.avail_out ? -5 : _);
          if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C) if (2 === n2.wrap) e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
          else {
            var a2 = v + (n2.w_bits - 8 << 4) << 8;
            a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
          }
          if (69 === n2.status) if (n2.gzhead.extra) {
            for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); ) U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
          } else n2.status = 73;
          if (73 === n2.status) if (n2.gzhead.name) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
          } else n2.status = 91;
          if (91 === n2.status) if (n2.gzhead.comment) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
          } else n2.status = 103;
          if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
            if (F(e2), 0 === e2.avail_out) return n2.last_flush = -1, m;
          } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f) return R(e2, -5);
          if (666 === n2.status && 0 !== e2.avail_in) return R(e2, -5);
          if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
            var o2 = 2 === n2.strategy ? (function(e3, t3) {
              for (var r3; ; ) {
                if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                  if (t3 === l) return A;
                  break;
                }
                if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            })(n2, t2) : 3 === n2.strategy ? (function(e3, t3) {
              for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                if (e3.lookahead <= S) {
                  if (j(e3), e3.lookahead <= S && t3 === l) return A;
                  if (0 === e3.lookahead) break;
                }
                if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                  s3 = e3.strstart + S;
                  do {
                  } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                  e3.match_length = S - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                }
                if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            })(n2, t2) : h[n2.level].func(n2, t2);
            if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O) return 0 === e2.avail_out && (n2.last_flush = -1), m;
            if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out)) return n2.last_flush = -1, m;
          }
          return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
        }, r.deflateEnd = function(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _;
        }, r.deflateSetDictionary = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
          if (!e2 || !e2.state) return _;
          if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead) return _;
          for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
            for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; ) ;
            r2.strstart = n2, r2.lookahead = x - 1, j(r2);
          }
          return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
        }, r.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
        "use strict";
        t.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
        };
      }, {}], 48: [function(e, t, r) {
        "use strict";
        t.exports = function(e2, t2) {
          var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _, g, b, v, y, w, k, x, S, z, C;
          r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _ = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
          e: do {
            p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
            t: for (; ; ) {
              if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255)) C[s++] = 65535 & v;
              else {
                if (!(16 & y)) {
                  if (0 == (64 & y)) {
                    v = m[(65535 & v) + (d & (1 << y) - 1)];
                    continue t;
                  }
                  if (32 & y) {
                    r2.mode = 12;
                    break e;
                  }
                  e2.msg = "invalid literal/length code", r2.mode = 30;
                  break e;
                }
                w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _[d & b];
                r: for (; ; ) {
                  if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                    if (0 == (64 & y)) {
                      v = _[(65535 & v) + (d & (1 << y) - 1)];
                      continue r;
                    }
                    e2.msg = "invalid distance code", r2.mode = 30;
                    break e;
                  }
                  if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break e;
                  }
                  if (d >>>= y, p -= y, (y = s - a) < k) {
                    if (l < (y = k - y) && r2.sane) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break e;
                    }
                    if (S = c, (x = 0) === f) {
                      if (x += u - y, y < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        x = s - k, S = C;
                      }
                    } else if (f < y) {
                      if (x += u + f - y, (y -= f) < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        if (x = 0, f < w) {
                          for (w -= y = f; C[s++] = c[x++], --y; ) ;
                          x = s - k, S = C;
                        }
                      }
                    } else if (x += f - y, y < w) {
                      for (w -= y; C[s++] = c[x++], --y; ) ;
                      x = s - k, S = C;
                    }
                    for (; 2 < w; ) C[s++] = S[x++], C[s++] = S[x++], C[s++] = S[x++], w -= 3;
                    w && (C[s++] = S[x++], 1 < w && (C[s++] = S[x++]));
                  } else {
                    for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); ) ;
                    w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (n < i && s < o);
          n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
        };
      }, {}], 49: [function(e, t, r) {
        "use strict";
        var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
        function L(e2) {
          return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
        }
        function s() {
          this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function a(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
        }
        function o(e2) {
          var t2;
          return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
        }
        function h(e2, t2) {
          var r2, n2;
          return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
        }
        function u(e2, t2) {
          var r2, n2;
          return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
        }
        var l, f, c = true;
        function j(e2) {
          if (c) {
            var t2;
            for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; ) e2.lens[t2++] = 8;
            for (; t2 < 256; ) e2.lens[t2++] = 9;
            for (; t2 < 280; ) e2.lens[t2++] = 7;
            for (; t2 < 288; ) e2.lens[t2++] = 8;
            for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; ) e2.lens[t2++] = 5;
            T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
          }
          e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
        }
        function Z(e2, t2, r2, n2) {
          var i2, s2 = e2.state;
          return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
        }
        r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
          return u(e2, 15);
        }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _, g, b, v, y, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in) return U;
          12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
          e: for (; ; ) switch (r2.mode) {
            case P:
              if (0 === r2.wrap) {
                r2.mode = 13;
                break;
              }
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (2 & r2.wrap && 35615 === u2) {
                E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                break;
              }
              if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                e2.msg = "incorrect header check", r2.mode = 30;
                break;
              }
              if (8 != (15 & u2)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits) r2.wbits = k;
              else if (k > r2.wbits) {
                e2.msg = "invalid window size", r2.mode = 30;
                break;
              }
              r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
              break;
            case 2:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.flags = u2, 8 != (255 & r2.flags)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (57344 & r2.flags) {
                e2.msg = "unknown header flags set", r2.mode = 30;
                break;
              }
              r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
            case 3:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
            case 4:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
            case 5:
              if (1024 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
              } else r2.head && (r2.head.extra = null);
              r2.mode = 6;
            case 6:
              if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length)) break e;
              r2.length = 0, r2.mode = 7;
            case 7:
              if (2048 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.name = null);
              r2.length = 0, r2.mode = 8;
            case 8:
              if (4096 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.comment = null);
              r2.mode = 9;
            case 9:
              if (512 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (65535 & r2.check)) {
                  e2.msg = "header crc mismatch", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
              break;
            case 10:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
            case 11:
              if (0 === r2.havedict) return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
              e2.adler = r2.check = 1, r2.mode = 12;
            case 12:
              if (5 === t2 || 6 === t2) break e;
            case 13:
              if (r2.last) {
                u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                break;
              }
              for (; l2 < 3; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                case 0:
                  r2.mode = 14;
                  break;
                case 1:
                  if (j(r2), r2.mode = 20, 6 !== t2) break;
                  u2 >>>= 2, l2 -= 2;
                  break e;
                case 2:
                  r2.mode = 17;
                  break;
                case 3:
                  e2.msg = "invalid block type", r2.mode = 30;
              }
              u2 >>>= 2, l2 -= 2;
              break;
            case 14:
              for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                e2.msg = "invalid stored block lengths", r2.mode = 30;
                break;
              }
              if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2) break e;
            case 15:
              r2.mode = 16;
            case 16:
              if (d = r2.length) {
                if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d) break e;
                I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                break;
              }
              r2.mode = 12;
              break;
            case 17:
              for (; l2 < 14; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                e2.msg = "too many length or distance symbols", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 18;
            case 18:
              for (; r2.have < r2.ncode; ) {
                for (; l2 < 3; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
              }
              for (; r2.have < 19; ) r2.lens[A[r2.have++]] = 0;
              if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid code lengths set", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 19;
            case 19:
              for (; r2.have < r2.nlen + r2.ndist; ) {
                for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (b < 16) u2 >>>= _, l2 -= _, r2.lens[r2.have++] = b;
                else {
                  if (16 === b) {
                    for (z = _ + 2; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (u2 >>>= _, l2 -= _, 0 === r2.have) {
                      e2.msg = "invalid bit length repeat", r2.mode = 30;
                      break;
                    }
                    k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                  } else if (17 === b) {
                    for (z = _ + 3; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _, k = 0, d = 3 + (7 & (u2 >>>= _)), u2 >>>= 3, l2 -= 3;
                  } else {
                    for (z = _ + 7; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _, k = 0, d = 11 + (127 & (u2 >>>= _)), u2 >>>= 7, l2 -= 7;
                  }
                  if (r2.have + d > r2.nlen + r2.ndist) {
                    e2.msg = "invalid bit length repeat", r2.mode = 30;
                    break;
                  }
                  for (; d--; ) r2.lens[r2.have++] = k;
                }
              }
              if (30 === r2.mode) break;
              if (0 === r2.lens[256]) {
                e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                break;
              }
              if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid literal/lengths set", r2.mode = 30;
                break;
              }
              if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                e2.msg = "invalid distances set", r2.mode = 30;
                break;
              }
              if (r2.mode = 20, 6 === t2) break e;
            case 20:
              r2.mode = 21;
            case 21:
              if (6 <= o2 && 258 <= h2) {
                e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                break;
              }
              for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (g && 0 == (240 & g)) {
                for (v = _, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _, l2 -= _, r2.back += _, r2.length = b, 0 === g) {
                r2.mode = 26;
                break;
              }
              if (32 & g) {
                r2.back = -1, r2.mode = 12;
                break;
              }
              if (64 & g) {
                e2.msg = "invalid literal/length code", r2.mode = 30;
                break;
              }
              r2.extra = 15 & g, r2.mode = 22;
            case 22:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              r2.was = r2.length, r2.mode = 23;
            case 23:
              for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (0 == (240 & g)) {
                for (v = _, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _, l2 -= _, r2.back += _, 64 & g) {
                e2.msg = "invalid distance code", r2.mode = 30;
                break;
              }
              r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
            case 24:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              if (r2.offset > r2.dmax) {
                e2.msg = "invalid distance too far back", r2.mode = 30;
                break;
              }
              r2.mode = 25;
            case 25:
              if (0 === h2) break e;
              if (d = c2 - h2, r2.offset > d) {
                if ((d = r2.offset - d) > r2.whave && r2.sane) {
                  e2.msg = "invalid distance too far back", r2.mode = 30;
                  break;
                }
                p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
              } else m = i2, p = a2 - r2.offset, d = r2.length;
              for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; ) ;
              0 === r2.length && (r2.mode = 21);
              break;
            case 26:
              if (0 === h2) break e;
              i2[a2++] = r2.length, h2--, r2.mode = 21;
              break;
            case 27:
              if (r2.wrap) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 |= n2[s2++] << l2, l2 += 8;
                }
                if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                  e2.msg = "incorrect data check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 28;
            case 28:
              if (r2.wrap && r2.flags) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (4294967295 & r2.total)) {
                  e2.msg = "incorrect length check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 29;
            case 29:
              x = 1;
              break e;
            case 30:
              x = -3;
              break e;
            case 31:
              return -4;
            case 32:
            default:
              return U;
          }
          return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
        }, r.inflateEnd = function(e2) {
          if (!e2 || !e2.state) return U;
          var t2 = e2.state;
          return t2.window && (t2.window = null), e2.state = null, N;
        }, r.inflateGetHeader = function(e2, t2) {
          var r2;
          return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
        }, r.inflateSetDictionary = function(e2, t2) {
          var r2, n2 = t2.length;
          return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
        }, r.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
        "use strict";
        var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        t.exports = function(e2, t2, r2, n, i, s, a, o) {
          var h, u, l, f, c, d, p, m, _, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
          for (b = 0; b <= 15; b++) O[b] = 0;
          for (v = 0; v < n; v++) O[t2[r2 + v]]++;
          for (k = g, w = 15; 1 <= w && 0 === O[w]; w--) ;
          if (w < k && (k = w), 0 === w) return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
          for (y = 1; y < w && 0 === O[y]; y++) ;
          for (k < y && (k = y), b = z = 1; b <= 15; b++) if (z <<= 1, (z -= O[b]) < 0) return -1;
          if (0 < z && (0 === e2 || 1 !== w)) return -1;
          for (B[1] = 0, b = 1; b < 15; b++) B[b + 1] = B[b] + O[b];
          for (v = 0; v < n; v++) 0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
          if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
          for (; ; ) {
            for (p = b - S, _ = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S, y = u = 1 << x; i[c + (E >> S) + (u -= h)] = p << 24 | m << 16 | _ | 0, 0 !== u; ) ;
            for (h = 1 << b - 1; E & h; ) h >>= 1;
            if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
              if (b === w) break;
              b = t2[r2 + a[v]];
            }
            if (k < b && (E & f) !== l) {
              for (0 === S && (S = k), c += y, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); ) x++, z <<= 1;
              if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
              i[l = E & f] = k << 24 | x << 16 | c - s | 0;
            }
          }
          return 0 !== E && (i[c + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(e, t, r) {
        "use strict";
        t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(e, t, r) {
        "use strict";
        var i = e("../utils/common"), o = 0, h = 1;
        function n(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _ = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
        n(z);
        var C = new Array(2 * f);
        n(C);
        var E = new Array(512);
        n(E);
        var A = new Array(256);
        n(A);
        var I = new Array(a);
        n(I);
        var O, B, R, T = new Array(f);
        function D(e2, t2, r2, n2, i2) {
          this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
        }
        function F(e2, t2) {
          this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
        }
        function N(e2) {
          return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
        }
        function P(e2, t2, r2) {
          e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
        }
        function L(e2, t2, r2) {
          P(e2, r2[2 * t2], r2[2 * t2 + 1]);
        }
        function j(e2, t2) {
          for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; ) ;
          return r2 >>> 1;
        }
        function Z(e2, t2, r2) {
          var n2, i2, s2 = new Array(g + 1), a2 = 0;
          for (n2 = 1; n2 <= g; n2++) s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
          for (i2 = 0; i2 <= t2; i2++) {
            var o2 = e2[2 * i2 + 1];
            0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
          }
        }
        function W(e2) {
          var t2;
          for (t2 = 0; t2 < l; t2++) e2.dyn_ltree[2 * t2] = 0;
          for (t2 = 0; t2 < f; t2++) e2.dyn_dtree[2 * t2] = 0;
          for (t2 = 0; t2 < c; t2++) e2.bl_tree[2 * t2] = 0;
          e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
        }
        function M(e2) {
          8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
        }
        function H(e2, t2, r2, n2) {
          var i2 = 2 * t2, s2 = 2 * r2;
          return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
        }
        function G(e2, t2, r2) {
          for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); ) e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
          e2.heap[r2] = n2;
        }
        function K(e2, t2, r2) {
          var n2, i2, s2, a2, o2 = 0;
          if (0 !== e2.last_lit) for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; ) ;
          L(e2, m, t2);
        }
        function Y(e2, t2) {
          var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
          for (e2.heap_len = 0, e2.heap_max = _, r2 = 0; r2 < h2; r2++) 0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
          for (; e2.heap_len < 2; ) s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
          for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--) G(e2, s2, r2);
          for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; ) ;
          e2.heap[--e2.heap_max] = e2.heap[1], (function(e3, t3) {
            var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
            for (s3 = 0; s3 <= g; s3++) e3.bl_count[s3] = 0;
            for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _; r3++) p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
            if (0 !== m2) {
              do {
                for (s3 = p2 - 1; 0 === e3.bl_count[s3]; ) s3--;
                e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
              } while (0 < m2);
              for (s3 = p2; 0 !== s3; s3--) for (n3 = e3.bl_count[s3]; 0 !== n3; ) u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
            }
          })(e2, t2), Z(s2, u2, e2.bl_count);
        }
        function X(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++) i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
        }
        function V(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++) if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
            if (o2 < u2) for (; L(e2, i2, e2.bl_tree), 0 != --o2; ) ;
            else 0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
            s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
          }
        }
        n(T);
        var q = false;
        function J(e2, t2, r2, n2) {
          P(e2, (s << 1) + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
            M(e3), n3 && (U(e3, r3), U(e3, ~r3)), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
          })(e2, t2, r2, true);
        }
        r._tr_init = function(e2) {
          q || ((function() {
            var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
            for (n2 = r2 = 0; n2 < a - 1; n2++) for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++) A[r2++] = n2;
            for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++) for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++) E[i2++] = n2;
            for (i2 >>= 7; n2 < f; n2++) for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++) E[256 + i2++] = n2;
            for (t2 = 0; t2 <= g; t2++) s2[t2] = 0;
            for (e3 = 0; e3 <= 143; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (; e3 <= 255; ) z[2 * e3 + 1] = 9, e3++, s2[9]++;
            for (; e3 <= 279; ) z[2 * e3 + 1] = 7, e3++, s2[7]++;
            for (; e3 <= 287; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++) C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
            O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
          })(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
        }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
          var i2, s2, a2 = 0;
          0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = (function(e3) {
            var t3, r3 = 4093624447;
            for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1) if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3]) return o;
            if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26]) return h;
            for (t3 = 32; t3 < u; t3++) if (0 !== e3.dyn_ltree[2 * t3]) return h;
            return o;
          })(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = (function(e3) {
            var t3;
            for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S[t3] + 1]; t3--) ;
            return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
          })(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
            var i3;
            for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) P(e3, e3.bl_tree[2 * S[i3] + 1], 3);
            V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
          })(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
        }, r._tr_tally = function(e2, t2, r2) {
          return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
        }, r._tr_align = function(e2) {
          P(e2, 2, 3), L(e2, m, z), (function(e3) {
            16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
          })(e2);
        };
      }, { "../utils/common": 41 }], 53: [function(e, t, r) {
        "use strict";
        t.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(e, t, r) {
        (function(e2) {
          !(function(r2, n) {
            "use strict";
            if (!r2.setImmediate) {
              var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
              e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                process.nextTick(function() {
                  c(e4);
                });
              } : (function() {
                if (r2.postMessage && !r2.importScripts) {
                  var e4 = true, t3 = r2.onmessage;
                  return r2.onmessage = function() {
                    e4 = false;
                  }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                }
              })() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                r2.postMessage(a + e4, "*");
              }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                c(e4.data);
              }, function(e4) {
                t2.port2.postMessage(e4);
              }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                var t3 = l.createElement("script");
                t3.onreadystatechange = function() {
                  c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                }, s.appendChild(t3);
              }) : function(e4) {
                setTimeout(c, 0, e4);
              }, e3.setImmediate = function(e4) {
                "function" != typeof e4 && (e4 = new Function("" + e4));
                for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++) t3[r3] = arguments[r3 + 1];
                var n2 = { callback: e4, args: t3 };
                return h[o] = n2, i(o), o++;
              }, e3.clearImmediate = f;
            }
            function f(e4) {
              delete h[e4];
            }
            function c(e4) {
              if (u) setTimeout(c, 0, e4);
              else {
                var t3 = h[e4];
                if (t3) {
                  u = true;
                  try {
                    !(function(e5) {
                      var t4 = e5.callback, r3 = e5.args;
                      switch (r3.length) {
                        case 0:
                          t4();
                          break;
                        case 1:
                          t4(r3[0]);
                          break;
                        case 2:
                          t4(r3[0], r3[1]);
                          break;
                        case 3:
                          t4(r3[0], r3[1], r3[2]);
                          break;
                        default:
                          t4.apply(n, r3);
                      }
                    })(t3);
                  } finally {
                    f(e4), u = false;
                  }
                }
              }
            }
            function d(e4) {
              e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
            }
          })("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}] }, {}, [10])(10);
    });
  }
});

// src/hrv-metrics.js
function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function standardDeviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}
function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, (sorted.length - 1) * pct));
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  return sorted[lo] * (1 - (index - lo)) + sorted[hi] * (index - lo);
}
function computeTimeDomainExtras(nnValuesMs, windows = []) {
  if (nnValuesMs.length < 3) {
    return { meanNN: 0, medianNN: 0, cvNN: 0, pNN20: 0, sdann: null, sdnnIndex: null };
  }
  const avg = mean(nnValuesMs);
  const sdnn = standardDeviation(nnValuesMs);
  let nn20 = 0;
  let pairs = 0;
  for (let index = 1; index < nnValuesMs.length; index++) {
    if (Math.abs(nnValuesMs[index] - nnValuesMs[index - 1]) > 20) nn20++;
    pairs++;
  }
  const validWindows = windows.filter((window2) => window2.hrvValid && Number.isFinite(window2.meanNN ?? window2.sdnn));
  const windowMeans = validWindows.map((window2) => window2.meanNN).filter(Number.isFinite);
  const windowSdnns = validWindows.map((window2) => window2.sdnn).filter((value) => Number.isFinite(value) && value > 0);
  return {
    meanNN: avg,
    medianNN: median(nnValuesMs),
    cvNN: avg ? sdnn / avg * 100 : 0,
    pNN20: pairs ? nn20 / pairs * 100 : 0,
    sdann: windowMeans.length >= 3 ? standardDeviation(windowMeans) : null,
    sdnnIndex: windowSdnns.length >= 3 ? mean(windowSdnns) : null
  };
}
function fft(real, imag) {
  const n = real.length;
  if (n <= 1) return;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = -2 * Math.PI / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const evenRe = real[i + k];
        const evenIm = imag[i + k];
        const oddRe = real[i + k + len / 2] * curRe - imag[i + k + len / 2] * curIm;
        const oddIm = real[i + k + len / 2] * curIm + imag[i + k + len / 2] * curRe;
        real[i + k] = evenRe + oddRe;
        imag[i + k] = evenIm + oddIm;
        real[i + k + len / 2] = evenRe - oddRe;
        imag[i + k + len / 2] = evenIm - oddIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}
function welchPsd(series, sampleHz, segmentLength = 256) {
  if (series.length < segmentLength) segmentLength = 1 << Math.floor(Math.log2(Math.max(8, series.length)));
  if (series.length < 16) return null;
  const hop = Math.max(1, Math.floor(segmentLength / 2));
  const window2 = new Float64Array(segmentLength);
  let windowPower = 0;
  for (let i = 0; i < segmentLength; i++) {
    window2[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (segmentLength - 1));
    windowPower += window2[i] * window2[i];
  }
  const half = segmentLength / 2;
  const psd = new Float64Array(half + 1);
  let segments = 0;
  for (let start = 0; start + segmentLength <= series.length; start += hop) {
    const real = new Float64Array(segmentLength);
    const imag = new Float64Array(segmentLength);
    let segMean = 0;
    for (let i = 0; i < segmentLength; i++) segMean += series[start + i];
    segMean /= segmentLength;
    for (let i = 0; i < segmentLength; i++) real[i] = (series[start + i] - segMean) * window2[i];
    fft(real, imag);
    for (let k = 0; k <= half; k++) {
      const power = (real[k] * real[k] + imag[k] * imag[k]) / (sampleHz * windowPower);
      psd[k] += k === 0 || k === half ? power : 2 * power;
    }
    segments++;
  }
  if (!segments) return null;
  const freqs = new Float64Array(half + 1);
  for (let k = 0; k <= half; k++) {
    psd[k] /= segments;
    freqs[k] = k * sampleHz / segmentLength;
  }
  return { freqs, psd };
}
function bandPower(freqs, psd, lo, hi) {
  let power = 0;
  for (let k = 1; k < freqs.length; k++) {
    const centre = freqs[k];
    if (centre >= lo && centre < hi) power += psd[k] * (freqs[k] - freqs[k - 1]);
  }
  return power;
}
function peakFrequency(freqs, psd, lo, hi) {
  let best = null;
  for (let k = 1; k < freqs.length; k++) {
    if (freqs[k] < lo || freqs[k] >= hi) continue;
    if (!best || psd[k] > best.power) best = { freq: freqs[k], power: psd[k] };
  }
  return best?.freq ?? null;
}
function resampleTachogram(beats, startSec, endSec, sampleHz = 4, maxGapSec = 5) {
  const inRange = beats.filter((beat) => beat.timeSec >= startSec && beat.timeSec <= endSec);
  if (inRange.length < 8) return null;
  const count = Math.floor((endSec - startSec) * sampleHz);
  if (count < 16) return null;
  const series = new Float64Array(count);
  let beatIndex = 0;
  for (let i = 0; i < count; i++) {
    const t = startSec + i / sampleHz;
    while (beatIndex + 1 < inRange.length && inRange[beatIndex + 1].timeSec <= t) beatIndex++;
    const left = inRange[Math.min(beatIndex, inRange.length - 1)];
    const right = inRange[Math.min(beatIndex + 1, inRange.length - 1)];
    if (t <= left.timeSec) {
      series[i] = left.nnMs;
      continue;
    }
    if (t >= right.timeSec || right === left) {
      series[i] = right.nnMs;
      continue;
    }
    const span = right.timeSec - left.timeSec;
    if (span > maxGapSec) {
      series[i] = (left.nnMs + right.nnMs) / 2;
      continue;
    }
    const weight = (t - left.timeSec) / span;
    series[i] = left.nnMs * (1 - weight) + right.nnMs * weight;
  }
  return series;
}
function computeFrequencyDomain(beats, hrvWindows) {
  const sampleHz = 4;
  const perWindow = [];
  for (const window2 of hrvWindows) {
    if (!window2.hrvValid) continue;
    const series = resampleTachogram(beats, window2.startSec, window2.endSec, sampleHz);
    if (!series) continue;
    const spectrum = welchPsd(series, sampleHz, 256);
    if (!spectrum) continue;
    const vlf = bandPower(spectrum.freqs, spectrum.psd, 33e-4, 0.04);
    const lf = bandPower(spectrum.freqs, spectrum.psd, 0.04, 0.15);
    const hf = bandPower(spectrum.freqs, spectrum.psd, 0.15, 0.4);
    const totalPower = vlf + lf + hf;
    const hfPeak = peakFrequency(spectrum.freqs, spectrum.psd, 0.15, 0.4);
    perWindow.push({
      startSec: window2.startSec,
      endSec: window2.endSec,
      centerSec: (window2.startSec + window2.endSec) / 2,
      vlf,
      lf,
      hf,
      totalPower,
      lfHfRatio: hf > 0 ? lf / hf : null,
      lfNu: lf + hf > 0 ? lf / (lf + hf) * 100 : null,
      hfNu: lf + hf > 0 ? hf / (lf + hf) * 100 : null,
      hfPeakHz: hfPeak,
      respirationBpm: Number.isFinite(hfPeak) ? hfPeak * 60 : null
    });
  }
  if (!perWindow.length) {
    return { available: false, windows: [], session: null };
  }
  const pick = (key) => perWindow.map((w) => w[key]).filter(Number.isFinite);
  const session = {
    vlf: median(pick("vlf")),
    lf: median(pick("lf")),
    hf: median(pick("hf")),
    totalPower: median(pick("totalPower")),
    lfHfRatio: median(pick("lfHfRatio")),
    lfNu: median(pick("lfNu")),
    hfNu: median(pick("hfNu")),
    respirationBpm: median(pick("respirationBpm")) || null,
    windowCount: perWindow.length
  };
  return { available: true, windows: perWindow, session };
}
function computeNonlinear(nnValuesMs) {
  if (nnValuesMs.length < 10) {
    return { available: false, sd1: null, sd2: null, sd1Sd2Ratio: null, stressIndex: null, triangularIndex: null, ellipseAreaMs2: null };
  }
  const diffs = [];
  for (let index = 1; index < nnValuesMs.length; index++) diffs.push(nnValuesMs[index] - nnValuesMs[index - 1]);
  const sdsd = standardDeviation(diffs);
  const sdnn = standardDeviation(nnValuesMs);
  const sd1 = Math.sqrt(Math.max(0, sdsd * sdsd / 2));
  const sd2 = Math.sqrt(Math.max(0, 2 * sdnn * sdnn - sd1 * sd1));
  const binMs = 50;
  const bins = /* @__PURE__ */ new Map();
  for (const nn of nnValuesMs) {
    const bin = Math.floor(nn / binMs) * binMs;
    bins.set(bin, (bins.get(bin) ?? 0) + 1);
  }
  let modalBin = null;
  let modalCount = 0;
  for (const [bin, count] of bins) {
    if (count > modalCount) {
      modalCount = count;
      modalBin = bin;
    }
  }
  const moSec = (modalBin + binMs / 2) / 1e3;
  const amoPct = modalCount / nnValuesMs.length * 100;
  const mxDMnSec = Math.max(0.05, (percentile(nnValuesMs, 0.98) - percentile(nnValuesMs, 0.02)) / 1e3);
  const stressIndex = moSec > 0 ? amoPct / (2 * moSec * mxDMnSec) : null;
  const htiBinMs = 1e3 / 128;
  const htiBins = /* @__PURE__ */ new Map();
  for (const nn of nnValuesMs) {
    const bin = Math.round(nn / htiBinMs);
    htiBins.set(bin, (htiBins.get(bin) ?? 0) + 1);
  }
  const htiModal = Math.max(...htiBins.values());
  const triangularIndex = htiModal ? nnValuesMs.length / htiModal : null;
  return {
    available: true,
    sd1,
    sd2,
    sd1Sd2Ratio: sd2 > 0 ? sd1 / sd2 : null,
    stressIndex,
    triangularIndex,
    ellipseAreaMs2: Math.PI * sd1 * sd2
  };
}

// src/signal-quality.js
var clamp = (value, low, high) => Math.max(low, Math.min(high, value));
function median2(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function percentile2(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = clamp((sorted.length - 1) * fraction, 0, sorted.length - 1);
  const low = Math.floor(position);
  const high = Math.ceil(position);
  const weight = position - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}
function lowerBound(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] < target) low = middle + 1;
    else high = middle;
  }
  return low;
}
function countPeaks(peaks, startIndex, endIndex) {
  return Math.max(0, lowerBound(peaks, endIndex) - lowerBound(peaks, startIndex));
}
function detectorAgreementInRange(primary, secondary, startIndex, endIndex, toleranceSamples) {
  const first = primary.slice(lowerBound(primary, startIndex), lowerBound(primary, endIndex));
  const second = secondary.slice(lowerBound(secondary, startIndex), lowerBound(secondary, endIndex));
  if (!first.length && !second.length) return 0;
  let matches = 0;
  let secondIndex = 0;
  for (const peak of first) {
    while (secondIndex < second.length && second[secondIndex] < peak - toleranceSamples) secondIndex++;
    if (secondIndex < second.length && Math.abs(second[secondIndex] - peak) <= toleranceSamples) matches++;
  }
  return 2 * matches / Math.max(1, first.length + second.length) * 100;
}
function mergeExcludedSegments(segments) {
  const excluded = [];
  let current = null;
  for (const segment of segments) {
    if (segment.hrUsable) {
      if (current) excluded.push(current);
      current = null;
      continue;
    }
    if (!current || segment.startSec - current.endSec > 0.25) {
      if (current) excluded.push(current);
      current = {
        startSec: segment.startSec,
        endSec: segment.endSec,
        reason: segment.reason,
        minimumScore: segment.score
      };
    } else {
      current.endSec = segment.endSec;
      current.minimumScore = Math.min(current.minimumScore, segment.score);
      if (!current.reason.includes(segment.reason)) current.reason += `; ${segment.reason}`;
    }
  }
  if (current) excluded.push(current);
  return excluded;
}
function gradeUsability(percentage) {
  if (percentage >= 90) return "High";
  if (percentage >= 75) return "Good";
  if (percentage >= 55) return "Limited";
  return "Insufficient";
}
function qualitySegmentAt(segments, timeSec) {
  if (!segments?.length || !Number.isFinite(timeSec)) return null;
  const index = Math.min(segments.length - 1, Math.max(0, Math.floor(timeSec / (segments[0].durationSec || 10))));
  const direct = segments[index];
  if (direct && timeSec >= direct.startSec && timeSec < direct.endSec) return direct;
  return segments.find((segment) => timeSec >= segment.startSec && timeSec < segment.endSec) ?? null;
}
function buildSignalQualityTimeline({
  ecgs,
  ecgTimes,
  sampleRate,
  minTime,
  durationSec,
  primaryPeaks = [],
  secondaryPeaks = [],
  segmentDurationSec = 10
}) {
  const segmentCount = Math.max(1, Math.ceil(durationSec / segmentDurationSec));
  const rawSegments = [];
  const toleranceSamples = Math.max(1, Math.round(sampleRate * 0.1));
  let sampleIndex = 0;
  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
    const startSec = segmentIndex * segmentDurationSec;
    const endSec = Math.min(durationSec, startSec + segmentDurationSec);
    const startTime = minTime + startSec * 1e9;
    const endTime = minTime + endSec * 1e9;
    while (sampleIndex < ecgTimes.length && ecgTimes[sampleIndex] < startTime) sampleIndex++;
    const startIndex = sampleIndex;
    while (sampleIndex < ecgTimes.length && ecgTimes[sampleIndex] < endTime) sampleIndex++;
    const endIndex = sampleIndex;
    const count = endIndex - startIndex;
    const expected = Math.max(1, (endSec - startSec) * sampleRate);
    const coverage = clamp(count / expected * 100, 0, 100);
    const stride = Math.max(1, Math.floor(count / 500));
    const sample = [];
    const differences = [];
    let equalDifferences = 0;
    let repeatedExtrema = 0;
    let previous = null;
    let localMin = Infinity;
    let localMax = -Infinity;
    for (let index = startIndex; index < endIndex; index += stride) {
      const value = ecgs[index];
      if (!Number.isFinite(value)) continue;
      sample.push(value);
      localMin = Math.min(localMin, value);
      localMax = Math.max(localMax, value);
      if (previous !== null) differences.push(Math.abs(value - previous));
      previous = value;
    }
    const p05 = percentile2(sample, 0.05);
    const p95 = percentile2(sample, 0.95);
    const amplitude = Math.max(Number.EPSILON, p95 - p05);
    const flatThreshold = Math.max(Number.EPSILON, amplitude * 5e-4);
    for (const difference of differences) if (difference <= flatThreshold) equalDifferences++;
    for (const value of sample) {
      if (value === localMin || value === localMax) repeatedExtrema++;
    }
    const flatlinePct = differences.length ? equalDifferences / differences.length * 100 : 100;
    const clippedPct = sample.length ? Math.max(0, repeatedExtrema - 2) / sample.length * 100 : 100;
    const noiseRatio = amplitude ? median2(differences) / amplitude : 1;
    const baseline = median2(sample);
    const detectorAgreement = detectorAgreementInRange(primaryPeaks, secondaryPeaks, startIndex, endIndex, toleranceSamples);
    const detectedBeats = countPeaks(primaryPeaks, startIndex, endIndex);
    rawSegments.push({
      startSec,
      endSec,
      durationSec: endSec - startSec,
      startIndex,
      endIndex,
      sampleCount: count,
      expectedSamples: expected,
      coverage,
      amplitude,
      baseline,
      noiseRatio,
      flatlinePct,
      clippedPct,
      detectorAgreement,
      detectedBeats
    });
  }
  const referenceAmplitude = median2(rawSegments.map((segment) => segment.amplitude).filter((value) => value > Number.EPSILON)) || 1;
  const referenceNoise = median2(rawSegments.map((segment) => segment.noiseRatio).filter(Number.isFinite)) || 0.02;
  const baselineStepReference = median2(rawSegments.slice(1).map((segment, index) => Math.abs(segment.baseline - rawSegments[index].baseline))) || referenceAmplitude * 0.05;
  const segments = rawSegments.map((segment, index) => {
    const amplitudeRatio = segment.amplitude / referenceAmplitude;
    const noiseMultiple = segment.noiseRatio / Math.max(2e-3, referenceNoise);
    const baselineStep = index ? Math.abs(segment.baseline - rawSegments[index - 1].baseline) : 0;
    const baselineStepMultiple = baselineStep / Math.max(referenceAmplitude * 0.05, baselineStepReference);
    let score = 100;
    const reasons = [];
    if (segment.coverage < 80) {
      score -= 55;
      reasons.push("large timestamp gap");
    } else if (segment.coverage < 95) {
      score -= 20;
      reasons.push("missing samples");
    }
    if (amplitudeRatio < 0.08) {
      score -= 60;
      reasons.push("near-flat contact");
    } else if (amplitudeRatio < 0.25) {
      score -= 30;
      reasons.push("low signal amplitude");
    } else if (amplitudeRatio > 8) {
      score -= 55;
      reasons.push("large contact shift");
    } else if (amplitudeRatio > 4) {
      score -= 25;
      reasons.push("unstable amplitude");
    }
    if (segment.flatlinePct > 20) {
      score -= 55;
      reasons.push("flatline");
    } else if (segment.flatlinePct > 5) {
      score -= 20;
      reasons.push("repeated samples");
    }
    if (segment.clippedPct > 8) {
      score -= 35;
      reasons.push("clipping");
    } else if (segment.clippedPct > 2) {
      score -= 15;
      reasons.push("possible clipping");
    }
    if (noiseMultiple > 8 && segment.noiseRatio > 0.18) {
      score -= 40;
      reasons.push("high-frequency noise");
    } else if (noiseMultiple > 4 && segment.noiseRatio > 0.1) {
      score -= 18;
      reasons.push("elevated noise");
    }
    if (baselineStepMultiple > 10 && baselineStep > referenceAmplitude) {
      score -= 45;
      reasons.push("electrode displacement");
    } else if (baselineStepMultiple > 5 && baselineStep > referenceAmplitude * 0.4) {
      score -= 20;
      reasons.push("baseline step");
    }
    if (segment.detectedBeats >= 3) {
      if (segment.detectorAgreement < 45) {
        score -= 35;
        reasons.push("peak detectors disagree");
      } else if (segment.detectorAgreement < 70) {
        score -= 15;
        reasons.push("limited peak agreement");
      }
    }
    score = Math.round(clamp(score, 0, 100));
    const displacement = reasons.some((reason) => ["near-flat contact", "large contact shift", "electrode displacement", "flatline"].includes(reason));
    const hrUsable = score >= 45 && segment.coverage >= 75 && amplitudeRatio >= 0.06;
    const hrvUsable = score >= 72 && segment.detectorAgreement >= 70 && !displacement;
    const morphologyUsable = score >= 78 && noiseMultiple <= 5 && amplitudeRatio >= 0.25 && amplitudeRatio <= 4;
    return {
      ...segment,
      score,
      amplitudeRatio,
      noiseMultiple,
      baselineStep,
      baselineStepMultiple,
      displacement,
      hrUsable,
      hrvUsable,
      morphologyUsable,
      reason: reasons.join(", ") || "clean signal"
    };
  });
  const totalSeconds = segments.reduce((sum, segment) => sum + segment.durationSec, 0) || durationSec || 1;
  const percentFor = (key) => segments.reduce((sum, segment) => sum + (segment[key] ? segment.durationSec : 0), 0) / totalSeconds * 100;
  const hrUsablePercentage = percentFor("hrUsable");
  const hrvUsablePercentage = percentFor("hrvUsable");
  const morphologyUsablePercentage = percentFor("morphologyUsable");
  const excludedEpisodes = mergeExcludedSegments(segments);
  const flatlineDurationSec = segments.reduce((sum, segment) => sum + (segment.flatlinePct > 20 ? segment.durationSec : 0), 0);
  const clippedSamplePercentage = segments.reduce((sum, segment) => sum + segment.clippedPct * segment.sampleCount, 0) / Math.max(1, segments.reduce((sum, segment) => sum + segment.sampleCount, 0));
  return {
    segmentDurationSec,
    segments,
    excludedEpisodes,
    hrUsablePercentage,
    hrvUsablePercentage,
    morphologyUsablePercentage,
    grades: {
      hr: gradeUsability(hrUsablePercentage),
      hrv: gradeUsability(hrvUsablePercentage),
      morphology: gradeUsability(morphologyUsablePercentage)
    },
    flatlineDurationSec,
    clippedSamplePercentage,
    baselineWanderIndex: median2(segments.map((segment) => segment.baselineStep / Math.max(referenceAmplitude, Number.EPSILON))),
    highFrequencyNoiseIndex: median2(segments.map((segment) => segment.noiseRatio)),
    displacementEpisodeCount: excludedEpisodes.filter((episode) => episode.reason.includes("contact") || episode.reason.includes("displacement") || episode.reason.includes("flatline")).length
  };
}

// src/respiration.js
var mean2 = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
function quantile(xs, q) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), i = (s.length - 1) * q;
  return s[Math.floor(i)] * (1 - i % 1) + s[Math.ceil(i)] * (i % 1);
}
var median3 = (xs) => quantile(xs, 0.5);
function resample(points, key, start, end, maxGap) {
  const xs = points.filter((p) => Number.isFinite(p[key]));
  if (xs.length < 12 || xs[0].timeSec > start || xs.at(-1).timeSec < end - 0.25) return null;
  const values = [];
  let j = 0;
  for (let t = start; t < end; t += 0.25) {
    while (j + 1 < xs.length && xs[j + 1].timeSec < t) j++;
    const a = xs[j], b = xs[j + 1];
    if (!b || b.timeSec - a.timeSec > maxGap) return null;
    values.push(a[key] + (b[key] - a[key]) * (t - a.timeSec) / (b.timeSec - a.timeSec));
  }
  return values;
}
function spectralCandidate(values, minBpm, maxBpm, minVariation) {
  if (!values || values.length < 64) return null;
  const n = values.length, mid = (n - 1) / 2, avg = mean2(values);
  let numerator = 0, denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - mid) * (values[i] - avg);
    denominator += (i - mid) ** 2;
  }
  const detrended = values.map((v, i) => v - avg - numerator / denominator * (i - mid));
  const sd = Math.sqrt(mean2(detrended.map((v) => v * v)));
  if (sd < minVariation) return null;
  const center = median3(detrended), mad = median3(detrended.map((v) => Math.abs(v - center))) || sd;
  const real = new Float64Array(1024), imag = new Float64Array(1024);
  for (let i = 0; i < n; i++) real[i] = Math.max(-5 * mad, Math.min(5 * mad, detrended[i] - center)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
  fft(real, imag);
  const power = Array.from(real, (v, i) => v * v + imag[i] * imag[i]);
  return describeSpectrum(power, minBpm, maxBpm, 240 / n);
}
function describeSpectrum(power, minBpm, maxBpm, resolutionBpm) {
  const binBpm = 240 / power.length;
  const lo = Math.ceil(minBpm / binBpm), hi = Math.floor(maxBpm / binBpm);
  if (hi <= lo + 4) return null;
  let peak = lo, total = 0;
  for (let k = lo; k <= hi; k++) {
    total += power[k];
    if (power[k] > power[peak]) peak = k;
  }
  if (!total) return null;
  let local = 0, competitor = 0;
  for (let k = lo; k <= hi; k++) {
    if (Math.abs(k - peak) * binBpm <= resolutionBpm) local += power[k];
    if (Math.abs(k - peak) * binBpm > resolutionBpm * 1.5) competitor = Math.max(competitor, power[k]);
  }
  const concentration = local / total, prominence = power[peak] / Math.max(competitor, 1e-20);
  const score = Math.round(100 * Math.min(1, concentration) * Math.min(1, prominence / 3));
  const resolved = peak > lo + 1 && peak < hi - 1;
  return {
    bpm: peak * binBpm,
    concentration,
    prominence,
    score,
    usable: resolved && concentration >= 0.45 && prominence >= 1.7,
    strong: resolved && concentration >= 0.65 && prominence >= 3.5,
    spectrum: power.map((p) => p / total),
    peak
  };
}
function fuseSpectra(timing, shape, minBpm, maxBpm, resolutionBpm) {
  if (!timing || !shape) return null;
  const combined = describeSpectrum(timing.spectrum.map((p, i) => p * shape.spectrum[i]), minBpm, maxBpm, resolutionBpm);
  if (!combined?.usable) return null;
  const k = combined.peak;
  if (timing.spectrum[k] < timing.spectrum[timing.peak] * 0.25 || shape.spectrum[k] < shape.spectrum[shape.peak] * 0.25) return null;
  return combined;
}
var diagnostic = (candidate) => {
  if (!candidate) return null;
  const { spectrum, peak, ...summary } = candidate;
  return summary;
};
function summarizeRespiration(windows) {
  const accepted = windows.filter((w) => Number.isFinite(w.bpm));
  const rates = accepted.map((w) => w.bpm);
  return {
    medianBpm: median3(rates),
    p10Bpm: quantile(rates, 0.1),
    p90Bpm: quantile(rates, 0.9),
    acceptedWindows: accepted.length,
    totalWindows: windows.length,
    coveragePct: windows.length ? accepted.length / windows.length * 100 : 0,
    agreementWindows: accepted.filter((w) => w.source === "timing + morphology").length
  };
}
function estimateRespiration({ ecgs, ecgTimes, primaryPeaks, cleanRrs, minTime, durationSec, sampleRate, qualityTimeline, gaps = [], mode = "rest" }) {
  const exercise = ["workout", "interval-test", "mixed"].includes(mode);
  const windowSec = exercise ? 32 : 64, stepSec = exercise ? 10 : 30;
  const minBpm = exercise ? 12 : 6;
  const cleanTimes = new Set(cleanRrs.map((rr) => rr.time));
  const features = [];
  for (const peak of primaryPeaks) {
    const timeSec = (ecgTimes[peak] - minTime) / 1e9;
    const quality = qualitySegmentAt(qualityTimeline, timeSec);
    if (!cleanTimes.has(ecgTimes[peak]) || !quality?.morphologyUsable) continue;
    const left = peak - Math.ceil(sampleRate * 0.055), right = peak + Math.ceil(sampleRate * 0.075);
    if (left < 0 || right >= ecgs.length || (ecgTimes[right] - ecgTimes[left]) / 1e9 > 0.17) continue;
    const baseline = (ecgs[left] + ecgs[right]) / 2;
    let low = Infinity, high = -Infinity, area = 0;
    for (let i = left; i <= right; i++) {
      low = Math.min(low, ecgs[i]);
      high = Math.max(high, ecgs[i]);
      area += Math.abs(ecgs[i] - baseline);
    }
    features.push({ timeSec, amplitude: high - low, area: area / (right - left + 1) });
  }
  const timing = cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, nnMs: rr.val }));
  const windows = [];
  let ti = 0, fi = 0, gi = 0;
  for (let startSec = 0; startSec + windowSec <= durationSec; startSec += stepSec) {
    const endSec = startSec + windowSec, centerSec = (startSec + endSec) / 2;
    while (ti + 1 < timing.length && timing[ti + 1].timeSec < startSec) ti++;
    while (fi + 1 < features.length && features[fi + 1].timeSec < startSec) fi++;
    while (gi < gaps.length && gaps[gi].timeSec + gaps[gi].durationSec < startSec) gi++;
    let te = ti;
    while (te < timing.length && timing[te].timeSec < endSec + 2) te++;
    let fe = fi;
    while (fe < features.length && features[fe].timeSec < endSec + 2) fe++;
    const nn = timing.slice(ti, te), morphology = features.slice(fi, fe);
    const nnInside = nn.filter((p) => p.timeSec >= startSec && p.timeSec < endSec);
    const typicalNn = median3(nnInside.map((p) => p.nnMs));
    const hrBpm = typicalNn > 0 ? 6e4 / typicalNn : null;
    const maxBpm = Math.min(72, (hrBpm || 0) * 0.45);
    const result = { startSec, endSec, centerSec, bpm: null, score: null, support: "unavailable", source: "", reason: "", hrBpm, maxBpm, channels: {} };
    let hasGap = false;
    for (let g = gi; g < gaps.length && gaps[g].timeSec < endSec; g++) if (gaps[g].durationSec > 0.25) hasGap = true;
    const cleanCoverage = nnInside.reduce((sum, p) => sum + p.nnMs / 1e3, 0) / windowSec;
    if (hasGap) result.reason = "ECG gap";
    else if (!hrBpm || cleanCoverage < 0.8) result.reason = "Insufficient clean beats";
    else if (maxBpm < minBpm + 4) result.reason = "Insufficient beat sampling rate";
    else {
      const maxGap = Math.min(3, Math.max(1.5, typicalNn / 1e3 * 2.5));
      const rsa = spectralCandidate(resample(nn, "nnMs", startSec, endSec, maxGap), minBpm, maxBpm, 4);
      const amplitudeScale = median3(morphology.map((p) => p.amplitude)) || 0;
      const areaScale = median3(morphology.map((p) => p.area)) || 0;
      const amplitude = spectralCandidate(resample(morphology, "amplitude", startSec, endSec, maxGap), minBpm, maxBpm, amplitudeScale * 5e-3 + 1e-12);
      const area = spectralCandidate(resample(morphology, "area", startSec, endSec, maxGap), minBpm, maxBpm, areaScale * 5e-3 + 1e-12);
      result.channels = { timing: diagnostic(rsa), amplitude: diagnostic(amplitude), area: diagnostic(area) };
      const tolerance = Math.max(2.5, 60 / windowSec * 1.5);
      const agree = (a, b) => Math.abs(a.bpm - b.bpm) <= tolerance;
      const shapeConflict = amplitude?.usable && area?.usable && !agree(amplitude, area);
      const shape = !shapeConflict ? [amplitude, area].filter((c) => c?.usable).sort((a, b) => b.score - a.score)[0] : null;
      const timingOk = rsa?.usable;
      const shapeSpectrum = amplitude && area ? describeSpectrum(area.spectrum.map((p, i) => (p + amplitude.spectrum[i]) / 2), minBpm, maxBpm, 60 / windowSec) : area || amplitude;
      const fused = fuseSpectra(rsa, shapeSpectrum, minBpm, maxBpm, 60 / windowSec);
      result.channels.fused = diagnostic(fused);
      if (shapeConflict && amplitude.strong && area.strong || shape?.strong && rsa?.strong && !agree(shape, rsa)) result.reason = "Respiratory surrogates disagree";
      else if (fused || shape && timingOk && agree(shape, rsa)) {
        result.bpm = fused?.bpm ?? (shape.bpm * shape.score + rsa.bpm * rsa.score) / (shape.score + rsa.score);
        result.source = "timing + morphology";
        result.support = "agreement";
        result.score = fused?.score ?? Math.round((shape.score + rsa.score) / 2);
      } else if (shape && timingOk && !agree(shape, rsa)) result.reason = "Respiratory surrogates disagree";
      else if (shape?.strong || timingOk && rsa.strong && rsa.bpm >= 9 && !exercise) {
        const candidate = shape?.strong ? shape : rsa;
        result.bpm = candidate.bpm;
        result.source = shape?.strong ? "morphology only" : "timing only";
        result.support = "single family";
        result.score = candidate.score;
      } else result.reason = "Weak or interrupted respiratory modulation";
    }
    windows.push(result);
  }
  const summary = summarizeRespiration(windows);
  const bucketSec = durationSec >= 7200 ? 3600 : 300;
  const buckets = [];
  for (let startSec = 0; startSec < durationSec; startSec += bucketSec) {
    const endSec = Math.min(durationSec, startSec + bucketSec);
    buckets.push({ startSec, endSec, ...summarizeRespiration(windows.filter((w) => w.centerSec >= startSec && w.centerSec < endSec)) });
  }
  const reasonCounts = {};
  for (const w of windows) if (w.reason) reasonCounts[w.reason] = (reasonCounts[w.reason] || 0) + 1;
  return {
    version: 1,
    available: summary.acceptedWindows > 0,
    mode,
    method: "ECG-derived respiration: clean NN timing and QRS amplitude/area spectral fusion",
    settings: { windowSec, stepSec, minBpm, maxBpm: 72, beatRateCeiling: 0.45, resampleHz: 4, nominalResolutionBpm: 60 / windowSec },
    summary,
    windows,
    buckets,
    reasonCounts,
    caveat: "Experimental ECG-derived estimate; no reference breathing signal in this recording. Movement, cadence and aliasing can mimic breathing. Signal support is heuristic, not a validated confidence or accuracy score. Gaps mean unavailable, not absent breathing. Not an apnea test or a basis for automatic training changes.",
    timingNote: `${windowSec}-second overlapping windows, every ${stepSec} seconds, plotted at their centers. Retrospective analysis; transitions are averaged within each window. Coverage is accepted complete windows / all complete windows; recording edges are not scored.`
  };
}

// src/ecg-ingestion.js
var TIME_COLUMN_UNITS = /* @__PURE__ */ new Map([
  ["timestamp_ns", "ns"],
  ["timestamp_us", "us"],
  ["timestamp_ms", "ms"],
  ["timestamp_s", "s"],
  ["timestamp", null],
  ["time", null],
  ["sample_index", "sample_index"]
]);
var TIME_COLUMN_PRIORITY = [
  "timestamp_ns",
  "timestamp_us",
  "timestamp_ms",
  "timestamp_s",
  "timestamp",
  "time",
  "sample_index"
];
var ECG_COLUMN_PRIORITY = ["ecg_uv", "ecg", "voltage"];
var UNIT_TO_NS = { s: 1e9, ms: 1e6, us: 1e3, ns: 1 };
function median4(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function normalizeHeader(value) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\u00b5\u03bc]/g, "u").replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}
function parseCsvRow(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}
function findColumn(headers, priority) {
  for (const alias of priority) {
    const index = headers.indexOf(alias);
    if (index !== -1) return { index, alias };
  }
  return { index: -1, alias: null };
}
function sampledPositiveDeltas(values) {
  if (values.length < 2) return [];
  const deltas = [];
  const step = Math.max(1, Math.floor((values.length - 1) / 2e4));
  for (let index = 1; index < values.length; index += step) {
    const delta = values[index] - values[index - 1];
    if (Number.isFinite(delta) && delta > 0) deltas.push(delta);
  }
  return deltas;
}
function magnitudeUnit(values) {
  if (!values.length) return null;
  const step = Math.max(1, Math.floor(values.length / 1e3));
  const magnitudes = [];
  for (let index = 0; index < values.length; index += step) {
    const magnitude = Math.abs(values[index]);
    if (Number.isFinite(magnitude) && magnitude > 0) magnitudes.push(magnitude);
  }
  const typical = median4(magnitudes);
  if (typical >= 1e17) return "ns";
  if (typical >= 1e14) return "us";
  if (typical >= 1e11) return "ms";
  if (typical >= 1e8) return "s";
  return null;
}
function inferTimestampUnit(values, nominalSampleRate) {
  const deltas = sampledPositiveDeltas(values);
  const typicalDelta = median4(deltas);
  const magnitudeGuess = magnitudeUnit(values);
  if (!(typicalDelta > 0)) {
    return {
      unit: magnitudeGuess || "ns",
      source: magnitudeGuess ? "inferred-magnitude" : "fallback",
      typicalDeltaRaw: 0
    };
  }
  let best = null;
  for (const [unit, factor] of Object.entries(UNIT_TO_NS)) {
    const sampleRate = 1e9 / (typicalDelta * factor);
    if (!(sampleRate > 0) || !Number.isFinite(sampleRate)) continue;
    let score = Math.abs(Math.log(sampleRate / nominalSampleRate));
    if (sampleRate < 5) score += 5 + Math.abs(Math.log(sampleRate / 5));
    if (sampleRate > 5e3) score += 5 + Math.abs(Math.log(sampleRate / 5e3));
    if (magnitudeGuess === unit) score -= 2.5;
    else if (magnitudeGuess) score += 0.5;
    if (!best || score < best.score) best = { unit, score };
  }
  return {
    unit: best?.unit || magnitudeGuess || "ns",
    source: "inferred-delta",
    typicalDeltaRaw: typicalDelta
  };
}
function isAbsoluteTime(rawValue, unit) {
  const magnitude = Math.abs(rawValue);
  if (unit === "s") return magnitude >= 1e8;
  if (unit === "ms") return magnitude >= 1e11;
  if (unit === "us") return magnitude >= 1e14;
  if (unit === "ns") return magnitude >= 1e17;
  return false;
}
function naturalNameCompare(left, right) {
  return left.name.localeCompare(right.name, void 0, {
    numeric: true,
    sensitivity: "base"
  }) || left.inputIndex - right.inputIndex;
}
function lowerBound2(values, target) {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const middle = Math.floor((lo + hi) / 2);
    if (values[middle] < target) lo = middle + 1;
    else hi = middle;
  }
  return lo;
}
function approximatelyEqual(left, right) {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= scale * 1e-7;
}
function matchesExistingTimeline(segment, placedSegments) {
  const overlapping = placedSegments.filter((placed) => placed.endNs >= segment.startNs && placed.startNs <= segment.endNs);
  if (!overlapping.length || !segment.times.length) return false;
  const sampleCount = Math.min(21, segment.times.length);
  let comparable = 0;
  let matching = 0;
  for (let sample = 0; sample < sampleCount; sample++) {
    const index = sampleCount === 1 ? 0 : Math.round(sample * (segment.times.length - 1) / (sampleCount - 1));
    const time = segment.times[index];
    for (const placed of overlapping) {
      if (time < placed.startNs || time > placed.endNs) continue;
      const found = lowerBound2(placed.times, time);
      if (found >= placed.times.length || placed.times[found] !== time) continue;
      comparable++;
      if (approximatelyEqual(segment.ecgs[index], placed.ecgs[found])) matching++;
      break;
    }
  }
  const required = Math.min(2, sampleCount);
  return comparable >= required && matching / comparable >= 0.8;
}
function createDiagnostics(inputFileCount, nominalSampleRate) {
  return {
    inputFileCount,
    fileCount: inputFileCount,
    parsedFileCount: 0,
    acceptedFileCount: 0,
    skippedFileCount: 0,
    totalRows: 0,
    rowCount: 0,
    usableRows: 0,
    invalidRows: 0,
    blankRows: 0,
    schemaErrors: [],
    units: { s: 0, ms: 0, us: 0, ns: 0, sample_index: 0 },
    unitCounts: { s: 0, ms: 0, us: 0, ns: 0, sample_index: 0 },
    duplicateTimestamps: 0,
    duplicateCount: 0,
    outOfOrderRows: 0,
    outOfOrderCount: 0,
    timestampResets: 0,
    resetCount: 0,
    mergeReordered: false,
    mixedTimestampUnits: false,
    mixedTimeBases: false,
    nominalSampleRate,
    files: []
  };
}
function parseFile(file, nominalSampleRate) {
  const name = file.name || `file-${file.inputIndex + 1}.csv`;
  const report = {
    name,
    inputIndex: file.inputIndex,
    status: "skipped",
    totalRows: 0,
    usableRows: 0,
    invalidRows: 0,
    blankRows: 0,
    invalidTimeRows: 0,
    invalidEcgRows: 0,
    outOfOrderRows: 0,
    duplicateTimestamps: 0,
    timestampResets: 0,
    crossFileResets: 0,
    concatenatedSegments: 0,
    preservedOverlaps: 0,
    schema: null,
    timestampUnit: null,
    unitSource: null,
    ecgUnit: null,
    sampleRate: null,
    detectedSampleRate: null,
    absoluteTimeline: false,
    timeBasis: null,
    error: null
  };
  if (typeof file.text !== "string") {
    report.error = "CSV text is missing or is not a string.";
    return { report, segments: [] };
  }
  const lines = file.text.split(/\r?\n/);
  let headerLineIndex = -1;
  for (let index = 0; index < lines.length; index++) {
    if (lines[index].trim()) {
      headerLineIndex = index;
      break;
    }
    report.blankRows++;
  }
  if (headerLineIndex === -1) {
    report.error = "The file is empty.";
    return { report, segments: [] };
  }
  const originalHeaders = parseCsvRow(lines[headerLineIndex]);
  const headers = originalHeaders.map(normalizeHeader);
  const timeColumn = findColumn(headers, TIME_COLUMN_PRIORITY);
  const ecgColumn = findColumn(headers, ECG_COLUMN_PRIORITY);
  report.schema = {
    headers,
    timeColumn: timeColumn.alias,
    ecgColumn: ecgColumn.alias
  };
  if (timeColumn.index === -1 || ecgColumn.index === -1) {
    const missing = [];
    if (timeColumn.index === -1) missing.push("a timestamp column");
    if (ecgColumn.index === -1) missing.push("an ECG column");
    report.error = `Missing ${missing.join(" and ")}.`;
    for (let index = headerLineIndex + 1; index < lines.length; index++) {
      if (lines[index].trim()) report.totalRows++;
      else report.blankRows++;
    }
    report.invalidRows = report.totalRows;
    return { report, segments: [] };
  }
  const rows = [];
  const maximumColumn = Math.max(timeColumn.index, ecgColumn.index);
  for (let index = headerLineIndex + 1; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) {
      report.blankRows++;
      continue;
    }
    report.totalRows++;
    const columns = parseCsvRow(line);
    if (columns.length <= maximumColumn) {
      report.invalidRows++;
      report.invalidTimeRows++;
      report.invalidEcgRows++;
      continue;
    }
    const timeText = columns[timeColumn.index].trim();
    const ecgText = columns[ecgColumn.index].trim();
    const rawTime = timeText === "" ? Number.NaN : Number(timeText);
    const ecg = ecgText === "" ? Number.NaN : Number(ecgText);
    if (!Number.isFinite(rawTime) || !Number.isFinite(ecg)) {
      report.invalidRows++;
      if (!Number.isFinite(rawTime)) report.invalidTimeRows++;
      if (!Number.isFinite(ecg)) report.invalidEcgRows++;
      continue;
    }
    rows.push({ rawTime, ecg, rowNumber: index + 1 });
  }
  report.usableRows = rows.length;
  if (!rows.length) {
    report.error = "No rows contain both a finite timestamp and ECG value.";
    return { report, segments: [] };
  }
  const declaredUnit = TIME_COLUMN_UNITS.get(timeColumn.alias);
  let unitInfo;
  if (declaredUnit === "sample_index") {
    unitInfo = { unit: "sample_index", source: "sample-index", typicalDeltaRaw: 1 };
  } else if (declaredUnit) {
    unitInfo = {
      unit: declaredUnit,
      source: "explicit-header",
      typicalDeltaRaw: median4(sampledPositiveDeltas(rows.map((row) => row.rawTime)))
    };
  } else {
    unitInfo = inferTimestampUnit(rows.map((row) => row.rawTime), nominalSampleRate);
  }
  const factor = unitInfo.unit === "sample_index" ? 1e9 / nominalSampleRate : UNIT_TO_NS[unitInfo.unit];
  const typicalDeltaRaw = unitInfo.typicalDeltaRaw > 0 ? unitInfo.typicalDeltaRaw : unitInfo.unit === "sample_index" ? 1 : 1;
  report.timestampUnit = unitInfo.unit;
  report.unitSource = unitInfo.source;
  report.ecgUnit = ecgColumn.alias === "ecg_uv" ? "uV" : "unspecified";
  report.sampleRate = unitInfo.unit === "sample_index" ? nominalSampleRate : unitInfo.typicalDeltaRaw > 0 ? 1e9 / (typicalDeltaRaw * factor) : null;
  report.detectedSampleRate = report.sampleRate;
  const rawSegments = [[]];
  let segmentStart = rows[0].rawTime;
  let previous = rows[0].rawTime;
  rawSegments[0].push(rows[0]);
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    if (row.rawTime < previous) {
      report.outOfOrderRows++;
      const backwards = previous - row.rawTime;
      const nearOrigin = row.rawTime <= segmentStart + typicalDeltaRaw * 5;
      const progressed = previous >= segmentStart + typicalDeltaRaw * 2;
      const reset = backwards >= typicalDeltaRaw * 2 && nearOrigin && progressed;
      if (reset) {
        report.timestampResets++;
        rawSegments.push([]);
        segmentStart = row.rawTime;
      }
    }
    rawSegments[rawSegments.length - 1].push(row);
    previous = row.rawTime;
  }
  const segments = rawSegments.filter((segment) => segment.length).map((rawSegment, segmentIndex) => {
    rawSegment.sort((left, right) => left.rawTime - right.rawTime || left.rowNumber - right.rowNumber);
    const rawOrigin = rawSegment[0].rawTime;
    const times = rawSegment.map((row) => Math.round(row.rawTime * factor));
    const ecgs = rawSegment.map((row) => row.ecg);
    for (let index = 1; index < times.length; index++) {
      if (times[index] === times[index - 1]) report.duplicateTimestamps++;
    }
    const intervalNs = report.sampleRate > 0 && Number.isFinite(report.sampleRate) ? 1e9 / report.sampleRate : 1e9 / nominalSampleRate;
    return {
      times,
      ecgs,
      startNs: times[0],
      endNs: times[times.length - 1],
      intervalNs,
      absolute: unitInfo.unit !== "sample_index" && isAbsoluteTime(rawOrigin, unitInfo.unit),
      forceAppend: segmentIndex > 0,
      report
    };
  });
  report.absoluteTimeline = segments.some((segment) => segment.absolute);
  report.timeBasis = unitInfo.unit === "sample_index" ? "sample-index" : report.absoluteTimeline ? "absolute" : "relative";
  report.status = "accepted";
  return { report, segments };
}
function parseEcgCsvFiles(csvFiles, profileInfo = {}, progressCallback) {
  const files = Array.isArray(csvFiles) ? csvFiles : [];
  const requestedRate = Number(profileInfo.nominalSampleRate);
  const nominalSampleRate = Number.isFinite(requestedRate) && requestedRate > 0 ? requestedRate : 130;
  const diagnostics = createDiagnostics(files.length, nominalSampleRate);
  const orderedFiles = files.map((file, inputIndex) => ({ ...file, inputIndex, name: file?.name || `file-${inputIndex + 1}.csv` })).sort(naturalNameCompare);
  const parsedFiles = orderedFiles.map((file, index) => {
    progressCallback?.(index / Math.max(1, orderedFiles.length));
    return parseFile(file, nominalSampleRate);
  });
  progressCallback?.(1);
  const mergedTimes = [];
  const mergedEcgs = [];
  const placedSegments = [];
  let previousPlaced = null;
  let relativeOriginNs = null;
  let latestEndNs = -Infinity;
  for (const parsed of parsedFiles) {
    const report = parsed.report;
    diagnostics.files.push(report);
    diagnostics.totalRows += report.totalRows;
    diagnostics.usableRows += report.usableRows;
    diagnostics.invalidRows += report.invalidRows;
    diagnostics.blankRows += report.blankRows;
    diagnostics.outOfOrderRows += report.outOfOrderRows;
    diagnostics.timestampResets += report.timestampResets;
    if (report.status !== "accepted") {
      diagnostics.skippedFileCount++;
      diagnostics.schemaErrors.push({
        file: report.name,
        error: report.error,
        schema: report.schema
      });
      continue;
    }
    diagnostics.parsedFileCount++;
    diagnostics.acceptedFileCount++;
    diagnostics.units[report.timestampUnit]++;
    diagnostics.unitCounts[report.timestampUnit]++;
    for (const segment of parsed.segments) {
      let offsetNs = 0;
      let placement = "preserved";
      if (segment.forceAppend && previousPlaced) {
        offsetNs = previousPlaced.endNs + previousPlaced.intervalNs - segment.startNs;
        placement = "concatenated-in-file-reset";
      } else if (!segment.absolute && placedSegments.length) {
        if (relativeOriginNs === null) {
          relativeOriginNs = segment.startNs;
          offsetNs = latestEndNs + segment.intervalNs - segment.startNs;
          report.crossFileResets++;
          diagnostics.timestampResets++;
          placement = "concatenated-relative-after-absolute";
        } else if (segment.startNs <= relativeOriginNs + Math.max(segment.intervalNs, 1e3)) {
          if (matchesExistingTimeline(segment, placedSegments)) {
            report.preservedOverlaps++;
            placement = "preserved-overlap";
          } else {
            offsetNs = latestEndNs + segment.intervalNs - segment.startNs;
            report.crossFileResets++;
            diagnostics.timestampResets++;
            placement = "concatenated-cross-file-reset";
          }
        }
      } else if (!segment.absolute && relativeOriginNs === null) {
        relativeOriginNs = segment.startNs;
      }
      if (offsetNs) {
        segment.times = segment.times.map((time) => Math.round(time + offsetNs));
        segment.startNs = segment.times[0];
        segment.endNs = segment.times[segment.times.length - 1];
        report.concatenatedSegments++;
      }
      segment.placement = placement;
      for (let index = 0; index < segment.times.length; index++) {
        mergedTimes.push(segment.times[index]);
        mergedEcgs.push(segment.ecgs[index]);
      }
      placedSegments.push(segment);
      previousPlaced = segment;
      latestEndNs = Math.max(latestEndNs, segment.endNs);
    }
  }
  diagnostics.rowCount = diagnostics.totalRows;
  diagnostics.outOfOrderCount = diagnostics.outOfOrderRows;
  diagnostics.resetCount = diagnostics.timestampResets;
  const usedUnits = Object.entries(diagnostics.units).filter(([, count]) => count > 0).map(([unit]) => unit);
  const detectedRates = diagnostics.files.map((file) => file.detectedSampleRate).filter((rate) => Number.isFinite(rate) && rate > 0);
  diagnostics.timestampUnits = usedUnits;
  diagnostics.detectedSampleRate = median4(detectedRates);
  diagnostics.mixedTimestampUnits = usedUnits.length > 1;
  diagnostics.mixedTimeBases = diagnostics.files.some((file) => file.status === "accepted" && file.absoluteTimeline) && diagnostics.files.some((file) => file.status === "accepted" && !file.absoluteTimeline);
  if (!mergedTimes.length) {
    const schemaSummary = diagnostics.schemaErrors.map((entry) => `${entry.file}: ${entry.error}`).join("; ");
    throw new Error(
      `No usable ECG samples were found in the uploaded CSV data.${schemaSummary ? ` ${schemaSummary}` : ""} Expected a time/timestamp/timestamp_ns/timestamp_us/timestamp_ms/sample_index column and an ecg/ecg_uv/voltage column.`
    );
  }
  let orderedTimes = mergedTimes;
  let orderedEcgs = mergedEcgs;
  for (let index = 1; index < orderedTimes.length; index++) {
    if (orderedTimes[index] < orderedTimes[index - 1]) {
      diagnostics.mergeReordered = true;
      const order = Array.from({ length: orderedTimes.length }, (_, itemIndex) => itemIndex).sort((left, right) => orderedTimes[left] - orderedTimes[right] || left - right);
      orderedTimes = order.map((itemIndex) => orderedTimes[itemIndex]);
      orderedEcgs = order.map((itemIndex) => orderedEcgs[itemIndex]);
      break;
    }
  }
  const ecgTimes = [];
  const ecgs = [];
  for (let index = 0; index < orderedTimes.length; index++) {
    if (ecgTimes.length && orderedTimes[index] === ecgTimes[ecgTimes.length - 1]) {
      diagnostics.duplicateTimestamps++;
      continue;
    }
    ecgTimes.push(orderedTimes[index]);
    ecgs.push(orderedEcgs[index]);
  }
  diagnostics.duplicateCount = diagnostics.duplicateTimestamps;
  diagnostics.usableRowsAfterDeduplication = ecgTimes.length;
  return { ecgTimes, ecgs, diagnostics };
}

// src/interval-test.js
var HR_BIN_SEC = 5;
var EFFORT_SEC = 60;
var DEFAULT_FIRST_INTERVAL_START_SEC = 12 * 60;
var DEFAULT_BASELINE_TOLERANCE_BPM = 5;
var DEFAULT_BASELINE_HOLD_SEC = 30;
var DEFAULT_MAXIMUM_RECOVERY_SEC = 10 * 60;
var BASELINE_WINDOW_SEC = 60;
var PRE_INTERVAL_WINDOW_SEC = 30;
var MIN_POINT_QUALITY_PCT = 45;
var STATISTIC_FIELDS = [
  "preHr",
  "hr30",
  "endHr",
  "riseBpm",
  "rampRateBpmPerMin",
  "initialRampRateBpmPerMin",
  "peakHr",
  "timeToPeakSec",
  "hrr30",
  "hrr60",
  "hrr120",
  "hrr240",
  "recoveryRateBpmPerMin",
  "recoveryPercent60",
  "returnToBaselineSec",
  "effortQualityPct",
  "recoveryQualityPct",
  "effortRhythmCandidateCount",
  "recoveryRhythmCandidateCount"
];
function clamp2(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}
function median5(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function configuredNumber(value, fallback, minimum, maximum) {
  const numeric = finiteNumber(value);
  return numeric === null ? fallback : clamp2(numeric, minimum, maximum);
}
function buildProtocol(profileInfo = {}) {
  const recordingType = String(profileInfo.recordingType ?? "").trim().toLowerCase();
  const enabled = recordingType === "interval-test" || profileInfo.protocol?.enabled === true;
  return {
    enabled,
    type: "dynamic-interval",
    effortSec: EFFORT_SEC,
    baselineWindowSec: BASELINE_WINDOW_SEC,
    baselineToleranceBpm: DEFAULT_BASELINE_TOLERANCE_BPM,
    baselineHoldSec: DEFAULT_BASELINE_HOLD_SEC,
    maximumRecoverySec: DEFAULT_MAXIMUM_RECOVERY_SEC,
    hrBinSec: HR_BIN_SEC
  };
}
function normalizeQualityValue(entry) {
  if (entry?.valid === false || entry?.usable === false || entry?.hrUsable === false) return 0;
  const raw = entry?.qualityPct ?? entry?.qualityPercentage ?? entry?.usablePct ?? entry?.cleanCoverage ?? entry?.score ?? entry?.quality ?? entry?.value;
  if (typeof raw === "boolean") return raw ? 100 : 0;
  if (typeof raw === "string") {
    const label = raw.trim().toLowerCase();
    if (["good", "high", "clean", "usable", "green"].includes(label)) return 100;
    if (["fair", "moderate", "yellow"].includes(label)) return 60;
    if (["poor", "low", "bad", "unusable", "gray", "grey", "red"].includes(label)) return 0;
  }
  const numeric = finiteNumber(raw);
  if (numeric === null) return entry?.valid === true || entry?.usable === true ? 100 : 100;
  return clamp2(numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric, 0, 100);
}
function absoluteTimeToSec(value, minTime) {
  const numeric = finiteNumber(value);
  if (numeric === null || !Number.isFinite(minTime)) return null;
  return (numeric - minTime) / 1e9;
}
function normalizeQualityTimeline(qualityTimeline, minTime) {
  if (!Array.isArray(qualityTimeline)) return [];
  return qualityTimeline.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const pointSec = finiteNumber(entry.timeSec) ?? absoluteTimeToSec(entry.time, minTime);
    let startSec = finiteNumber(entry.startSec) ?? absoluteTimeToSec(entry.startTime, minTime);
    let endSec = finiteNumber(entry.endSec) ?? absoluteTimeToSec(entry.endTime, minTime);
    const durationSec = configuredNumber(entry.durationSec, HR_BIN_SEC, 0, 60 * 60);
    if (startSec === null && pointSec !== null) startSec = pointSec - durationSec / 2;
    if (endSec === null && startSec !== null) endSec = startSec + durationSec;
    if (startSec === null || endSec === null || endSec <= startSec) return [];
    return [{
      startSec,
      endSec,
      qualityPct: normalizeQualityValue(entry)
    }];
  }).sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);
}
function qualityForBin(entries, startSec, endSec, cursor) {
  while (cursor.index < entries.length && entries[cursor.index].endSec <= startSec) {
    cursor.index++;
  }
  let weightedQuality = 0;
  let overlapDuration = 0;
  for (let index = cursor.index; index < entries.length; index++) {
    const entry = entries[index];
    if (entry.startSec >= endSec) break;
    const overlap = Math.max(0, Math.min(endSec, entry.endSec) - Math.max(startSec, entry.startSec));
    if (!overlap) continue;
    weightedQuality += entry.qualityPct * overlap;
    overlapDuration += overlap;
  }
  return overlapDuration ? weightedQuality / overlapDuration : 100;
}
function buildFiveSecondHrPoints(cleanRrs, minTime, durationSec, qualityTimeline) {
  const normalizedQuality = normalizeQualityTimeline(qualityTimeline, minTime);
  const samples = (Array.isArray(cleanRrs) ? cleanRrs : []).flatMap((rr) => {
    const rrMs = finiteNumber(rr?.val ?? rr?.rrMs ?? rr?.rr);
    if (rrMs === null || rrMs < 250 || rrMs > 2500) return [];
    const relativeTimeSec = finiteNumber(rr?.timeSec) ?? absoluteTimeToSec(rr?.time, minTime);
    if (relativeTimeSec === null || relativeTimeSec < 0 || relativeTimeSec > durationSec) return [];
    return [{ timeSec: relativeTimeSec, hr: 6e4 / rrMs }];
  }).sort((a, b) => a.timeSec - b.timeSec);
  const pointCount = Math.max(0, Math.ceil(durationSec / HR_BIN_SEC));
  const points = [];
  const qualityCursor = { index: 0 };
  let sampleIndex = 0;
  for (let index = 0; index < pointCount; index++) {
    const startSec = index * HR_BIN_SEC;
    const endSec = Math.min(durationSec, startSec + HR_BIN_SEC);
    while (sampleIndex < samples.length && samples[sampleIndex].timeSec < startSec) sampleIndex++;
    const values = [];
    let candidateIndex = sampleIndex;
    while (candidateIndex < samples.length && samples[candidateIndex].timeSec < endSec) {
      values.push(samples[candidateIndex].hr);
      candidateIndex++;
    }
    sampleIndex = candidateIndex;
    const hr = median5(values);
    const sourceQualityPct = qualityForBin(normalizedQuality, startSec, endSec, qualityCursor);
    points.push({
      startSec,
      endSec,
      timeSec: (startSec + endSec) / 2,
      hr: finiteOrNull(hr),
      qualityPct: hr === null ? 0 : sourceQualityPct,
      beatCount: values.length
    });
  }
  return points;
}
function pointsForRange(points, startSec, endSec, minimumQualityPct = MIN_POINT_QUALITY_PCT) {
  return points.filter((point) => point.timeSec >= startSec && point.timeSec < endSec && Number.isFinite(point.hr) && point.qualityPct >= minimumQualityPct);
}
function medianHrForRange(points, startSec, endSec, minimumCoverage = 0.5) {
  if (!(endSec > startSec)) return null;
  const selected = pointsForRange(points, startSec, endSec);
  const expectedBins = Math.max(1, Math.ceil((endSec - startSec) / HR_BIN_SEC));
  if (selected.length < Math.max(1, Math.ceil(expectedBins * minimumCoverage))) return null;
  return median5(selected.map((point) => point.hr));
}
function qualityPercentForRange(points, startSec, endSec) {
  if (!(endSec > startSec)) return null;
  let weightedQuality = 0;
  for (const point of points) {
    const overlap = Math.max(0, Math.min(endSec, point.endSec) - Math.max(startSec, point.startSec));
    if (!overlap) continue;
    weightedQuality += (Number.isFinite(point.hr) ? point.qualityPct : 0) * overlap;
  }
  return clamp2(weightedQuality / (endSec - startSec), 0, 100);
}
function peakForRange(points, startSec, endSec) {
  const selected = pointsForRange(points, startSec, endSec);
  if (!selected.length) return { peakHr: null, timeToPeakSec: null };
  const peak = selected.reduce((best, point) => point.hr > best.hr ? point : best, selected[0]);
  return {
    peakHr: peak.hr,
    timeToPeakSec: peak.timeSec - startSec
  };
}
function findBaselineReturn(points, effortEndSec, durationSec, baselineHr, protocol) {
  if (!Number.isFinite(baselineHr)) return null;
  const limitSec = Math.min(durationSec, effortEndSec + protocol.maximumRecoverySec);
  let runStartSec = null;
  let previousEndSec = null;
  for (const point of points) {
    if (point.startSec + 1e-6 < effortEndSec) continue;
    if (point.endSec > limitSec + 1e-6) break;
    const consecutive = previousEndSec === null || Math.abs(point.startSec - previousEndSec) < 1e-6;
    const withinBaseline = Number.isFinite(point.hr) && point.qualityPct >= MIN_POINT_QUALITY_PCT && Math.abs(point.hr - baselineHr) <= protocol.baselineToleranceBpm;
    if (!withinBaseline || !consecutive) {
      runStartSec = withinBaseline ? point.startSec : null;
    } else if (runStartSec === null) {
      runStartSec = point.startSec;
    }
    previousEndSec = withinBaseline ? point.endSec : null;
    if (withinBaseline && point.endSec - runStartSec >= protocol.baselineHoldSec - 1e-6) {
      return {
        returnStartSec: runStartSec,
        confirmedAtSec: point.endSec,
        returnToBaselineSec: Math.max(0, runStartSec - effortEndSec)
      };
    }
  }
  return null;
}
function normalizedEventRange(event, minTime) {
  const startSec = finiteNumber(event?.timeSec) ?? finiteNumber(event?.startSec) ?? absoluteTimeToSec(event?.time, minTime) ?? absoluteTimeToSec(event?.startTime, minTime);
  if (startSec === null) return null;
  const endSec = finiteNumber(event?.endSec) ?? absoluteTimeToSec(event?.endTime, minTime) ?? startSec;
  return { startSec, endSec: Math.max(startSec, endSec) };
}
function isRhythmCandidate(event) {
  const type = String(event?.type ?? "").trim().toLowerCase();
  return !["artifact", "sensor", "sensor-issue", "contact", "contact-loss", "gap", "noise", "quality"].includes(type);
}
function countRhythmCandidates(events, startSec, endSec, minTime) {
  if (!(endSec > startSec)) return 0;
  return (Array.isArray(events) ? events : []).reduce((count, event) => {
    if (!isRhythmCandidate(event)) return count;
    const range = normalizedEventRange(event, minTime);
    if (!range) return count;
    const overlaps = range.endSec === range.startSec ? range.startSec >= startSec && range.startSec < endSec : range.endSec > startSec && range.startSec < endSec;
    return count + (overlaps ? 1 : 0);
  }, 0);
}
function recoveryDropAt(points, effortEndSec, offsetSec, recoveryMetricEndSec, endHr) {
  if (!Number.isFinite(endHr)) return null;
  const windowEndSec = effortEndSec + offsetSec;
  const windowStartSec = windowEndSec - HR_BIN_SEC * 2;
  if (windowStartSec < effortEndSec || windowEndSec > recoveryMetricEndSec + 1e-6) return null;
  const recoveryHr = medianHrForRange(points, windowStartSec, windowEndSec);
  return Number.isFinite(recoveryHr) ? endHr - recoveryHr : null;
}
function buildRelativeTrace(points, intervalStartSec, traceEndSec) {
  const traceStartSec = intervalStartSec - PRE_INTERVAL_WINDOW_SEC;
  const cappedEndSec = Math.min(traceEndSec, intervalStartSec + 300);
  return points.filter((point) => point.timeSec >= traceStartSec && point.timeSec <= cappedEndSec).map((point) => ({
    timeSec: point.timeSec - intervalStartSec,
    hr: finiteOrNull(point.hr),
    quality: Number.isFinite(point.hr) ? point.qualityPct : 0
  }));
}
function summarize(values) {
  const finiteValues = values.filter(Number.isFinite);
  const count = finiteValues.length;
  if (!count) {
    return {
      count: 0,
      mean: null,
      median: null,
      sd: null,
      cv: null,
      min: null,
      max: null,
      first: null,
      last: null,
      firstToLastChange: null,
      firstToLastPercent: null
    };
  }
  const meanValue = finiteValues.reduce((sum, value) => sum + value, 0) / count;
  const sd = count >= 2 ? Math.sqrt(finiteValues.reduce((sum, value) => sum + (value - meanValue) ** 2, 0) / (count - 1)) : null;
  const first = finiteValues[0];
  const last = finiteValues[finiteValues.length - 1];
  return {
    count,
    mean: meanValue,
    median: median5(finiteValues),
    sd,
    cv: Number.isFinite(sd) && Math.abs(meanValue) > 1e-9 ? sd / Math.abs(meanValue) * 100 : null,
    min: Math.min(...finiteValues),
    max: Math.max(...finiteValues),
    first,
    last,
    firstToLastChange: count >= 2 ? last - first : null,
    firstToLastPercent: count >= 2 && Math.abs(first) > 1e-9 ? (last - first) / Math.abs(first) * 100 : null
  };
}
function buildStatistics(repetitions) {
  return Object.fromEntries(STATISTIC_FIELDS.map((field) => [
    field,
    summarize(repetitions.map((repetition) => repetition.valid ? repetition[field] : null))
  ]));
}
function buildFirstToLastDrift(repetitions) {
  return Object.fromEntries(STATISTIC_FIELDS.map((field) => {
    const values = repetitions.map((repetition) => repetition.valid ? repetition[field] : null).filter(Number.isFinite);
    if (values.length < 2) return [field, null];
    const first = values[0];
    const last = values[values.length - 1];
    return [field, {
      first,
      last,
      absolute: last - first,
      percent: Math.abs(first) > 1e-9 ? (last - first) / Math.abs(first) * 100 : null
    }];
  }));
}
function disabledResult(protocol) {
  const summary = "Select the interval-test recording type to analyze this standardized protocol.";
  return {
    enabled: false,
    protocol,
    status: "not-enabled",
    stopReason: "The standardized interval test was not selected for this recording.",
    baseline: { hr: null, source: "unavailable", startSec: null, endSec: null, qualityPct: null },
    hrPoints: [],
    repetitions: [],
    statistics: buildStatistics([]),
    firstToLastDrift: buildFirstToLastDrift([]),
    incompleteRecoveryCount: 0,
    summary,
    message: summary,
    summaryDetails: {
      title: "5 x 1-minute interval test",
      text: summary,
      instruction: "Record one continuous ECG file containing all five efforts and every recovery."
    }
  };
}
function detectIntervals(points) {
  const validPeaks = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!Number.isFinite(point.hr)) continue;
    let isPeak = true;
    for (let j = Math.max(0, i - 12); j <= Math.min(points.length - 1, i + 12); j++) {
      if (i !== j && Number.isFinite(points[j].hr) && points[j].hr > point.hr) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) {
      if (validPeaks.length === 0 || point.timeSec - validPeaks[validPeaks.length - 1].timeSec > 90) {
        validPeaks.push(point);
      } else if (point.hr > validPeaks[validPeaks.length - 1].hr) {
        validPeaks[validPeaks.length - 1] = point;
      }
    }
  }
  const intervals = [];
  for (const peak of validPeaks) {
    const prePeakPoints = points.filter((p) => p.timeSec >= peak.timeSec - 90 && p.timeSec < peak.timeSec);
    const minHr = prePeakPoints.length ? Math.min(...prePeakPoints.map((p) => p.hr).filter(Number.isFinite)) : peak.hr;
    if (peak.hr - minHr >= 15) {
      intervals.push({ startSec: Math.max(0, peak.timeSec - 60), endSec: peak.timeSec });
    }
  }
  return intervals;
}
function buildIntervalTestMetrics({
  cleanRrs,
  minTime,
  durationSec,
  qualityTimeline = [],
  rhythmEvents = [],
  profileInfo = {}
} = {}) {
  const protocol = buildProtocol(profileInfo);
  if (!protocol.enabled) return disabledResult(protocol);
  const recordingDurationSec = Math.max(0, finiteNumber(durationSec) ?? 0);
  const hrPoints = buildFiveSecondHrPoints(
    cleanRrs,
    finiteNumber(minTime),
    recordingDurationSec,
    qualityTimeline
  );
  const rawIntervals = detectIntervals(hrPoints);
  if (rawIntervals.length < 3) {
    return {
      enabled: true,
      protocol,
      status: "insufficient-recording",
      stopReason: "Fewer than 3 efforts detected.",
      message: "Could not detect at least 3 one-minute efforts in the recording.",
      summary: `Only ${rawIntervals.length} efforts detected. The dynamic interval test requires at least 3 efforts.`,
      baselineHr: null,
      repetitions: [],
      statistics: buildStatistics([]),
      firstToLastDrift: buildFirstToLastDrift([]),
      incompleteRecoveryCount: 0,
      summaryDetails: {
        title: "Dynamic Interval Test",
        text: `Detected ${rawIntervals.length} intervals.`,
        instruction: "Dynamic detection requires at least 3 efforts.",
        baselineHr: null,
        segmentedRepetitions: rawIntervals.length,
        validRepetitions: 0,
        requestedRepetitions: 3,
        completeRecoveries: 0,
        incompleteRecoveries: 0,
        missingRepetitions: 3 - rawIntervals.length
      }
    };
  }
  const baselineStartSec = Math.max(0, rawIntervals[0].startSec - protocol.baselineWindowSec);
  const baselineEndSec = rawIntervals[0].startSec;
  const measuredBaselineHr = medianHrForRange(hrPoints, baselineStartSec, baselineEndSec);
  const baselineHr = measuredBaselineHr;
  const baseline = {
    hr: finiteOrNull(baselineHr),
    source: measuredBaselineHr !== null ? "recording-final-60-seconds" : "unavailable",
    startSec: baselineStartSec,
    endSec: baselineEndSec,
    qualityPct: qualityPercentForRange(hrPoints, baselineStartSec, baselineEndSec)
  };
  const repetitions = [];
  let stopReason = null;
  for (let index = 0; index < rawIntervals.length; index++) {
    const effortStartSec = rawIntervals[index].startSec;
    const effortEndSec = rawIntervals[index].endSec;
    const preHr = medianHrForRange(
      hrPoints,
      effortStartSec - PRE_INTERVAL_WINDOW_SEC,
      effortStartSec
    );
    const hr30 = medianHrForRange(hrPoints, effortStartSec + 25, effortStartSec + 35);
    const endHr = medianHrForRange(hrPoints, effortEndSec - 10, effortEndSec);
    const riseBpm = Number.isFinite(preHr) && Number.isFinite(endHr) ? endHr - preHr : null;
    const rampRateBpmPerMin = Number.isFinite(riseBpm) ? riseBpm / (protocol.effortSec / 60) : null;
    const initialRampRateBpmPerMin = Number.isFinite(preHr) && Number.isFinite(hr30) ? (hr30 - preHr) / 0.5 : null;
    const peak = peakForRange(hrPoints, effortStartSec, effortEndSec);
    const baselineReturn = findBaselineReturn(
      hrPoints,
      effortEndSec,
      recordingDurationSec,
      baselineHr ?? 100,
      // Safe fallback
      protocol
    );
    const willStartAnotherRepetition = index < rawIntervals.length - 1;
    const recoverySearchEndSec = baselineReturn?.confirmedAtSec ?? Math.min(recordingDurationSec, effortEndSec + protocol.maximumRecoverySec);
    const recoveryMetricEndSec = willStartAnotherRepetition ? rawIntervals[index + 1].startSec : Math.min(recordingDurationSec, effortEndSec + protocol.maximumRecoverySec);
    const hrr30 = recoveryDropAt(hrPoints, effortEndSec, 30, recoveryMetricEndSec, endHr);
    const hrr60 = recoveryDropAt(hrPoints, effortEndSec, 60, recoveryMetricEndSec, endHr);
    const hrr120 = recoveryDropAt(hrPoints, effortEndSec, 120, recoveryMetricEndSec, endHr);
    const hrr240 = recoveryDropAt(hrPoints, effortEndSec, 240, recoveryMetricEndSec, endHr);
    const recoveryRateBpmPerMin = finiteOrNull(hrr60);
    const recoveryPercent60 = Number.isFinite(hrr60) && Number.isFinite(riseBpm) && riseBpm > 1 ? hrr60 / riseBpm * 100 : null;
    const recoveryQualityEndSec = Math.min(recoveryMetricEndSec, effortEndSec + 60);
    const effortQualityPct = qualityPercentForRange(hrPoints, effortStartSec, effortEndSec);
    const recoveryQualityPct = recoveryQualityEndSec > effortEndSec ? qualityPercentForRange(hrPoints, effortEndSec, recoveryQualityEndSec) : null;
    const effortRhythmCandidateCount = countRhythmCandidates(
      rhythmEvents,
      effortStartSec,
      effortEndSec,
      minTime
    );
    const recoveryRhythmCandidateCount = countRhythmCandidates(
      rhythmEvents,
      effortEndSec,
      recoverySearchEndSec,
      minTime
    );
    const traceEndSec = willStartAnotherRepetition ? rawIntervals[index + 1].startSec : Math.min(recordingDurationSec, effortEndSec + protocol.maximumRecoverySec);
    const valid = [preHr, hr30, endHr, riseBpm, rampRateBpmPerMin].every(Number.isFinite) && Number.isFinite(effortQualityPct) && effortQualityPct >= MIN_POINT_QUALITY_PCT;
    repetitions.push({
      index: index + 1,
      startSec: effortStartSec,
      endSec: effortEndSec,
      valid,
      durationSec: protocol.effortSec,
      traceEndSec,
      preHr: finiteOrNull(preHr),
      hr30: finiteOrNull(hr30),
      endHr: finiteOrNull(endHr),
      riseBpm: finiteOrNull(riseBpm),
      rampRateBpmPerMin: finiteOrNull(rampRateBpmPerMin),
      initialRampRateBpmPerMin: finiteOrNull(initialRampRateBpmPerMin),
      peakHr: finiteOrNull(peak?.peakHr),
      timeToPeakSec: finiteOrNull(peak?.timeToPeakSec),
      hrr30: finiteOrNull(hrr30),
      hrr60: finiteOrNull(hrr60),
      hrr120: finiteOrNull(hrr120),
      hrr240: finiteOrNull(hrr240),
      recoveryRateBpmPerMin: finiteOrNull(recoveryRateBpmPerMin),
      recoveryPercent60: finiteOrNull(recoveryPercent60),
      returnToBaselineSec: finiteOrNull(baselineReturn?.returnToBaselineSec),
      recoveryComplete: Boolean(baselineReturn),
      baselineReturn: {
        returned: baselineReturn !== null,
        returnTimeSec: finiteOrNull(baselineReturn?.returnToBaselineSec),
        confirmedAtSec: finiteOrNull(baselineReturn?.confirmedAtSec)
      },
      effortQualityPct: finiteOrNull(effortQualityPct),
      recoveryQualityPct: finiteOrNull(recoveryQualityPct),
      effortRhythmCandidateCount,
      recoveryRhythmCandidateCount,
      rhythmCandidateCounts: {
        effort: effortRhythmCandidateCount,
        recovery: recoveryRhythmCandidateCount
      },
      trace: buildRelativeTrace(hrPoints, effortStartSec, traceEndSec)
    });
  }
  const incompleteRecoveryCount = repetitions.filter((repetition) => !repetition.recoveryComplete).length;
  const validCount = repetitions.filter((repetition) => repetition.valid).length;
  const status = "complete";
  const summary = `Detected and analyzed ${repetitions.length} one-minute effort windows automatically.`;
  const instruction = `The protocol dynamically inferred ${repetitions.length} efforts.`;
  return {
    enabled: true,
    protocol,
    status,
    stopReason,
    message: summary,
    summary,
    baseline,
    baselineHr: finiteOrNull(baselineHr),
    hrPoints: hrPoints.map((point) => ({
      timeSec: point.timeSec,
      hr: finiteOrNull(point.hr),
      quality: Number.isFinite(point.hr) ? point.qualityPct : 0
    })),
    repetitions,
    statistics: buildStatistics(repetitions),
    firstToLastDrift: buildFirstToLastDrift(repetitions),
    incompleteRecoveryCount,
    summaryDetails: {
      title: "Dynamic Interval Test",
      text: summary,
      instruction,
      baselineHr: finiteOrNull(baselineHr),
      segmentedRepetitions: repetitions.length,
      validRepetitions: validCount,
      requestedRepetitions: repetitions.length,
      completeRecoveries: repetitions.length - incompleteRecoveryCount,
      incompleteRecoveries: incompleteRecoveryCount,
      missingRepetitions: 0
    }
  };
}

// src/ecg-analysis.js
var FIVE_MINUTES = 300;
var MODE_VALUES = ["auto", "sleep", "rest", "workout", "mixed"];
function clamp3(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}
function mean3(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
function median6(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function percentile3(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = clamp3((sorted.length - 1) * pct, 0, sorted.length - 1);
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  const weight = index - lo;
  return sorted[lo] * (1 - weight) + sorted[hi] * weight;
}
function standardDeviation2(values) {
  if (!values.length) return 0;
  const avg = mean3(values);
  return Math.sqrt(mean3(values.map((value) => (value - avg) ** 2)));
}
function medianAbsoluteDeviation(values) {
  if (!values.length) return 0;
  const center = median6(values);
  return median6(values.map((value) => Math.abs(value - center)));
}
function downsample(values, target) {
  if (values.length <= target) return values.slice();
  const step = values.length / target;
  return Array.from({ length: target }, (_, index) => values[Math.floor(index * step)]);
}
function computeHistogram(values, preferredBinSize, fallbackLo, fallbackHi) {
  if (!values.length) return {};
  const loValue = percentile3(values, 0.01) || fallbackLo;
  const hiValue = percentile3(values, 0.99) || fallbackHi;
  const range = Math.max(1, hiValue - loValue);
  let binSize = preferredBinSize;
  if (range <= preferredBinSize * 10) binSize = Math.max(1, preferredBinSize / 2);
  if (range > preferredBinSize * 30) binSize = preferredBinSize * 2;
  const lo = Math.floor(loValue / binSize) * binSize;
  const hi = Math.ceil(hiValue / binSize) * binSize;
  const bins = {};
  for (let value = lo; value <= hi; value += binSize) bins[value] = 0;
  for (const value of values) {
    if (value < lo || value > hi) continue;
    const bin = Math.floor(value / binSize) * binSize;
    if (bins[bin] !== void 0) bins[bin]++;
  }
  return bins;
}
function computeHrv(rrValues) {
  if (rrValues.length < 3) {
    return { sdnn: 0, rmssd: 0, lnRMSSD: 0, pNN50: 0, validPairs: 0 };
  }
  const avg = mean3(rrValues);
  const sdnn = Math.sqrt(mean3(rrValues.map((value) => (value - avg) ** 2)));
  let squaredDiffs = 0;
  let nn50 = 0;
  let validPairs = 0;
  for (let index = 1; index < rrValues.length; index++) {
    const diff = Math.abs(rrValues[index] - rrValues[index - 1]);
    squaredDiffs += diff ** 2;
    if (diff > 50) nn50++;
    validPairs++;
  }
  const rmssd = validPairs ? Math.sqrt(squaredDiffs / validPairs) : 0;
  return {
    sdnn,
    rmssd,
    lnRMSSD: rmssd > 0 ? Math.log(rmssd) : 0,
    pNN50: validPairs ? nn50 / validPairs * 100 : 0,
    validPairs
  };
}
function computeLinearSlope(points) {
  if (points.length < 2) return 0;
  const avgX = mean3(points.map((point) => point.timeSec));
  const avgY = mean3(points.map((point) => point.value));
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
    numerator += (point.timeSec - avgX) * (point.value - avgY);
    denominator += (point.timeSec - avgX) ** 2;
  }
  return denominator ? numerator / denominator * 3600 : 0;
}
function aggregateTimedValues(items, minTime, durationSec, binSec = 15) {
  const binCount = Math.max(1, Math.ceil(durationSec / binSec));
  const bins = Array.from({ length: binCount }, () => []);
  for (const item of items) {
    const timeSec = (item.time - minTime) / 1e9;
    const index = Math.floor(timeSec / binSec);
    if (index >= 0 && index < bins.length) bins[index].push(item.val);
  }
  return bins.flatMap((values, index) => values.length ? [{ timeSec: index * binSec + binSec / 2, value: median6(values), count: values.length }] : []);
}
function findThresholdEpisodes(points, predicate, minimumDurationSec, binSec = 15) {
  const episodes = [];
  let current = null;
  for (const point of points) {
    if (predicate(point.value)) {
      if (!current || point.timeSec - current.lastTime > binSec * 1.75) {
        if (current && current.lastTime - current.startSec + binSec >= minimumDurationSec) episodes.push(current);
        current = { startSec: point.timeSec - binSec / 2, endSec: point.timeSec + binSec / 2, lastTime: point.timeSec, peak: point.value, low: point.value };
      } else {
        current.endSec = point.timeSec + binSec / 2;
        current.lastTime = point.timeSec;
        current.peak = Math.max(current.peak, point.value);
        current.low = Math.min(current.low, point.value);
      }
    } else if (current) {
      if (current.lastTime - current.startSec + binSec >= minimumDurationSec) episodes.push(current);
      current = null;
    }
  }
  if (current && current.lastTime - current.startSec + binSec >= minimumDurationSec) episodes.push(current);
  return episodes.map(({ lastTime, ...episode }) => episode);
}
function matchPeakDetectors(primary, secondary, sampleRate) {
  if (!primary.length || !secondary.length) return 0;
  const tolerance = Math.max(1, Math.round(sampleRate * 0.1));
  let matches = 0;
  let secondaryIndex = 0;
  for (const peak of primary) {
    while (secondaryIndex < secondary.length && secondary[secondaryIndex] < peak - tolerance) secondaryIndex++;
    if (secondaryIndex < secondary.length && Math.abs(secondary[secondaryIndex] - peak) <= tolerance) matches++;
  }
  return 2 * matches / (primary.length + secondary.length) * 100;
}
function detectRPeaksSecondary(ecgs, sampleRate) {
  if (ecgs.length < sampleRate * 2) return [];
  const baselineWindow = Math.max(3, Math.floor(sampleRate * 0.6));
  const energy = new Float64Array(ecgs.length);
  let running = 0;
  for (let index = 0; index < ecgs.length; index++) {
    running += ecgs[index];
    if (index >= baselineWindow) running -= ecgs[index - baselineWindow];
    const baseline = running / Math.min(index + 1, baselineWindow);
    const centered = ecgs[index] - baseline;
    energy[index] = centered * centered;
  }
  const sample = [];
  const sampleStep = Math.max(1, Math.floor(energy.length / 5e3));
  for (let index = 0; index < energy.length; index += sampleStep) sample.push(energy[index]);
  const threshold = percentile3(sample, 0.985) * 0.35;
  const refractory = Math.max(1, Math.floor(sampleRate * 0.24));
  const searchRadius = Math.max(2, Math.floor(sampleRate * 0.08));
  const peaks = [];
  let lastPeak = -refractory;
  for (let index = 1; index < energy.length - 1; index++) {
    if (energy[index] < threshold || energy[index] < energy[index - 1] || energy[index] < energy[index + 1]) continue;
    if (index - lastPeak < refractory) continue;
    let best = index;
    let bestEnergy = energy[index];
    for (let candidate = Math.max(0, index - searchRadius); candidate <= Math.min(energy.length - 1, index + searchRadius); candidate++) {
      if (energy[candidate] > bestEnergy) {
        best = candidate;
        bestEnergy = energy[candidate];
      }
    }
    peaks.push(best);
    lastPeak = best;
  }
  return peaks;
}
function conditionForDetection(ecgs, sampleRate) {
  const n = ecgs.length;
  const out = new Float64Array(n);
  if (!n) return out;
  const halfWindow = Math.max(2, Math.round(sampleRate * 0.33));
  const prefix = new Float64Array(n + 1);
  for (let index = 0; index < n; index++) prefix[index + 1] = prefix[index] + ecgs[index];
  for (let index = 0; index < n; index++) {
    const lo = Math.max(0, index - halfWindow);
    const hi = Math.min(n - 1, index + halfWindow);
    const baseline = (prefix[hi + 1] - prefix[lo]) / (hi - lo + 1);
    out[index] = ecgs[index] - baseline;
  }
  for (let index = 1; index < n - 1; index++) {
    out[index] = (out[index - 1] + 2 * out[index] + out[index + 1]) / 4;
  }
  const stride = Math.max(1, Math.floor(n / 2e4));
  const sampled = [];
  for (let index = 0; index < n; index += stride) sampled.push(out[index]);
  const positive = percentile3(sampled, 0.999);
  const negative = -percentile3(sampled, 1e-3);
  if (negative > positive * 1.5) {
    for (let index = 0; index < n; index++) out[index] = -out[index];
  }
  return out;
}
function buildBeatTemplate(ecgs, peaks, sampleRate) {
  const half = Math.max(4, Math.round(sampleRate * 0.22));
  const length = half * 2 + 1;
  const step = Math.max(1, Math.floor(peaks.length / 240));
  const usable = [];
  for (let index = 0; index < peaks.length; index += step) {
    const peak = peaks[index];
    if (peak - half < 0 || peak + half >= ecgs.length) continue;
    usable.push(peak);
  }
  if (usable.length < 8) return null;
  const template = new Float64Array(length);
  const column = new Array(usable.length);
  for (let offset = 0; offset < length; offset++) {
    for (let beat = 0; beat < usable.length; beat++) column[beat] = ecgs[usable[beat] - half + offset];
    template[offset] = median6(column);
  }
  return { template, half };
}
function correlateBeat(ecgs, peakIndex, beatTemplate) {
  if (!beatTemplate) return null;
  const { template, half } = beatTemplate;
  if (peakIndex - half < 0 || peakIndex + half >= ecgs.length) return null;
  const length = half * 2 + 1;
  let sumX = 0;
  let sumY = 0;
  for (let offset = 0; offset < length; offset++) {
    sumX += ecgs[peakIndex - half + offset];
    sumY += template[offset];
  }
  const meanX = sumX / length;
  const meanY = sumY / length;
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  for (let offset = 0; offset < length; offset++) {
    const dx = ecgs[peakIndex - half + offset] - meanX;
    const dy = template[offset] - meanY;
    covariance += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  const denominator = Math.sqrt(varX * varY);
  return denominator > 0 ? covariance / denominator : null;
}
function nearestPeakIndex(peakTimes, targetNs) {
  let lo = 0;
  let hi = peakTimes.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (peakTimes[mid] < targetNs) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(peakTimes[lo - 1] - targetNs) < Math.abs(peakTimes[lo] - targetNs)) return lo - 1;
  return lo;
}
function verifyRhythmCandidates({ conditioned, ecgTimes, primaryPeaks, sampleRate, ectopicEvents, pauseEvents, minTime }) {
  const beatTemplate = buildBeatTemplate(conditioned, primaryPeaks, sampleRate);
  const peakTimes = primaryPeaks.map((peak) => ecgTimes[peak]);
  const NEIGHBOR_MIN = 0.6;
  const DISTINCT_MAX = 0.7;
  const classify = (event, isPause) => {
    if (!beatTemplate || !peakTimes.length) {
      event.classification = "unverified";
      event.morphology = "unknown";
      return event;
    }
    const targetNs = minTime + event.timeSec * 1e9;
    const at = nearestPeakIndex(peakTimes, targetNs);
    const beatCorr = correlateBeat(conditioned, primaryPeaks[at], beatTemplate);
    const prevCorr = at > 0 ? correlateBeat(conditioned, primaryPeaks[at - 1], beatTemplate) : null;
    const nextCorr = at + 1 < primaryPeaks.length ? correlateBeat(conditioned, primaryPeaks[at + 1], beatTemplate) : null;
    const neighborCorrs = [prevCorr, nextCorr].filter(Number.isFinite);
    const neighborsClean = neighborCorrs.length > 0 && neighborCorrs.every((value) => value >= NEIGHBOR_MIN);
    event.templateCorrelation = Number.isFinite(beatCorr) ? beatCorr : null;
    event.neighborCorrelation = neighborCorrs.length ? Math.min(...neighborCorrs) : null;
    if (!neighborsClean) {
      event.classification = "artifact-suspected";
      event.morphology = "unknown";
      event.confidencePct = Math.round(clamp3((event.neighborCorrelation ?? 0) * 100, 0, 100));
      return event;
    }
    event.classification = "verified";
    event.confidencePct = Math.round(clamp3(Math.min(...neighborCorrs) * 100, 0, 100));
    if (isPause) {
      event.morphology = "flanked-by-normal-beats";
    } else {
      event.morphology = Number.isFinite(beatCorr) && beatCorr < DISTINCT_MAX ? "distinct-qrs" : "narrow-similar";
    }
    return event;
  };
  for (const event of ectopicEvents) classify(event, false);
  for (const event of pauseEvents) classify(event, true);
  return {
    verifiedEctopicCount: ectopicEvents.filter((event) => event.classification !== "artifact-suspected").length,
    artifactEctopicCount: ectopicEvents.filter((event) => event.classification === "artifact-suspected").length,
    verifiedPauseCount: pauseEvents.filter((event) => event.classification !== "artifact-suspected").length,
    artifactPauseCount: pauseEvents.filter((event) => event.classification === "artifact-suspected").length,
    distinctQrsCount: ectopicEvents.filter((event) => event.morphology === "distinct-qrs").length,
    templateAvailable: Boolean(beatTemplate)
  };
}
function analyzeRhythm(rrs, minTime, qualityTimeline = []) {
  const cleanRrs = [];
  const ectopicEvents = [];
  const pauseEvents = [];
  const irregularBins = /* @__PURE__ */ new Map();
  let sensorIssueCount = 0;
  let qualityExcludedBeatCount = 0;
  let suppressedCandidateCount = 0;
  for (let index = 0; index < rrs.length; index++) {
    const rr = rrs[index];
    const timeSec = (rr.time - minTime) / 1e9;
    const quality = qualitySegmentAt(qualityTimeline, timeSec);
    if (rr.signalGap || quality && !quality.hrUsable) {
      sensorIssueCount++;
      qualityExcludedBeatCount++;
      suppressedCandidateCount++;
      continue;
    }
    const local = rrs.slice(Math.max(0, index - 10), Math.min(rrs.length, index + 11)).filter((entry) => {
      if (entry.signalGap) return false;
      const entryQuality = qualitySegmentAt(qualityTimeline, (entry.time - minTime) / 1e9);
      return !entryQuality || entryQuality.hrUsable;
    }).map((entry) => entry.val).filter((value) => value >= 300 && value <= 2e3);
    const localMedian = median6(local) || rr.val;
    const nextEntry = rrs[index + 1];
    const nextQuality = nextEntry ? qualitySegmentAt(qualityTimeline, (nextEntry.time - minTime) / 1e9) : null;
    const next = nextEntry && !nextEntry.signalGap && (!nextQuality || nextQuality.hrUsable) ? nextEntry.val : null;
    const premature = rr.val < localMedian * 0.8;
    const compensatory = Number.isFinite(next) && next > localMedian * 1.2 && Math.abs(rr.val + next - 2 * localMedian) / (2 * localMedian) <= 0.25;
    const pause = rr.val >= 2e3 && rr.val >= localMedian * 1.5;
    const physiologic = rr.val >= 300 && rr.val <= 2e3;
    const localDeviation = Math.abs(rr.val - localMedian) / localMedian;
    if (premature && compensatory) {
      ectopicEvents.push({ type: "ectopic", timeSec, rrMs: rr.val });
      continue;
    }
    if (pause) {
      pauseEvents.push({ type: "pause", timeSec, rrMs: rr.val });
      continue;
    }
    if (!physiologic) {
      sensorIssueCount++;
      continue;
    }
    if (localDeviation <= 0.25) cleanRrs.push(rr);
    const binStart = Math.floor(timeSec / 30) * 30;
    const bin = irregularBins.get(binStart) ?? { total: 0, irregular: 0 };
    bin.total++;
    if (localDeviation > 0.2) bin.irregular++;
    irregularBins.set(binStart, bin);
  }
  const irregularEpisodes = [];
  let run = null;
  for (const [startSec, bin] of [...irregularBins.entries()].sort((a, b) => a[0] - b[0])) {
    const irregular = bin.total >= 20 && bin.irregular / bin.total >= 0.2;
    if (irregular) {
      if (!run || startSec - run.endSec > 35) run = { type: "irregular", startSec, endSec: startSec + 30, maxIrregularFraction: bin.irregular / bin.total };
      else {
        run.endSec = startSec + 30;
        run.maxIrregularFraction = Math.max(run.maxIrregularFraction, bin.irregular / bin.total);
      }
    } else if (run) {
      irregularEpisodes.push(run);
      run = null;
    }
  }
  if (run) irregularEpisodes.push(run);
  return {
    cleanRrs,
    ectopicEvents,
    pauseEvents,
    irregularEpisodes,
    sensorIssueCount,
    qualityExcludedBeatCount,
    suppressedCandidateCount
  };
}
function computeMetricWindows(cleanRrs, allRrs, minTime, durationSec, qualityTimeline = []) {
  const windows = [];
  for (let startSec = 0; startSec < durationSec; startSec += FIVE_MINUTES) {
    const endSec = Math.min(durationSec, startSec + FIVE_MINUTES);
    const startTime = minTime + startSec * 1e9;
    const endTime = minTime + endSec * 1e9;
    const allWindow = allRrs.filter((rr) => rr.time >= startTime && rr.time < endTime);
    const cleanWindow = cleanRrs.filter((rr) => rr.time >= startTime && rr.time < endTime);
    if (allWindow.length < 5) continue;
    const hrvWindow = cleanWindow.filter((rr) => {
      const quality = qualitySegmentAt(qualityTimeline, (rr.time - minTime) / 1e9);
      return !quality || quality.hrvUsable;
    });
    const rrValues = hrvWindow.map((rr) => rr.val);
    const hrValues = cleanWindow.map((rr) => 6e4 / rr.val);
    const coverage = allWindow.length ? cleanWindow.length / allWindow.length * 100 : 0;
    const hrvCoverage = allWindow.length ? hrvWindow.length / allWindow.length * 100 : 0;
    const hrv = computeHrv(rrValues);
    const hrValid = endSec - startSec >= 60 && coverage >= 70 && cleanWindow.length >= 30;
    const hrvValid = endSec - startSec >= 240 && hrvCoverage >= 80 && hrvWindow.length >= 120;
    windows.push({
      startSec,
      endSec,
      centerSec: (startSec + endSec) / 2,
      durationSec: endSec - startSec,
      avgHr: mean3(hrValues),
      medianHr: median6(hrValues),
      minHr: percentile3(hrValues, 0.05),
      maxHr: percentile3(hrValues, 0.95),
      hrStd: standardDeviation2(hrValues),
      meanNN: rrValues.length ? mean3(rrValues) : null,
      cleanCoverage: coverage,
      hrvCoverage,
      hrValid,
      hrvValid,
      valid: hrValid,
      ...hrv
    });
  }
  return windows;
}
function buildBeatOverlay(ecgs, rPeakIndices, sampleRate) {
  const beatSamples = [];
  const step = Math.max(1, Math.floor(rPeakIndices.length / 160));
  const halfWindow = Math.floor(sampleRate * 0.3);
  const beatLength = halfWindow * 2 + 1;
  for (let index = 0; index < rPeakIndices.length; index += step) {
    const peak = rPeakIndices[index];
    if (peak - halfWindow < 0 || peak + halfWindow >= ecgs.length) continue;
    beatSamples.push(ecgs.slice(peak - halfWindow, peak + halfWindow + 1));
  }
  const overlay = { mean: [], upper: [], lower: [], morphologyScore: 0, sampleRate };
  if (!beatSamples.length) return overlay;
  for (let column = 0; column < beatLength; column++) {
    const values = beatSamples.map((beat) => beat[column]);
    const avg = mean3(values);
    const sd = standardDeviation2(values);
    overlay.mean.push(avg);
    overlay.upper.push(avg + sd);
    overlay.lower.push(avg - sd);
  }
  const meanRange = Math.max(...overlay.mean) - Math.min(...overlay.mean) || 1;
  const normalizedSpread = mean3(overlay.upper.map((value, index) => Math.abs(value - overlay.mean[index]))) / meanRange;
  overlay.morphologyScore = clamp3(100 - normalizedSpread * 180, 0, 100);
  return overlay;
}
function buildClassification(windows, durationSec, startTimeNs, estimatedMaxHr) {
  const validWindows = windows.filter((window2) => window2.valid);
  const workoutThreshold = Math.max(100, estimatedMaxHr * 0.55);
  let workoutSeconds = 0;
  let restSeconds = 0;
  for (const window2 of validWindows) {
    const workoutLike = window2.medianHr >= workoutThreshold || window2.maxHr - window2.minHr >= 30;
    if (workoutLike) workoutSeconds += window2.durationSec;
    else restSeconds += window2.durationSec;
  }
  const classifiedSeconds = workoutSeconds + restSeconds || durationSec;
  const workoutShare = workoutSeconds / classifiedSeconds;
  const restShare = restSeconds / classifiedSeconds;
  const startHour = Number.isFinite(startTimeNs) ? new Date(startTimeNs / 1e6).getHours() : null;
  const overnightStart = startHour !== null && (startHour >= 20 || startHour <= 6);
  const overallHr = median6(validWindows.map((window2) => window2.medianHr));
  let inferredMode = "rest";
  let confidence = 55;
  let reason = "Heart rate remained predominantly below the workout threshold.";
  if (workoutShare >= 0.2 && restShare >= 0.2) {
    inferredMode = "mixed";
    confidence = clamp3(55 + Math.min(workoutShare, restShare) * 100, 55, 90);
    reason = "The recording contains substantial low-activity and workout-like segments.";
  } else if (workoutShare > 0.5) {
    inferredMode = "workout";
    confidence = clamp3(60 + workoutShare * 35, 60, 96);
    reason = "Most valid windows show sustained workout-level heart rate or large ramps.";
  } else if (durationSec >= 5400 && overallHr < 90 && overnightStart) {
    inferredMode = "sleep";
    confidence = clamp3(58 + restShare * 22, 58, 80);
    reason = "A long overnight recording with sustained low heart rate is sleep-like; ECG alone cannot confirm sleep.";
  } else {
    confidence = clamp3(50 + restShare * 25, 50, 75);
  }
  return {
    inferredMode,
    selectedMode: inferredMode,
    override: false,
    confidence: Math.round(confidence),
    reason,
    segmentShares: {
      workout: workoutShare * 100,
      rest: restShare * 100
    },
    availableModes: MODE_VALUES
  };
}
function buildWorkoutMetrics(cleanRrs, hrPoints, windows, durationSec, estimatedMaxHr, minTime) {
  const hrValues = cleanRrs.map((rr) => 6e4 / rr.val);
  const cleanHrPoints = cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, value: 6e4 / rr.val }));
  const stats = {
    avg: mean3(hrValues),
    median: median6(hrValues),
    min: percentile3(hrValues, 0.01),
    max: percentile3(hrValues, 0.99),
    percentiles: {
      p5: percentile3(hrValues, 0.05),
      p25: percentile3(hrValues, 0.25),
      p50: percentile3(hrValues, 0.5),
      p75: percentile3(hrValues, 0.75),
      p95: percentile3(hrValues, 0.95)
    }
  };
  const trendBpmPerHour = computeLinearSlope(hrPoints);
  let rampBpmPerMinute = 0;
  for (let index = 0; index < hrPoints.length; index++) {
    let later = index + 1;
    while (later < hrPoints.length && hrPoints[later].timeSec - hrPoints[index].timeSec < 60) later++;
    if (later < hrPoints.length) {
      const elapsed = hrPoints[later].timeSec - hrPoints[index].timeSec;
      const ramp = (hrPoints[later].value - hrPoints[index].value) / elapsed * 60;
      rampBpmPerMinute = Math.max(rampBpmPerMinute, ramp);
    }
  }
  const zoneTimes = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  for (const rr of cleanRrs) {
    const hr = 6e4 / rr.val;
    const ratio = hr / estimatedMaxHr;
    const duration = rr.val / 1e3;
    if (ratio < 0.6) zoneTimes.z1 += duration;
    else if (ratio < 0.7) zoneTimes.z2 += duration;
    else if (ratio < 0.8) zoneTimes.z3 += duration;
    else if (ratio < 0.9) zoneTimes.z4 += duration;
    else zoneTimes.z5 += duration;
  }
  const zoneArray = Object.entries(zoneTimes).map(([key, seconds], index) => ({
    key,
    label: `Zone ${index + 1}`,
    seconds,
    minutes: seconds / 60,
    weight: index + 1
  }));
  const loadScore = zoneArray.reduce((sum, zone) => sum + zone.minutes * zone.weight, 0);
  const peakPoint = hrPoints.reduce((best, point) => !best || point.value > best.value ? point : best, null);
  const recovery = { peakHr: peakPoint?.value ?? 0, peakTimeSec: peakPoint?.timeSec ?? 0, values: {}, available: false, tauSec: null };
  if (peakPoint) {
    for (const seconds of [30, 60, 120]) {
      const candidates = hrPoints.filter((point) => Math.abs(point.timeSec - (peakPoint.timeSec + seconds)) <= 15);
      const target = candidates.length ? mean3(candidates.map((point) => point.value)) : null;
      recovery.values[seconds] = Number.isFinite(target) ? {
        hr: target,
        drop: peakPoint.value - target,
        available: peakPoint.timeSec + seconds <= durationSec
      } : { hr: null, drop: null, available: false };
    }
    recovery.available = Object.values(recovery.values).some((value) => value.available);
    const tail = hrPoints.filter((point) => point.timeSec >= peakPoint.timeSec && point.timeSec <= peakPoint.timeSec + 300);
    if (tail.length >= 6) {
      const plateau = Math.min(...tail.map((point) => point.value)) - 1;
      const fitPoints = tail.map((point) => ({ x: point.timeSec - peakPoint.timeSec, y: point.value - plateau })).filter((point) => point.y > 0.5);
      if (fitPoints.length >= 6 && peakPoint.value - plateau >= 10) {
        const xs = fitPoints.map((point) => point.x);
        const ys = fitPoints.map((point) => Math.log(point.y));
        const meanX = mean3(xs);
        const meanY = mean3(ys);
        let numerator = 0;
        let denominator = 0;
        for (let index = 0; index < xs.length; index++) {
          numerator += (xs[index] - meanX) * (ys[index] - meanY);
          denominator += (xs[index] - meanX) ** 2;
        }
        const slope = denominator ? numerator / denominator : 0;
        if (slope < -1e-4) recovery.tauSec = clamp3(-1 / slope, 10, 600);
      }
    }
  }
  const restHrReference = Math.min(80, percentile3(hrValues, 0.05) || 60);
  const heartRateReserve = Math.max(1, estimatedMaxHr - restHrReference);
  let trimpScore = 0;
  for (const rr of cleanRrs) {
    const hr = 6e4 / rr.val;
    const fraction = clamp3((hr - restHrReference) / heartRateReserve, 0, 1);
    trimpScore += rr.val / 6e4 * fraction * 0.64 * Math.exp(1.92 * fraction);
  }
  const effortThreshold = Math.max(estimatedMaxHr * 0.75, percentile3(hrPoints.map((point) => point.value), 0.7));
  const rawEfforts = findThresholdEpisodes(hrPoints, (value) => value >= effortThreshold, 60, 15);
  const intervals = rawEfforts.map((effort, index) => {
    const effortPoints = hrPoints.filter((point) => point.timeSec >= effort.startSec && point.timeSec <= effort.endSec);
    const nextStart = rawEfforts[index + 1]?.startSec ?? Math.min(durationSec, effort.endSec + 120);
    const recoveryPoints = hrPoints.filter((point) => point.timeSec > effort.endSec && point.timeSec <= nextStart);
    const peakHr = Math.max(...effortPoints.map((point) => point.value), 0);
    const recoveryLow = recoveryPoints.length ? Math.min(...recoveryPoints.map((point) => point.value)) : null;
    return {
      index: index + 1,
      startSec: effort.startSec,
      endSec: effort.endSec,
      durationSec: effort.endSec - effort.startSec,
      peakHr,
      recoveryDrop: Number.isFinite(recoveryLow) ? peakHr - recoveryLow : null
    };
  });
  const intervalApplicable = intervals.length >= 2;
  const driftEligible = durationSec >= 1800 && !intervalApplicable && hrPoints.length >= 12;
  let driftValuePct = null;
  if (driftEligible) {
    const analysisPoints = hrPoints.filter((point) => point.timeSec >= Math.min(600, durationSec * 0.15));
    const third = Math.max(1, Math.floor(analysisPoints.length / 3));
    const early = mean3(analysisPoints.slice(0, third).map((point) => point.value));
    const late = mean3(analysisPoints.slice(-third).map((point) => point.value));
    driftValuePct = early ? (late - early) / early * 100 : null;
  }
  const spikeDropFlags = [];
  for (let index = 0; index < hrPoints.length; index++) {
    const later = hrPoints.find((point) => point.timeSec >= hrPoints[index].timeSec + 30);
    if (!later || later.timeSec - hrPoints[index].timeSec > 45) continue;
    const change = later.value - hrPoints[index].value;
    const intervalTransition = intervals.some((interval) => Math.abs(interval.startSec - hrPoints[index].timeSec) <= 45 || Math.abs(interval.endSec - hrPoints[index].timeSec) <= 45);
    if (Math.abs(change) >= 20 && !intervalTransition) {
      spikeDropFlags.push({
        type: change > 0 ? "spike" : "drop",
        timeSec: hrPoints[index].timeSec,
        changeBpm: change
      });
    }
  }
  return {
    hr: stats,
    trendBpmPerHour,
    rampBpmPerMinute,
    peakTiming: peakPoint ? { timeSec: peakPoint.timeSec, percentIntoRecording: peakPoint.timeSec / durationSec * 100, hr: peakPoint.value } : null,
    zoneTimes,
    zones: zoneArray,
    loadScore,
    trimp: {
      score: trimpScore,
      restHrReference,
      maxHrReference: estimatedMaxHr,
      note: "Banister TRIMP using this session's robust low HR as the resting reference."
    },
    recovery,
    intervals: intervalApplicable ? intervals : [],
    intervalDetection: {
      applicable: intervalApplicable,
      count: intervalApplicable ? intervals.length : 0,
      reason: intervalApplicable ? "Repeated sustained high-HR efforts were detected." : "Fewer than two confident effort/recovery blocks were detected."
    },
    drift: {
      eligible: driftEligible,
      valuePct: driftValuePct,
      reason: driftEligible ? "HR-only early-to-late comparison; constant external workload cannot be confirmed." : durationSec < 1800 ? "Requires at least 30 minutes." : "Interval-like structure makes an HR-only drift proxy misleading."
    },
    spikeDropFlags: spikeDropFlags.slice(0, 20),
    cleanBeatCount: cleanHrPoints.length
  };
}
function buildRestMetrics(cleanRrs, hrPoints, windows, durationSec, cleanBeatPercentage, qualityTimeline = [], minTime = 0) {
  const validWindows = windows.filter((window2) => window2.hrValid);
  const hrvWindows = windows.filter((window2) => window2.hrvValid);
  const stableWindows = validWindows.filter((window2) => window2.hrStd <= 5 && window2.cleanCoverage >= 90);
  const stableSource = stableWindows.length ? stableWindows : validWindows;
  const stableHrValues = stableSource.map((window2) => window2.avgHr);
  const sortedStable = [...stableHrValues].sort((a, b) => a - b);
  const lowerQuartile = sortedStable.slice(0, Math.max(1, Math.ceil(sortedStable.length / 4)));
  const restingHr = median6(lowerQuartile);
  const lowest5MinHr = sortedStable.length ? sortedStable[0] : percentile3(hrPoints.map((point) => point.value), 0.05);
  let lowest10MinHr = null;
  for (let index = 1; index < stableSource.length; index++) {
    const previous = stableSource[index - 1];
    const current = stableSource[index];
    if (current.startSec - previous.endSec > 5) continue;
    const combined = (previous.avgHr * previous.durationSec + current.avgHr * current.durationSec) / (previous.durationSec + current.durationSec);
    lowest10MinHr = lowest10MinHr === null ? combined : Math.min(lowest10MinHr, combined);
  }
  const baselineHr = lowest10MinHr ?? lowest5MinHr;
  const validLnRmssd = hrvWindows.map((window2) => window2.lnRMSSD).filter((value) => value > 0);
  const baselineLnRmssd = median6(validLnRmssd);
  const lnMad = medianAbsoluteDeviation(validLnRmssd) || 0.15;
  const hrvEligibleRrs = cleanRrs.filter((rr) => {
    const quality = qualitySegmentAt(qualityTimeline, (rr.time - minTime) / 1e9);
    return !quality || quality.hrvUsable;
  });
  const hrv = computeHrv(hrvEligibleRrs.map((rr) => rr.val));
  const hrvValidDurationSec = hrvWindows.reduce((sum, window2) => sum + window2.durationSec, 0);
  const overallHr = mean3(hrPoints.map((point) => point.value));
  const hrComponent = clamp3(100 - Math.max(0, overallHr - baselineHr - 3) / 17 * 100, 0, 100);
  const hrvComponent = baselineLnRmssd ? clamp3(70 + (hrv.lnRMSSD - baselineLnRmssd) / 0.7 * 30, 0, 100) : 50;
  const recoveryScore = Math.round(hrComponent * 0.45 + hrvComponent * 0.35 + cleanBeatPercentage * 0.2);
  const hrCv = overallHr ? standardDeviation2(hrPoints.map((point) => point.value)) / overallHr : 1;
  const stabilityScore = Math.round(clamp3(100 - hrCv * 320 - Math.abs(computeLinearSlope(hrPoints)) * 0.15, 0, 100));
  const suppressedHrvEpisodes = [];
  let suppressedStart = null;
  for (const window2 of hrvWindows) {
    const suppressed = window2.lnRMSSD > 0 && window2.lnRMSSD < baselineLnRmssd - lnMad;
    if (suppressed && suppressedStart === null) suppressedStart = window2.startSec;
    if (!suppressed && suppressedStart !== null) {
      if (window2.startSec - suppressedStart >= 600) suppressedHrvEpisodes.push({ startSec: suppressedStart, endSec: window2.startSec });
      suppressedStart = null;
    }
  }
  if (suppressedStart !== null && durationSec - suppressedStart >= 600) suppressedHrvEpisodes.push({ startSec: suppressedStart, endSec: durationSec });
  const elevatedRestingEpisodes = findThresholdEpisodes(
    hrPoints,
    (value) => Number.isFinite(baselineHr) && value >= baselineHr + 10,
    15 * 60,
    15
  );
  const highSleepingThreshold = Math.max(100, (baselineHr || 80) + 20);
  const highSleepingEpisodes = findThresholdEpisodes(hrPoints, (value) => value >= highSleepingThreshold, 300, 15);
  const bradycardiaEpisodes = findThresholdEpisodes(hrPoints, (value) => value < 40, 30, 15);
  return {
    hr: {
      avg: mean3(hrPoints.map((point) => point.value)),
      median: median6(hrPoints.map((point) => point.value)),
      min: percentile3(hrPoints.map((point) => point.value), 0.01),
      max: percentile3(hrPoints.map((point) => point.value), 0.99)
    },
    restingHr,
    lowest5MinHr,
    lowest10MinHr,
    hrv,
    hrvValidDurationSec,
    stabilityScore,
    recoveryScore,
    baseline: {
      type: "within-recording",
      hr: baselineHr,
      lnRMSSD: baselineLnRmssd,
      note: "Derived from stable clean windows in this upload; not a cross-night baseline."
    },
    suppressedHrvEpisodes,
    suppressedHrvFlag: suppressedHrvEpisodes.length > 0,
    elevatedRestingEpisodes,
    elevatedRestingHrFlag: elevatedRestingEpisodes.length > 0,
    highSleepingEpisodes,
    highSleepingThreshold,
    bradycardiaEpisodes,
    windows: validWindows
  };
}
function buildHourlySummary(windows, durationSec, freqWindows = [], respirationWindows = []) {
  const hours = [];
  for (let hour = 0; hour * 3600 < durationSec; hour++) {
    const startSec = hour * 3600;
    const endSec = Math.min(durationSec, startSec + 3600);
    const hourWindows = windows.filter((window2) => window2.centerSec >= startSec && window2.centerSec < endSec);
    const validWindows = hourWindows.filter((window2) => window2.hrValid);
    const hrvWindows = hourWindows.filter((window2) => window2.hrvValid && window2.rmssd > 0);
    const freqHere = freqWindows.filter((window2) => window2.centerSec >= startSec && window2.centerSec < endSec);
    const breathing = summarizeRespiration(respirationWindows.filter((w) => w.centerSec >= startSec && w.centerSec < endSec));
    hours.push({
      hour: hour + 1,
      startSec,
      endSec,
      avgHr: validWindows.length ? mean3(validWindows.map((window2) => window2.avgHr)) : null,
      minHr: validWindows.length ? Math.min(...validWindows.map((window2) => window2.avgHr)) : null,
      rmssd: hrvWindows.length ? median6(hrvWindows.map((window2) => window2.rmssd)) : null,
      lfHfRatio: freqHere.length ? median6(freqHere.map((window2) => window2.lfHfRatio).filter(Number.isFinite)) : null,
      respirationBpm: breathing.medianBpm,
      respirationCoveragePct: breathing.coveragePct,
      cleanCoveragePct: hourWindows.length ? mean3(hourWindows.map((window2) => window2.cleanCoverage)) : 0,
      usableWindowCount: validWindows.length,
      windowCount: hourWindows.length
    });
  }
  return hours;
}
function buildSleepStageProxy(windows, restingHr, durationSec) {
  const hrvValid = windows.filter((window2) => window2.hrvValid && window2.rmssd > 0);
  const rmssdReference = median6(hrvValid.map((window2) => window2.rmssd)) || 0;
  const stages = windows.map((window2) => {
    let stage = "unscored";
    if (window2.hrValid && Number.isFinite(restingHr)) {
      const hrDelta = window2.avgHr - restingHr;
      if (hrDelta >= 12 || window2.cleanCoverage < 70) stage = "wake-like";
      else if (window2.hrvValid && window2.rmssd >= rmssdReference && hrDelta <= 3 && window2.hrStd <= 3.5) stage = "deep-like";
      else if (hrDelta >= 5 || window2.hrStd >= 6) stage = "rem-like";
      else stage = "light-like";
    }
    return { startSec: window2.startSec, endSec: window2.endSec, stage, avgHr: window2.avgHr, rmssd: window2.rmssd };
  });
  const minutesFor = (stage) => stages.filter((entry) => entry.stage === stage).reduce((sum, entry) => sum + (entry.endSec - entry.startSec) / 60, 0);
  const scoredMinutes = minutesFor("deep-like") + minutesFor("light-like") + minutesFor("rem-like");
  return {
    available: durationSec >= 3600 && scoredMinutes >= 60,
    stages,
    minutes: {
      deep: minutesFor("deep-like"),
      light: minutesFor("light-like"),
      rem: minutesFor("rem-like"),
      wake: minutesFor("wake-like"),
      unscored: minutesFor("unscored")
    },
    caveat: "HR/HRV-based stage proxy from single-lead ECG; it is not polysomnography and does not measure brain activity."
  };
}
function buildNocturnalDip(windows, lowestStableHr, durationSec) {
  const firstHourWindows = windows.filter((window2) => window2.hrValid && window2.centerSec <= 3600);
  const referenceHr = firstHourWindows.length ? median6(firstHourWindows.map((window2) => window2.avgHr)) : null;
  if (!Number.isFinite(referenceHr) || !Number.isFinite(lowestStableHr) || durationSec < 2 * 3600) {
    return { available: false, dipPct: null, referenceHr: null, lowestStableHr: null };
  }
  return {
    available: true,
    referenceHr,
    lowestStableHr,
    dipPct: referenceHr > 0 ? (referenceHr - lowestStableHr) / referenceHr * 100 : null,
    note: "First-hour median HR versus the lowest stable HR later in the same recording."
  };
}
function analyzeEcgData(csvFiles, profileInfo = {}, progressCallback) {
  const parsed = parseEcgCsvFiles(csvFiles, profileInfo, progressCallback);
  const ecgTimes = parsed.ecgTimes;
  const ecgs = parsed.ecgs;
  const ingestionDiagnostics = parsed.diagnostics;
  let ecgMax = -Infinity;
  let ecgMin = Infinity;
  for (const ecg of ecgs) {
    ecgMax = Math.max(ecgMax, ecg);
    ecgMin = Math.min(ecgMin, ecg);
  }
  const minTime = ecgTimes[0];
  const maxTime = ecgTimes[ecgTimes.length - 1];
  const durationSec = (maxTime - minTime) / 1e9;
  if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error("The ECG timestamps do not span a valid recording duration.");
  const deltaSample = [];
  const deltaStep = Math.max(1, Math.floor((ecgTimes.length - 1) / 2e4));
  for (let index = deltaStep; index < ecgTimes.length; index += deltaStep) {
    const delta = (ecgTimes[index] - ecgTimes[index - deltaStep]) / 1e9 / deltaStep;
    if (delta > 0 && delta < 0.1) deltaSample.push(delta);
  }
  const medianSampleIntervalSec = median6(deltaSample) || durationSec / Math.max(1, ecgs.length - 1);
  const sampleRate = 1 / medianSampleIntervalSec;
  const gapThreshold = medianSampleIntervalSec * 2.5;
  const gaps = [];
  let missingSamples = 0;
  let gapDurationSec = 0;
  for (let index = 1; index < ecgTimes.length; index++) {
    const delta = (ecgTimes[index] - ecgTimes[index - 1]) / 1e9;
    if (delta <= gapThreshold) continue;
    const missing = Math.max(0, Math.round(delta / medianSampleIntervalSec) - 1);
    missingSamples += missing;
    gapDurationSec += Math.max(0, delta - medianSampleIntervalSec);
    gaps.push({
      timeSec: (ecgTimes[index - 1] - minTime) / 1e9,
      durationSec: delta,
      missingSamples: missing
    });
  }
  const amplitude = ecgMax - ecgMin;
  const conditioned = conditionForDetection(ecgs, sampleRate);
  const primaryPeaks = detectRPeaks(conditioned, sampleRate);
  const secondaryPeaks = detectRPeaksSecondary(conditioned, sampleRate);
  const rPeakConfidence = matchPeakDetectors(primaryPeaks, secondaryPeaks, sampleRate);
  const signalQuality = buildSignalQualityTimeline({
    ecgs,
    ecgTimes,
    sampleRate,
    minTime,
    durationSec,
    primaryPeaks,
    secondaryPeaks
  });
  const rrs = [];
  let gapIndex = 0;
  for (let index = 1; index < primaryPeaks.length; index++) {
    const previous = primaryPeaks[index - 1];
    const current = primaryPeaks[index];
    const rrMs = (ecgTimes[current] - ecgTimes[previous]) / 1e6;
    const previousSec = (ecgTimes[previous] - minTime) / 1e9;
    const currentSec = (ecgTimes[current] - minTime) / 1e9;
    while (gapIndex < gaps.length && gaps[gapIndex].timeSec < previousSec) gapIndex++;
    const signalGap = gapIndex < gaps.length && gaps[gapIndex].timeSec >= previousSec && gaps[gapIndex].timeSec < currentSec;
    if (rrMs > 150 && rrMs < 5e3) rrs.push({ time: ecgTimes[current], val: rrMs, signalGap });
  }
  const rhythmAnalysis = analyzeRhythm(rrs, minTime, signalQuality.segments);
  const candidateVerification = verifyRhythmCandidates({
    conditioned,
    ecgTimes,
    primaryPeaks,
    sampleRate,
    ectopicEvents: rhythmAnalysis.ectopicEvents,
    pauseEvents: rhythmAnalysis.pauseEvents,
    minTime
  });
  const cleanRrs = rhythmAnalysis.cleanRrs;
  const hrs = cleanRrs.map((rr) => ({ time: rr.time, val: 6e4 / rr.val }));
  const hrValues = hrs.map((hr) => hr.val);
  const rrValues = cleanRrs.map((rr) => rr.val);
  const cleanBeatPercentage = rrs.length ? cleanRrs.length / rrs.length * 100 : 0;
  const artifactPercentage = 100 - cleanBeatPercentage;
  const windows = computeMetricWindows(cleanRrs, rrs, minTime, durationSec, signalQuality.segments);
  const hrPoints = aggregateTimedValues(hrs, minTime, durationSec, 15);
  const rrPoints = downsample(cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, value: rr.val })), 1e3);
  const morphologyPeaks = primaryPeaks.filter((peak) => {
    const quality = qualitySegmentAt(signalQuality.segments, (ecgTimes[peak] - minTime) / 1e9);
    return !quality || quality.morphologyUsable;
  });
  const beatOverlay = buildBeatOverlay(ecgs, morphologyPeaks, sampleRate);
  const suppliedMaxHr = Number(profileInfo.knownMaxHr);
  const estimatedMaxHr = Number.isFinite(suppliedMaxHr) && suppliedMaxHr >= 100 ? suppliedMaxHr : 220 - (profileInfo.age || 30);
  const providedStartMs = Date.parse(profileInfo.recordingDateTime || "");
  const hasAbsoluteTimeline = ingestionDiagnostics.files?.some((file) => file.absoluteTimeline);
  const classificationStartNs = Number.isFinite(providedStartMs) ? providedStartMs * 1e6 : hasAbsoluteTimeline ? minTime : Number.NaN;
  const classification = buildClassification(windows, durationSec, classificationStartNs, estimatedMaxHr);
  const workout = buildWorkoutMetrics(cleanRrs, hrPoints, windows, durationSec, estimatedMaxHr, minTime);
  const rest = buildRestMetrics(cleanRrs, hrPoints, windows, durationSec, cleanBeatPercentage, signalQuality.segments, minTime);
  const nnBeats = cleanRrs.map((rr) => ({ timeSec: (rr.time - minTime) / 1e9, nnMs: rr.val }));
  const freqDomain = computeFrequencyDomain(nnBeats, windows);
  const nonlinear = computeNonlinear(rrValues);
  const timeExtras = computeTimeDomainExtras(rrValues, windows);
  const respiration = estimateRespiration({
    ecgs,
    ecgTimes,
    primaryPeaks,
    cleanRrs,
    minTime,
    durationSec,
    sampleRate,
    qualityTimeline: signalQuality.segments,
    gaps,
    mode: profileInfo.recordingType && profileInfo.recordingType !== "auto" ? profileInfo.recordingType : classification.inferredMode
  });
  rest.hourly = buildHourlySummary(windows, durationSec, freqDomain.windows, respiration.windows);
  rest.stageProxy = buildSleepStageProxy(windows, rest.restingHr, durationSec);
  rest.nocturnalDip = buildNocturnalDip(windows, rest.lowest5MinHr, durationSec);
  rest.respirationBpm = respiration.summary.medianBpm;
  const screeningEvents = [
    ...rhythmAnalysis.ectopicEvents,
    ...rhythmAnalysis.pauseEvents,
    ...rhythmAnalysis.irregularEpisodes
  ];
  workout.intervalTest = buildIntervalTestMetrics({
    cleanRrs,
    minTime,
    durationSec,
    qualityTimeline: signalQuality.segments,
    rhythmEvents: screeningEvents,
    profileInfo
  });
  workout.maxHrReference = {
    value: estimatedMaxHr,
    source: Number.isFinite(suppliedMaxHr) && suppliedMaxHr >= 100 ? "athlete-provided" : "age-estimated"
  };
  const continuityScore = clamp3(100 * (1 - missingSamples / Math.max(1, ecgs.length + missingSamples)), 0, 100);
  const detectorScore = clamp3(rPeakConfidence, 0, 100);
  const morphologyScore = (beatOverlay.morphologyScore + signalQuality.morphologyUsablePercentage) / 2;
  const cleanBeatScore = clamp3(cleanBeatPercentage, 0, 100);
  const qualityScore = Math.round(
    continuityScore * 0.2 + detectorScore * 0.2 + morphologyScore * 0.15 + cleanBeatScore * 0.15 + signalQuality.hrUsablePercentage * 0.3
  );
  const qualityLevel = qualityScore >= 90 ? "Excellent" : qualityScore >= 75 ? "Good" : qualityScore >= 55 ? "Fair - review signal quality" : "Poor - likely noise or sensor-contact issues";
  const verifiedEctopicEvents = rhythmAnalysis.ectopicEvents.filter((event) => event.classification !== "artifact-suspected");
  const verifiedPauseEvents = rhythmAnalysis.pauseEvents.filter((event) => event.classification !== "artifact-suspected");
  const ectopicBurdenPct = rrs.length ? verifiedEctopicEvents.length / rrs.length * 100 : 0;
  const pauseBurdenPct = rrs.length ? verifiedPauseEvents.length / rrs.length * 100 : 0;
  const regularityScore = Math.round(clamp3(
    100 - ectopicBurdenPct * 8 - pauseBurdenPct * 15 - rhythmAnalysis.irregularEpisodes.length * 5,
    0,
    100
  ));
  let reviewPriority = "Low";
  if (verifiedPauseEvents.length >= 3 || rhythmAnalysis.irregularEpisodes.length >= 2 || ectopicBurdenPct >= 2) reviewPriority = "Moderate";
  if (verifiedPauseEvents.length >= 10 || rhythmAnalysis.irregularEpisodes.length >= 5 || ectopicBurdenPct >= 5) reviewPriority = "High";
  const rhythmEvents = [
    ...screeningEvents,
    ...rest.bradycardiaEpisodes.map((episode) => ({ ...episode, type: "bradycardia" })),
    ...rest.highSleepingEpisodes.map((episode) => ({ ...episode, type: "high-hr" }))
  ].sort((a, b) => (a.timeSec ?? a.startSec) - (b.timeSec ?? b.startSec));
  const universal = {
    durationSec,
    sampleRate,
    medianSampleIntervalSec,
    totalSamples: ecgs.length,
    expectedSamples: ecgs.length + missingSamples,
    missingSamples,
    gapCount: gaps.length,
    gapDurationSec,
    amplitude,
    ingestion: ingestionDiagnostics,
    qualityScore,
    qualityLevel,
    qualityComponents: {
      continuity: continuityScore,
      rPeakAgreement: detectorScore,
      morphology: morphologyScore,
      cleanBeats: cleanBeatScore,
      hrUsable: signalQuality.hrUsablePercentage
    },
    qualityGrades: signalQuality.grades,
    hrUsablePercentage: signalQuality.hrUsablePercentage,
    hrvUsablePercentage: signalQuality.hrvUsablePercentage,
    morphologyUsablePercentage: signalQuality.morphologyUsablePercentage,
    flatlineDurationSec: signalQuality.flatlineDurationSec,
    clippedSamplePercentage: signalQuality.clippedSamplePercentage,
    baselineWanderIndex: signalQuality.baselineWanderIndex,
    highFrequencyNoiseIndex: signalQuality.highFrequencyNoiseIndex,
    displacementEpisodeCount: signalQuality.displacementEpisodeCount,
    cleanBeatPercentage,
    artifactPercentage,
    rPeakConfidence,
    detectedBeats: primaryPeaks.length
  };
  const rhythm = {
    ectopicCount: verifiedEctopicEvents.length,
    ectopicCandidateCount: rhythmAnalysis.ectopicEvents.length,
    ectopicBurdenPct,
    pauseCount: verifiedPauseEvents.length,
    pauseCandidateCount: rhythmAnalysis.pauseEvents.length,
    pauseBurdenPct,
    verification: candidateVerification,
    irregularEpisodeCount: rhythmAnalysis.irregularEpisodes.length,
    irregularEpisodes: rhythmAnalysis.irregularEpisodes,
    bradycardiaEpisodeCount: rest.bradycardiaEpisodes.length,
    highSleepingHrEpisodeCount: rest.highSleepingEpisodes.length,
    regularityScore,
    reviewPriority,
    sensorIssueCount: rhythmAnalysis.sensorIssueCount,
    qualityExcludedBeatCount: rhythmAnalysis.qualityExcludedBeatCount,
    artifactExcludedIntervalCount: rhythmAnalysis.qualityExcludedBeatCount,
    suppressedArtifactWarningCount: rhythmAnalysis.suppressedCandidateCount,
    artifactEpisodes: signalQuality.excludedEpisodes,
    candidateBurdenPer1000: cleanRrs.length ? rhythmEvents.filter((event) => ["ectopic", "pause", "irregular"].includes(event.type) && event.classification !== "artifact-suspected").length / cleanRrs.length * 1e3 : 0,
    events: rhythmEvents,
    disclaimer: "Screening candidates only. This browser analysis is not a diagnosis and does not replace clinician review."
  };
  const visualizationData = {
    hrPoints: downsample(hrPoints, 1e3),
    rrPoints,
    hrHistogram: computeHistogram(hrValues, 5, 30, 220),
    rrHistogram: computeHistogram(rrValues, 50, 250, 2e3),
    beatOverlay,
    hrvTrend: {
      times: windows.filter((window2) => window2.hrvValid).map((window2) => window2.centerSec),
      rmssd: windows.filter((window2) => window2.hrvValid).map((window2) => window2.rmssd),
      sdnn: windows.filter((window2) => window2.hrvValid).map((window2) => window2.sdnn),
      hr: windows.filter((window2) => window2.hrvValid).map((window2) => window2.avgHr)
    },
    qualityTimeline: signalQuality.segments.map((segment) => ({
      startSec: segment.startSec,
      endSec: segment.endSec,
      score: segment.score,
      hrUsable: segment.hrUsable,
      hrvUsable: segment.hrvUsable,
      morphologyUsable: segment.morphologyUsable,
      displacement: segment.displacement,
      reason: segment.reason
    })),
    poincare: downsample(cleanRrs.slice(1).map((rr, index) => ({
      x: cleanRrs[index].val,
      y: rr.val
    })), 1200),
    qualityComponents: universal.qualityComponents,
    gaps,
    rhythmEvents,
    intervals: workout.intervals,
    recovery: workout.recovery,
    zones: workout.zones,
    restWindows: rest.windows,
    lfhfTrend: freqDomain.windows.map((window2) => ({
      timeSec: window2.centerSec,
      lf: window2.lf,
      hf: window2.hf,
      ratio: window2.lfHfRatio,
      respirationBpm: window2.respirationBpm
    })),
    stageProxy: rest.stageProxy,
    hourly: rest.hourly
  };
  const report = {
    version: 5,
    respiration,
    universal,
    classification,
    workout,
    rest,
    rhythm,
    hrv: {
      time: { ...rest.hrv, ...timeExtras },
      nonlinear,
      frequency: freqDomain.session,
      frequencyAvailable: freqDomain.available,
      frequencyWindowCount: freqDomain.windows.length,
      frequencyNote: "Welch PSD of a 4 Hz resampled clean NN tachogram per valid 5-minute window; session values are medians across windows."
    },
    visualizationData,
    methodology: {
      baselinePolicy: "within-recording",
      hrvStandard: "Clean normal-to-normal intervals; RMSSD, lnRMSSD, SDNN, and pNN50.",
      rPeakConfidence: "Agreement between two independent ECG peak detectors within 100 ms.",
      signalCleansing: "Short quality epochs consolidate gaps, flatline, clipping, abrupt contact shifts, and detector disagreement before rhythm candidates are counted.",
      intervalProtocol: "Five fixed one-minute efforts; each next effort is analyzed only after a sustained return to the original pre-test baseline.",
      activityCaveat: "Sleep versus quiet rest cannot be confirmed from ECG alone.",
      driftCaveat: "HR-only drift proxy cannot confirm constant pace, power, or workload.",
      medicalCaveat: rhythm.disclaimer
    }
  };
  const rawData = {
    ecgs,
    ecgTimes,
    hrs,
    rrs: cleanRrs,
    minTime,
    maxTime,
    durationSec,
    sampleRate,
    qualityTimeline: signalQuality.segments,
    rPeakTimes: primaryPeaks.map((peak) => ecgTimes[peak]),
    ectopicTimes: rhythmAnalysis.ectopicEvents.map((event) => minTime + event.timeSec * 1e9),
    pauseTimes: rhythmAnalysis.pauseEvents.map((event) => minTime + event.timeSec * 1e9),
    ectopicEvents: rhythmAnalysis.ectopicEvents.map((event) => ({
      timeNs: minTime + event.timeSec * 1e9,
      classification: event.classification,
      morphology: event.morphology
    })),
    pauseEventDetails: rhythmAnalysis.pauseEvents.map((event) => ({
      timeNs: minTime + event.timeSec * 1e9,
      classification: event.classification
    }))
  };
  return { report, rawData };
}
function detectRPeaks(ecgs, sampleRate) {
  const n = ecgs.length;
  if (n < 10) return [];
  const diff = new Float64Array(n);
  for (let i = 2; i < n - 2; i++) {
    diff[i] = (-ecgs[i - 2] - ecgs[i - 1] + ecgs[i + 1] + ecgs[i + 2]) / 8;
  }
  const sq = new Float64Array(n);
  for (let i = 0; i < n; i++) sq[i] = diff[i] * diff[i];
  const mwLen = Math.max(3, Math.floor(sampleRate * 0.15));
  const ma = new Float64Array(n);
  let runSum = 0;
  for (let i = 0; i < n; i++) {
    runSum += sq[i];
    if (i >= mwLen) runSum -= sq[i - mwLen];
    ma[i] = runSum / Math.min(i + 1, mwLen);
  }
  const peaks = [];
  const refractorySamples = Math.floor(sampleRate * 0.2);
  const initLen = Math.min(Math.floor(sampleRate * 2), n);
  let maxInit = 0;
  for (let i = 0; i < initLen; i++) {
    if (ma[i] > maxInit) maxInit = ma[i];
  }
  let threshold = maxInit * 0.3;
  let lastPeak = -refractorySamples;
  for (let i = 1; i < n - 1; i++) {
    if (ma[i] > threshold && ma[i] > ma[i - 1] && ma[i] >= ma[i + 1] && i - lastPeak > refractorySamples) {
      let bestIdx = i;
      let bestVal = ecgs[i];
      const lo = Math.max(0, i - 15);
      const hi = Math.min(n - 1, i + 15);
      for (let j = lo; j <= hi; j++) {
        if (ecgs[j] > bestVal) {
          bestVal = ecgs[j];
          bestIdx = j;
        }
      }
      peaks.push(bestIdx);
      lastPeak = bestIdx;
      threshold = 0.7 * threshold + 0.3 * ma[i] * 0.3;
    }
    if (i % Math.floor(sampleRate) === 0) {
      threshold *= 0.95;
      if (threshold < maxInit * 0.05) threshold = maxInit * 0.05;
    }
  }
  return peaks;
}
function extractWindow(rawData, windowStartSec, windowSizeSec) {
  const { ecgs, ecgTimes, hrs, rrs, durationSec, sampleRate, ectopicTimes, pauseTimes, minTime, rPeakTimes, ectopicEvents, pauseEventDetails } = rawData;
  if (windowSizeSec === void 0 || windowSizeSec === null) windowSizeSec = 30;
  if (windowStartSec > durationSec - windowSizeSec) {
    windowStartSec = Math.max(0, durationSec - windowSizeSec);
  }
  if (windowStartSec < 0) windowStartSec = 0;
  const startTimeNs = minTime + windowStartSec * 1e9;
  const endTimeNs = minTime + (windowStartSec + windowSizeSec) * 1e9;
  const lowerBound3 = (values, target) => {
    let lo = 0;
    let hi = values.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (values[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const startIdx = ecgTimes?.length ? lowerBound3(ecgTimes, startTimeNs) : Math.floor(windowStartSec * sampleRate);
  let endIdx = ecgTimes?.length ? lowerBound3(ecgTimes, endTimeNs) : Math.floor((windowStartSec + windowSizeSec) * sampleRate);
  if (endIdx > ecgs.length) endIdx = ecgs.length;
  const rawSlice = ecgs.slice(startIdx, endIdx);
  let sum = 0;
  for (let i = 0; i < rawSlice.length; i++) sum += rawSlice[i];
  const mean4 = rawSlice.length > 0 ? sum / rawSlice.length : 0;
  let varSum = 0;
  for (let i = 0; i < rawSlice.length; i++) varSum += Math.pow(rawSlice[i] - mean4, 2);
  const std = rawSlice.length > 0 ? Math.sqrt(varSum / rawSlice.length) : 0;
  const minValid = mean4 - 3 * std;
  const maxValid = mean4 + 3 * std;
  const maxEcgPoints = 1e4;
  const ecgWindow = { min: [], max: [], median: [] };
  if (rawSlice.length > maxEcgPoints) {
    const chunkLen = rawSlice.length / maxEcgPoints;
    for (let i = 0; i < maxEcgPoints; i++) {
      const cStart = Math.floor(i * chunkLen);
      const cEnd = Math.floor((i + 1) * chunkLen);
      let cMin = Infinity;
      let cMax = -Infinity;
      const vals = [];
      for (let j = cStart; j < cEnd; j++) {
        const v = rawSlice[j];
        if (v >= minValid && v <= maxValid) {
          if (v < cMin) cMin = v;
          if (v > cMax) cMax = v;
          vals.push(v);
        }
      }
      if (vals.length === 0) {
        ecgWindow.min.push(mean4);
        ecgWindow.max.push(mean4);
        ecgWindow.median.push(mean4);
      } else {
        ecgWindow.min.push(cMin);
        ecgWindow.max.push(cMax);
        vals.sort((a, b) => a - b);
        ecgWindow.median.push(vals[Math.floor(vals.length / 2)]);
      }
    }
  } else {
    for (let i = 0; i < rawSlice.length; i++) {
      let v = rawSlice[i];
      if (v < minValid) v = minValid;
      if (v > maxValid) v = maxValid;
      ecgWindow.min.push(v);
      ecgWindow.max.push(v);
      ecgWindow.median.push(v);
    }
  }
  const hrWindow = hrs.filter((h) => h.time >= startTimeNs && h.time <= endTimeNs).map((h) => h.val);
  const rrWindow = rrs.filter((r) => r.time >= startTimeNs && r.time <= endTimeNs).map((r) => r.val);
  const markers = [];
  const ectopicSource = ectopicEvents ?? (ectopicTimes ?? []).map((timeNs) => ({ timeNs }));
  for (const event of ectopicSource) {
    if (event.timeNs >= startTimeNs && event.timeNs <= endTimeNs) {
      markers.push({
        type: "ectopic",
        pos: (event.timeNs - startTimeNs) / (endTimeNs - startTimeNs),
        classification: event.classification ?? "unverified",
        morphology: event.morphology ?? "unknown"
      });
    }
  }
  const pauseSource = pauseEventDetails ?? (pauseTimes ?? []).map((timeNs) => ({ timeNs }));
  for (const event of pauseSource) {
    if (event.timeNs >= startTimeNs && event.timeNs <= endTimeNs) {
      markers.push({
        type: "pause",
        pos: (event.timeNs - startTimeNs) / (endTimeNs - startTimeNs),
        classification: event.classification ?? "unverified"
      });
    }
  }
  const beats = [];
  if (Array.isArray(rPeakTimes) && rPeakTimes.length && windowSizeSec <= 60) {
    let lo = lowerBound3(rPeakTimes, startTimeNs);
    for (let index = lo; index < rPeakTimes.length && rPeakTimes[index] <= endTimeNs; index++) {
      const rrMs = index > 0 ? (rPeakTimes[index] - rPeakTimes[index - 1]) / 1e6 : null;
      beats.push({
        pos: (rPeakTimes[index] - startTimeNs) / (endTimeNs - startTimeNs),
        rrMs: Number.isFinite(rrMs) && rrMs > 150 && rrMs < 5e3 ? rrMs : null
      });
      if (beats.length >= 160) break;
    }
  }
  const numTimeBins = 100;
  const numFreqBins = 40;
  const minFreq = 1;
  const maxFreq = 40;
  const spectrogram = [];
  const dt = 1 / sampleRate;
  const chunkLenForCwt = rawSlice.length;
  const timeSteps = [];
  for (let i = 0; i < numTimeBins; i++) {
    timeSteps.push(Math.floor(i * (chunkLenForCwt / numTimeBins)));
  }
  let maxMagGlobal = 0;
  if (chunkLenForCwt > 0) {
    for (let f = 0; f < numFreqBins; f++) {
      const freq = minFreq + f / numFreqBins * (maxFreq - minFreq);
      const row = [];
      const w0 = 6;
      const s = w0 / (2 * Math.PI * freq);
      const hw = Math.floor(3 * s * sampleRate);
      for (const tIdx of timeSteps) {
        let real = 0;
        let imag = 0;
        const start = Math.max(0, tIdx - hw);
        const end = Math.min(chunkLenForCwt - 1, tIdx + hw);
        for (let j = start; j <= end; j++) {
          const t = (j - tIdx) * dt;
          const val = rawSlice[j];
          const env = Math.exp(-(t * t) / (2 * s * s)) * Math.pow(Math.PI * s * s, -0.25);
          const phase = w0 * t / s;
          real += val * env * Math.cos(phase);
          imag += val * env * Math.sin(phase);
        }
        const magnitude = Math.sqrt(real * real + imag * imag);
        row.push(magnitude);
        if (magnitude > maxMagGlobal) maxMagGlobal = magnitude;
      }
      spectrogram.push(row);
    }
    if (maxMagGlobal > 0) {
      for (let r = 0; r < spectrogram.length; r++) {
        for (let c = 0; c < spectrogram[r].length; c++) {
          spectrogram[r][c] /= maxMagGlobal;
        }
      }
    }
  }
  return {
    ecg: ecgWindow,
    hr: hrWindow,
    rr: rrWindow,
    markers,
    beats,
    spectrogram,
    windowStartSec,
    windowSizeSec,
    durationSec
  };
}

// src/analysis-worker.js
var import_jszip = __toESM(require_jszip_min(), 1);
var globalState = null;
function isCsvName(name) {
  const normalized = String(name || "").replace(/\\/g, "/");
  const parts = normalized.split("/");
  const basename = parts[parts.length - 1] || "";
  return basename.toLowerCase().endsWith(".csv") && !basename.startsWith(".") && !parts.some((part) => part.toLowerCase() === "__macosx");
}
function hasExtension(name, extension) {
  return String(name || "").toLowerCase().endsWith(extension);
}
self.onmessage = async (e) => {
  const { files, profileInfo, action, windowStart, windowSize } = e.data;
  if (action === "get_window") {
    if (!globalState) return;
    const result = extractWindow(globalState, windowStart || 0, windowSize || 30);
    self.postMessage({ type: "window_data", data: result });
    return;
  }
  try {
    self.postMessage({ type: "progress", percent: 5, message: "Extracting files..." });
    let allCsvs = [];
    for (const file of files) {
      if (hasExtension(file.name, ".zip")) {
        const zip = new import_jszip.default();
        const arrayBuffer = await file.arrayBuffer();
        const contents = await zip.loadAsync(arrayBuffer);
        for (const [filename, zipEntry] of Object.entries(contents.files)) {
          if (!zipEntry.dir && isCsvName(filename)) {
            const text = await zipEntry.async("text");
            allCsvs.push({ name: filename, text });
          }
        }
      } else if (isCsvName(file.name)) {
        const text = await file.text();
        allCsvs.push({ name: file.name, text });
      }
    }
    allCsvs.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true }));
    self.postMessage({ type: "progress", percent: 20, message: `Parsing ${allCsvs.length} CSV file(s)...` });
    const { report, rawData } = analyzeEcgData(allCsvs, profileInfo, (pct) => {
      self.postMessage({ type: "progress", percent: 20 + Math.floor(pct * 60), message: "Analyzing data..." });
    });
    globalState = rawData;
    self.postMessage({ type: "progress", percent: 95, message: "Finalizing report..." });
    self.postMessage({ type: "complete", report });
  } catch (error) {
    self.postMessage({ type: "error", error: error.message });
  }
};
/*! Bundled license information:

jszip/dist/jszip.min.js:
  (*!
  
  JSZip v3.10.1 - A JavaScript class for generating and reading zip files
  <http://stuartk.com/jszip>
  
  (c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
  Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.
  
  JSZip uses the library pako released under the MIT license :
  https://github.com/nodeca/pako/blob/main/LICENSE
  *)
*/
