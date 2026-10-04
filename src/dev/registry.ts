// The harness scene registry: scenes register a factory under a string name;
// the URL picks one. A factory receives the canonical camera rig and the
// fixed clock and returns a fully-lit THREE.Scene plus its camera.

import type * as THREE from 'three'
import type { CameraRig } from './cameras.ts'

export interface SceneContext {
  rig: CameraRig
  /** Fixed clock in seconds — never advances unless a scene opts into time. */
  time: number
}

export interface SceneEntry {
  scene: THREE.Scene
  camera: THREE.Camera
}

export type SceneFactory = (ctx: SceneContext) => SceneEntry

const registry = new Map<string, SceneFactory>()

export function registerScene(name: string, factory: SceneFactory): void {
  if (registry.has(name)) throw new Error(`harness: scene "${name}" already registered`)
  registry.set(name, factory)
}

export function sceneNames(): string[] {
  return [...registry.keys()]
}

export function getSceneFactory(name: string): SceneFactory | undefined {
  return registry.get(name)
}
