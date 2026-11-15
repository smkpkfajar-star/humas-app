/**
 * Membangun ulang vendor/docxtemplater-image-module-free-1.1.1.browser.js
 *
 * Mengapa? Bundel browser bawaan paket (build/imagemodule.js) membawa salinan
 * lama `xmldom` & internal docxtemplater, yang bentrok dengan DOM native Chrome:
 *   "Cannot set property namespaceURI of #<Element> which has only a getter"
 *
 * Bundel ini memakai sumber js/ milik paket, dengan:
 *   require('docxtemplater') → window.docxtemplater (v3.71 yang sudah dimuat)
 *   require('xmldom')        → DOMParser native browser (hanya dipakai untuk PPTX)
 *   imgManager.js            → di-patch: createElementNS (lihat PATCHES)
 *   index.js                 → di-patch: ekstensi gambar .jpeg (lihat INDEX_PATCHES)
 *
 * Hanya perlu dijalankan bila ingin memperbarui versi modul. Aplikasinya sendiri
 * tetap tanpa build tools. Cara pakai (di folder kosong di luar proyek):
 *   npm i docxtemplater-image-module-free@1.1.1 esbuild@0.24.0
 *   node <path-proyek>/tools/build-image-module.js <path-proyek>/vendor
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(require.resolve('esbuild', { paths: [process.cwd()] }));

const outDir = process.argv[2];
if (!outDir) {
  console.error('Pemakaian: node build-image-module.js <folder-vendor>');
  process.exit(1);
}

const pkgDir = path.dirname(require.resolve('docxtemplater-image-module-free/package.json', { paths: [process.cwd()] }));
const version = require(path.join(pkgDir, 'package.json')).version;

/**
 * Patch imgManager.js: modul membuat elemen dengan createElement() lalu
 * `newTag.namespaceURI = null`. Di DOM native browser properti itu read-only
 * (TypeError), dan elemen tanpa namespace akan diserialisasi dengan xmlns=""
 * sehingga Word mengabaikan relasi gambar. Solusi: createElementNS() dengan
 * namespace milik elemen akar dokumen.
 */
const PATCHES = [
  ['var newTag = contentTypeDoc.createElement("Default");\n\t\t\tnewTag.namespaceURI = null;',
   'var newTag = contentTypeDoc.createElementNS(contentTypeDoc.documentElement.namespaceURI, "Default");'],
  ['var newTag = this.relsDoc.createElement("Relationship");\n\t\t\tnewTag.namespaceURI = null;',
   'var newTag = this.relsDoc.createElementNS(this.relsDoc.documentElement.namespaceURI, "Relationship");']
];

/**
 * Patch index.js: nama file gambar selalu ".png", padahal aplikasi ini selalu
 * mengirim JPEG (hasil kompresi canvas). Ekstensi disamakan agar Content-Type
 * di dalam .docx sesuai isi file.
 */
const INDEX_PATCHES = [
  ['var name = "image_generated_" + this.imageNumber + ".png";',
   'var name = "image_generated_" + this.imageNumber + ".jpeg";']
];

function applyPatches(file, patches) {
  let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  for (const [from, to] of patches) {
    if (!src.includes(from)) throw new Error('Patch tidak cocok (versi modul berubah?): ' + from.split('\n')[0]);
    src = src.replace(from, to);
  }
  return src;
}

const patchModule = {
  name: 'patch-image-module',
  setup(build) {
    build.onLoad({ filter: /imgManager\.js$/ }, args => ({ contents: applyPatches(args.path, PATCHES), loader: 'js' }));
    build.onLoad({ filter: /[\\/]js[\\/]index\.js$/ }, args => ({ contents: applyPatches(args.path, INDEX_PATCHES), loader: 'js' }));
  }
};

const shims = {
  name: 'browser-shims',
  setup(build) {
    build.onResolve({ filter: /^(docxtemplater|xmldom)$/ }, args => ({ path: args.path, namespace: 'shim' }));
    build.onLoad({ filter: /.*/, namespace: 'shim' }, args => ({
      loader: 'js',
      contents: args.path === 'docxtemplater'
        ? 'module.exports = window.docxtemplater;'
        : 'function P(){}; P.prototype.parseFromString = function (s, t) { return new window.DOMParser().parseFromString(s, t || "text/xml"); };' +
          'module.exports = { DOMParser: P, XMLSerializer: window.XMLSerializer };'
    }));
  }
};

const outfile = path.join(outDir, `docxtemplater-image-module-free-${version}.browser.js`);

esbuild.build({
  entryPoints: [path.join(pkgDir, 'js', 'index.js')],
  bundle: true,
  format: 'iife',
  globalName: 'ImageModule',
  footer: { js: 'ImageModule = ImageModule.default || ImageModule;' },
  platform: 'browser',
  target: ['es2017'],
  minify: true,
  legalComments: 'none',
  banner: { js: `/*! docxtemplater-image-module-free ${version} | MIT | dibundel ulang untuk browser (lihat tools/build-image-module.js) */` },
  plugins: [patchModule, shims],
  outfile
}).then(() => {
  console.log('OK →', outfile, fs.statSync(outfile).size, 'byte');
}).catch(() => process.exit(1));
