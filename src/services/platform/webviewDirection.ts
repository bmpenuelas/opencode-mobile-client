import type { WebviewDirection } from '@/services/storage/uiPreferences'

export function buildDirectionScript(direction: WebviewDirection): string {
  return `(function(){if(document.documentElement)document.documentElement.dir=${JSON.stringify(direction)};})();`
}
