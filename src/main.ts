import { boot } from './boot.ts'
import './ui/shell.css'

// The deterministic render harness is dev tooling, but it must ride the exact
// production build so renders cannot diverge from shipped code. With
// ?harness=1 it replaces the app shell; the dynamic import keeps it out of
// the main chunk (it is fetched only when the flag is present).
if (new URLSearchParams(window.location.search).has('harness')) {
  void import('./dev/harness.ts')
} else {
  boot(document.querySelector<HTMLDivElement>('#app')!)
}
