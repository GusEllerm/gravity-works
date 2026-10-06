import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
// warmth probe: mean RGB in luma bands + 200px silhouette downscale montage
for (const f of process.argv.slice(2)) {
  const png = PNG.sync.read(readFileSync(f))
  const { width: w, height: h, data } = png
  const bands = [[120,160],[160,200],[200,256]]
  const out = []
  for (const [lo,hi] of bands) {
    let n=0,r=0,g=0,b=0
    for (let i=0;i<w*h;i++){const p=i*4;const R=data[p],G=data[p+1],B=data[p+2];const m=(R+G+B)/3;if(m>=lo&&m<hi){n++;r+=R;g+=G;b+=B}}
    out.push(`[${lo}-${hi}] ${n?((r/n)|0)+','+((g/n)|0)+','+((b/n)|0):'-'}`)
  }
  console.log(f.split('/').pop().padEnd(24), out.join(' '))
}
// montage of 200px-wide downscales
const files = process.argv.slice(2)
const parts = files.map(f => PNG.sync.read(readFileSync(f)))
const W = 200, H = Math.round(200 * parts[0].height / parts[0].width)
const out = new PNG({ width: W*parts.length, height: H })
parts.forEach((png, k) => {
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const sx=Math.floor(x*png.width/W), sy=Math.floor(y*png.height/H)
    const sp=(sy*png.width+sx)*4, dp=(y*out.width + k*W + x)*4
    out.data[dp]=png.data[sp];out.data[dp+1]=png.data[sp+1];out.data[dp+2]=png.data[sp+2];out.data[dp+3]=255
  }
})
writeFileSync('tools/.tmp-montage.png', PNG.sync.write(out))
