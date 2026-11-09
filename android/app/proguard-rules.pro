# Keep Capacitor bridge classes — used for reflection-based plugin dispatch
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.android.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Keep registered plugins
-keep class com.getcapacitor.plugin.** { *; }
-keep class capgo.capacitorinappbrowser.** { *; }
-keep class com.aparajita.capacitor.securestorage.** { *; }

# Keep app entry point
-keep class com.opencode.mobile.ar.MainActivity { *; }

# Keep @JavascriptInterface methods (safety net for WebView bridges)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for crash stack traces
-keepattributes SourceFile,LineNumberTable
