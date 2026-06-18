<template>
  <div class="min-h-dvh flex flex-col">
    <header class="flex items-center gap-3 px-4 pt-4">
      <Button variant="ghost" size="icon" @click="goBack" aria-label="Go back">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-semibold">Help</h1>
    </header>

    <div class="flex-1 p-4 flex flex-col gap-6 pb-8 overflow-y-auto">
      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">About</h2>
        <p class="text-sm leading-relaxed">
          This is a lightweight mobile client that wraps the OpenCode Web UI for native Android and iOS.
          <strong>It connects to an already-running OpenCode web server</strong> over LAN or VPN / Tailscale.
        </p>
      </section>

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Requirements</h2>
        <p class="text-sm leading-relaxed">
          <strong>You need a running OpenCode web server.</strong>
        </p>
        <br />
        <p class="text-sm leading-relaxed">
          The server should be running on the machine where your code and build tools are. That machine must be reachable from your phone over LAN, or VPN / Tailscale if your away from home.
        </p>
        <br />
      </section>

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Start Your OpenCode Server</h2>

        <h3 class="text-sm font-semibold mb-2">No authentication</h3>
        <pre class="text-xs bg-muted p-3 rounded-md overflow-x-auto mb-4">opencode web --hostname 0.0.0.0 --port 4096</pre>

        <h3 class="text-sm font-semibold mb-2">With authentication (recommended)</h3>
        <pre class="text-xs bg-muted p-3 rounded-md overflow-x-auto mb-3">export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096</pre>
        <p class="text-sm text-muted-foreground">When auth is enabled, the username defaults to <code>opencode</code> in the app.</p>
      </section>

      <Separator />

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Troubleshooting</h2>

        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold mb-1">Cannot connect</h3>
            <ul class="text-sm leading-relaxed list-disc list-inside space-y-1">
              <li>Verify the server is running: <code>opencode serve --hostname 0.0.0.0 --port 4096</code></li>
              <li>Verify the URL is correct. Try <code>curl http://your-server:4096/</code> from another device on the same network.</li>
              <li>Check that the port is not firewalled.</li>
              <li>Ensure the server is listening on <code>0.0.0.0</code> (not <code>127.0.0.1</code>, which would only accept local connections).</li>
            </ul>
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">Auth required</h3>
            <p class="text-sm leading-relaxed">
              The server returned HTTP 401 and no password is stored in the app.
              Go to Edit Server and set the password that matches <code>OPENCODE_SERVER_PASSWORD</code>.
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">Wrong credentials</h3>
            <p class="text-sm leading-relaxed">
              The stored username or password does not match the server.
              Try connecting with the correct credentials via curl first:
              <code>curl -u opencode:your-password http://server:4096/</code>
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">Blank iframe</h3>
            <p class="text-sm leading-relaxed">
              The health check succeeded but the iframe shows nothing after 8 seconds.
              The OpenCode Web UI may be sending headers that block embedding (<code>X-Frame-Options: DENY</code> or <code>Content-Security-Policy: frame-ancestors 'none'</code>).
              Workaround: Use the "Open in isolated native webview" option from the menu.
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">HTTP blocked on Android/iOS</h3>
            <p class="text-sm leading-relaxed">
              <strong>Android:</strong> Ensure <code>android:networkSecurityConfig</code> allows cleartext.<br />
              <strong>iOS:</strong> Ensure <code>NSAllowsLocalNetworking</code> is set in <code>Info.plist</code>.
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">Works in native app but not browser dev mode (CORS)</h3>
            <p class="text-sm leading-relaxed">
              This is expected. The web dev server at <code>localhost:5173</code> has a different origin than your OpenCode server.
              Use the native app build, or configure the OpenCode server to allow your dev origin via CORS headers.
              The <code>CapacitorHttp</code> plugin bypasses CORS on native, which is why health checks work in the app.
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">Server reachable but embedding blocked</h3>
            <p class="text-sm leading-relaxed">
              Some OpenCode deployments may send <code>X-Frame-Options: DENY</code> or <code>Content-Security-Policy: frame-ancestors 'none'</code>.
              The app detects this after 8 seconds and offers a "Refresh" button.
              If the issue persists, use the menu &rarr; "Open in isolated native webview" fallback.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Issues &amp; Suggestions</h2>
        <p class="text-sm leading-relaxed">
          The code is fully open-source, you can find it on <a href="https://github.com/bmpenuelas/opencode-mobile-client" target="_blank" rel="noopener noreferrer" class="text-blue-700 dark:text-blue-400 no-underline font-semibold">GitHub</a>.
          If you face any issue, please open an issue there. Same if you have suggestions or want to submit PRs!
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const router = useRouter()

function goBack(): void { router.push('/') }
</script>
