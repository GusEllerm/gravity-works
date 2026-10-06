// The set lighting rig (art bible §Light, PROMPT §5.5): one key light per set
// with long soft shadows and a visible direction, plus a soft fill that the
// material system carries as two bands sampled by world-up — never an
// AmbientLight, which the rubric forbids. The fill is derived here (not in
// scenes) so the set's accent is *reachable* in shade: the 2026-10-04 backlog
// found the fill gain hardcoded at 0.25 in the shader and the fill never
// quite touching the mint accent. Both dials are parameters now.
//
// Tinted shadows need no extra light: ToonMaterial.setKeyLight (exposed here
// as applyKeyLight) records the key's length so the shader can separate cast
// shadow from unlit angle and swap in the set's shadowTint.

import * as THREE from 'three'
import { GLOBAL_TOKENS, lighten, mixHex, shiftHex } from './tokens.ts'
import type { SetTokens } from './tokens.ts'
import { ToonMaterial } from './toon-material.ts'

export interface LightingRigOptions {
  /** Key intensity. Default 1.3 — the stage-1 kitchen breakfast sun. */
  keyIntensity?: number
  /** Key direction (position of a target-at-origin DirectionalLight). */
  keyPosition?: readonly [number, number, number]
  /** How far the fill is pulled toward the set's accent, 0..1. Default 0.3. */
  accentMix?: number
  /** Fill gain handed to materials; default 0.32 — above the old shader
   * constant 0.25, so the accent band of the fill actually lands. */
  fillStrength?: number
  /** Shadow map edge softness (PCF disc radius in texels). Default 4. */
  shadowRadius?: number
  /** Shadow map resolution. Default 2048. */
  shadowMapSize?: number
  /** Half-extent of the orthographic shadow camera. Default 1.2. */
  shadowExtent?: number
  /**
   * Key COLOR (stage 4, garden): the stock key is the warm-neutral
   * `GLOBAL_TOKENS.keyLight`; an outdoor set passes the SUN's own tint
   * (golden-hour amber). Omitting this — every indoor set — keeps the key
   * color byte-identical.
   */
  keyColor?: THREE.ColorRepresentation
  /**
   * OUTDOOR REGIME (stage 4, garden): the flat sky value. Outdoors the fill
   * IS the sky, so the sky-side band and the shadow tint derive from the sky,
   * not (only) the set's dominant hue — the indoor §Light rule made for a sun
   * (Review 2026-10-08 garden, AD note 2: shadow tint derives from the SKY
   * value). Omitting this keeps every indoor rig byte-identical.
   */
  sky?: string
  /** How far the shadow tint is pulled toward `sky`, 0..1. Default 0.6. */
  skyInfluence?: number
  /**
   * Sky-FILL GAIN (stage 4 garden round 1): how far the sky-side fill band
   * is pulled toward the flat sky value, 0..1. Default 0.55 — the number the
   * first garden production renders shipped, so omitting this keeps both the
   * indoor branch (which never reaches it) and the outdoor branch
   * byte-identical. An outdoor set passes a lower value to spend LESS of the
   * sky's brightness inside shadows — the AD's shadow-darkening budget knob
   * (Review 2026-10-08 garden production, AD note 1); it moves the fill's
   * BRIGHTNESS, never its hue path, which stays the sky's.
   */
  skyFillMix?: number
  /**
   * Sky-FILL SHADE DEPTH (stage 4 garden round 1, AD note 1): how far the
   * sky VALUE used for the fill band is deepened before mixing, in the
   * same spirit as the shadow tint's deepened-sky term — the flat sky is a
   * bright horizon color and a shadow is sky light that lost its sun, so a
   * set may want the fill to carry the sky at shade depth. Default 0 — the
   * flat sky value, byte-identical to the first outdoor renders. The hue
   * path stays the sky's (deepened, not rotated), so the census tint stays
   * blue-above-red.
   */
  skyFillShade?: number
  /**
   * Fill SHADE DEPTH (stage 4 garden round 1, AD note 1 — the rig-side half
   * of the shader's `uFillShadeDepth`): the fraction of the sky fill a
   * shadowed fragment keeps. Default 1 — every indoor rig and every
   * pre-round-1 render byte-identical (the multiply is an exact 1);
   * an outdoor set passes < 1 when the sky has replaced the sun INSIDE its
   * shadows (the fill's BRIGHTNESS dial, hue untouched, lit pixels fully
   * unaffected — which is why it can darken the long bars without moving
   * any frame's median tone).
   */
  fillShadeDepth?: number
}

export interface LightingRig {
  key: THREE.DirectionalLight
  /** Fill band, sky side — feed into every material's `fillHigh`. */
  fillHigh: string
  /** Fill band, ground side — feed into every material's `fillLow`. */
  fillLow: string
  /** Fill gain — feed into every material's `fillStrength`. */
  fillStrength: number
  /** Fill shade depth — feed into every material's `fillShadeDepth`. */
  fillShadeDepth: number
  /** Shadow tint — the material-side half of the tinted-shadow contract. */
  shadowTint: string
  keyIntensity: number
  /**
   * Hook, not particles: dust motes in the key light are §5.5 scenery for a
   * later juice pass. Until then this registers nothing and returns an empty
   * group — the call site is stable so the stage-5 pass changes no scenes.
   */
  dustMotes(): THREE.Object3D
}

/**
 * Build the rig for a set: the shadowed key (configured once — the dither-
 * budget work happens in the shader and in `shadowRadius`) and the accent-
 * reachable fill bands derived from the set's tokens.
 */
export function createLightingRig(tokens: SetTokens, opts: LightingRigOptions = {}): LightingRig {
  const intensity = opts.keyIntensity ?? 1.3
  const [kx, ky, kz] = opts.keyPosition ?? [0.9, 0.55, 0.6]

  const key = new THREE.DirectionalLight(opts.keyColor ?? GLOBAL_TOKENS.keyLight, intensity)
  key.position.set(kx, ky, kz)
  key.castShadow = true
  const size = opts.shadowMapSize ?? 2048
  key.shadow.mapSize.set(size, size)
  const ext = opts.shadowExtent ?? 1.2
  key.shadow.camera.left = -ext
  key.shadow.camera.right = ext
  key.shadow.camera.top = ext
  key.shadow.camera.bottom = -ext
  key.shadow.camera.near = 0.1
  key.shadow.camera.far = 4
  // Bias pair tuned with the shader's dither budget: normalBias walks contact
  // pixels off the floor so their PCF samples stop half-covering (the grazing
  // speckle), and the negative depth bias stays small enough not to detach
  // the long breakfast shadows.
  key.shadow.bias = -0.0002
  key.shadow.normalBias = 0.006
  key.shadow.radius = opts.shadowRadius ?? 4
  key.shadow.camera.updateProjectionMatrix()

  // Fill: token fill bands (dominant-derived) pulled toward the accent, with
  // the high band kept sky-light bright. This is "soft fill from the set's
  // dominant hue" with the accent *reachable* in shade.
  const mix = opts.accentMix ?? 0.3
  let fillHigh = lighten(mixHex(tokens.fillHigh, tokens.accent, mix), 0.12)
  let fillLow = mixHex(tokens.fillLow, tokens.accent, mix * 0.6)
  let shadowTint = mixHex(tokens.shadowTint, tokens.dominant, 0.3)
  // Outdoor substitution ONLY when a sky value is passed: indoors the maths
  // above is the stage-1..4 indoor rule, byte-for-byte (the kitchen visual
  // baselines gate it; tests/unit/garden-lighting.test.ts proves it).
  // Outdoors the sky is the fill and the shade is sky-lit — the high band,
  // the ground band and the shadow tint all take a cut of the sky value.
  if (opts.sky !== undefined) {
    // The fill's sky VALUE at shade depth when the set asks for it (AD note
    // 1): deepened like the shadow tint; at the default 0 this is the flat
    // sky, byte-identical.
    const skyFill = opts.skyFillShade ? shiftHex(opts.sky, 0, 0.15, -opts.skyFillShade) : opts.sky
    fillHigh = mixHex(fillHigh, skyFill, opts.skyFillMix ?? 0.55)
    fillLow = mixHex(fillLow, opts.sky, 0.22)
    // The SKY'S OWN HUE at shade depth: the flat sky value is a bright
    // horizon color; a shadow is sky-lit light that LOST its sun, so the
    // tint is the sky deepened and saturated, not the sky flat (a flat mix
    // lands neutral and the rendered darks lose their spread — the census
    // wants TINTED darks in numbers, not grey ones).
    const skyTint = shiftHex(opts.sky, 0, 0.15, -0.45)
    shadowTint = mixHex(shadowTint, skyTint, opts.skyInfluence ?? 0.6)
  }

  return {
    key,
    fillHigh,
    fillLow,
    fillStrength: opts.fillStrength ?? 0.32,
    fillShadeDepth: opts.fillShadeDepth ?? 1,
    shadowTint,
    keyIntensity: intensity,
    dustMotes: () => new THREE.Object3D(),
  }
}

/**
 * Declare the rig's key light to every ToonMaterial in the scene (the
 * key-length recovery behind tinted shadows). Call once after dressing.
 */
export function applyKeyLight(root: THREE.Object3D, rig: LightingRig): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of mats) {
        // the rig's OWN key color — an indoor rig's is always
        // GLOBAL_TOKENS.keyLight (byte-identical to the old constant), an
        // outdoor rig's is the sun's tint, so shadowed pixels resolve against
        // the light that actually casts them.
        if (m instanceof ToonMaterial) m.setKeyLight(rig.key.color, rig.keyIntensity)
      }
    }
  })
}

/** Convenience: the per-material fill overrides a scene passes every class. */
export function fillFromRig(rig: LightingRig): {
  fillHigh: string
  fillLow: string
  fillStrength: number
  fillShadeDepth: number
  shadowTint: string
} {
  return {
    fillHigh: rig.fillHigh,
    fillLow: rig.fillLow,
    fillStrength: rig.fillStrength,
    fillShadeDepth: rig.fillShadeDepth,
    shadowTint: rig.shadowTint,
  }
}
